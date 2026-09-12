/**
 * Database abstraction types for Fatora SQLite layer.
 */

export type DatabaseDriverType = "tauri-sqlite" | "web-local-sqlite";

export type DatabaseStatus = "uninitialized" | "initializing" | "ready" | "error";

export interface QueryResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface DbClient {
  /**
   * Execute a raw SQL statement (DDL / DML without returning rows).
   */
  execute(query: string, bindValues?: unknown[]): Promise<QueryResult>;

  /**
   * Execute a SQL query and return strongly-typed rows.
   */
  select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]>;

  /**
   * Close the database connection if needed.
   */
  close(): Promise<boolean>;

  /**
   * Driver type currently active.
   */
  readonly driver: DatabaseDriverType;
}

export interface Migration {
  id: number;
  name: string;
  /**
   * SQL statements or async function to run the migration.
   */
  up: string | ((db: DbClient) => Promise<void>);
}

export interface DatabaseHealth {
  status: DatabaseStatus;
  driver: DatabaseDriverType;
  isOffline: boolean;
  foreignKeysEnabled: boolean;
  migrationVersion: number;
  totalMigrations: number;
  error?: string;
}
