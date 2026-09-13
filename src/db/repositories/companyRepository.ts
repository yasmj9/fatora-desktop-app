import { getDatabaseAsync } from "../client";
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from "../../types/company";
import { CompanySettingsFormData } from "../../schemas/companySchema";

/**
 * Company Settings Repository
 * 
 * Provides isolated data access for company information.
 * Ensures SQL logic is completely separated from React components.
 */
export const companyRepository = {
  /**
   * Retrieves the current company settings from the SQLite database.
   */
  async getSettings(): Promise<CompanySettings> {
    const db = await getDatabaseAsync();
    console.log("[CompanyRepository] Fetching company settings...");

    const rows = await db.select<CompanySettings>(`
      SELECT 
        id,
        name,
        contact_person,
        address,
        city,
        country,
        phone,
        email,
        website,
        ice,
        if_tax,
        rc,
        patente,
        cnss,
        bank_name,
        rib_iban,
        currency,
        document_language,
        invoice_prefix,
        invoice_pattern,
        invoice_sequence_padding,
        invoice_next_number,
        updated_at
      FROM company_settings
      WHERE id = 1
      LIMIT 1;
    `);

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        id: 1,
        name: row.name || "",
        contact_person: row.contact_person || "",
        address: row.address || "",
        city: row.city || "",
        country: row.country || "Maroc",
        phone: row.phone || "",
        email: row.email || "",
        website: row.website || "",
        ice: row.ice || "",
        if_tax: row.if_tax || "",
        rc: row.rc || "",
        patente: row.patente || "",
        cnss: row.cnss || "",
        bank_name: row.bank_name || "",
        rib_iban: row.rib_iban || "",
        currency: row.currency || "MAD",
        document_language: row.document_language || "fr",
        invoice_prefix: row.invoice_prefix !== undefined && row.invoice_prefix !== null ? row.invoice_prefix : "FAC",
        invoice_pattern: row.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}",
        invoice_sequence_padding: Number(row.invoice_sequence_padding) || 4,
        invoice_next_number: Number(row.invoice_next_number) || 1,
        updated_at: row.updated_at,
      };
    }

    return { ...DEFAULT_COMPANY_SETTINGS };
  },

  /**
   * Updates company settings in the SQLite database.
   */
  async updateSettings(data: CompanySettingsFormData): Promise<CompanySettings> {
    const db = await getDatabaseAsync();
    console.log("[CompanyRepository] Saving company settings...", data.name);

    await db.execute(
      `
      UPDATE company_settings
      SET 
        name = ?,
        contact_person = ?,
        address = ?,
        city = ?,
        country = ?,
        phone = ?,
        email = ?,
        website = ?,
        ice = ?,
        if_tax = ?,
        rc = ?,
        patente = ?,
        cnss = ?,
        bank_name = ?,
        rib_iban = ?,
        currency = ?,
        document_language = ?,
        invoice_prefix = ?,
        invoice_pattern = ?,
        invoice_sequence_padding = ?,
        invoice_next_number = ?,
        updated_at = datetime('now')
      WHERE id = 1;
      `,
      [
        data.name || "",
        data.contact_person || "",
        data.address || "",
        data.city || "",
        data.country || "Maroc",
        data.phone || "",
        data.email || "",
        data.website || "",
        data.ice || "",
        data.if_tax || "",
        data.rc || "",
        data.patente || "",
        data.cnss || "",
        data.bank_name || "",
        data.rib_iban || "",
        data.currency || "MAD",
        data.document_language || "fr",
        data.invoice_prefix !== undefined ? data.invoice_prefix : "FAC",
        data.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}",
        Number(data.invoice_sequence_padding) || 4,
        Number(data.invoice_next_number) || 1,
      ]
    );

    return this.getSettings();
  },
};
