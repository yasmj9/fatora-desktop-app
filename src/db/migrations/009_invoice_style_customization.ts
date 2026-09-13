import { Migration } from "../types";

export const migration009: Migration = {
  id: 9,
  name: "009_invoice_style_customization",
  up: async (db) => {
    // Add new customizable color columns to invoice_styles if they don't exist
    const tableInfo = await db.select("PRAGMA table_info(invoice_styles);");
    const columns = new Set(tableInfo.map((col: any) => col.name));

    if (!columns.has("header_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN header_bg_color TEXT NOT NULL DEFAULT '#facc15';`);
    }
    if (!columns.has("header_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN header_text_color TEXT NOT NULL DEFAULT '#111827';`);
    }
    if (!columns.has("table_header_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN table_header_bg_color TEXT NOT NULL DEFAULT '#1e293b';`);
    }
    if (!columns.has("table_header_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN table_header_text_color TEXT NOT NULL DEFAULT '#ffffff';`);
    }
    if (!columns.has("footer_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN footer_bg_color TEXT NOT NULL DEFAULT '#ffffff';`);
    }
    if (!columns.has("footer_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN footer_text_color TEXT NOT NULL DEFAULT '#334155';`);
    }

    // Update existing records with professional default colors matching the user request
    await db.execute(`
      UPDATE invoice_styles SET
        header_bg_color = '#facc15',
        header_text_color = '#111827',
        table_header_bg_color = '#1e293b',
        table_header_text_color = '#ffffff',
        footer_bg_color = '#ffffff',
        footer_text_color = '#334155',
        footer_text = 'Please send payment within 30 days of receiving this invoice.'
      WHERE id = 1 OR is_default = 1;
    `);
  },
};
