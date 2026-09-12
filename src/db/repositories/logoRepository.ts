import { getDatabaseAsync } from "../client";
import { Logo, LogoCreateInput } from "../../types/logo";

interface RawLogoRow {
  id: number;
  name: string;
  file_name: string;
  file_data: string;
  file_type: string;
  file_size: number;
  is_default: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

function mapRowToLogo(row: RawLogoRow): Logo {
  return {
    ...row,
    is_default: Boolean(row.is_default),
    is_archived: Boolean(row.is_archived),
  };
}

export const logoRepository = {
  /**
   * Retrieves all logos, optionally including archived logos.
   */
  async getAllLogos(includeArchived: boolean = false): Promise<Logo[]> {
    const db = await getDatabaseAsync();
    let sql = "SELECT * FROM logos";
    if (!includeArchived) {
      sql += " WHERE is_archived = 0";
    }
    sql += " ORDER BY is_default DESC, id DESC";

    const rows = await db.select<RawLogoRow>(sql);
    return rows.map(mapRowToLogo);
  },

  /**
   * Retrieves a single logo by ID.
   */
  async getLogoById(id: number): Promise<Logo | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawLogoRow>(
      "SELECT * FROM logos WHERE id = ? LIMIT 1",
      [id]
    );
    return rows.length > 0 ? mapRowToLogo(rows[0]) : null;
  },

  /**
   * Retrieves the currently active default logo.
   */
  async getDefaultLogo(): Promise<Logo | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawLogoRow>(
      "SELECT * FROM logos WHERE is_default = 1 AND is_archived = 0 LIMIT 1"
    );
    if (rows.length > 0) {
      return mapRowToLogo(rows[0]);
    }

    // Fallback: Return first available active logo if no default flag is explicitly set
    const fallbackRows = await db.select<RawLogoRow>(
      "SELECT * FROM logos WHERE is_archived = 0 ORDER BY id ASC LIMIT 1"
    );
    return fallbackRows.length > 0 ? mapRowToLogo(fallbackRows[0]) : null;
  },

  /**
   * Adds a new logo to application local storage.
   */
  async addLogo(input: LogoCreateInput): Promise<Logo> {
    const db = await getDatabaseAsync();

    const name = input.name.trim();
    if (!name) {
      throw new Error("Le nom du logo est obligatoire.");
    }

    if (!input.file_data) {
      throw new Error("Aucun fichier d'image n'a été fourni.");
    }

    // Check if any active logos exist
    const existingLogos = await this.getAllLogos(false);
    const shouldBeDefault = input.is_default || existingLogos.length === 0;

    await db.execute("BEGIN TRANSACTION;");

    try {
      if (shouldBeDefault) {
        // Unset previous defaults
        await db.execute("UPDATE logos SET is_default = 0");
      }

      const insertResult = await db.execute(
        `
        INSERT INTO logos (
          name,
          file_name,
          file_data,
          file_type,
          file_size,
          is_default,
          is_archived,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
        `,
        [
          name,
          input.file_name || "logo.png",
          input.file_data,
          input.file_type || "image/png",
          input.file_size || 0,
          shouldBeDefault ? 1 : 0,
        ]
      );

      await db.execute("COMMIT;");

      const createdId = insertResult.lastInsertId!;
      const logo = await this.getLogoById(createdId);
      if (!logo) {
        throw new Error("Erreur lors de la récupération du logo créé.");
      }
      return logo;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[logoRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Renames an existing logo.
   */
  async renameLogo(id: number, newName: string): Promise<Logo> {
    const db = await getDatabaseAsync();
    const trimmed = newName.trim();
    if (!trimmed) {
      throw new Error("Le nom du logo ne peut pas être vide.");
    }

    const existing = await this.getLogoById(id);
    if (!existing) {
      throw new Error("Le logo à renommer est introuvable.");
    }

    await db.execute(
      "UPDATE logos SET name = ?, updated_at = datetime('now') WHERE id = ?",
      [trimmed, id]
    );

    const updated = await this.getLogoById(id);
    return updated!;
  },

  /**
   * Sets a specific logo as the default active logo.
   */
  async setDefaultLogo(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const target = await this.getLogoById(id);

    if (!target) {
      throw new Error("Le logo sélectionné est introuvable.");
    }

    if (target.is_archived) {
      throw new Error("Un logo archivé ne peut pas être défini comme logo par défaut.");
    }

    await db.execute("BEGIN TRANSACTION;");

    try {
      // Clear previous default flags
      await db.execute("UPDATE logos SET is_default = 0");

      // Set target logo as default
      await db.execute(
        "UPDATE logos SET is_default = 1, updated_at = datetime('now') WHERE id = ?",
        [id]
      );

      await db.execute("COMMIT;");
      return true;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[logoRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Safely archives a logo (soft delete). If the logo was default, another active logo is selected as default.
   */
  async archiveLogo(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const target = await this.getLogoById(id);

    if (!target) {
      throw new Error("Le logo à archiver est introuvable.");
    }

    await db.execute("BEGIN TRANSACTION;");

    try {
      await db.execute(
        "UPDATE logos SET is_archived = 1, is_default = 0, updated_at = datetime('now') WHERE id = ?",
        [id]
      );

      // If target was default, auto-promote the next available non-archived logo to default
      if (target.is_default) {
        const activeRows = await db.select<RawLogoRow>(
          "SELECT id FROM logos WHERE is_archived = 0 ORDER BY id DESC LIMIT 1"
        );
        if (activeRows.length > 0) {
          await db.execute(
            "UPDATE logos SET is_default = 1, updated_at = datetime('now') WHERE id = ?",
            [activeRows[0].id]
          );
        }
      }

      await db.execute("COMMIT;");
      return true;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[logoRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Restores an archived logo.
   */
  async restoreLogo(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const target = await this.getLogoById(id);

    if (!target) {
      throw new Error("Le logo à restaurer est introuvable.");
    }

    await db.execute("BEGIN TRANSACTION;");

    try {
      await db.execute(
        "UPDATE logos SET is_archived = 0, updated_at = datetime('now') WHERE id = ?",
        [id]
      );

      // If no current default logo exists, set this restored logo as default
      const defaultRows = await db.select<RawLogoRow>(
        "SELECT id FROM logos WHERE is_default = 1 AND is_archived = 0 LIMIT 1"
      );
      if (defaultRows.length === 0) {
        await db.execute(
          "UPDATE logos SET is_default = 1, updated_at = datetime('now') WHERE id = ?",
          [id]
        );
      }

      await db.execute("COMMIT;");
      return true;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[logoRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Permanently deletes a logo record.
   */
  async deleteLogoPermanently(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const result = await db.execute("DELETE FROM logos WHERE id = ?", [id]);
    return result.rowsAffected > 0;
  },
};
