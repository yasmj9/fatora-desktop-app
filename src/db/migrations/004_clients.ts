import { Migration } from "../types";

/**
 * Migration 004: Clients Directory
 * 
 * Creates the `clients` table supporting individuals and companies,
 * phone, Moroccan tax IDs (ICE, IF, RC), and soft archiving.
 */
export const migration004: Migration = {
  id: 4,
  name: "004_clients",
  up: `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL DEFAULT 'individual',
      name TEXT NOT NULL,
      contact_person TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      ice TEXT NOT NULL DEFAULT '',
      if_tax TEXT NOT NULL DEFAULT '',
      rc TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients (is_active);
    CREATE INDEX IF NOT EXISTS idx_clients_name ON clients (name);
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
    CREATE INDEX IF NOT EXISTS idx_clients_ice ON clients (ice);
  `,
};
