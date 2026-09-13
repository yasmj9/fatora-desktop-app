import { getDatabaseAsync } from "../client";
import { companyRepository } from "./companyRepository";
import { clientRepository } from "./clientRepository";
import { invoiceRepository } from "./invoiceRepository";
import {
  Quotation,
  QuotationItem,
  QuotationCreateInput,
  QuotationFilterOptions,
  QuotationStatus,
} from "../../types/quotation";
import { Invoice } from "../../types/invoice";
import { calculateInvoiceFinancials, toCents } from "../../utils/money";

export const quotationRepository = {
  /**
   * Generates the next sequential quotation number for a given year and prefix.
   * Format: `${prefix}-${year}-${0001}` (e.g. "DEV-2026-0001")
   */
  async getNextQuotationNumber(
    year: number = new Date().getFullYear(),
    prefix: string = "DEV"
  ): Promise<{ quotationNumber: string; sequenceNumber: number; sequenceYear: number; prefix: string }> {
    const db = await getDatabaseAsync();

    const rows = await db.select<{ max_seq: number | null }>(
      `SELECT MAX(sequence_number) as max_seq FROM quotations WHERE sequence_year = ? AND prefix = ?`,
      [year, prefix]
    );

    const maxSeq = rows.length > 0 && rows[0].max_seq ? rows[0].max_seq : 0;
    let sequenceNumber = maxSeq + 1;
    let formattedSeq = String(sequenceNumber).padStart(4, "0");
    let quotationNumber = `${prefix}-${year}-${formattedSeq}`;

    // Collision avoidance
    let exists = await db.select<{ id: number }>(
      `SELECT id FROM quotations WHERE quotation_number = ? LIMIT 1`,
      [quotationNumber]
    );
    while (exists.length > 0) {
      sequenceNumber += 1;
      formattedSeq = String(sequenceNumber).padStart(4, "0");
      quotationNumber = `${prefix}-${year}-${formattedSeq}`;
      exists = await db.select<{ id: number }>(
        `SELECT id FROM quotations WHERE quotation_number = ? LIMIT 1`,
        [quotationNumber]
      );
    }

    return {
      quotationNumber,
      sequenceNumber,
      sequenceYear: year,
      prefix,
    };
  },

  /**
   * Retrieves quotations with flexible filtering, search, and sorting.
   */
  async getQuotations(filters?: QuotationFilterOptions): Promise<Quotation[]> {
    const db = await getDatabaseAsync();

    let query = "SELECT * FROM quotations WHERE 1=1";
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
      query += " AND quotation_date >= ?";
      bindValues.push(filters.startDate);
    }

    if (filters?.endDate) {
      query += " AND quotation_date <= ?";
      bindValues.push(filters.endDate);
    }

    query += " ORDER BY sequence_year DESC, sequence_number DESC, id DESC";

    const quotations = await db.select<Quotation>(query, bindValues);

    if (filters?.search && filters.search.trim() !== "") {
      const search = filters.search.toLowerCase().trim();
      return quotations.filter((q) => {
        const num = (q.quotation_number || "").toLowerCase();
        const client = (q.client_name || "").toLowerCase();
        const phone = (q.client_phone || "").replace(/\D/g, "");
        const ice = (q.client_ice || "").toLowerCase();
        const notes = (q.notes || "").toLowerCase();

        return (
          num.includes(search) ||
          client.includes(search) ||
          phone.includes(search.replace(/\D/g, "")) ||
          ice.includes(search) ||
          notes.includes(search)
        );
      });
    }

    return quotations;
  },

  /**
   * Retrieves a full quotation by ID, including its line items.
   */
  async getQuotationById(id: number): Promise<Quotation | null> {
    const db = await getDatabaseAsync();

    const quotationRows = await db.select<Quotation>(
      "SELECT * FROM quotations WHERE id = ? LIMIT 1",
      [id]
    );

    if (quotationRows.length === 0) return null;

    const quotation = quotationRows[0];

    // Fetch line items ordered by position
    const items = await db.select<QuotationItem>(
      "SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY position ASC, id ASC",
      [id]
    );

    return {
      ...quotation,
      items,
    };
  },

  /**
   * Creates a new Quotation with snapshots for items, client, and seller.
   */
  async createQuotation(input: QuotationCreateInput): Promise<Quotation> {
    const db = await getDatabaseAsync();

    // 1. Determine quotation numbering
    const currentYear = new Date().getFullYear();
    const nextNumberData = await this.getNextQuotationNumber(
      input.sequence_year || currentYear,
      input.prefix || "DEV"
    );

    const quotationNumber = input.quotation_number || nextNumberData.quotationNumber;
    const sequenceNumber = input.sequence_number || nextNumberData.sequenceNumber;
    const sequenceYear = input.sequence_year || nextNumberData.sequenceYear;
    const prefix = input.prefix || nextNumberData.prefix;

    // Check duplicate
    const duplicateCheck = await db.select<{ id: number }>(
      `SELECT id FROM quotations WHERE quotation_number = ? LIMIT 1`,
      [quotationNumber]
    );
    if (duplicateCheck.length > 0) {
      throw new Error(`Ce numéro de devis (${quotationNumber}) existe déjà.`);
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
        console.warn("[quotationRepository] Could not load company settings for snapshot:", err);
      }
    }

    // 3. Fetch Client snapshot if client_id is given
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
        console.warn("[quotationRepository] Could not load client for snapshot:", err);
      }
    }

    // 4. Calculate Financials using integer cents
    const financialCalc = calculateInvoiceFinancials({
      items: input.items.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        discountType: item.discount_type,
        discountRate: item.discount_rate,
        discountAmountCents: item.discount_amount_cents,
        taxRate: item.tax_rate,
      })),
      globalDiscountType: input.discount_type,
      globalDiscountRate: input.discount_rate,
      globalDiscountAmountCents: input.discount_amount_cents,
      globalTaxRate: input.tax_rate,
      paidAmountCents: 0,
    });

    const quotationDate = input.quotation_date || new Date().toISOString().split("T")[0];
    const validUntilDate = input.valid_until_date || "";
    const notes = input.notes || "";
    const paymentTerms = input.payment_terms || "";
    const status: QuotationStatus = input.status || "draft";

    // 5. Database Transaction Execution
    await db.execute("BEGIN TRANSACTION;");
    let quotationId: number;

    try {
      const insertResult = await db.execute(
        `
        INSERT INTO quotations (
          quotation_number,
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
          quotation_date,
          valid_until_date,
          notes,
          payment_terms,
          subtotal_cents,
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
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
        `,
        [
          quotationNumber,
          sequenceNumber,
          sequenceYear,
          prefix,
          status,
          documentLanguage,
          currency,
          input.client_id || null,
          clientName || "",
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
          quotationDate,
          validUntilDate,
          notes,
          paymentTerms,
          financialCalc.subtotalCents,
          input.discount_type || "fixed",
          input.discount_rate || 0,
          financialCalc.discountAmountCents,
          input.tax_rate || 0,
          financialCalc.taxAmountCents,
          financialCalc.totalCents,
        ]
      );

      quotationId = insertResult.lastInsertId!;

      // Insert Line Items
      for (let i = 0; i < input.items.length; i++) {
        const itemInput = input.items[i];
        const itemCalc = financialCalc.itemsCalculated[i];

        await db.execute(
          `
          INSERT INTO quotation_items (
            quotation_id,
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
            quotationId,
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
            itemCalc ? itemCalc.totalCents : toCents((itemInput.quantity * itemInput.unit_price_cents) / 100),
          ]
        );
      }

      await db.execute("COMMIT;");
    } catch (txError) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[quotationRepository] Rollback error:", rollbackErr);
      }
      throw txError;
    }

    const created = await this.getQuotationById(quotationId);
    if (!created) {
      throw new Error(`Failed to retrieve newly created quotation ID: ${quotationId}`);
    }

    return created;
  },

  /**
   * Updates an existing quotation status directly.
   */
  async updateQuotationStatus(id: number, status: QuotationStatus): Promise<boolean> {
    const db = await getDatabaseAsync();
    const result = await db.execute(
      "UPDATE quotations SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
    return result.rowsAffected > 0;
  },

  /**
   * Deletes a quotation and line items.
   */
  async deleteQuotation(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const result = await db.execute("DELETE FROM quotations WHERE id = ?", [id]);
    return result.rowsAffected > 0;
  },

  /**
   * CONVERT QUOTATION TO INVOICE ("Convertir en facture")
   * 
   * Copies client, items, descriptions, quantities, prices, discounts, and taxes.
   * Generates a NEW invoice number (does NOT reuse quotation number).
   * Preserves the original quotation and its financial snapshot intact.
   * Marks the quotation as 'invoiced' ("Facturé") and links `converted_invoice_id`.
   * Executes in a database transaction.
   */
  async convertQuotationToInvoice(quotationId: number): Promise<Invoice> {
    const quotation = await this.getQuotationById(quotationId);
    if (!quotation) {
      throw new Error(`Le devis N° ${quotationId} n'a pas été trouvé.`);
    }

    if (quotation.status === "invoiced" && quotation.converted_invoice_id) {
      // If already converted, fetch and return the existing linked invoice
      const existingInvoice = await invoiceRepository.getInvoiceById(quotation.converted_invoice_id);
      if (existingInvoice) {
        return existingInvoice;
      }
    }

    const items = quotation.items || [];
    if (items.length === 0) {
      throw new Error("Ce devis ne contient aucune prestation à facturer.");
    }

    // 1. Generate a NEW sequential invoice number based on company settings
    const currentYear = new Date().getFullYear();
    const nextInvoiceData = await invoiceRepository.getNextInvoiceNumber(currentYear);

    // 2. Prepare financials from quotation items snapshot
    const financialCalc = calculateInvoiceFinancials({
      items: items.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unit_price_cents,
        discountType: item.discount_type,
        discountRate: item.discount_rate,
        discountAmountCents: item.discount_amount_cents,
        taxRate: item.tax_rate,
      })),
      globalDiscountType: quotation.discount_type,
      globalDiscountRate: quotation.discount_rate,
      globalDiscountAmountCents: quotation.discount_amount_cents,
      globalTaxRate: quotation.tax_rate,
      paidAmountCents: 0,
    });

    const invoiceDate = new Date().toISOString().split("T")[0];
    const db = await getDatabaseAsync();

    // 3. Perform Transaction: Create Invoice + Mark Quotation as Invoiced
    await db.execute("BEGIN TRANSACTION;");
    let invoiceId: number;

    try {
      // 3a. Insert Invoice Header with copied Client and Seller snapshots
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
          nextInvoiceData.invoiceNumber,
          nextInvoiceData.sequenceNumber,
          nextInvoiceData.sequenceYear,
          nextInvoiceData.prefix,
          "sent", // Status is 'sent' / 'unpaid' upon conversion
          quotation.language || "fr",
          quotation.currency || "MAD",
          quotation.client_id || null,
          quotation.client_name,
          quotation.client_type || "individual",
          quotation.client_contact_person || "",
          quotation.client_phone || "",
          quotation.client_address || "",
          quotation.client_city || "",
          quotation.client_email || "",
          quotation.client_ice || "",
          quotation.client_if || "",
          quotation.client_rc || "",
          quotation.seller_name || "",
          quotation.seller_contact_person || "",
          quotation.seller_phone || "",
          quotation.seller_address || "",
          quotation.seller_city || "",
          quotation.seller_email || "",
          quotation.seller_ice || "",
          quotation.seller_if || "",
          quotation.seller_rc || "",
          quotation.seller_patente || "",
          quotation.seller_cnss || "",
          quotation.seller_bank_name || "",
          quotation.seller_rib || "",
          invoiceDate,
          "", // due date
          quotation.notes ? `Converti du devis ${quotation.quotation_number}. ${quotation.notes}` : `Converti du devis ${quotation.quotation_number}`,
          quotation.payment_terms || "",
          financialCalc.subtotalCents,
          quotation.discount_type || "fixed",
          quotation.discount_rate || 0,
          financialCalc.discountAmountCents,
          quotation.tax_rate || 0,
          financialCalc.taxAmountCents,
          financialCalc.totalCents,
          0, // paid_amount_cents
          financialCalc.totalCents, // balance_cents
        ]
      );

      invoiceId = insertInvoiceResult.lastInsertId!;

      // 3b. Copy Line Items exactly (names, descriptions, quantities, prices, discounts, taxes)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
            item.service_id || null,
            item.position ?? i,
            item.name,
            item.name_ar || "",
            item.name_en || "",
            item.description || "",
            item.description_ar || "",
            item.description_en || "",
            item.unit || "U",
            item.quantity,
            item.unit_price_cents,
            item.discount_type || "fixed",
            item.discount_rate || 0,
            itemCalc ? itemCalc.discountAmountCents : (item.discount_amount_cents || 0),
            item.tax_rate || 0,
            itemCalc ? itemCalc.taxAmountCents : (item.tax_amount_cents || 0),
            itemCalc ? itemCalc.totalCents : item.total_cents,
          ]
        );
      }

      // 3c. Mark original quotation status as 'invoiced' ("Facturé") and store relationship
      await db.execute(
        `
        UPDATE quotations 
        SET status = 'invoiced',
            converted_invoice_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
        `,
        [invoiceId, quotationId]
      );

      await db.execute("COMMIT;");
    } catch (txError) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[quotationRepository] Rollback error:", rollbackErr);
      }
      throw txError;
    }

    // 4. Retrieve created invoice
    const createdInvoice = await invoiceRepository.getInvoiceById(invoiceId);
    if (!createdInvoice) {
      throw new Error(`Failed to retrieve newly converted invoice ID: ${invoiceId}`);
    }

    return createdInvoice;
  },
};
