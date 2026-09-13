export type InvoiceStyleKey = "style_1" | string;

export interface InvoiceStyle {
  id: number;
  style_key: InvoiceStyleKey;
  name: string;
  description?: string;
  logo_id: number | null;
  primary_color: string;
  header_color: string;
  accent_color: string;
  footer_color: string;
  header_bg_color: string;
  header_text_color: string;
  table_header_bg_color: string;
  table_header_text_color: string;
  footer_bg_color: string;
  footer_text_color: string;
  footer_text: string;
  show_ice: boolean;
  show_tax_id: boolean;
  show_rc: boolean;
  show_cnss: boolean;
  show_iban: boolean;
  show_phone: boolean;
  show_email: boolean;
  show_address: boolean;
  show_due_date: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceStyleUpdateInput {
  name?: string;
  description?: string;
  logo_id?: number | null;
  primary_color?: string;
  header_color?: string;
  accent_color?: string;
  footer_color?: string;
  header_bg_color?: string;
  header_text_color?: string;
  table_header_bg_color?: string;
  table_header_text_color?: string;
  footer_bg_color?: string;
  footer_text_color?: string;
  footer_text?: string;
  show_ice?: boolean;
  show_tax_id?: boolean;
  show_rc?: boolean;
  show_cnss?: boolean;
  show_iban?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
  show_address?: boolean;
  show_due_date?: boolean;
  is_default?: boolean;
}

export interface InvoiceStyleCreateInput {
  style_key: InvoiceStyleKey;
  name: string;
  description?: string;
  logo_id?: number | null;
  primary_color?: string;
  header_color?: string;
  accent_color?: string;
  footer_color?: string;
  header_bg_color?: string;
  header_text_color?: string;
  table_header_bg_color?: string;
  table_header_text_color?: string;
  footer_bg_color?: string;
  footer_text_color?: string;
  footer_text?: string;
  show_ice?: boolean;
  show_tax_id?: boolean;
  show_rc?: boolean;
  show_cnss?: boolean;
  show_iban?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
  show_address?: boolean;
  show_due_date?: boolean;
  is_default?: boolean;
}
