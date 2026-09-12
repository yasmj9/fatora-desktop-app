import { Migration } from "../types";

/**
 * Migration 006: Logos Table
 * 
 * Stores uploaded company logos directly inside local application SQLite storage.
 * Manages default logo selection and safe archiving.
 */
export const migration006: Migration = {
  id: 6,
  name: "006_logos",
  up: `
    CREATE TABLE IF NOT EXISTS logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_data TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'image/png',
      file_size INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
};
