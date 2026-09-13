import { Migration } from "../types";

export const migration010: Migration = {
  id: 10,
  name: "010_invoice_style_due_date",
  up: async (db) => {
    const tableInfo = await db.select("PRAGMA table_info(invoice_styles);");
    const columns = new Set(tableInfo.map((col: any) => col.name));

    if (!columns.has("show_due_date")) {
      await db.execute(`ALTER TABLE invoice_styles ADD COLUMN show_due_date INTEGER NOT NULL DEFAULT 1;`);
    }

    await db.execute(`
      UPDATE invoice_styles SET show_due_date = 1 WHERE show_due_date IS NULL;
    `);
  },
};
