import { Migration } from "../types";

/**
 * Migration 002: Company Settings
 * 
 * Creates the singleton `company_settings` table to store all company configuration,
 * including legal identifiers, contact details, bank coordinates and document defaults.
 */
export const migration002: Migration = {
  id: 2,
  name: "002_company_settings",
  up: `
    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT '',
      contact_person TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT 'Maroc',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      ice TEXT NOT NULL DEFAULT '',
      if_tax TEXT NOT NULL DEFAULT '',
      rc TEXT NOT NULL DEFAULT '',
      patente TEXT NOT NULL DEFAULT '',
      cnss TEXT NOT NULL DEFAULT '',
      bank_name TEXT NOT NULL DEFAULT '',
      rib_iban TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'MAD',
      document_language TEXT NOT NULL DEFAULT 'fr',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO company_settings (
      id, name, contact_person, address, city, country, phone, email, website,
      ice, if_tax, rc, patente, cnss, bank_name, rib_iban, currency, document_language
    ) VALUES (
      1, '', '', '', '', 'Maroc', '', '', '',
      '', '', '', '', '', '', '', 'MAD', 'fr'
    );
  `,
};
