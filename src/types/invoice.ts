/**
 * Invoice, InvoiceItem, and Payment Types
 * 
 * Defines the complete data model for invoices with historical snapshots,
 * safe money representation in integer cents, multi-language support,
 * and payment tracking.
 */

export type DocumentLanguage = "fr" | "ar" | "en";

export type InvoiceStatus =
  | "draft"           // Brouillon
  | "sent"            // Envoyée / Émise
  | "partially_paid"  // Partiellement payée
  | "paid"            // Payée
  | "cancelled"       // Annulée
  | "overdue";        // En retard

export type DiscountType = "fixed" | "percentage";

export type PaymentMethod =
  | "cash"           // Espèces
  | "check"          // Chèque
  | "bank_transfer"  // Virement bancaire
  | "card"           // Carte bancaire
  | "other";         // Autre

/**
 * Historical snapshot of a client at the time an invoice is created/updated.
 */
export interface ClientSnapshot {
  client_id?: number | null;
  client_name: string;
  client_type: "individual" | "company";
  client_contact_person?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_email?: string;
  client_ice?: string;
  client_if?: string;
  client_rc?: string;
}

/**
 * Historical snapshot of the company at the time an invoice is created/updated.
 */
export interface SellerSnapshot {
  seller_name: string;
  seller_contact_person?: string;
  seller_phone?: string;
  seller_address?: string;
  seller_city?: string;
  seller_email?: string;
  seller_ice?: string;
  seller_if?: string;
  seller_rc?: string;
  seller_patente?: string;
  seller_cnss?: string;
  seller_bank_name?: string;
  seller_rib?: string;
}

/**
 * Line item stored within an invoice.
 * Includes complete historical snapshots of service names, descriptions,
 * units, prices, discounts, and taxes.
 */
export interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_id?: number | null;
  position: number;
  
  // Historical snapshots of Service attributes
  name: string;
  name_ar: string;
  name_en: string;
  description: string;
  description_ar: string;
  description_en: string;
  unit: string;
  quantity: number;

  // Reliable integer cents storage
  unit_price_cents: number;
  discount_type: DiscountType;
  discount_rate: number;
  discount_amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  total_cents: number;

  created_at: string;
  updated_at: string;
}

/**
 * Payment record attached to an invoice.
 */
export interface Payment {
  id: number;
  invoice_id: number;
  amount_cents: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Main Invoice Entity.
 */
export interface Invoice {
  id: number;
  invoice_number: string;     // e.g. "FAC-2026-0001"
  sequence_number: number;    // e.g. 1
  sequence_year: number;      // e.g. 2026
  prefix: string;             // e.g. "FAC"
  
  status: InvoiceStatus;
  language: DocumentLanguage;
  currency: string;           // e.g. "MAD"
  style_id?: number | null;

  // Client historical snapshot
  client_id?: number | null;
  client_name: string;
  client_type: "individual" | "company";
  client_contact_person: string;
  client_phone: string;
  client_address: string;
  client_city: string;
  client_email: string;
  client_ice: string;
  client_if: string;
  client_rc: string;

  // Seller historical snapshot
  seller_name: string;
  seller_contact_person: string;
  seller_phone: string;
  seller_address: string;
  seller_city: string;
  seller_email: string;
  seller_ice: string;
  seller_if: string;
  seller_rc: string;
  seller_patente: string;
  seller_cnss: string;
  seller_bank_name: string;
  seller_rib: string;

  // Dates and document terms
  invoice_date: string;       // YYYY-MM-DD
  due_date: string;           // YYYY-MM-DD
  notes: string;
  payment_terms: string;

  // Reliable integer cents financial calculations
  subtotal_cents: number;
  discount_type: DiscountType;
  discount_rate: number;
  discount_amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  total_cents: number;
  paid_amount_cents: number;
  balance_cents: number;

  created_at: string;
  updated_at: string;

  // Populated relations
  items?: InvoiceItem[];
  payments?: Payment[];
}

/**
 * Input for creating a new line item.
 */
export interface InvoiceItemInput {
  service_id?: number | null;
  position?: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  unit?: string;
  quantity: number;
  unit_price_cents: number;
  discount_type?: DiscountType;
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;
  tax_amount_cents?: number;
  total_cents?: number;
}

/**
 * Input for creating a new Invoice.
 */
export interface InvoiceCreateInput {
  invoice_number?: string;
  sequence_number?: number;
  sequence_year?: number;
  prefix?: string;
  
  status?: InvoiceStatus;
  language?: DocumentLanguage;
  currency?: string;

  // Client snapshot
  client_id?: number | null;
  client_name: string;
  client_type?: "individual" | "company";
  client_contact_person?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_email?: string;
  client_ice?: string;
  client_if?: string;
  client_rc?: string;

  // Seller snapshot (if not provided, will be auto-populated from company_settings)
  seller_name?: string;
  seller_contact_person?: string;
  seller_phone?: string;
  seller_address?: string;
  seller_city?: string;
  seller_email?: string;
  seller_ice?: string;
  seller_if?: string;
  seller_rc?: string;
  seller_patente?: string;
  seller_cnss?: string;
  seller_bank_name?: string;
  seller_rib?: string;

  // Dates
  invoice_date?: string; // default today
  due_date?: string;
  notes?: string;
  payment_terms?: string;

  // Discount & Tax rates
  discount_type?: DiscountType;
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;
  tax_amount_cents?: number;

  // Items
  items: InvoiceItemInput[];

  // Optional initial payment
  initial_payment?: {
    amount_cents: number;
    payment_method?: PaymentMethod;
    payment_date?: string;
    reference?: string;
    notes?: string;
  };
}

/**
 * Input for updating an existing Invoice.
 */
export interface InvoiceUpdateInput extends Partial<Omit<InvoiceCreateInput, "items">> {
  items?: InvoiceItemInput[];
}

/**
 * Input for registering a new Payment.
 */
export interface PaymentCreateInput {
  invoice_id: number;
  amount_cents: number;
  payment_date?: string; // default today YYYY-MM-DD
  payment_method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

/**
 * Filter options for querying invoices.
 */
export interface InvoiceFilterOptions {
  status?: "all" | InvoiceStatus;
  clientId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
}
