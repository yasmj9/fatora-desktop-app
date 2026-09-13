import { Migration } from "../types";

export const migration011: Migration = {
  id: 11,
  name: "011_company_invoice_pattern",
  up: async (db) => {
    const tableInfo = await db.select("PRAGMA table_info(company_settings);");
    const columns = new Set(tableInfo.map((col: any) => col.name));

    if (!columns.has("invoice_prefix")) {
      await db.execute(`ALTER TABLE company_settings ADD COLUMN invoice_prefix TEXT NOT NULL DEFAULT 'FAC';`);
    }

    if (!columns.has("invoice_pattern")) {
      await db.execute(`ALTER TABLE company_settings ADD COLUMN invoice_pattern TEXT NOT NULL DEFAULT '{PREFIX}-{YEAR}-{SEQ}';`);
    }

    if (!columns.has("invoice_sequence_padding")) {
      await db.execute(`ALTER TABLE company_settings ADD COLUMN invoice_sequence_padding INTEGER NOT NULL DEFAULT 4;`);
    }

    if (!columns.has("invoice_next_number")) {
      await db.execute(`ALTER TABLE company_settings ADD COLUMN invoice_next_number INTEGER NOT NULL DEFAULT 1;`);
    }

    await db.execute(`
      UPDATE company_settings 
      SET 
        invoice_prefix = COALESCE(invoice_prefix, 'FAC'),
        invoice_pattern = COALESCE(invoice_pattern, '{PREFIX}-{YEAR}-{SEQ}'),
        invoice_sequence_padding = COALESCE(invoice_sequence_padding, 4),
        invoice_next_number = COALESCE(invoice_next_number, 1)
      WHERE id = 1;
    `);
  },
};
