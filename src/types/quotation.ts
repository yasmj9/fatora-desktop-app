import { ClientType } from "./client";
import { DocumentLanguage } from "./invoice";

export type QuotationStatus =
  | "draft"       // Brouillon
  | "sent"        // Envoyé
  | "accepted"    // Accepté
  | "rejected"    // Refusé
  | "expired"     // Expiré
  | "invoiced";   // Facturé (converted to invoice)

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  service_id?: number | null;
  position: number;

  // Service Historical Snapshot
  name: string;
  name_ar?: string;
  name_en?: string;
  description?: string;
  description_ar?: string;
  description_en?: string;
  unit?: string;
  quantity: number;

  // Pricing in Integer Cents
  unit_price_cents: number;
  discount_type?: "fixed" | "percentage";
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;
  tax_amount_cents?: number;
  total_cents: number;

  created_at?: string;
  updated_at?: string;
}

export interface Quotation {
  id: number;
  quotation_number: string;   // e.g. "DEV-2026-0001"
  sequence_number: number;   // e.g. 1
  sequence_year: number;     // e.g. 2026
  prefix: string;            // e.g. "DEV"

  status: QuotationStatus;
  language: DocumentLanguage;
  currency: string;           // e.g. "MAD"

  // Relationship to converted invoice
  converted_invoice_id?: number | null;

  // Client historical snapshot
  client_id?: number | null;
  client_name: string;
  client_type: ClientType;
  client_contact_person: string;
  client_phone: string;
  client_address: string;
  client_city: string;
  client_email: string;
  client_ice: string;
  client_if: string;
  client_rc: string;

  // Seller/Company historical snapshot
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

  // Dates & terms
  quotation_date: string;
  valid_until_date: string;
  notes: string;
  payment_terms: string;

  // Financial totals in Integer Cents
  subtotal_cents: number;
  discount_type: "fixed" | "percentage";
  discount_rate: number;
  discount_amount_cents: number;
  tax_rate: number;
  tax_amount_cents: number;
  total_cents: number;

  items?: QuotationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface QuotationItemInput {
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
  discount_type?: "fixed" | "percentage";
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;
}

export interface QuotationCreateInput {
  quotation_number?: string;
  sequence_number?: number;
  sequence_year?: number;
  prefix?: string;
  status?: QuotationStatus;
  language?: DocumentLanguage;
  currency?: string;

  client_id?: number | null;
  client_name?: string;
  client_type?: ClientType;
  client_contact_person?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_email?: string;
  client_ice?: string;
  client_if?: string;
  client_rc?: string;

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

  quotation_date?: string;
  valid_until_date?: string;
  notes?: string;
  payment_terms?: string;

  discount_type?: "fixed" | "percentage";
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;

  items: QuotationItemInput[];
}

export interface QuotationUpdateInput {
  status?: QuotationStatus;
  language?: DocumentLanguage;
  currency?: string;

  client_id?: number | null;
  client_name?: string;
  client_type?: ClientType;
  client_contact_person?: string;
  client_phone?: string;
  client_address?: string;
  client_city?: string;
  client_email?: string;
  client_ice?: string;
  client_if?: string;
  client_rc?: string;

  quotation_date?: string;
  valid_until_date?: string;
  notes?: string;
  payment_terms?: string;

  discount_type?: "fixed" | "percentage";
  discount_rate?: number;
  discount_amount_cents?: number;
  tax_rate?: number;

  items?: QuotationItemInput[];
}

export interface QuotationFilterOptions {
  status?: "all" | QuotationStatus;
  clientId?: number;
  search?: string;
  year?: number;
  startDate?: string;
  endDate?: string;
}
