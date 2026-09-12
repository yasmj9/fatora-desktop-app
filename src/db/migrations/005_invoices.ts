import { Migration } from "../types";

/**
 * Migration 005: Invoices, InvoiceItems, and Payments
 * 
 * Creates the relational schema for invoice management:
 * 1. `invoices` - header, document status, language, client & seller snapshots, integer-cent financial totals.
 * 2. `invoice_items` - line items with service snapshots, quantities, pricing, discounts, and taxes.
 * 3. `payments` - multi-payment tracking with amounts, methods, dates, and references.
 */
export const migration005: Migration = {
  id: 5,
  name: "005_invoices",
  up: `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      sequence_number INTEGER NOT NULL,
      sequence_year INTEGER NOT NULL,
      prefix TEXT NOT NULL DEFAULT 'FAC',
      
      status TEXT NOT NULL DEFAULT 'draft',
      language TEXT NOT NULL DEFAULT 'fr',
      currency TEXT NOT NULL DEFAULT 'MAD',

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
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL DEFAULT '',
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
      paid_amount_cents INTEGER NOT NULL DEFAULT 0,
      balance_cents INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
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

      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      reference TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      CHECK (amount_cents > 0)
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices (invoice_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_year_seq ON invoices (sequence_year, sequence_number);

    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_service_id ON invoice_items (service_id);

    CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments (payment_date);
  `,
};
