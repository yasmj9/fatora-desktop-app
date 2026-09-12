/**
 * Money and Financial Calculation Utilities
 *
 * Provides safe integer-centime conversions, rounding, and business logic
 * to avoid floating-point inaccuracies in billing and invoices.
 */

export type DiscountType = "fixed" | "percentage";

export interface LineItemCalculationInput {
  quantity: number;
  unitPriceCents: number;
  discountType?: DiscountType;
  discountRate?: number;
  discountAmountCents?: number;
  taxRate?: number;
}

export interface ItemFinancialsCalculationResult {
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
}

export interface InvoiceFinancialsCalculationInput {
  items: LineItemCalculationInput[];
  globalDiscountType?: DiscountType;
  globalDiscountRate?: number;
  globalDiscountAmountCents?: number;
  globalTaxRate?: number;
  paidAmountCents?: number;
}

export interface InvoiceFinancialsCalculationResult {
  itemsCalculated: ItemFinancialsCalculationResult[];
  subtotalCents: number;
  discountAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
  paidAmountCents: number;
  balanceCents: number;
}

/**
 * Converts a standard decimal currency amount (e.g. 150.50 MAD) to integer cents (15050).
 */
export function toCents(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === "") return 0;
  const num =
    typeof amount === "string"
      ? parseFloat(amount.replace(/\s+/g, "").replace(",", "."))
      : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer cents (e.g. 15050) back to standard decimal currency (150.50).
 */
