import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  formatMoney,
  calculateLineSubtotal,
  calculateDiscount,
  calculateTax,
  calculateLineTotal,
  calculateItemFinancials,
  calculateSubtotal,
  calculateTotal,
  calculateRemainingBalance,
  calculateInvoiceFinancials,
  derivePaymentStatus,
  validatePaymentAmount,
} from "./money";

describe("Financial Calculations & Money Utilities", () => {
  describe("Conversions (toCents and fromCents)", () => {
    it("converts decimal amounts to integer cents accurately without floating point flaws", () => {
      expect(toCents(500)).toBe(50000);
      expect(toCents(2000)).toBe(200000);
      expect(toCents(19.99)).toBe(1999);
      expect(toCents(0.1 + 0.2)).toBe(30); // Classic floating point test 0.30000000000000004 -> 30 cents
      expect(toCents("150,50")).toBe(15050);
      expect(toCents("2 000.00")).toBe(200000);
      expect(toCents(0)).toBe(0);
      expect(toCents(null)).toBe(0);
      expect(toCents(undefined)).toBe(0);
    });

    it("converts integer cents back to decimal currency", () => {
      expect(fromCents(50000)).toBe(500);
      expect(fromCents(200000)).toBe(2000);
      expect(fromCents(1999)).toBe(19.99);
      expect(fromCents(0)).toBe(0);
      expect(fromCents(null)).toBe(0);
    });

    it("formats monetary values cleanly in French/Moroccan convention", () => {
      expect(formatMoney(200000, "MAD", true)).toMatch(/2\s?000,00\sMAD/);
      expect(formatMoney(50000, "MAD", true)).toMatch(/500,00\sMAD/);
      expect(formatMoney(150.5, "MAD", false)).toMatch(/150,50\sMAD/);
    });
  });

  describe("Line Total & Line Item Calculations", () => {
    it("calculates Quantity 4 × 500 MAD = 2,000 MAD (user required example)", () => {
      const quantity = 4;
      const unitPriceCents = toCents(500); // 50,000 cents
      const subtotalCents = calculateLineSubtotal(quantity, unitPriceCents);

      expect(subtotalCents).toBe(200000); // 2,000.00 MAD in cents
      expect(fromCents(subtotalCents)).toBe(2000);

      const lineTotal = calculateLineTotal({
        quantity,
        unitPriceCents,
      });
      expect(lineTotal).toBe(200000);
    });

    it("handles fractional quantities accurately (e.g. 1.5 hours at 300 MAD = 450 MAD)", () => {
      const quantity = 1.5;
      const unitPriceCents = toCents(300);
      const subtotalCents = calculateLineSubtotal(quantity, unitPriceCents);

      expect(subtotalCents).toBe(45000);
      expect(fromCents(subtotalCents)).toBe(450);
    });

    it("applies percentage discount to line item (e.g. 10% on 2,000 MAD = 200 MAD discount -> 1,800 MAD total)", () => {
      const result = calculateItemFinancials({
        quantity: 4,
        unitPriceCents: toCents(500),
        discountType: "percentage",
        discountRate: 10,
      });

      expect(result.subtotalCents).toBe(200000); // 2,000 MAD
      expect(result.discountAmountCents).toBe(20000); // 200 MAD
      expect(result.taxAmountCents).toBe(0);
      expect(result.totalCents).toBe(180000); // 1,800 MAD
    });

    it("applies fixed discount to line item (e.g. 150 MAD fixed discount on 2,000 MAD -> 1,850 MAD total)", () => {
      const result = calculateItemFinancials({
        quantity: 4,
        unitPriceCents: toCents(500),
        discountType: "fixed",
        discountAmountCents: toCents(150),
      });

      expect(result.subtotalCents).toBe(200000);
      expect(result.discountAmountCents).toBe(15000); // 150 MAD
      expect(result.totalCents).toBe(185000); // 1,850 MAD
    });

    it("applies VAT/tax rate to line item (e.g. 20% TVA on 1,000 MAD = 200 MAD TVA -> 1,200 MAD total)", () => {
      const result = calculateItemFinancials({
        quantity: 2,
        unitPriceCents: toCents(500),
        taxRate: 20,
      });

      expect(result.subtotalCents).toBe(100000);
      expect(result.discountAmountCents).toBe(0);
      expect(result.taxAmountCents).toBe(20000); // 200 MAD TVA
      expect(result.totalCents).toBe(120000); // 1,200 MAD TTC
    });

    it("computes discount followed by tax correctly (discount reduces taxable base)", () => {
      // Subtotal 1,000 MAD, 10% discount (=100 MAD) -> Taxable base = 900 MAD -> 20% TVA on 900 = 180 MAD -> Total = 1,080 MAD
      const result = calculateItemFinancials({
        quantity: 2,
        unitPriceCents: toCents(500),
        discountType: "percentage",
        discountRate: 10,
        taxRate: 20,
      });

      expect(result.subtotalCents).toBe(100000);
      expect(result.discountAmountCents).toBe(10000);
      expect(result.taxAmountCents).toBe(18000);
      expect(result.totalCents).toBe(108000);
    });
  });

  describe("Subtotal, Discounts, Taxes, and Grand Total", () => {
    it("calculates standalone discount function for both percentage and fixed", () => {
      expect(calculateDiscount(200000, "percentage", 10)).toBe(20000);
      expect(calculateDiscount(200000, "fixed", 0, 15000)).toBe(15000);
      expect(calculateDiscount(200000, "percentage", 0)).toBe(0);
      // Discount cannot exceed base subtotal
      expect(calculateDiscount(5000, "fixed", 0, 10000)).toBe(5000);
    });

    it("calculates standalone tax function", () => {
      expect(calculateTax(100000, 20)).toBe(20000); // 20% on 1,000 MAD = 200 MAD
      expect(calculateTax(100000, 10)).toBe(10000); // 10% on 1,000 MAD = 100 MAD
      expect(calculateTax(100000, 0)).toBe(0);
    });

    it("calculates collection subtotal across multiple items", () => {
      const items = [
        { quantity: 2, unitPriceCents: toCents(500) }, // 1,000 MAD
        { quantity: 3, unitPriceCents: toCents(200) }, // 600 MAD
        { quantity: 1, unitPriceCents: toCents(400) }, // 400 MAD
      ];

      const subtotalCents = calculateSubtotal(items);
      expect(subtotalCents).toBe(200000); // 2,000 MAD
    });

    it("calculates grand total with discount and tax", () => {
      const subtotalCents = 200000; // 2,000 MAD
      const discountCents = 20000; // 200 MAD
      const taxCents = 36000; // 360 MAD

      const totalCents = calculateTotal(subtotalCents, discountCents, taxCents);
      expect(totalCents).toBe(216000); // 2,160 MAD
    });
  });

  describe("Amount Paid and Remaining Balance (User required scenarios)", () => {
    it("Scenario 1: Invoice total 5,000 MAD, Paid 0, Remaining 5,000 MAD", () => {
      const totalCents = toCents(5000); // 500,000 cents
      const paidCents = toCents(0); // 0 cents
      const remainingCents = calculateRemainingBalance(totalCents, paidCents);

      expect(remainingCents).toBe(500000);
      expect(fromCents(remainingCents)).toBe(5000);
    });

    it("Scenario 2: Invoice total 5,000 MAD, Paid 2,000 MAD, Remaining 3,000 MAD", () => {
      const totalCents = toCents(5000); // 500,000 cents
      const paidCents = toCents(2000); // 200,000 cents
      const remainingCents = calculateRemainingBalance(totalCents, paidCents);

      expect(remainingCents).toBe(300000);
      expect(fromCents(remainingCents)).toBe(3000);
    });

    it("Scenario 3: Invoice total 5,000 MAD, Paid 5,000 MAD, Remaining 0 MAD", () => {
      const totalCents = toCents(5000); // 500,000 cents
      const paidCents = toCents(5000); // 500,000 cents
      const remainingCents = calculateRemainingBalance(totalCents, paidCents);

      expect(remainingCents).toBe(0);
      expect(fromCents(remainingCents)).toBe(0);
    });

    it("prevents negative remaining balance if paid amount exceeds total", () => {
      const totalCents = toCents(5000);
      const paidCents = toCents(6000);
      const remainingCents = calculateRemainingBalance(totalCents, paidCents);

      expect(remainingCents).toBe(0);
    });
  });

  describe("Automatic Payment Status Derivation (User required examples)", () => {
    it("derives 'Non payée' when paid is 0 (total 5,000 MAD, paid 0)", () => {
      const totalCents = toCents(5000);
      const paidCents = toCents(0);
      const result = derivePaymentStatus(totalCents, paidCents);

      expect(result.statusLabel).toBe("Non payée");
      expect(result.statusType).toBe("unpaid");
      expect(result.status).toBe("sent");
    });

    it("derives 'Partiellement payée' when paid is less than total (total 5,000 MAD, paid 2,000 MAD)", () => {
      const totalCents = toCents(5000);
      const paidCents = toCents(2000);
      const result = derivePaymentStatus(totalCents, paidCents);

      expect(result.statusLabel).toBe("Partiellement payée");
      expect(result.statusType).toBe("partially_paid");
      expect(result.status).toBe("partially_paid");
    });

    it("derives 'Payée' when paid is equal to total (total 5,000 MAD, paid 5,000 MAD)", () => {
      const totalCents = toCents(5000);
      const paidCents = toCents(5000);
      const result = derivePaymentStatus(totalCents, paidCents);

      expect(result.statusLabel).toBe("Payée");
      expect(result.statusType).toBe("paid");
      expect(result.status).toBe("paid");
    });
  });

  describe("Payment Amount Validation with Clear French Messages", () => {
    it("validates zero payment as valid", () => {
      const validation = validatePaymentAmount(0, toCents(5000));
      expect(validation.isValid).toBe(true);
    });

    it("validates full payment as valid", () => {
      const validation = validatePaymentAmount(toCents(5000), toCents(5000));
      expect(validation.isValid).toBe(true);
    });

    it("validates partial payment as valid", () => {
      const validation = validatePaymentAmount(toCents(2000), toCents(5000));
      expect(validation.isValid).toBe(true);
    });

    it("rejects negative payment with clear French message", () => {
      const validation = validatePaymentAmount(-100, toCents(5000));
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toBe("Le montant payé ne peut pas être négatif.");
    });

    it("rejects overpayment exceeding total with clear French message", () => {
      const validation = validatePaymentAmount(toCents(6000), toCents(5000), "MAD");
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toContain("ne peut pas dépasser le total");
    });
  });

  describe("Complete Invoice Financials Integration", () => {
    it("calculates a comprehensive multi-item invoice with partial payment", () => {
      const invoiceData = {
        items: [
          {
            quantity: 4,
            unitPriceCents: toCents(500), // 2,000 MAD
            discountType: "percentage" as const,
            discountRate: 10, // 200 MAD discount -> 1,800 MAD
            taxRate: 20, // 20% of 1,800 = 360 MAD -> 2,160 MAD
          },
          {
            quantity: 2,
            unitPriceCents: toCents(1420), // 2,840 MAD
            taxRate: 20, // 20% of 2,840 = 568 MAD -> 3,408 MAD
          },
        ],
        paidAmountCents: toCents(2000), // 2,000 MAD paid
      };

      const result = calculateInvoiceFinancials(invoiceData);

      // Subtotal: 2,000 + 2,840 = 4,840 MAD = 484,000 cents
      expect(result.subtotalCents).toBe(484000);

      // Discounts: 200 MAD = 20,000 cents
      expect(result.discountAmountCents).toBe(20000);

      // Tax: 360 + 568 = 928 MAD = 92,800 cents
      expect(result.taxAmountCents).toBe(92800);

      // Grand Total: (4,840 - 200) + 928 = 4,640 + 928 = 5,568 MAD = 556,800 cents
      expect(result.totalCents).toBe(556800);

      // Paid: 2,000 MAD = 200,000 cents
      expect(result.paidAmountCents).toBe(200000);

      // Remaining Balance: 5,568 - 2,000 = 3,568 MAD = 356,800 cents
      expect(result.balanceCents).toBe(356800);
      expect(fromCents(result.balanceCents)).toBe(3568);
    });
  });
});
