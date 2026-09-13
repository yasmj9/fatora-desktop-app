import { getDatabaseAsync } from "../client";
import { companyRepository } from "./companyRepository";
import { clientRepository } from "./clientRepository";
import {
  Invoice,
  InvoiceItem,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceFilterOptions,
  InvoiceStatus,
} from "../../types/invoice";
import { calculateInvoiceFinancials, toCents } from "../../utils/money";
import { formatInvoiceNumber } from "../../utils/invoiceNumberFormatter";

export interface InvoiceStats {
  totalInvoicesCount: number;
  draftCount: number;
  unpaidCount: number;
  paidCount: number;
  totalUnpaidBalanceCents: number;
  totalPaidRevenueCents: number;
  totalInvoicedCents: number;
}

export const invoiceRepository = {
  /**
   * Generates the next sequential invoice number based on company settings and year.
   * Supports customizable patterns like "{SEQ}/{YEAR}", "FACT-{SEQ}-{YEAR}", "{PREFIX}-{YEAR}-{SEQ}", etc.
   */
  async getNextInvoiceNumber(
    year: number = new Date().getFullYear(),
    overridePrefix?: string
  ): Promise<{ invoiceNumber: string; sequenceNumber: number; sequenceYear: number; prefix: string }> {
    const db = await getDatabaseAsync();
    const settings = await companyRepository.getSettings();

    const prefix =
      overridePrefix !== undefined
        ? overridePrefix
        : settings.invoice_prefix !== undefined && settings.invoice_prefix !== null
        ? settings.invoice_prefix
        : "FAC";
    const pattern = settings.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}";
    const padding = Number(settings.invoice_sequence_padding) || 4;
    const minStartNumber = Number(settings.invoice_next_number) || 1;

    // Get max sequence number for this year
    const rows = await db.select<{ max_seq: number | null }>(
      `SELECT MAX(sequence_number) as max_seq FROM invoices WHERE sequence_year = ?`,
      [year]
    );

    const maxSeq = rows.length > 0 && rows[0].max_seq ? rows[0].max_seq : 0;
    let sequenceNumber = Math.max(maxSeq + 1, minStartNumber);
    let invoiceNumber = formatInvoiceNumber({
      prefix,
      pattern,
      sequenceNumber,
      year,
      padding,
    });

    // Ensure collision avoidance if gaps or existing records exist
    let exists = await db.select<{ id: number }>(
      `SELECT id FROM invoices WHERE invoice_number = ? LIMIT 1`,
      [invoiceNumber]
    );
    while (exists.length > 0) {
      sequenceNumber += 1;
      invoiceNumber = formatInvoiceNumber({
        prefix,
        pattern,
        sequenceNumber,
        year,
        padding,
      });
      exists = await db.select<{ id: number }>(
        `SELECT id FROM invoices WHERE invoice_number = ? LIMIT 1`,
        [invoiceNumber]
      );
    }

    return {
      invoiceNumber,
      sequenceNumber,
      sequenceYear: year,
      prefix,
    };
  },

  /**
   * Retrieves invoices with flexible filtering, search, and sorting.
   */
  async getInvoices(filters?: InvoiceFilterOptions): Promise<Invoice[]> {
    const db = await getDatabaseAsync();

    let query = "SELECT * FROM invoices WHERE 1=1";
    const bindValues: unknown[] = [];

    if (filters?.status && filters.status !== "all") {
      query += " AND status = ?";
      bindValues.push(filters.status);
    }

    if (filters?.clientId) {
      query += " AND client_id = ?";
      bindValues.push(filters.clientId);
    }

    if (filters?.year) {
      query += " AND sequence_year = ?";
      bindValues.push(filters.year);
    }

    if (filters?.startDate) {
      query += " AND invoice_date >= ?";
      bindValues.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += " AND invoice_date <= ?";
      bindValues.push(filters.endDate);
    }

    query += " ORDER BY sequence_year DESC, sequence_number DESC, id DESC";

    const invoices = await db.select<Invoice>(query, bindValues);

    // Apply forgiving text search in memory if provided
    if (filters?.search && filters.search.trim() !== "") {
      const search = filters.search.toLowerCase().trim();
      return invoices.filter((inv) => {
        const num = (inv.invoice_number || "").toLowerCase();
        const client = (inv.client_name || "").toLowerCase();
        const phone = (inv.client_phone || "").replace(/\D/g, "");
        const ice = (inv.client_ice || "").toLowerCase();
        const notes = (inv.notes || "").toLowerCase();

        return (
          num.includes(search) ||
          client.includes(search) ||
          phone.includes(search.replace(/\D/g, "")) ||
          ice.includes(search) ||
          notes.includes(search)
        );
      });
    }

    return invoices;
  },

  /**
   * Retrieves a full invoice by ID, including its line items and payment records.
   */
  async getInvoiceById(id: number): Promise<Invoice | null> {
    const db = await getDatabaseAsync();

    const invoiceRows = await db.select<Invoice>(
      "SELECT * FROM invoices WHERE id = ? LIMIT 1",
      [id]
    );

    if (invoiceRows.length === 0) return null;

    const invoice = invoiceRows[0];

    // Fetch line items ordered by position
    const items = await db.select<InvoiceItem>(
      "SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position ASC, id ASC",
      [id]
    );

    // Fetch payments
    const payments = await db.select<Invoice["payments"] extends (infer P)[] | undefined ? P : never>(
      "SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC, id ASC",
      [id]
    );

    return {
      ...invoice,
      items,
      payments,
    };
  },

  /**
   * Retrieves a full invoice by invoice number (e.g. "FAC-2026-0001").
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const db = await getDatabaseAsync();
    const invoiceRows = await db.select<Invoice>(
      "SELECT * FROM invoices WHERE invoice_number = ? LIMIT 1",
      [invoiceNumber]
    );

    if (invoiceRows.length === 0) return null;
    return this.getInvoiceById(invoiceRows[0].id);
  },

  /**
   * Creates a new Invoice with complete snapshots for items, client, and seller.
   */
  async createInvoice(input: InvoiceCreateInput): Promise<Invoice> {
    const db = await getDatabaseAsync();

    // 1. Determine invoice numbering
    const currentYear = new Date().getFullYear();
    const nextNumberData = await this.getNextInvoiceNumber(
      input.sequence_year || currentYear,
      input.prefix
    );

    const invoiceNumber = input.invoice_number || nextNumberData.invoiceNumber;
    const sequenceNumber = input.sequence_number || nextNumberData.sequenceNumber;
    const sequenceYear = input.sequence_year || nextNumberData.sequenceYear;
    const prefix = input.prefix || nextNumberData.prefix;

    // Check for duplicate invoice number
    const duplicateCheck = await db.select<{ id: number }>(
      `SELECT id FROM invoices WHERE invoice_number = ? LIMIT 1`,
      [invoiceNumber]
    );
    if (duplicateCheck.length > 0) {
      throw new Error(`Ce numéro de facture (${invoiceNumber}) existe déjà.`);
    }

    // 2. Fetch Seller snapshot if missing
    let sellerName = input.seller_name;
    let sellerContact = input.seller_contact_person || "";
    let sellerPhone = input.seller_phone || "";
    let sellerAddress = input.seller_address || "";
    let sellerCity = input.seller_city || "";
    let sellerEmail = input.seller_email || "";
    let sellerIce = input.seller_ice || "";
    let sellerIf = input.seller_if || "";
    let sellerRc = input.seller_rc || "";
    let sellerPatente = input.seller_patente || "";
    let sellerCnss = input.seller_cnss || "";
    let sellerBank = input.seller_bank_name || "";
    let sellerRib = input.seller_rib || "";
    let currency = input.currency || "MAD";
    let documentLanguage = input.language || "fr";

    if (!sellerName) {
      try {
        const company = await companyRepository.getSettings();
        sellerName = company.name || "";
        sellerContact = company.contact_person || "";
        sellerPhone = company.phone || "";
        sellerAddress = company.address || "";
        sellerCity = company.city || "";
        sellerEmail = company.email || "";
        sellerIce = company.ice || "";
        sellerIf = company.if_tax || "";
        sellerRc = company.rc || "";
        sellerPatente = company.patente || "";
        sellerCnss = company.cnss || "";
        sellerBank = company.bank_name || "";
        sellerRib = company.rib_iban || "";
        currency = company.currency || currency;
        documentLanguage = (company.document_language as "fr" | "ar" | "en") || documentLanguage;
      } catch (err) {
        console.warn("[invoiceRepository] Could not load company settings for snapshot:", err);
      }
    }

    // 3. Fetch Client snapshot if client_id is given and fields are blank
    let clientName = input.client_name;
    let clientType = input.client_type || "individual";
    let clientContact = input.client_contact_person || "";
    let clientPhone = input.client_phone || "";
    let clientAddress = input.client_address || "";
    let clientCity = input.client_city || "";
    let clientEmail = input.client_email || "";
    let clientIce = input.client_ice || "";
    let clientIf = input.client_if || "";
    let clientRc = input.client_rc || "";

    if (input.client_id && (!clientPhone || !clientAddress)) {
      try {
        const existingClient = await clientRepository.getClientById(input.client_id);
        if (existingClient) {
          clientName = clientName || existingClient.name;
          clientType = existingClient.type;
          clientContact = clientContact || existingClient.contact_person;
          clientPhone = clientPhone || existingClient.phone;
          clientAddress = clientAddress || existingClient.address;
          clientCity = clientCity || existingClient.city;
          clientEmail = clientEmail || existingClient.email;
          clientIce = clientIce || existingClient.ice;
          clientIf = clientIf || existingClient.if_tax;
          clientRc = clientRc || existingClient.rc;
        }
      } catch (err) {
        console.warn("[invoiceRepository] Could not load client for snapshot:", err);
      }
    }

    // 4. Calculate Financials accurately using integer cents
    const initialPaymentCents = Math.max(0, input.initial_payment?.amount_cents || 0);
    const effectiveGlobalTaxRate = input.tax_rate !== undefined ? input.tax_rate : 20;

    const financialCalc = calculateInvoiceFinancials({
      items: input.items.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        discountType: item.discount_type,
        discountRate: item.discount_rate,
        discountAmountCents: item.discount_amount_cents,
        taxRate: item.tax_rate !== undefined ? item.tax_rate : effectiveGlobalTaxRate,
      })),
      globalDiscountType: input.discount_type,
      globalDiscountRate: input.discount_rate,
      globalDiscountAmountCents: input.discount_amount_cents,
      globalTaxRate: effectiveGlobalTaxRate,
      paidAmountCents: initialPaymentCents,
    });

    const paidAmountCents = financialCalc.paidAmountCents;
    const balanceCents = financialCalc.balanceCents;

    // Determine status automatically
    let status: InvoiceStatus = input.status || "sent";
    if (paidAmountCents >= financialCalc.totalCents && financialCalc.totalCents > 0) {
      status = "paid";
    } else if (paidAmountCents > 0) {
      status = "partially_paid";
    } else if (!input.status) {
      status = "sent";
    }

    const invoiceDate = input.invoice_date || new Date().toISOString().split("T")[0];
    const dueDate = input.due_date || "";
    const notes = input.notes || "";
    const paymentTerms = input.payment_terms || "";

    // 5. Database Transaction Execution
    await db.execute("BEGIN TRANSACTION;");
    let invoiceId: number;

    try {
      // 5a. Insert Invoice Header
      const insertInvoiceResult = await db.execute(
        `
        INSERT INTO invoices (
          invoice_number,
          sequence_number,
          sequence_year,
          prefix,
          status,
          language,
          currency,
          client_id,
          client_name,
          client_type,
          client_contact_person,
          client_phone,
          client_address,
          client_city,
          client_email,
          client_ice,
          client_if,
          client_rc,
          seller_name,
          seller_contact_person,
          seller_phone,
          seller_address,
          seller_city,
          seller_email,
          seller_ice,
          seller_if,
          seller_rc,
          seller_patente,
          seller_cnss,
          seller_bank_name,
          seller_rib,
          invoice_date,
          due_date,
          notes,
          payment_terms,
          subtotal_cents,
          discount_type,
          discount_rate,
          discount_amount_cents,
          tax_rate,
          tax_amount_cents,
          total_cents,
          paid_amount_cents,
          balance_cents,
          created_at,
          updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
        `,
        [
          invoiceNumber,
          sequenceNumber,
          sequenceYear,
          prefix,
          status,
          documentLanguage,
          currency,
          input.client_id || null,
          clientName,
          clientType,
          clientContact,
          clientPhone,
          clientAddress,
          clientCity,
          clientEmail,
          clientIce,
          clientIf,
          clientRc,
          sellerName || "",
          sellerContact,
          sellerPhone,
          sellerAddress,
          sellerCity,
          sellerEmail,
          sellerIce,
          sellerIf,
          sellerRc,
          sellerPatente,
          sellerCnss,
          sellerBank,
          sellerRib,
          invoiceDate,
          dueDate,
          notes,
          paymentTerms,
          financialCalc.subtotalCents,
          input.discount_type || "fixed",
          input.discount_rate || 0,
          financialCalc.discountAmountCents,
          effectiveGlobalTaxRate,
          financialCalc.taxAmountCents,
          financialCalc.totalCents,
          paidAmountCents,
          balanceCents,
        ]
      );

      invoiceId = insertInvoiceResult.lastInsertId!;

      // 5b. Insert Line Items with complete snapshots
      for (let i = 0; i < input.items.length; i++) {
        const itemInput = input.items[i];
        const itemCalc = financialCalc.itemsCalculated[i];

        await db.execute(
          `
          INSERT INTO invoice_items (
            invoice_id,
            service_id,
            position,
            name,
            name_ar,
            name_en,
            description,
            description_ar,
            description_en,
            unit,
            quantity,
            unit_price_cents,
            discount_type,
            discount_rate,
            discount_amount_cents,
            tax_rate,
            tax_amount_cents,
            total_cents,
            created_at,
            updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            datetime('now'), datetime('now')
          )
          `,
          [
            invoiceId,
            itemInput.service_id || null,
            itemInput.position ?? i,
            itemInput.name,
            itemInput.name_ar || "",
            itemInput.name_en || "",
            itemInput.description || "",
            itemInput.description_ar || "",
            itemInput.description_en || "",
            itemInput.unit || "U",
            itemInput.quantity,
            itemInput.unit_price_cents,
            itemInput.discount_type || "fixed",
            itemInput.discount_rate || 0,
            itemCalc ? itemCalc.discountAmountCents : 0,
            itemInput.tax_rate !== undefined ? itemInput.tax_rate : effectiveGlobalTaxRate,
            itemCalc ? itemCalc.taxAmountCents : 0,
            itemCalc ? itemCalc.totalCents : toCents((itemInput.quantity * itemInput.unit_price_cents) / 100),
          ]
        );
      }

      // 5c. Insert Initial Payment if entered
      if (paidAmountCents > 0) {
        await db.execute(
          `
          INSERT INTO payments (
            invoice_id,
            amount_cents,
            payment_date,
            payment_method,
            reference,
            notes,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `,
          [
            invoiceId,
            paidAmountCents,
            input.initial_payment?.payment_date || invoiceDate,
            input.initial_payment?.payment_method || "cash",
            input.initial_payment?.reference || "",
            input.initial_payment?.notes || "",
          ]
        );
      }

      await db.execute("COMMIT;");
    } catch (txError) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[invoiceRepository] Rollback error:", rollbackErr);
      }
      throw txError;
    }

    const created = await this.getInvoiceById(invoiceId);
    if (!created) {
      throw new Error(`Failed to retrieve newly created invoice ID: ${invoiceId}`);
    }

    return created;
  },

  /**
   * Updates an existing invoice and recalculates totals and line items.
   */
  async updateInvoice(id: number, input: InvoiceUpdateInput): Promise<Invoice> {
    const db = await getDatabaseAsync();
    const existing = await this.getInvoiceById(id);
    if (!existing) {
      throw new Error(`Invoice with ID ${id} not found.`);
    }

    // Determine current payments total
    const paidAmountCents = existing.paid_amount_cents || 0;

    // Line items to use
    const itemsToProcess = input.items || (existing.items ? existing.items.map((it) => ({
      service_id: it.service_id,
      position: it.position,
      name: it.name,
      name_ar: it.name_ar,
      name_en: it.name_en,
      description: it.description,
      description_ar: it.description_ar,
      description_en: it.description_en,
      unit: it.unit,
      quantity: it.quantity,
      unit_price_cents: it.unit_price_cents,
      discount_type: it.discount_type,
      discount_rate: it.discount_rate,
      discount_amount_cents: it.discount_amount_cents,
      tax_rate: it.tax_rate,
    })) : []);

    const discountType = input.discount_type ?? existing.discount_type;
    const discountRate = input.discount_rate ?? existing.discount_rate;
    const discountAmountCents = input.discount_amount_cents ?? existing.discount_amount_cents;
    const taxRate = input.tax_rate ?? existing.tax_rate;

    const financialCalc = calculateInvoiceFinancials({
      items: itemsToProcess.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        discountType: item.discount_type,
        discountRate: item.discount_rate,
        discountAmountCents: item.discount_amount_cents,
        taxRate: item.tax_rate,
      })),
      globalDiscountType: discountType,
      globalDiscountRate: discountRate,
      globalDiscountAmountCents: discountAmountCents,
      globalTaxRate: taxRate,
      paidAmountCents,
    });

    // Auto-update status if balance is 0 or payments exist
    let newStatus = input.status ?? existing.status;
    if (paidAmountCents > 0) {
      if (financialCalc.balanceCents <= 0) {
        newStatus = "paid";
      } else if (newStatus !== "cancelled") {
        newStatus = "partially_paid";
      }
    }

    // Update Header
    await db.execute(
      `
      UPDATE invoices SET
        status = ?,
        language = ?,
        currency = ?,
        client_id = ?,
        client_name = ?,
        client_type = ?,
        client_contact_person = ?,
        client_phone = ?,
        client_address = ?,
        client_city = ?,
        client_email = ?,
        client_ice = ?,
        client_if = ?,
        client_rc = ?,
        invoice_date = ?,
        due_date = ?,
        notes = ?,
        payment_terms = ?,
        subtotal_cents = ?,
        discount_type = ?,
        discount_rate = ?,
        discount_amount_cents = ?,
        tax_rate = ?,
        tax_amount_cents = ?,
        total_cents = ?,
        paid_amount_cents = ?,
        balance_cents = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
        newStatus,
        input.language ?? existing.language,
        input.currency ?? existing.currency,
        input.client_id !== undefined ? input.client_id : existing.client_id,
        input.client_name ?? existing.client_name,
        input.client_type ?? existing.client_type,
        input.client_contact_person ?? existing.client_contact_person,
        input.client_phone ?? existing.client_phone,
        input.client_address ?? existing.client_address,
        input.client_city ?? existing.client_city,
        input.client_email ?? existing.client_email,
        input.client_ice ?? existing.client_ice,
        input.client_if ?? existing.client_if,
        input.client_rc ?? existing.client_rc,
        input.invoice_date ?? existing.invoice_date,
        input.due_date ?? existing.due_date,
        input.notes ?? existing.notes,
        input.payment_terms ?? existing.payment_terms,
        financialCalc.subtotalCents,
        discountType,
        discountRate,
        financialCalc.discountAmountCents,
        taxRate,
        financialCalc.taxAmountCents,
        financialCalc.totalCents,
        paidAmountCents,
        financialCalc.balanceCents,
        id,
      ]
    );

    // If items were provided in the update, replace items
    if (input.items) {
      await db.execute("DELETE FROM invoice_items WHERE invoice_id = ?", [id]);

      for (let i = 0; i < input.items.length; i++) {
        const itemInput = input.items[i];
        const itemCalc = financialCalc.itemsCalculated[i];

        await db.execute(
          `
          INSERT INTO invoice_items (
            invoice_id,
            service_id,
            position,
            name,
            name_ar,
            name_en,
            description,
            description_ar,
            description_en,
            unit,
            quantity,
            unit_price_cents,
            discount_type,
            discount_rate,
            discount_amount_cents,
            tax_rate,
            tax_amount_cents,
            total_cents,
            created_at,
            updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            datetime('now'), datetime('now')
          )
          `,
          [
            id,
            itemInput.service_id || null,
            itemInput.position ?? i,
            itemInput.name,
            itemInput.name_ar || "",
            itemInput.name_en || "",
            itemInput.description || "",
            itemInput.description_ar || "",
            itemInput.description_en || "",
            itemInput.unit || "U",
            itemInput.quantity,
            itemInput.unit_price_cents,
            itemInput.discount_type || "fixed",
            itemInput.discount_rate || 0,
            itemCalc ? itemCalc.discountAmountCents : 0,
            itemInput.tax_rate || 0,
            itemCalc ? itemCalc.taxAmountCents : 0,
            itemCalc ? itemCalc.totalCents : toCents(itemInput.quantity * itemInput.unit_price_cents / 100),
          ]
        );
      }
    }

    const updated = await this.getInvoiceById(id);
    if (!updated) {
      throw new Error(`Failed to retrieve updated invoice ID: ${id}`);
    }

    return updated;
  },

  /**
   * Updates an invoice's status directly.
   */
  async updateInvoiceStatus(id: number, status: InvoiceStatus): Promise<boolean> {
    const db = await getDatabaseAsync();
    const result = await db.execute(
      "UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
    return result.rowsAffected > 0;
  },

  /**
   * Deletes an invoice and automatically cascades to line items and payments.
   */
  async deleteInvoice(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const result = await db.execute("DELETE FROM invoices WHERE id = ?", [id]);
    return result.rowsAffected > 0;
  },

  /**
   * Computes high-level aggregate financial metrics from the SQLite database.
   */
  async getInvoiceStats(): Promise<InvoiceStats> {
    const db = await getDatabaseAsync();

    const countRows = await db.select<{
      total_count: number;
      draft_count: number;
      unpaid_count: number;
      paid_count: number;
      total_unpaid_balance: number | null;
      total_paid_revenue: number | null;
      total_invoiced: number | null;
    }>(`
      SELECT 
        COUNT(id) as total_count,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status IN ('sent', 'partially_paid', 'overdue') THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status != 'cancelled' THEN balance_cents ELSE 0 END) as total_unpaid_balance,
        SUM(CASE WHEN status != 'cancelled' THEN paid_amount_cents ELSE 0 END) as total_paid_revenue,
        SUM(CASE WHEN status != 'cancelled' THEN total_cents ELSE 0 END) as total_invoiced
      FROM invoices
    `);

    const row = countRows[0] || {
      total_count: 0,
      draft_count: 0,
      unpaid_count: 0,
      paid_count: 0,
      total_unpaid_balance: 0,
      total_paid_revenue: 0,
      total_invoiced: 0,
    };

    return {
      totalInvoicesCount: Number(row.total_count) || 0,
      draftCount: Number(row.draft_count) || 0,
      unpaidCount: Number(row.unpaid_count) || 0,
      paidCount: Number(row.paid_count) || 0,
      totalUnpaidBalanceCents: Number(row.total_unpaid_balance) || 0,
      totalPaidRevenueCents: Number(row.total_paid_revenue) || 0,
      totalInvoicedCents: Number(row.total_invoiced) || 0,
    };
  },
};