export function fromCents(cents: number | null | undefined): number {
  if (cents === null || cents === undefined || isNaN(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

/**
 * Formats monetary amounts for display with proper thousands separator and 2 decimals.
 * Example: 15050 cents -> "150,50 MAD" or 150.5 decimal -> "150,50 MAD"
 */
export function formatMoney(
  amountOrCents: number | null | undefined,
  currency = "MAD",
  isAlreadyInCents = true
): string {
  const decimalVal = isAlreadyInCents
    ? fromCents(amountOrCents)
    : Number(amountOrCents || 0);
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalVal);

  return `${formatted} ${currency}`;
}

/**
 * Calculates raw line subtotal before discounts and taxes (in cents).
 * Example: Quantity 4 × 50,000 cents (500 MAD) = 200,000 cents (2,000 MAD).
 */
export function calculateLineSubtotal(quantity: number, unitPriceCents: number): number {
  const qty = isNaN(quantity) || quantity < 0 ? 0 : quantity;
  const unitPrice = isNaN(unitPriceCents) || unitPriceCents < 0 ? 0 : unitPriceCents;
  return Math.round(qty * unitPrice);
}

/**
 * Calculates discount amount in cents for a given base subtotal.
 */
export function calculateDiscount(
  baseSubtotalCents: number,
  discountType?: DiscountType,
  discountRate?: number,
  discountAmountCents?: number
): number {
  const subtotal = Math.max(0, baseSubtotalCents);
  let discountCents = 0;

  if (discountType === "percentage" && discountRate && discountRate > 0) {
    discountCents = Math.round((subtotal * discountRate) / 100);
  } else if (discountAmountCents && discountAmountCents > 0) {
    discountCents = discountAmountCents;
  }

  return Math.min(discountCents, subtotal);
}

/**
 * Calculates tax amount in cents for a given taxable base.
 */
export function calculateTax(taxableBaseCents: number, taxRate?: number): number {
  const base = Math.max(0, taxableBaseCents);
  if (!taxRate || taxRate <= 0) return 0;
  return Math.round((base * taxRate) / 100);
}

/**
 * Calculates individual line-item total in cents.
 */
export function calculateLineTotal(input: LineItemCalculationInput): number {
  const subtotal = calculateLineSubtotal(input.quantity, input.unitPriceCents);
  const discount = calculateDiscount(
    subtotal,
    input.discountType,
    input.discountRate,
    input.discountAmountCents
  );
  const taxableBase = subtotal - discount;
  const tax = calculateTax(taxableBase, input.taxRate);
  return taxableBase + tax;
}

/**
 * Full item-level financial calculation (returns breakdown of subtotal, discount, tax, total).
 */
export function calculateItemFinancials(
  input: LineItemCalculationInput
): ItemFinancialsCalculationResult {
  const subtotalCents = calculateLineSubtotal(input.quantity, input.unitPriceCents);
  const discountAmountCents = calculateDiscount(
    subtotalCents,
    input.discountType,
    input.discountRate,
    input.discountAmountCents
  );
  const taxableBase = subtotalCents - discountAmountCents;
  const taxAmountCents = calculateTax(taxableBase, input.taxRate);
  const totalCents = taxableBase + taxAmountCents;

  return {
    subtotalCents,
    discountAmountCents,
    taxAmountCents,
    totalCents,
  };
}

/**
 * Calculates the overall subtotal of a collection of items (sum of line subtotals).
 */
export function calculateSubtotal(
  items: Array<{ quantity: number; unitPriceCents: number }>
): number {
  return items.reduce((acc, curr) => acc + calculateLineSubtotal(curr.quantity, curr.unitPriceCents), 0);
}

/**
 * Calculates grand total from subtotal, total discounts, and total taxes.
 */
export function calculateTotal(
  subtotalCents: number,
  discountCents = 0,
  taxCents = 0
): number {
  const discounted = Math.max(0, subtotalCents - discountCents);
  return discounted + Math.max(0, taxCents);
}

/**
 * Calculates remaining unpaid balance given grand total and amount paid.
 * Examples:
 *   Total 5,000 MAD, Paid 0 -> Remaining 5,000 MAD
 *   Total 5,000 MAD, Paid 2,000 MAD -> Remaining 3,000 MAD
 *   Total 5,000 MAD, Paid 5,000 MAD -> Remaining 0 MAD
 */
export function calculateRemainingBalance(
  totalCents: number,
  paidAmountCents: number
): number {
  const total = Math.max(0, totalCents);
  const paid = Math.max(0, paidAmountCents);
  return Math.max(0, total - paid);
}

export type PaymentStatusType = "unpaid" | "partially_paid" | "paid";

export interface DerivedPaymentStatusResult {
  status: "draft" | "sent" | "partially_paid" | "paid";
  statusType: PaymentStatusType;
  statusLabel: string;
  statusDescription: string;
  statusBadgeClasses: string;
}

/**
 * Automatically derives the invoice payment status from total and paid amount in cents.
 *
 * Rules:
 * - Paid 0: "Non payée"
 * - Paid less than total: "Partiellement payée"
 * - Paid equal to total (or greater): "Payée"
 */
export function derivePaymentStatus(
  totalCents: number,
  paidAmountCents: number
): DerivedPaymentStatusResult {
  const total = Math.max(0, totalCents);
  const paid = Math.max(0, paidAmountCents);

  if (total === 0 || paid === 0) {
    return {
      status: "sent",
      statusType: "unpaid",
      statusLabel: "Non payée",
      statusDescription: "Aucun règlement n'a encore été perçu pour cette facture.",
      statusBadgeClasses: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }

  if (paid < total) {
    return {
      status: "partially_paid",
      statusType: "partially_paid",
      statusLabel: "Partiellement payée",
      statusDescription: "Un acompte ou règlement partiel a été enregistré.",
      statusBadgeClasses: "bg-blue-100 text-blue-900 border-blue-300",
    };
  }

  return {
    status: "paid",
    statusType: "paid",
    statusLabel: "Payée",
    statusDescription: "La facture est intégralement réglée.",
    statusBadgeClasses: "bg-emerald-100 text-emerald-900 border-emerald-300",
  };
}

export interface PaymentValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates payment amount against the invoice total with clear French messages.
 */
export function validatePaymentAmount(
  paidAmountCents: number,
  totalCents: number,
  currency = "MAD"
): PaymentValidationResult {
  if (isNaN(paidAmountCents)) {
    return {
      isValid: false,
      errorMessage: "Veuillez saisir un montant numérique valide.",
    };
  }

  if (paidAmountCents < 0) {
    return {
      isValid: false,
      errorMessage: "Le montant payé ne peut pas être négatif.",
    };
  }

  if (totalCents > 0 && paidAmountCents > totalCents) {
    const formattedTotal = formatMoney(totalCents, currency, true);
    return {
      isValid: false,
      errorMessage: `Le montant payé (${formatMoney(paidAmountCents, currency, true)}) ne peut pas dépasser le total de la facture (${formattedTotal}).`,
    };
  }

  return { isValid: true };
}

/**
 * Computes complete invoice financials, combining line items, invoice-level discounts/taxes,
 * and remaining unpaid balance.
 */
export function calculateInvoiceFinancials(
  input: InvoiceFinancialsCalculationInput
): InvoiceFinancialsCalculationResult {
  const itemsCalculated = input.items.map((item) => calculateItemFinancials(item));

  // Sum of raw line subtotals
  const itemsSubtotalCents = itemsCalculated.reduce(
    (acc, curr) => acc + curr.subtotalCents,
    0
  );

  // Global Invoice Discount (if specified at invoice level)
  let globalDiscountCents = 0;
  if (
    input.globalDiscountType === "percentage" &&
    input.globalDiscountRate &&
    input.globalDiscountRate > 0
  ) {
    globalDiscountCents = Math.round((itemsSubtotalCents * input.globalDiscountRate) / 100);
  } else if (input.globalDiscountAmountCents && input.globalDiscountAmountCents > 0) {
    globalDiscountCents = input.globalDiscountAmountCents;
  }
  globalDiscountCents = Math.min(globalDiscountCents, itemsSubtotalCents);

  const baseForTax = itemsSubtotalCents - globalDiscountCents;

  // Global Invoice Tax (e.g. 20% TVA)
  let globalTaxCents = 0;
  if (input.globalTaxRate && input.globalTaxRate > 0) {
    globalTaxCents = Math.round((baseForTax * input.globalTaxRate) / 100);
  }

  // If item-level tax was used and no global tax is applied, aggregate item taxes
  const itemLevelTaxes = itemsCalculated.reduce((acc, curr) => acc + curr.taxAmountCents, 0);
  const itemLevelDiscounts = itemsCalculated.reduce((acc, curr) => acc + curr.discountAmountCents, 0);

  const finalDiscountCents = globalDiscountCents > 0 ? globalDiscountCents : itemLevelDiscounts;
  const finalTaxCents = globalTaxCents > 0 ? globalTaxCents : itemLevelTaxes;

  // Final grand total
  const totalCents = Math.max(0, itemsSubtotalCents - finalDiscountCents) + finalTaxCents;

  const paidAmountCents = Math.max(0, input.paidAmountCents || 0);
  const balanceCents = calculateRemainingBalance(totalCents, paidAmountCents);

  return {
    itemsCalculated,
    subtotalCents: itemsSubtotalCents,
    discountAmountCents: finalDiscountCents,
    taxAmountCents: finalTaxCents,
    totalCents,
    paidAmountCents,
    balanceCents,
  };
}
