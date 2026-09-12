import { getDatabaseAsync } from "../client";
import { Client, ClientCreateInput, ClientUpdateInput } from "../../types/client";

/**
 * Normalizes text for forgiving, case-insensitive, and accent-insensitive search.
 * Example: "Émile" -> "emile", "BATI-MAROC" -> "bati-maroc", "Ahm" -> "ahm"
 */
export function normalizeSearchTerm(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .trim();
}

/**
 * Normalizes phone numbers by stripping non-digit characters for robust matching.
 * Example: "+212 6 61 23 45 67" -> "212661234567", "06-61-23-45-67" -> "0661234567"
 */
export function normalizePhoneDigits(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

/**
 * Checks if a client matches a search query using forgiving multi-field matching
 * across client name/company name, phone number, ICE, contact person, city, and email.
 */
export function matchesClientSearch(client: Client, query: string): boolean {
  if (!query || query.trim() === "") return true;

  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedName = normalizeSearchTerm(client.name || "");
  const normalizedContact = normalizeSearchTerm(client.contact_person || "");
  const normalizedCity = normalizeSearchTerm(client.city || "");
  const normalizedEmail = normalizeSearchTerm(client.email || "");
  const normalizedIce = normalizeSearchTerm(client.ice || "");
  const normalizedNotes = normalizeSearchTerm(client.notes || "");

  // Text fields match
  if (
    normalizedName.includes(normalizedQuery) ||
    normalizedContact.includes(normalizedQuery) ||
    normalizedCity.includes(normalizedQuery) ||
    normalizedEmail.includes(normalizedQuery) ||
    normalizedIce.includes(normalizedQuery) ||
    normalizedNotes.includes(normalizedQuery)
  ) {
    return true;
  }

  // Phone match (forgiving: raw substring OR digits-only substring)
  const phoneNormalized = normalizeSearchTerm(client.phone || "");
  if (phoneNormalized.includes(normalizedQuery)) {
    return true;
  }

  const queryDigits = normalizePhoneDigits(query);
  const clientPhoneDigits = normalizePhoneDigits(client.phone || "");
  if (queryDigits.length >= 2 && clientPhoneDigits.includes(queryDigits)) {
    return true;
  }

  return false;
}

export const clientRepository = {
  /**
   * Retrieves clients filtered by status and optional search term.
   */
  async getClients(filter?: {
    status?: "all" | "active" | "archived";
    search?: string;
  }): Promise<Client[]> {
    const db = await getDatabaseAsync();
    const status = filter?.status || "active";

    let query = "SELECT * FROM clients";
    const bindValues: unknown[] = [];

    if (status === "active") {
      query += " WHERE is_active = 1";
    } else if (status === "archived") {
      query += " WHERE is_active = 0";
    }

    query += " ORDER BY name ASC, id DESC";

    const rows = await db.select<Client>(query, bindValues);

    // Apply forgiving partial search filtering
    if (filter?.search && filter.search.trim() !== "") {
      const searchStr = filter.search;
      return rows.filter((client: Client) => matchesClientSearch(client, searchStr));
    }

    return rows;
  },

  /**
   * Retrieves a single client by ID.
   */
  async getClientById(id: number): Promise<Client | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<Client>(
      "SELECT * FROM clients WHERE id = ? LIMIT 1",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new client in SQLite.
   */
  async createClient(input: ClientCreateInput): Promise<Client> {
    const db = await getDatabaseAsync();
    const result = await db.execute(
      `
      INSERT INTO clients (
        type,
        name,
        contact_person,
        phone,
        address,
        city,
        email,
        ice,
        if_tax,
        rc,
        notes,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      [
        input.type || "individual",
        input.name.trim(),
        input.contact_person?.trim() || "",
        input.phone?.trim() || "",
        input.address?.trim() || "",
        input.city?.trim() || "",
        input.email?.trim() || "",
        input.ice?.trim() || "",
        input.if_tax?.trim() || "",
        input.rc?.trim() || "",
        input.notes?.trim() || "",
        typeof input.is_active === "number" ? input.is_active : 1,
      ]
    );

    const createdId = result.lastInsertId || 1;
    const created = await this.getClientById(createdId);
    if (!created) {
      throw new Error(`Échec de récupération du client créé avec l'identifiant ${createdId}`);
    }
    return created;
  },

  /**
   * Updates an existing client record.
   */
  async updateClient(id: number, input: ClientUpdateInput): Promise<Client> {
    const current = await this.getClientById(id);
    if (!current) {
      throw new Error(`Client introuvable (ID: ${id})`);
    }

    const merged = {
      type: input.type !== undefined ? input.type : current.type,
      name: input.name !== undefined ? input.name.trim() : current.name,
      contact_person: input.contact_person !== undefined ? input.contact_person.trim() : current.contact_person,
      phone: input.phone !== undefined ? input.phone.trim() : current.phone,
      address: input.address !== undefined ? input.address.trim() : current.address,
      city: input.city !== undefined ? input.city.trim() : current.city,
      email: input.email !== undefined ? input.email.trim() : current.email,
      ice: input.ice !== undefined ? input.ice.trim() : current.ice,
      if_tax: input.if_tax !== undefined ? input.if_tax.trim() : current.if_tax,
      rc: input.rc !== undefined ? input.rc.trim() : current.rc,
      notes: input.notes !== undefined ? input.notes.trim() : current.notes,
      is_active: input.is_active !== undefined ? input.is_active : current.is_active,
    };

    const db = await getDatabaseAsync();
    await db.execute(
      `
      UPDATE clients SET
        type = ?,
        name = ?,
        contact_person = ?,
        phone = ?,
        address = ?,
        city = ?,
        email = ?,
        ice = ?,
        if_tax = ?,
        rc = ?,
        notes = ?,
        is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
        merged.type,
        merged.name,
        merged.contact_person,
        merged.phone,
        merged.address,
        merged.city,
        merged.email,
        merged.ice,
        merged.if_tax,
        merged.rc,
        merged.notes,
        merged.is_active,
        id,
      ]
    );

    const updated = await this.getClientById(id);
    if (!updated) {
      throw new Error(`Échec de récupération du client après modification`);
    }
    return updated;
  },

  /**
   * Soft-archives a client.
   */
  async archiveClient(id: number): Promise<void> {
    const db = await getDatabaseAsync();
    await db.execute(
      "UPDATE clients SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },

  /**
   * Restores an archived client to active status.
   */
  async restoreClient(id: number): Promise<void> {
    const db = await getDatabaseAsync();
    await db.execute(
      "UPDATE clients SET is_active = 1, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },

  /**
   * Deletes a client and all related invoices (and invoice items/payments) and quotations.
   */
  async deleteClientWithRelated(clientId: number): Promise<void> {
    const db = await getDatabaseAsync();

    // 1. Delete invoice items, payments, and invoices belonging to this client
    const invoices = await db.select<{ id: number }>(
      "SELECT id FROM invoices WHERE client_id = ?",
      [clientId]
    );
    for (const inv of invoices) {
      await db.execute("DELETE FROM invoice_items WHERE invoice_id = ?", [inv.id]);
      await db.execute("DELETE FROM payments WHERE invoice_id = ?", [inv.id]);
      await db.execute("DELETE FROM invoices WHERE id = ?", [inv.id]);
    }

    // 2. Delete quotation items and quotations belonging to this client
    const quotations = await db.select<{ id: number }>(
      "SELECT id FROM quotations WHERE client_id = ?",
      [clientId]
    );
    for (const q of quotations) {
      await db.execute("DELETE FROM quotation_items WHERE quotation_id = ?", [q.id]);
      await db.execute("DELETE FROM quotations WHERE id = ?", [q.id]);
    }

    // 3. Delete the client record
    await db.execute("DELETE FROM clients WHERE id = ?", [clientId]);
  },
};
