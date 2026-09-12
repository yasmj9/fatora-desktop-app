import { Migration } from "../types";

/**
 * Migration 001: Initial Infrastructure
 * 
 * Establishes:
 * 1. An application metadata table for storing local instance metadata, schema version and setup status.
 * 2. Ensures the database infrastructure is ready for future domain migrations.
 */
export const migration001: Migration = {
  id: 1,
  name: "001_initial_infrastructure",
  up: `
    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO app_metadata (key, value)
    VALUES ('initialized_at', datetime('now'));

    INSERT OR REPLACE INTO app_metadata (key, value)
    VALUES ('schema_version', '1');
  `,
};
