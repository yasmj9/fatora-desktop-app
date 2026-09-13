import { getDatabaseAsync } from "../client";
import { InvoiceStyle, InvoiceStyleUpdateInput, InvoiceStyleCreateInput } from "../../types/invoiceStyle";

interface RawInvoiceStyleRow {
  id: number;
  style_key: string;
  name: string;
  description: string | null;
  logo_id: number | null;
  primary_color: string;
  header_color: string;
  accent_color: string;
  footer_color: string;
  header_bg_color: string;
  header_text_color: string;
  table_header_bg_color: string;
  table_header_text_color: string;
  footer_bg_color: string;
  footer_text_color: string;
  footer_text: string;
  show_ice: number;
  show_tax_id: number;
  show_rc: number;
  show_cnss: number;
  show_iban: number;
  show_phone: number;
  show_email: number;
  show_address: number;
  show_due_date: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

function mapRowToStyle(row: RawInvoiceStyleRow): InvoiceStyle {
  return {
    ...row,
    description: row.description || undefined,
    show_ice: Boolean(row.show_ice),
    show_tax_id: Boolean(row.show_tax_id),
    show_rc: Boolean(row.show_rc),
    show_cnss: Boolean(row.show_cnss),
    show_iban: Boolean(row.show_iban),
    show_phone: Boolean(row.show_phone),
    show_email: Boolean(row.show_email),
    show_address: Boolean(row.show_address),
    show_due_date: Boolean(row.show_due_date),
    is_default: Boolean(row.is_default),
  };
}

export const invoiceStyleRepository = {
  /**
   * Retrieves all available invoice presentation styles.
   */
  async getAllStyles(): Promise<InvoiceStyle[]> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawInvoiceStyleRow>(
      "SELECT * FROM invoice_styles ORDER BY id ASC"
    );
    return rows.map(mapRowToStyle);
  },

