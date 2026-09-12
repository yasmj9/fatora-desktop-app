import { getDatabaseAsync } from "../client";
import { Payment, PaymentCreateInput } from "../../types/invoice";
import { formatMoney } from "../../utils/money";

export const paymentRepository = {
  /**
   * Retrieves all payments associated with a specific invoice.
   */
  async getPaymentsByInvoiceId(invoiceId: number): Promise<Payment[]> {
    const db = await getDatabaseAsync();
    return db.select<Payment>(
      "SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC, id ASC",
      [invoiceId]
    );
  },

  /**
   * Adds a new payment to an invoice within a SQLite database transaction.
   * Recalculates total paid, remaining balance, and invoice status.
   */
  async addPayment(input: PaymentCreateInput): Promise<Payment> {
    const db = await getDatabaseAsync();

    if (!input.invoice_id) {
      throw new Error("L'identifiant de la facture est obligatoire pour enregistrer un paiement.");
    }

    if (!input.amount_cents || input.amount_cents <= 0) {
      throw new Error("Le montant du paiement doit être supérieur à zéro.");
    }

    // 1. Fetch current invoice state for validation
    const invoiceRows = await db.select<{
      id: number;
      total_cents: number;
      paid_amount_cents: number;
      balance_cents: number;
      status: string;
      currency?: string;
    }>(
      "SELECT id, total_cents, paid_amount_cents, balance_cents, status, currency FROM invoices WHERE id = ? LIMIT 1",
      [input.invoice_id]
    );

    if (invoiceRows.length === 0) {
      throw new Error("La facture spécifiée est introuvable.");
    }

    const invoice = invoiceRows[0];

    if (invoice.status === "cancelled") {
      throw new Error("Impossible d'ajouter un paiement à une facture annulée.");
    }

    const remainingBalanceCents = Math.max(
      0,
      invoice.balance_cents ?? (invoice.total_cents - (invoice.paid_amount_cents || 0))
    );

    if (remainingBalanceCents <= 0) {
      throw new Error("Cette facture est déjà entièrement réglée.");
    }

    if (input.amount_cents > remainingBalanceCents) {
      const currency = invoice.currency || "MAD";
      throw new Error(
        `Le montant du paiement (${formatMoney(input.amount_cents, currency, true)}) ne peut pas dépasser le reste à payer (${formatMoney(remainingBalanceCents, currency, true)}).`
      );
    }

    const paymentDate = input.payment_date || new Date().toISOString().split("T")[0];
    const paymentMethod = input.payment_method || "cash";
    const reference = input.reference || "";
    const notes = input.notes || "";

    // 2. Execute payment creation and invoice recalculation in a single transaction
    await db.execute("BEGIN TRANSACTION;");

    try {
      const insertResult = await db.execute(
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
          input.invoice_id,
          input.amount_cents,
          paymentDate,
          paymentMethod,
          reference,
          notes,
        ]
      );

      const paymentId = insertResult.lastInsertId!;

      // 3. Recalculate aggregate paid amount from all stored payments
      const sumRows = await db.select<{ total_paid: number | null }>(
        "SELECT SUM(amount_cents) as total_paid FROM payments WHERE invoice_id = ?",
        [input.invoice_id]
      );

      const totalPaidCents =
        sumRows.length > 0 && sumRows[0].total_paid ? Number(sumRows[0].total_paid) : 0;

      const balanceCents = Math.max(0, invoice.total_cents - totalPaidCents);

      // 4. Recalculate invoice status based on updated total paid and balance
      let newStatus = invoice.status;
      if (invoice.status !== "cancelled") {
        if (balanceCents === 0 && invoice.total_cents > 0) {
          newStatus = "paid";
        } else if (totalPaidCents > 0 && balanceCents > 0) {
          newStatus = "partially_paid";
        } else if (totalPaidCents === 0) {
          newStatus = invoice.status === "draft" ? "draft" : "sent";
        }
      }

      await db.execute(
        `
        UPDATE invoices SET
          paid_amount_cents = ?,
          balance_cents = ?,
          status = ?,
          updated_at = datetime('now')
        WHERE id = ?
        `,
        [totalPaidCents, balanceCents, newStatus, input.invoice_id]
      );

      await db.execute("COMMIT;");

      const createdRows = await db.select<Payment>(
        "SELECT * FROM payments WHERE id = ? LIMIT 1",
        [paymentId]
      );

      return createdRows[0];
    } catch (txError) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[paymentRepository] Rollback error:", rollbackErr);
      }
      throw txError;
    }
  },

  /**
   * Deletes a payment record and synchronizes the invoice's remaining balance in a transaction.
   */
  async deletePayment(paymentId: number): Promise<boolean> {
    const db = await getDatabaseAsync();

    const paymentRows = await db.select<Payment>(
      "SELECT invoice_id FROM payments WHERE id = ? LIMIT 1",
      [paymentId]
    );

    if (paymentRows.length === 0) return false;
    const invoiceId = paymentRows[0].invoice_id;

    await db.execute("BEGIN TRANSACTION;");

    try {
      await db.execute("DELETE FROM payments WHERE id = ?", [paymentId]);

      // Recalculate invoice payment state
      await this.syncInvoicePaymentState(invoiceId);

      await db.execute("COMMIT;");
      return true;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[paymentRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Helper that aggregates all payments for an invoice and updates the invoice's
   * `paid_amount_cents`, `balance_cents`, and `status`.
   */
  async syncInvoicePaymentState(invoiceId: number): Promise<void> {
    const db = await getDatabaseAsync();

    // 1. Calculate total paid for invoice
    const sumRows = await db.select<{ total_paid: number | null }>(
      "SELECT SUM(amount_cents) as total_paid FROM payments WHERE invoice_id = ?",
      [invoiceId]
    );
    const totalPaidCents =
      sumRows.length > 0 && sumRows[0].total_paid ? Number(sumRows[0].total_paid) : 0;

    // 2. Get current invoice total and status
    const invoiceRows = await db.select<{ total_cents: number; status: string }>(
      "SELECT total_cents, status FROM invoices WHERE id = ? LIMIT 1",
      [invoiceId]
    );

    if (invoiceRows.length === 0) return;

    const totalCents = invoiceRows[0].total_cents;
    const currentStatus = invoiceRows[0].status;
    const balanceCents = Math.max(0, totalCents - totalPaidCents);

    // Determine status transition
    let newStatus = currentStatus;
    if (currentStatus !== "cancelled") {
      if (balanceCents === 0 && totalCents > 0) {
        newStatus = "paid";
      } else if (totalPaidCents > 0 && balanceCents > 0) {
        newStatus = "partially_paid";
      } else if (totalPaidCents === 0 && currentStatus === "paid") {
        newStatus = "sent";
      }
    }

    await db.execute(
      `
      UPDATE invoices SET
        paid_amount_cents = ?,
        balance_cents = ?,
        status = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [totalPaidCents, balanceCents, newStatus, invoiceId]
    );
  },
};
