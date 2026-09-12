import { DiscountType, DocumentLanguage, PaymentMethod } from "./invoice";

export interface DraftInvoiceItem {
  uid: string;
  service_id?: number | null;
  code?: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  unit_price_cents: number;
  discount_type: DiscountType;
  discount_rate: number;
  discount_amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  subtotal_cents: number;
  total_cents: number;
  show_options?: boolean;
}

export interface DraftPaymentState {
  paid_amount: number; // decimal e.g. 2000
  paid_amount_cents: number; // e.g. 200000
  payment_method: PaymentMethod;
  payment_date: string; // YYYY-MM-DD
  payment_reference: string;
  notes: string;
}

export interface InvoiceDraftState {
  language: DocumentLanguage;
  currency: string;
  invoice_date: string;
  due_date: string;
  items: DraftInvoiceItem[];
  payment: DraftPaymentState;
  notes: string;
  payment_terms: string;
}
