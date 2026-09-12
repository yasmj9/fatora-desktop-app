import { Migration } from "../types";

/**
 * Migration 008: Quotations and QuotationItems
 * 
 * Creates the relational schema for quotation (devis) management:
 * 1. `quotations` - header, document status, language, client & seller snapshots, integer-cent financial totals, and converted_invoice_id reference.
 * 2. `quotation_items` - line items with service snapshots, quantities, pricing, discounts, and taxes.
 */
export const migration008: Migration = {
  id: 8,
  name: "008_quotations",
  up: `
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_number TEXT NOT NULL UNIQUE,
      sequence_number INTEGER NOT NULL,
      sequence_year INTEGER NOT NULL,
      prefix TEXT NOT NULL DEFAULT 'DEV',
      
      status TEXT NOT NULL DEFAULT 'draft',
      language TEXT NOT NULL DEFAULT 'fr',
      currency TEXT NOT NULL DEFAULT 'MAD',

      -- Relationship to converted invoice
      converted_invoice_id INTEGER,

      -- Client Snapshot
      client_id INTEGER,
      client_name TEXT NOT NULL,
      client_type TEXT NOT NULL DEFAULT 'individual',
      client_contact_person TEXT NOT NULL DEFAULT '',
      client_phone TEXT NOT NULL DEFAULT '',
      client_address TEXT NOT NULL DEFAULT '',
      client_city TEXT NOT NULL DEFAULT '',
      client_email TEXT NOT NULL DEFAULT '',
      client_ice TEXT NOT NULL DEFAULT '',
      client_if TEXT NOT NULL DEFAULT '',
      client_rc TEXT NOT NULL DEFAULT '',

      -- Seller Snapshot
      seller_name TEXT NOT NULL DEFAULT '',
      seller_contact_person TEXT NOT NULL DEFAULT '',
      seller_phone TEXT NOT NULL DEFAULT '',
      seller_address TEXT NOT NULL DEFAULT '',
      seller_city TEXT NOT NULL DEFAULT '',
      seller_email TEXT NOT NULL DEFAULT '',
      seller_ice TEXT NOT NULL DEFAULT '',
      seller_if TEXT NOT NULL DEFAULT '',
      seller_rc TEXT NOT NULL DEFAULT '',
      seller_patente TEXT NOT NULL DEFAULT '',
      seller_cnss TEXT NOT NULL DEFAULT '',
      seller_bank_name TEXT NOT NULL DEFAULT '',
      seller_rib TEXT NOT NULL DEFAULT '',

      -- Dates & Terms
      quotation_date TEXT NOT NULL,
      valid_until_date TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      payment_terms TEXT NOT NULL DEFAULT '',

      -- Financials in Integer Cents
      subtotal_cents INTEGER NOT NULL DEFAULT 0,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_rate REAL NOT NULL DEFAULT 0,
      discount_amount_cents INTEGER NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (converted_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      service_id INTEGER,
      position INTEGER NOT NULL DEFAULT 0,

      -- Service Historical Snapshots
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      description_ar TEXT NOT NULL DEFAULT '',
      description_en TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'U',
      quantity REAL NOT NULL DEFAULT 1,

      -- Money fields in integer cents
      unit_price_cents INTEGER NOT NULL DEFAULT 0,
      discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_rate REAL NOT NULL DEFAULT 0,
      discount_amount_cents INTEGER NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations (status);
    CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations (client_id);
    CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations (quotation_date);
    CREATE INDEX IF NOT EXISTS idx_quotations_converted_invoice_id ON quotations (converted_invoice_id);
    CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items (quotation_id);
  `,
};
