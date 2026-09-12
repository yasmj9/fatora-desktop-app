import { InvoiceStyle } from "./invoiceStyle";

export interface DocumentItem {
  id?: number;
  description: string;
  unit?: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface DocumentPayment {
  id?: number;
  date: string;
  amountCents: number;
  method: string;
  reference?: string;
  notes?: string;
}

export interface DocumentCompanyInfo {
  name: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  ice?: string;
  ifTax?: string;
  rc?: string;
  patente?: string;
  cnss?: string;
  bankName?: string;
  ribIban?: string;
  logoDataUrl?: string | null;
}

export interface DocumentClientInfo {
  name: string;
  clientType?: "individual" | "company";
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  ice?: string;
  ifTax?: string;
  rc?: string;
}

export interface DocumentData {
  documentNumber: string;
  type: "invoice" | "quotation";
  date: string;
  dueDate?: string;
  language: "fr" | "en" | "ar";
  currency: string;
  company: DocumentCompanyInfo;
  client: DocumentClientInfo;
  items: DocumentItem[];
  subtotalCents: number;
  discountCents: number;
  taxRate: number;
  taxAmountCents: number;
  totalCents: number;
  paidAmountCents: number;
  remainingBalanceCents: number;
  status: "draft" | "unpaid" | "partially_paid" | "paid" | "cancelled";
  payments: DocumentPayment[];
  notes?: string;
  paymentTerms?: string;
  style: InvoiceStyle;
}
