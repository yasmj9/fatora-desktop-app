export interface CompanySettings {
  id?: number;
  name: string;
  contact_person: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  ice: string;
  if_tax: string;
  rc: string;
  patente: string;
  cnss: string;
  bank_name: string;
  rib_iban: string;
  currency: string;
  document_language: string;
  invoice_prefix?: string;
  invoice_pattern?: string;
  invoice_sequence_padding?: number;
  invoice_next_number?: number;
  updated_at?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  name: "",
  contact_person: "",
  address: "",
  city: "",
  country: "Maroc",
  phone: "",
  email: "",
  website: "",
  ice: "",
  if_tax: "",
  rc: "",
  patente: "",
  cnss: "",
  bank_name: "",
  rib_iban: "",
  currency: "MAD",
  document_language: "fr",
  invoice_prefix: "FAC",
  invoice_pattern: "{PREFIX}-{YEAR}-{SEQ}",
  invoice_sequence_padding: 4,
  invoice_next_number: 1,
};
