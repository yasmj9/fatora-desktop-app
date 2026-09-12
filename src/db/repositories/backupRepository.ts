import { getDatabaseAsync } from "../client";

export interface BackupMetadata {
  company_name: string;
  total_clients: number;
  total_invoices: number;
  total_quotations: number;
  total_services: number;
  total_logos: number;
  last_backup_at?: string;
  app_version: string;
}

export interface BackupPayload {
  version: string;
  app_id: string;
  created_at: string;
  metadata: BackupMetadata;
  tables: {
    company_settings: Record<string, unknown>[];
    logos: Record<string, unknown>[];
    invoice_styles: Record<string, unknown>[];
    services: Record<string, unknown>[];
    clients: Record<string, unknown>[];
    invoices: Record<string, unknown>[];
    invoice_items: Record<string, unknown>[];
    payments: Record<string, unknown>[];
    quotations: Record<string, unknown>[];
    quotation_items: Record<string, unknown>[];
    app_metadata: Record<string, unknown>[];
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  payload?: BackupPayload;
}

/**
 * Backup and Restore Repository
 * 
 * Provides isolated data management for backing up and restoring
 * all application data (SQLite database, logos, company settings, styles).
 */
export const backupRepository = {
  /**
   * Retrieves the date of the last backup.
   */
  async getLastBackupDate(): Promise<string | null> {
    try {
      const db = await getDatabaseAsync();
      const rows = await db.select<{ value: string }>(
        "SELECT value FROM app_metadata WHERE key = 'last_backup_at' LIMIT 1;"
      );
      if (rows && rows.length > 0 && rows[0].value) {
        return rows[0].value;
      }
    } catch (err) {
      console.warn("[BackupRepository] Could not fetch last_backup_at from DB:", err);
    }

    try {
      const local = localStorage.getItem("fatora_last_backup_at");
      if (local) return local;
    } catch {
      // Ignore
    }

    return null;
  },

  /**
   * Updates the date of the last backup.
   */
  async setLastBackupDate(dateIso: string): Promise<void> {
    try {
      const db = await getDatabaseAsync();
      await db.execute(
        "INSERT OR REPLACE INTO app_metadata (key, value, updated_at) VALUES ('last_backup_at', ?, datetime('now'));",
        [dateIso]
      );
    } catch (err) {
      console.warn("[BackupRepository] Could not write last_backup_at to DB:", err);
    }

    try {
      localStorage.setItem("fatora_last_backup_at", dateIso);
    } catch {
      // Ignore
    }
  },

  /**
   * Creates a complete backup payload containing all database tables and assets.
   */
  async createBackupData(): Promise<BackupPayload> {
    const db = await getDatabaseAsync();
    const now = new Date().toISOString();

    // Fetch records from all tables
    const companySettings = (await db.select<Record<string, unknown>>("SELECT * FROM company_settings;")) || [];
    const logos = (await db.select<Record<string, unknown>>("SELECT * FROM logos;")) || [];
    const invoiceStyles = (await db.select<Record<string, unknown>>("SELECT * FROM invoice_styles;")) || [];
    const services = (await db.select<Record<string, unknown>>("SELECT * FROM services;")) || [];
    const clients = (await db.select<Record<string, unknown>>("SELECT * FROM clients;")) || [];
    const invoices = (await db.select<Record<string, unknown>>("SELECT * FROM invoices;")) || [];
    const invoiceItems = (await db.select<Record<string, unknown>>("SELECT * FROM invoice_items;")) || [];
    const payments = (await db.select<Record<string, unknown>>("SELECT * FROM payments;")) || [];
    const quotations = (await db.select<Record<string, unknown>>("SELECT * FROM quotations;")) || [];
    const quotationItems = (await db.select<Record<string, unknown>>("SELECT * FROM quotation_items;")) || [];
    const appMetadata = (await db.select<Record<string, unknown>>("SELECT * FROM app_metadata;")) || [];

    // Save timestamp
    await this.setLastBackupDate(now);

    const companyName =
      companySettings.length > 0 && companySettings[0]?.name
        ? String(companySettings[0].name)
        : "Mon Entreprise";

    const payload: BackupPayload = {
      version: "1.0",
      app_id: "fatora_app",
      created_at: now,
      metadata: {
        company_name: companyName,
        total_clients: clients.length,
        total_invoices: invoices.length,
        total_quotations: quotations.length,
        total_services: services.length,
        total_logos: logos.length,
        last_backup_at: now,
        app_version: "1.0.0",
      },
      tables: {
        company_settings: companySettings,
        logos,
        invoice_styles: invoiceStyles,
        services,
        clients,
        invoices,
        invoice_items: invoiceItems,
        payments,
        quotations,
        quotation_items: quotationItems,
        app_metadata: appMetadata,
      },
    };

    return payload;
  },

  /**
   * Validates a backup JSON file content string before restoration.
   */
  validateBackupFile(fileContent: string): ValidationResult {
    if (!fileContent || typeof fileContent !== "string") {
      return {
        valid: false,
        error: "Le fichier sélectionné est vide ou illisible.",
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return {
        valid: false,
        error: "Le fichier n'est pas au format de sauvegarde valide (.json).",
      };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        valid: false,
        error: "La structure du fichier de sauvegarde est incorrecte.",
      };
    }

    const obj = parsed as Record<string, unknown>;

    const isFatoraBackup =
      obj.app_id === "fatora_app" ||
      obj.version === "1.0" ||
      (obj.tables && typeof obj.tables === "object");

    if (!isFatoraBackup) {
      return {
        valid: false,
        error: "Ce fichier ne semble pas être une sauvegarde générée par cette application.",
      };
    }

    const tables = obj.tables as Record<string, unknown> | undefined;
    if (!tables || typeof tables !== "object") {
      return {
        valid: false,
        error: "Le fichier de sauvegarde ne contient aucune donnée.",
      };
    }

    const requiredTables = ["clients", "services", "invoices", "company_settings"];
    const missing = requiredTables.filter((t) => !Array.isArray(tables[t]));

    if (missing.length > 0) {
      return {
        valid: false,
        error: "Certaines catégories de données indispensables manquent dans ce fichier.",
      };
    }

    return {
      valid: true,
      payload: parsed as BackupPayload,
    };
  },

  /**
   * Restores application data from a validated backup payload.
   * Creates a safety snapshot beforehand and performs rollback if restoration fails.
   */
  async restoreBackupData(
    payload: BackupPayload
  ): Promise<{ success: boolean; summary: BackupMetadata }> {
    // Step 1: Create a safety backup snapshot
    let safetySnapshot: BackupPayload | null = null;
    try {
      safetySnapshot = await this.createBackupData();
    } catch (snapErr) {
      console.warn("[BackupRepository] Could not create safety snapshot before restore:", snapErr);
    }

    const db = await getDatabaseAsync();

    try {
      // Temporarily disable foreign key constraints during table replacement
      await db.execute("PRAGMA foreign_keys = OFF;");

      // Table deletion order (child tables first)
      const deleteOrder = [
        "quotation_items",
        "quotations",
        "payments",
        "invoice_items",
        "invoices",
        "clients",
        "services",
        "invoice_styles",
        "logos",
        "company_settings",
        "app_metadata",
      ];

      for (const t of deleteOrder) {
        await db.execute(`DELETE FROM ${t};`);
      }

      // Table insertion order (parent tables first)
      const tableOrder: Array<keyof BackupPayload["tables"]> = [
        "app_metadata",
        "company_settings",
        "logos",
        "invoice_styles",
        "services",
        "clients",
        "invoices",
        "invoice_items",
        "payments",
        "quotations",
        "quotation_items",
      ];

      for (const tableName of tableOrder) {
        const rows = payload.tables[tableName];
        if (Array.isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            if (!row || typeof row !== "object") continue;
            const keys = Object.keys(row);
            if (keys.length === 0) continue;

            const colNames = keys.map((k) => `"${k}"`).join(", ");
            const placeholders = keys.map(() => "?").join(", ");
            const values = keys.map((k) => row[k]);

            await db.execute(
              `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders});`,
              values
            );
          }
        }
      }

      // Re-enable foreign key constraints
      await db.execute("PRAGMA foreign_keys = ON;");

      const now = new Date().toISOString();
      await this.setLastBackupDate(now);

      const summary: BackupMetadata = {
        company_name: (payload.tables.company_settings?.[0]?.name as string) || "Mon Entreprise",
        total_clients: payload.tables.clients?.length || 0,
        total_invoices: payload.tables.invoices?.length || 0,
        total_quotations: payload.tables.quotations?.length || 0,
        total_services: payload.tables.services?.length || 0,
        total_logos: payload.tables.logos?.length || 0,
        last_backup_at: now,
        app_version: "1.0.0",
      };

      return {
        success: true,
        summary,
      };
    } catch (restoreErr) {
      console.error("[BackupRepository] Error during restore. Triggering rollback...", restoreErr);

      // Attempt rollback from safety snapshot
      if (safetySnapshot) {
        try {
          await db.execute("PRAGMA foreign_keys = OFF;");
          const deleteOrder = [
            "quotation_items",
            "quotations",
            "payments",
            "invoice_items",
            "invoices",
            "clients",
            "services",
            "invoice_styles",
            "logos",
            "company_settings",
            "app_metadata",
          ];
          for (const t of deleteOrder) {
            await db.execute(`DELETE FROM ${t};`);
          }

          const tableOrder: Array<keyof BackupPayload["tables"]> = [
            "app_metadata",
            "company_settings",
            "logos",
            "invoice_styles",
            "services",
            "clients",
            "invoices",
            "invoice_items",
            "payments",
            "quotations",
            "quotation_items",
          ];

          for (const tableName of tableOrder) {
            const rows = safetySnapshot.tables[tableName];
            if (Array.isArray(rows) && rows.length > 0) {
              for (const row of rows) {
                if (!row || typeof row !== "object") continue;
                const keys = Object.keys(row);
                if (keys.length === 0) continue;

                const colNames = keys.map((k) => `"${k}"`).join(", ");
                const placeholders = keys.map(() => "?").join(", ");
                const values = keys.map((k) => row[k]);

                await db.execute(
                  `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders});`,
                  values
                );
              }
            }
          }
          await db.execute("PRAGMA foreign_keys = ON;");
        } catch (rollbackErr) {
          console.error("[BackupRepository] Rollback error:", rollbackErr);
        }
      }

      throw new Error(
        "La restauration a échoué. Vos données actuelles ont été conservées sans modification."
      );
    }
  },
};