  /**
   * Retrieves a specific style by ID.
   */
  async getStyleById(id: number): Promise<InvoiceStyle | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawInvoiceStyleRow>(
      "SELECT * FROM invoice_styles WHERE id = ? LIMIT 1",
      [id]
    );
    return rows.length > 0 ? mapRowToStyle(rows[0]) : null;
  },

  /**
   * Retrieves a style by its unique key (e.g. 'style_1', 'style_2', 'style_3').
   */
  async getStyleByKey(key: string): Promise<InvoiceStyle | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawInvoiceStyleRow>(
      "SELECT * FROM invoice_styles WHERE style_key = ? LIMIT 1",
      [key]
    );
    return rows.length > 0 ? mapRowToStyle(rows[0]) : null;
  },

  /**
   * Retrieves the currently set default style.
   */
  async getDefaultStyle(): Promise<InvoiceStyle | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<RawInvoiceStyleRow>(
      "SELECT * FROM invoice_styles WHERE is_default = 1 LIMIT 1"
    );
    if (rows.length > 0) {
      return mapRowToStyle(rows[0]);
    }

    // Fallback: Return first available style if no default is flagged
    const fallbackRows = await db.select<RawInvoiceStyleRow>(
      "SELECT * FROM invoice_styles ORDER BY id ASC LIMIT 1"
    );
    return fallbackRows.length > 0 ? mapRowToStyle(fallbackRows[0]) : null;
  },

  /**
   * Updates an existing invoice style configuration.
   */
  async updateStyle(id: number, input: InvoiceStyleUpdateInput): Promise<InvoiceStyle> {
    const db = await getDatabaseAsync();
    let existing = await this.getStyleById(id);

    if (!existing) {
      try {
        existing = await this.createStyle({
          style_key: `style_${id}`,
          name: input.name || `Style ${id}`,
          description: input.description,
          logo_id: input.logo_id,
          primary_color: input.primary_color,
          header_color: input.header_color,
          accent_color: input.accent_color,
          footer_color: input.footer_color,
          footer_text: input.footer_text,
          show_ice: input.show_ice,
          show_tax_id: input.show_tax_id,
          show_rc: input.show_rc,
          show_cnss: input.show_cnss,
          show_iban: input.show_iban,
          show_phone: input.show_phone,
          show_email: input.show_email,
          show_address: input.show_address,
          is_default: input.is_default,
        });
        return existing;
      } catch (createErr) {
        console.error("[invoiceStyleRepository] Failed to auto-create missing style on update:", createErr);
        throw new Error("Le style spécifié est introuvable.");
      }
    }

    const updatedName = input.name !== undefined ? input.name.trim() : existing.name;
    const updatedDescription = input.description !== undefined ? input.description : existing.description;
    const updatedLogoId = input.logo_id !== undefined ? input.logo_id : existing.logo_id;
    const updatedPrimary = input.primary_color || existing.primary_color;
    const updatedHeader = input.header_color || existing.header_color;
    const updatedAccent = input.accent_color || existing.accent_color;
    const updatedFooterColor = input.footer_color || existing.footer_color;
    const updatedHeaderBg = input.header_bg_color || existing.header_bg_color;
    const updatedHeaderText = input.header_text_color || existing.header_text_color;
    const updatedTableHeaderBg = input.table_header_bg_color || existing.table_header_bg_color;
    const updatedTableHeaderText = input.table_header_text_color || existing.table_header_text_color;
    const updatedFooterBg = input.footer_bg_color || existing.footer_bg_color;
    const updatedFooterTextClr = input.footer_text_color || existing.footer_text_color;
    const updatedFooterText = input.footer_text !== undefined ? input.footer_text : existing.footer_text;

    const showIce = input.show_ice !== undefined ? (input.show_ice ? 1 : 0) : (existing.show_ice ? 1 : 0);
    const showTaxId = input.show_tax_id !== undefined ? (input.show_tax_id ? 1 : 0) : (existing.show_tax_id ? 1 : 0);
    const showRc = input.show_rc !== undefined ? (input.show_rc ? 1 : 0) : (existing.show_rc ? 1 : 0);
    const showCnss = input.show_cnss !== undefined ? (input.show_cnss ? 1 : 0) : (existing.show_cnss ? 1 : 0);
    const showIban = input.show_iban !== undefined ? (input.show_iban ? 1 : 0) : (existing.show_iban ? 1 : 0);
    const showPhone = input.show_phone !== undefined ? (input.show_phone ? 1 : 0) : (existing.show_phone ? 1 : 0);
    const showEmail = input.show_email !== undefined ? (input.show_email ? 1 : 0) : (existing.show_email ? 1 : 0);
    const showAddress = input.show_address !== undefined ? (input.show_address ? 1 : 0) : (existing.show_address ? 1 : 0);
    const showDueDate = input.show_due_date !== undefined ? (input.show_due_date ? 1 : 0) : (existing.show_due_date ? 1 : 0);

    await db.execute(
      `
      UPDATE invoice_styles SET
        name = ?,
        description = ?,
        logo_id = ?,
        primary_color = ?,
        header_color = ?,
        accent_color = ?,
        footer_color = ?,
        header_bg_color = ?,
        header_text_color = ?,
        table_header_bg_color = ?,
        table_header_text_color = ?,
        footer_bg_color = ?,
        footer_text_color = ?,
        footer_text = ?,
        show_ice = ?,
        show_tax_id = ?,
        show_rc = ?,
        show_cnss = ?,
        show_iban = ?,
        show_phone = ?,
        show_email = ?,
        show_address = ?,
        show_due_date = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
        updatedName,
        updatedDescription || null,
        updatedLogoId,
        updatedPrimary,
        updatedHeader,
        updatedAccent,
        updatedFooterColor,
        updatedHeaderBg,
        updatedHeaderText,
        updatedTableHeaderBg,
        updatedTableHeaderText,
        updatedFooterBg,
        updatedFooterTextClr,
        updatedFooterText,
        showIce,
        showTaxId,
        showRc,
        showCnss,
        showIban,
        showPhone,
        showEmail,
        showAddress,
        showDueDate,
        id,
      ]
    );

    if (input.is_default) {
      await this.setDefaultStyle(id);
    }

    const updated = await this.getStyleById(id);
    return updated!;
  },

  /**
   * Sets a specific style as default in a transaction.
   */
  async setDefaultStyle(id: number): Promise<boolean> {
    const db = await getDatabaseAsync();
    const target = await this.getStyleById(id);

    if (!target) {
      throw new Error("Le style à définir par défaut est introuvable.");
    }

    await db.execute("BEGIN TRANSACTION;");

    try {
      await db.execute("UPDATE invoice_styles SET is_default = 0");
      await db.execute(
        "UPDATE invoice_styles SET is_default = 1, updated_at = datetime('now') WHERE id = ?",
        [id]
      );
      await db.execute("COMMIT;");
      return true;
    } catch (err) {
      try {
        await db.execute("ROLLBACK;");
      } catch (rollbackErr) {
        console.error("[invoiceStyleRepository] Rollback error:", rollbackErr);
      }
      throw err;
    }
  },

  /**
   * Creates a new style entry (makes it straightforward to add Style 3 or custom styles).
   */
  async createStyle(input: InvoiceStyleCreateInput): Promise<InvoiceStyle> {
    const db = await getDatabaseAsync();

    const insertResult = await db.execute(
      `
      INSERT INTO invoice_styles (
        style_key,
        name,
        description,
        logo_id,
        primary_color,
        header_color,
        accent_color,
        footer_color,
        header_bg_color,
        header_text_color,
        table_header_bg_color,
        table_header_text_color,
        footer_bg_color,
        footer_text_color,
        footer_text,
        show_ice,
        show_tax_id,
        show_rc,
        show_cnss,
        show_iban,
        show_phone,
        show_email,
        show_address,
        show_due_date,
        is_default,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      [
        input.style_key,
        input.name,
        input.description || null,
        input.logo_id || null,
        input.primary_color || "#0047AB",
        input.header_color || "#0047AB",
        input.accent_color || "#0047AB",
        input.footer_color || "#0047AB",
        input.header_bg_color || "#0047AB",
        input.header_text_color || "#ffffff",
        input.table_header_bg_color || "#0047AB",
        input.table_header_text_color || "#ffffff",
        input.footer_bg_color || "#0047AB",
        input.footer_text_color || "#ffffff",
        input.footer_text || "Merci de votre confiance. Facture payable selon les conditions convenues.",
        input.show_ice !== false ? 1 : 0,
        input.show_tax_id !== false ? 1 : 0,
        input.show_rc !== false ? 1 : 0,
        input.show_cnss ? 1 : 0,
        input.show_iban !== false ? 1 : 0,
        input.show_phone !== false ? 1 : 0,
        input.show_email !== false ? 1 : 0,
        input.show_address !== false ? 1 : 0,
        input.show_due_date !== false ? 1 : 0,
        input.is_default ? 1 : 0,
      ]
    );

    const createdId = insertResult.lastInsertId!;

    if (input.is_default) {
      await this.setDefaultStyle(createdId);
    }

    const created = await this.getStyleById(createdId);
    return created!;
  },
};
