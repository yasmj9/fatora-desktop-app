import { getDatabaseAsync } from "../client";
import { Payment, PaymentCreateInput } from "../../types/invoice";

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
   * Adds a new payment to an invoice and recalculates the invoice paid amount,
   * remaining balance, and status (e.g. partially_paid or paid).
   */
  async addPayment(input: PaymentCreateInput): Promise<Payment> {
    const db = await getDatabaseAsync();

    if (!input.invoice_id) {
      throw new Error("Invoice ID is required to register a payment.");
    }

    if (!input.amount_cents || input.amount_cents <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const paymentDate = input.payment_date || new Date().toISOString().split("T")[0];
    const paymentMethod = input.payment_method || "cash";
    const reference = input.reference || "";
    const notes = input.notes || "";

    // 1. Insert the payment
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

    // 2. Synchronize invoice paid amounts and balance
    await this.syncInvoicePaymentState(input.invoice_id);

    const createdRows = await db.select<Payment>(
      "SELECT * FROM payments WHERE id = ? LIMIT 1",
      [paymentId]
    );

    return createdRows[0];
  },

  /**
   * Deletes a payment record and synchronizes the invoice's remaining balance.
   */
  async deletePayment(paymentId: number): Promise<boolean> {
    const db = await getDatabaseAsync();

    const paymentRows = await db.select<Payment>(
      "SELECT invoice_id FROM payments WHERE id = ? LIMIT 1",
      [paymentId]
    );

    if (paymentRows.length === 0) return false;
    const invoiceId = paymentRows[0].invoice_id;

    await db.execute("DELETE FROM payments WHERE id = ?", [paymentId]);

    // Recalculate invoice payment state
    await this.syncInvoicePaymentState(invoiceId);

    return true;
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
    const totalPaidCents = sumRows.length > 0 && sumRows[0].total_paid ? sumRows[0].total_paid : 0;

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
    if (balanceCents === 0 && totalCents > 0) {
      newStatus = "paid";
    } else if (totalPaidCents > 0 && balanceCents > 0) {
      newStatus = "partially_paid";
    } else if (totalPaidCents === 0 && currentStatus === "paid") {
      newStatus = "sent";
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
