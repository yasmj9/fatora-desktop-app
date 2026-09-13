import { Migration } from "../types";

export const migration009: Migration = {
  id: 9,
  name: "009_invoice_style_customization",
  up: async (db) => {
    // Add new customizable color columns to invoice_styles if they don't exist
    const tableInfo = await db.select("PRAGMA table_info(invoice_styles);");
    const columns = new Set(tableInfo.map((col: any) => col.name));

    if (!columns.has("header_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN header_bg_color TEXT NOT NULL DEFAULT '#0047AB';`);
    }
    if (!columns.has("header_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN header_text_color TEXT NOT NULL DEFAULT '#ffffff';`);
    }
    if (!columns.has("table_header_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN table_header_bg_color TEXT NOT NULL DEFAULT '#0047AB';`);
    }
    if (!columns.has("table_header_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN table_header_text_color TEXT NOT NULL DEFAULT '#ffffff';`);
    }
    if (!columns.has("footer_bg_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN footer_bg_color TEXT NOT NULL DEFAULT '#0047AB';`);
    }
    if (!columns.has("footer_text_color")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN footer_text_color TEXT NOT NULL DEFAULT '#ffffff';`);
    }

    // Update existing records with professional default colors matching the user request
    await db.execute(`
      UPDATE invoice_styles SET
        header_bg_color = '#0047AB',
        header_text_color = '#ffffff',
        table_header_bg_color = '#0047AB',
        table_header_text_color = '#ffffff',
        footer_bg_color = '#0047AB',
        footer_text_color = '#ffffff',
        footer_text = 'Merci de votre confiance.'
      WHERE id = 1 OR is_default = 1;
    `);
  },
};
