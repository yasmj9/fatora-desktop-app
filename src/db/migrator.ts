import { DbClient, Migration } from "./types";
import { MIGRATIONS } from "./migrations";

interface AppliedMigrationRow {
  id: number;
  name: string;
  applied_at: string;
}

export interface MigrationSummary {
  appliedCount: number;
  currentVersion: number;
  totalMigrations: number;
}

/**
 * Runs all pending migrations against the provided database client.
 */
export async function runMigrations(
  db: DbClient,
  migrations: Migration[] = MIGRATIONS
): Promise<MigrationSummary> {
  console.log("[DB Migrator] Initializing migrations table...");

  // 1. Create the migrations tracking table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // 2. Query already applied migrations
  const appliedRows = await db.select<AppliedMigrationRow>(`
    SELECT id, name, applied_at FROM _schema_migrations ORDER BY id ASC;
  `);

  const appliedIds = new Set(appliedRows.map((r) => r.id));
  const latestApplied = appliedRows.length > 0 ? Math.max(...appliedRows.map((r) => r.id)) : 0;

  console.log(
    `[DB Migrator] Currently applied migrations: ${appliedRows.length} (latest version: v${latestApplied})`
  );

  let newlyApplied = 0;
  let currentVersion = latestApplied;

  // 3. Sort migrations by id ascending
  const sortedMigrations = [...migrations].sort((a, b) => a.id - b.id);

  for (const migration of sortedMigrations) {
    if (appliedIds.has(migration.id)) {
      continue;
    }

    console.log(
      `[DB Migrator] Applying migration #${migration.id} ("${migration.name}")...`
    );

    try {
      if (typeof migration.up === "string") {
        // Execute multi-statement SQL blocks
        const statements = migration.up
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await db.execute(statement);
        }
      } else if (typeof migration.up === "function") {
        await migration.up(db);
      }

      // Record migration
      await db.execute(
        `INSERT INTO _schema_migrations (id, name, applied_at) VALUES (?, ?, datetime('now'));`,
        [migration.id, migration.name]
      );

      console.log(
        `[DB Migrator] Successfully applied migration #${migration.id} ("${migration.name}")`
      );

      newlyApplied++;
      currentVersion = migration.id;
    } catch (error) {
      console.error(
        `[DB Migrator] FATAL: Migration #${migration.id} ("${migration.name}") failed!`,
        error
      );
      throw new Error(
        `Migration #${migration.id} (${migration.name}) failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  console.log(
    `[DB Migrator] Migration phase completed. Applied: ${newlyApplied}, Current Version: v${currentVersion}`
  );

  return {
    appliedCount: newlyApplied,
    currentVersion,
    totalMigrations: sortedMigrations.length,
  };
}
