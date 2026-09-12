import { Invoice } from "../types/invoice";
import { InvoiceStyle } from "../types/invoiceStyle";
import { DocumentData } from "../types/documentData";

/**
 * Builds an immutable, self-contained DocumentData snapshot from an Invoice and an InvoiceStyle.
 * Decouples raw business entity models from visual document rendering components and PDF generators.
 */
export function buildDocumentData(
  invoice: Invoice,
  style: InvoiceStyle,
  logoDataUrl: string | null = null
): DocumentData {
  const lang = invoice.language || "fr";

  return {
    documentNumber: invoice.invoice_number,
    type: "invoice",
    date: invoice.invoice_date,
    dueDate: invoice.due_date,
    language: lang,
    currency: invoice.currency || "MAD",

    company: {
      name: invoice.seller_name || "Entreprise",
      contactPerson: invoice.seller_contact_person,
      address: invoice.seller_address,
      city: invoice.seller_city,
      phone: invoice.seller_phone,
      email: invoice.seller_email,
      ice: invoice.seller_ice,
      ifTax: invoice.seller_if,
      rc: invoice.seller_rc,
      patente: invoice.seller_patente,
      cnss: invoice.seller_cnss,
      bankName: invoice.seller_bank_name,
      ribIban: invoice.seller_rib,
      logoDataUrl,
    },

    client: {
      name: invoice.client_name,
      clientType: invoice.client_type,
      contactPerson: invoice.client_contact_person,
      phone: invoice.client_phone,
      email: invoice.client_email,
      address: invoice.client_address,
      city: invoice.client_city,
      ice: invoice.client_ice,
      ifTax: invoice.client_if,
      rc: invoice.client_rc,
    },

    items: (invoice.items || []).map((it) => {
      let description = it.name;
      if (lang === "ar" && it.name_ar) {
        description = it.name_ar;
      } else if (lang === "en" && it.name_en) {
        description = it.name_en;
      }

      const extraDesc =
        lang === "ar"
          ? it.description_ar
          : lang === "en"
          ? it.description_en
          : it.description;

      if (extraDesc && extraDesc.trim() && extraDesc.trim() !== description.trim()) {
        description += ` - ${extraDesc.trim()}`;
      }

      return {
        id: it.id,
        description,
        unit: it.unit || "U",
        quantity: it.quantity,
        unitPriceCents: it.unit_price_cents,
        totalCents: it.total_cents,
      };
    }),

    subtotalCents: invoice.subtotal_cents,
    discountCents: invoice.discount_amount_cents || 0,
    taxRate: invoice.tax_rate || 0,
    taxAmountCents: invoice.tax_amount_cents || 0,
    totalCents: invoice.total_cents,
    paidAmountCents: invoice.paid_amount_cents || 0,
    remainingBalanceCents: invoice.balance_cents ?? (invoice.total_cents - (invoice.paid_amount_cents || 0)),
    status:
      invoice.status === "sent" || invoice.status === "overdue"
        ? "unpaid"
        : (invoice.status as DocumentData["status"]),

    payments: (invoice.payments || []).map((p) => ({
      id: p.id,
      date: p.payment_date,
      amountCents: p.amount_cents,
      method: p.payment_method,
      reference: p.reference,
      notes: p.notes,
    })),

    notes: invoice.notes,
    paymentTerms: invoice.payment_terms,
    style,
  };
}
