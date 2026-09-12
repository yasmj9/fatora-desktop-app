import { Migration } from "../types";

/**
 * Migration 003: Services Catalogue
 * 
 * Creates the `services` table for storing prestations, multilingual names/descriptions,
 * default pricing and units, with support for soft archiving.
 */
export const migration003: Migration = {
  id: 3,
  name: "003_services",
  up: `
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL DEFAULT '',
      name_fr TEXT NOT NULL,
      description_fr TEXT NOT NULL DEFAULT '',
      name_ar TEXT NOT NULL DEFAULT '',
      description_ar TEXT NOT NULL DEFAULT '',
      name_en TEXT NOT NULL DEFAULT '',
      description_en TEXT NOT NULL DEFAULT '',
      default_unit TEXT NOT NULL DEFAULT 'Unité',
      default_price REAL NOT NULL DEFAULT 0 CHECK (default_price >= 0),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_services_is_active ON services (is_active);
    CREATE INDEX IF NOT EXISTS idx_services_name_fr ON services (name_fr);
    CREATE INDEX IF NOT EXISTS idx_services_code ON services (code);
  `,
};
