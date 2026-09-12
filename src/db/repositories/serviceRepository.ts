import { getDatabaseAsync } from "../client";
import { Service, ServiceCreateInput, ServiceUpdateInput } from "../../types/service";

/**
 * Normalizes text for forgiving, case-insensitive and accent-insensitive search.
 * Example: "caméra" -> "camera", "Électricité" -> "electricite"
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
 * Checks if a service matches a search query using forgiving fuzzy/substring logic
 * across reference code, French name/description, Arabic and English fields.
 */
export function matchesServiceSearch(service: Service, query: string): boolean {
  if (!query || query.trim() === "") return true;

  const normalizedQuery = normalizeSearchTerm(query);
  const normalizedCode = normalizeSearchTerm(service.code || "");
  const normalizedFr = normalizeSearchTerm(service.name_fr || "");
  const normalizedDescFr = normalizeSearchTerm(service.description_fr || "");
  const normalizedEn = normalizeSearchTerm(service.name_en || "");
  const normalizedDescEn = normalizeSearchTerm(service.description_en || "");
  
  // Also check raw string for Arabic text (non-Latin characters)
  const rawQueryLower = query.toLowerCase().trim();
  const rawAr = (service.name_ar || "").toLowerCase();
  const rawDescAr = (service.description_ar || "").toLowerCase();

  return (
    normalizedCode.includes(normalizedQuery) ||
    normalizedFr.includes(normalizedQuery) ||
    normalizedDescFr.includes(normalizedQuery) ||
    normalizedEn.includes(normalizedQuery) ||
    normalizedDescEn.includes(normalizedQuery) ||
    rawAr.includes(rawQueryLower) ||
    rawDescAr.includes(rawQueryLower)
  );
}

export const serviceRepository = {
  /**
   * Retrieves services filtered by status and optional search term.
   */
  async getServices(filter?: {
    status?: "all" | "active" | "archived";
    search?: string;
  }): Promise<Service[]> {
    const db = await getDatabaseAsync();
    const status = filter?.status || "active";

    let query = "SELECT * FROM services";
    const bindValues: unknown[] = [];

    if (status === "active") {
      query += " WHERE is_active = 1";
    } else if (status === "archived") {
      query += " WHERE is_active = 0";
    }

    query += " ORDER BY name_fr ASC, id DESC";

    const rows = await db.select<Service>(query, bindValues);

    // Apply forgiving search filtering
    if (filter?.search && filter.search.trim() !== "") {
      const searchStr = filter.search;
      return rows.filter((service: Service) => matchesServiceSearch(service, searchStr));
    }

    return rows;
  },

  /**
   * Retrieves a single service by its ID.
   */
  async getServiceById(id: number): Promise<Service | null> {
    const db = await getDatabaseAsync();
    const rows = await db.select<Service>(
      "SELECT * FROM services WHERE id = ? LIMIT 1",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new service record in SQLite.
   */
  async createService(input: ServiceCreateInput): Promise<Service> {
    const db = await getDatabaseAsync();
    const result = await db.execute(
      `
      INSERT INTO services (
        code,
        name_fr,
        description_fr,
        name_ar,
        description_ar,
        name_en,
        description_en,
        default_unit,
        default_price,
        is_active,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      [
        input.code?.trim() || "",
        input.name_fr.trim(),
        input.description_fr?.trim() || "",
        input.name_ar?.trim() || "",
        input.description_ar?.trim() || "",
        input.name_en?.trim() || "",
        input.description_en?.trim() || "",
        input.default_unit?.trim() || "Unité",
        input.default_price >= 0 ? input.default_price : 0,
        typeof input.is_active === "number" ? input.is_active : 1,
      ]
    );

    const createdId = result.lastInsertId || 1;
    const created = await this.getServiceById(createdId);
    if (!created) {
      throw new Error(`Échec de récupération du service créé avec l'identifiant ${createdId}`);
    }
    return created;
  },

  /**
   * Updates an existing service record.
   */
  async updateService(id: number, input: ServiceUpdateInput): Promise<Service> {
    const current = await this.getServiceById(id);
    if (!current) {
      throw new Error(`Service introuvable (ID: ${id})`);
    }

    const merged = {
      code: input.code !== undefined ? input.code.trim() : current.code,
      name_fr: input.name_fr !== undefined ? input.name_fr.trim() : current.name_fr,
      description_fr: input.description_fr !== undefined ? input.description_fr.trim() : current.description_fr,
      name_ar: input.name_ar !== undefined ? input.name_ar.trim() : current.name_ar,
      description_ar: input.description_ar !== undefined ? input.description_ar.trim() : current.description_ar,
      name_en: input.name_en !== undefined ? input.name_en.trim() : current.name_en,
      description_en: input.description_en !== undefined ? input.description_en.trim() : current.description_en,
      default_unit: input.default_unit !== undefined ? input.default_unit.trim() : current.default_unit,
      default_price: input.default_price !== undefined ? Math.max(0, input.default_price) : current.default_price,
      is_active: input.is_active !== undefined ? input.is_active : current.is_active,
    };

    const db = await getDatabaseAsync();
    await db.execute(
      `
      UPDATE services SET
        code = ?,
        name_fr = ?,
        description_fr = ?,
        name_ar = ?,
        description_ar = ?,
        name_en = ?,
        description_en = ?,
        default_unit = ?,
        default_price = ?,
        is_active = ?,
        updated_at = datetime('now')
      WHERE id = ?
      `,
      [
        merged.code,
        merged.name_fr,
        merged.description_fr,
        merged.name_ar,
        merged.description_ar,
        merged.name_en,
        merged.description_en,
        merged.default_unit,
        merged.default_price,
        merged.is_active,
        id,
      ]
    );

    const updated = await this.getServiceById(id);
    if (!updated) {
      throw new Error(`Échec de récupération du service après modification`);
    }
    return updated;
  },

  /**
   * Soft-archives a service without deleting historical data.
   */
  async archiveService(id: number): Promise<void> {
    const db = await getDatabaseAsync();
    await db.execute(
      "UPDATE services SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },

  /**
   * Restores an archived service to active status.
   */
  async restoreService(id: number): Promise<void> {
    const db = await getDatabaseAsync();
    await db.execute(
      "UPDATE services SET is_active = 1, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },
};
