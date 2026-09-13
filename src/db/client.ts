import Database from "@tauri-apps/plugin-sql";
import { DbClient, DatabaseDriverType, DatabaseHealth, DatabaseStatus, QueryResult } from "./types";
import { runMigrations, MigrationSummary } from "./migrator";
import { MIGRATIONS } from "./migrations";

let dbInstance: DbClient | null = null;
let dbStatus: DatabaseStatus = "uninitialized";
let dbHealth: DatabaseHealth = {
  status: "uninitialized",
  driver: "tauri-sqlite",
  isOffline: true,
  foreignKeysEnabled: false,
  migrationVersion: 0,
  totalMigrations: MIGRATIONS.length,
};
let initPromise: Promise<DbClient> | null = null;

/**
 * Checks if the current environment is running inside a Tauri desktop container.
 */
function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ||
    (window as unknown as { __TAURI__?: unknown }).__TAURI__
  );
}

/**
 * Web/Browser local in-memory SQLite emulation for preview and testing environments.
 * Keeps the application functioning without crashing when viewed outside the Tauri binary.
 */
class WebLocalSqliteClient implements DbClient {
  readonly driver: DatabaseDriverType = "web-local-sqlite";
  private metadata = new Map<string, string>();
  private appliedMigrations: Array<{ id: number; name: string; applied_at: string }> = [];
  private companySettings: Record<string, unknown> = {
    id: 1,
    name: "",
    contact_person: "",
    address: "",
    city: "",
    country: "Maroc",
    phone: "",
    email: "",
    website: "",
    ice: "",
    if_tax: "",
    rc: "",
    patente: "",
    cnss: "",
    bank_name: "",
    rib_iban: "",
    currency: "MAD",
    document_language: "fr",
    invoice_prefix: "FAC",
    invoice_pattern: "{PREFIX}-{YEAR}-{SEQ}",
    invoice_sequence_padding: 4,
    invoice_next_number: 1,
    updated_at: new Date().toISOString(),
  };
  private services: Array<Record<string, unknown>> = [];
  private nextServiceId = 1;

  private clients: Array<Record<string, unknown>> = [];
  private nextClientId = 1;

  private invoices: Array<Record<string, unknown>> = [];
  private nextInvoiceId = 1;
  private invoiceItems: Array<Record<string, unknown>> = [];
  private nextInvoiceItemId = 1;
  private payments: Array<Record<string, unknown>> = [];
  private nextPaymentId = 1;

  private quotations: Array<Record<string, unknown>> = [];
  private nextQuotationId = 1;
  private quotationItems: Array<Record<string, unknown>> = [];
  private nextQuotationItemId = 1;

  private logos: Array<Record<string, unknown>> = [];
  private nextLogoId = 1;
  private invoiceStyles: Array<Record<string, unknown>> = [];
  private users: Array<Record<string, unknown>> = [];
  private nextUserId = 1;

  constructor() {
    console.log("[DB Web Client] Initialized offline browser SQLite fallback adapter.");
    try {
      const storedUsers = localStorage.getItem("fatora_users");
      if (storedUsers) {
        try {
          this.users = JSON.parse(storedUsers);
          if (this.users.length > 0) {
            const maxId = Math.max(...this.users.map((u) => Number(u.id) || 1));
            this.nextUserId = maxId + 1;
          }
        } catch {
          this.users = [];
        }
      }
      const storedSettings = localStorage.getItem("fatora_company_settings");
      if (storedSettings) {
        this.companySettings = { ...this.companySettings, ...JSON.parse(storedSettings) };
      }

      const storedServices = localStorage.getItem("fatora_services");
      if (storedServices) {
        this.services = JSON.parse(storedServices);
        if (this.services.length > 0) {
          const maxId = Math.max(...this.services.map((s) => Number(s.id) || 1));
          this.nextServiceId = maxId + 1;
        }
      } else {
        localStorage.setItem("fatora_services", JSON.stringify(this.services));
      }

      const storedClients = localStorage.getItem("fatora_clients");
      if (storedClients) {
        this.clients = JSON.parse(storedClients);
        if (this.clients.length > 0) {
          const maxId = Math.max(...this.clients.map((c) => Number(c.id) || 1));
          this.nextClientId = maxId + 1;
        }
      } else {
        localStorage.setItem("fatora_clients", JSON.stringify(this.clients));
      }

      const storedInvoices = localStorage.getItem("fatora_invoices");
      if (storedInvoices) {
        this.invoices = JSON.parse(storedInvoices);
        if (this.invoices.length > 0) {
          const maxId = Math.max(...this.invoices.map((inv) => Number(inv.id) || 1));
          this.nextInvoiceId = maxId + 1;
        }
      }

      const storedInvoiceItems = localStorage.getItem("fatora_invoice_items");
      if (storedInvoiceItems) {
        this.invoiceItems = JSON.parse(storedInvoiceItems);
        if (this.invoiceItems.length > 0) {
          const maxId = Math.max(...this.invoiceItems.map((item) => Number(item.id) || 1));
          this.nextInvoiceItemId = maxId + 1;
        }
      }

      const storedPayments = localStorage.getItem("fatora_payments");
      if (storedPayments) {
        this.payments = JSON.parse(storedPayments);
        if (this.payments.length > 0) {
          const maxId = Math.max(...this.payments.map((p) => Number(p.id) || 1));
          this.nextPaymentId = maxId + 1;
        }
      }

      const storedQuotations = localStorage.getItem("fatora_quotations");
      if (storedQuotations) {
        this.quotations = JSON.parse(storedQuotations);
        if (this.quotations.length > 0) {
          const maxId = Math.max(...this.quotations.map((q) => Number(q.id) || 1));
          this.nextQuotationId = maxId + 1;
        }
      }

      const storedQuotationItems = localStorage.getItem("fatora_quotation_items");
      if (storedQuotationItems) {
        this.quotationItems = JSON.parse(storedQuotationItems);
        if (this.quotationItems.length > 0) {
          const maxId = Math.max(...this.quotationItems.map((item) => Number(item.id) || 1));
          this.nextQuotationItemId = maxId + 1;
        }
      }

      const storedLogos = localStorage.getItem("fatora_logos");
      if (storedLogos) {
        this.logos = JSON.parse(storedLogos);
        if (this.logos.length > 0) {
          const maxId = Math.max(...this.logos.map((l) => Number(l.id) || 1));
          this.nextLogoId = maxId + 1;
        }
      }

      const storedStyles = localStorage.getItem("fatora_invoice_styles");
      const defaultStylesList = [
        {
          id: 1,
          style_key: 'style_1',
          name: 'Style 1 — Bleu Cobalt (Classique)',
          description: 'Présentation professionnelle avec bandeau supérieur bleu cobalt (#0047AB), en-tête net et haute lisibilité.',
          logo_id: null,
          primary_color: '#0047AB',
          header_color: '#0047AB',
          accent_color: '#0047AB',
          footer_color: '#0047AB',
          header_bg_color: '#0047AB',
          header_text_color: '#ffffff',
          table_header_bg_color: '#0047AB',
          table_header_text_color: '#ffffff',
          footer_bg_color: '#0047AB',
          footer_text_color: '#ffffff',
          footer_text: 'Merci de votre confiance. Facture payable selon les conditions convenues.',
          show_ice: 1,
          show_tax_id: 1,
          show_rc: 1,
          show_cnss: 0,
          show_iban: 1,
          show_phone: 1,
          show_email: 1,
          show_address: 1,
          show_due_date: 1,
          is_default: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          style_key: 'style_2',
          name: 'Style 2 — Bleu Cobalt (Moderne)',
          description: 'Style contemporain et épuré avec bandeau bleu cobalt (#0047AB).',
          logo_id: null,
          primary_color: '#0047AB',
          header_color: '#0047AB',
          accent_color: '#0047AB',
          footer_color: '#0047AB',
          header_bg_color: '#0047AB',
          header_text_color: '#ffffff',
          table_header_bg_color: '#0047AB',
          table_header_text_color: '#ffffff',
          footer_bg_color: '#0047AB',
          footer_text_color: '#ffffff',
          footer_text: 'Document officiel établi conformément aux réglementations commerciales en vigueur.',
          show_ice: 1,
          show_tax_id: 1,
          show_rc: 1,
          show_cnss: 0,
          show_iban: 1,
          show_phone: 1,
          show_email: 1,
          show_address: 1,
          show_due_date: 1,
          is_default: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          style_key: 'style_3',
          name: 'Style 3 — Bleu Cobalt (Épuré)',
          description: 'Design corporatif et sobre axé sur le bleu cobalt (#0047AB).',
          logo_id: null,
          primary_color: '#0047AB',
          header_color: '#0047AB',
          accent_color: '#0047AB',
          footer_color: '#0047AB',
          header_bg_color: '#0047AB',
          header_text_color: '#ffffff',
          table_header_bg_color: '#0047AB',
          table_header_text_color: '#ffffff',
          footer_bg_color: '#0047AB',
          footer_text_color: '#ffffff',
          footer_text: 'Paiement par virement bancaire recommandé avec mention du numéro de facture.',
          show_ice: 1,
          show_tax_id: 1,
          show_rc: 1,
          show_cnss: 0,
          show_iban: 1,
          show_phone: 1,
          show_email: 1,
          show_address: 1,
          show_due_date: 1,
          is_default: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      if (storedStyles) {
        try {
          const parsed = JSON.parse(storedStyles);
          this.invoiceStyles = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.invoiceStyles = [];
        }
      }

      // Ensure all fields exist on stored styles (migration for missing color/font/due_date properties)
      this.invoiceStyles = this.invoiceStyles.map((s) => ({
        ...s,
        header_bg_color: s.header_bg_color || s.header_color || "#0047AB",
        header_text_color: s.header_text_color || "#ffffff",
        table_header_bg_color: s.table_header_bg_color || "#0047AB",
        table_header_text_color: s.table_header_text_color || "#ffffff",
        footer_bg_color: s.footer_bg_color || s.header_bg_color || s.header_color || "#0047AB",
        footer_text_color: s.footer_text_color || "#ffffff",
        show_due_date: s.show_due_date !== undefined ? Number(s.show_due_date) : 1,
      }));

      // Ensure all default styles exist
      for (const defSt of defaultStylesList) {
        if (!this.invoiceStyles.some((s) => Number(s.id) === defSt.id || s.style_key === defSt.style_key)) {
          this.invoiceStyles.push(defSt);
        }
      }
      this.saveInvoiceStylesToStorage();
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }

  private saveServicesToStorage() {
    try {
      localStorage.setItem("fatora_services", JSON.stringify(this.services));
    } catch {
      // Ignore
    }
  }

  private saveClientsToStorage() {
    try {
      localStorage.setItem("fatora_clients", JSON.stringify(this.clients));
    } catch {
      // Ignore
    }
  }

  private saveInvoicesToStorage() {
    try {
      localStorage.setItem("fatora_invoices", JSON.stringify(this.invoices));
    } catch {
      // Ignore
    }
  }

  private saveInvoiceItemsToStorage() {
    try {
      localStorage.setItem("fatora_invoice_items", JSON.stringify(this.invoiceItems));
    } catch {
      // Ignore
    }
  }

  private savePaymentsToStorage() {
    try {
      localStorage.setItem("fatora_payments", JSON.stringify(this.payments));
    } catch {
      // Ignore
    }
  }

  private saveQuotationsToStorage() {
    try {
      localStorage.setItem("fatora_quotations", JSON.stringify(this.quotations));
    } catch {
      // Ignore
    }
  }

  private saveQuotationItemsToStorage() {
    try {
      localStorage.setItem("fatora_quotation_items", JSON.stringify(this.quotationItems));
    } catch {
      // Ignore
    }
  }

  private saveLogosToStorage() {
    try {
      localStorage.setItem("fatora_logos", JSON.stringify(this.logos));
    } catch {
      // Ignore
    }
  }

  private saveInvoiceStylesToStorage() {
    try {
      localStorage.setItem("fatora_invoice_styles", JSON.stringify(this.invoiceStyles));
    } catch {
      // Ignore
    }
  }

  private saveUsersToStorage() {
    try {
      localStorage.setItem("fatora_users", JSON.stringify(this.users));
    } catch {
      // Ignore
    }
  }

  async execute(query: string, bindValues: unknown[] = []): Promise<QueryResult> {
    const trimmed = query.trim();
    console.log(`[DB Web Client: EXEC] ${trimmed.slice(0, 100)}...`, bindValues);

    // Simple parser for metadata & migrations tables & transactions
    if (
      trimmed.toUpperCase().startsWith("BEGIN") ||
      trimmed.toUpperCase().startsWith("COMMIT") ||
      trimmed.toUpperCase().startsWith("ROLLBACK")
    ) {
      return { rowsAffected: 0 };
    }

    if (trimmed.toUpperCase().includes("PRAGMA FOREIGN_KEYS")) {
      return { rowsAffected: 0 };
    }

    // Table Clear (DELETE FROM) handling
    if (trimmed.toUpperCase().startsWith("DELETE FROM")) {
      const upper = trimmed.toUpperCase();
      if (upper.includes("DELETE FROM QUOTATION_ITEMS")) {
        this.quotationItems = [];
        this.saveQuotationItemsToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM QUOTATIONS")) {
        this.quotations = [];
        this.saveQuotationsToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM PAYMENTS")) {
        this.payments = [];
        this.savePaymentsToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM INVOICE_ITEMS")) {
        this.invoiceItems = [];
        this.saveInvoiceItemsToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM INVOICES")) {
        this.invoices = [];
        this.saveInvoicesToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM CLIENTS")) {
        this.clients = [];
        this.saveClientsToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM SERVICES")) {
        this.services = [];
        this.saveServicesToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM LOGOS")) {
        this.logos = [];
        this.saveLogosToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM INVOICE_STYLES")) {
        this.invoiceStyles = [];
        this.saveInvoiceStylesToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM APP_USERS")) {
        this.users = [];
        this.saveUsersToStorage();
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM COMPANY_SETTINGS")) {
        this.companySettings = { id: 1 };
        try { localStorage.removeItem("fatora_company_settings"); } catch {}
        return { rowsAffected: 1 };
      }
      if (upper.includes("DELETE FROM APP_METADATA")) {
        this.metadata.clear();
        return { rowsAffected: 1 };
      }
    }

    // Parameterised generic INSERT INTO tableName ("col1", "col2") VALUES (?, ?)
    const insertMatch = trimmed.match(/INSERT(?:\s+OR\s+\w+)?\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES/i);
    if (insertMatch) {
      const tableName = insertMatch[1].toLowerCase();
      if (!["clients", "services", "invoices", "quotations", "invoice_items", "quotation_items", "payments", "logos", "invoice_styles", "company_settings", "app_metadata"].includes(tableName)) {
        const colNames = insertMatch[2].split(",").map((c) => c.trim().replace(/^["'`]|["'`]$/g, ""));
        const rowObj: Record<string, unknown> = {};
        colNames.forEach((col, idx) => {
          rowObj[col] = bindValues[idx];
        });
        return { rowsAffected: 1, lastInsertId: Number(rowObj.id) || 1 };
      }
    }

    if (trimmed.includes("INSERT INTO _schema_migrations") || trimmed.includes("INSERT OR IGNORE INTO _schema_migrations")) {
      const id = typeof bindValues[0] === "number" ? bindValues[0] : 1;
      const name = typeof bindValues[1] === "string" ? bindValues[1] : "migration";
      this.appliedMigrations.push({
        id,
        name,
        applied_at: new Date().toISOString(),
      });
      return { rowsAffected: 1, lastInsertId: id };
    }

    if (trimmed.includes("INSERT INTO app_metadata") || trimmed.includes("INSERT OR REPLACE INTO app_metadata") || trimmed.includes("INSERT OR IGNORE INTO app_metadata")) {
      const key = typeof bindValues[0] === "string" ? bindValues[0] : "key";
      const value = typeof bindValues[1] === "string" ? bindValues[1] : "value";
      this.metadata.set(key, value);
      return { rowsAffected: 1 };
    }

    if (trimmed.toUpperCase().includes("UPDATE COMPANY_SETTINGS") || trimmed.toUpperCase().includes("INSERT OR REPLACE INTO COMPANY_SETTINGS")) {
      if (bindValues && bindValues.length >= 17) {
        this.companySettings = {
          id: 1,
          name: bindValues[0] ?? "",
          contact_person: bindValues[1] ?? "",
          address: bindValues[2] ?? "",
          city: bindValues[3] ?? "",
          country: bindValues[4] ?? "Maroc",
          phone: bindValues[5] ?? "",
          email: bindValues[6] ?? "",
          website: bindValues[7] ?? "",
          ice: bindValues[8] ?? "",
          if_tax: bindValues[9] ?? "",
          rc: bindValues[10] ?? "",
          patente: bindValues[11] ?? "",
          cnss: bindValues[12] ?? "",
          bank_name: bindValues[13] ?? "",
          rib_iban: bindValues[14] ?? "",
          currency: bindValues[15] ?? "MAD",
          document_language: bindValues[16] ?? "fr",
          invoice_prefix: bindValues[17] !== undefined ? bindValues[17] : "FAC",
          invoice_pattern: bindValues[18] ?? "{PREFIX}-{YEAR}-{SEQ}",
          invoice_sequence_padding: Number(bindValues[19]) || 4,
          invoice_next_number: Number(bindValues[20]) || 1,
          updated_at: new Date().toISOString(),
        };
        try {
          localStorage.setItem("fatora_company_settings", JSON.stringify(this.companySettings));
        } catch {
          // Ignore
        }
      }
      return { rowsAffected: 1 };
    }

    // INSERT INTO services
    if (trimmed.toUpperCase().includes("INSERT INTO SERVICES")) {
      const newId = this.nextServiceId++;
      const newService = {
        id: newId,
        code: bindValues[0] ?? "",
        name_fr: bindValues[1] ?? "",
        description_fr: bindValues[2] ?? "",
        name_ar: bindValues[3] ?? "",
        description_ar: bindValues[4] ?? "",
        name_en: bindValues[5] ?? "",
        description_en: bindValues[6] ?? "",
        default_unit: bindValues[7] ?? "Unité",
        default_price: Number(bindValues[8]) || 0,
        is_active: typeof bindValues[9] === "number" ? bindValues[9] : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.services.unshift(newService);
      this.saveServicesToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE services SET is_active = 0 (Archive) or 1 (Restore)
    if (trimmed.toUpperCase().includes("UPDATE SERVICES SET IS_ACTIVE =")) {
      const isArchived = trimmed.toUpperCase().includes("IS_ACTIVE = 0") ? 0 : 1;
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.services = this.services.map((s) => {
        if (Number(s.id) === targetId) {
          return { ...s, is_active: isArchived, updated_at: new Date().toISOString() };
        }
        return s;
      });
      this.saveServicesToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE services SET ... full edit
    if (trimmed.toUpperCase().includes("UPDATE SERVICES SET")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.services = this.services.map((s) => {
        if (Number(s.id) === targetId) {
          return {
            ...s,
            code: bindValues[0] ?? s.code,
            name_fr: bindValues[1] ?? s.name_fr,
            description_fr: bindValues[2] ?? s.description_fr,
            name_ar: bindValues[3] ?? s.name_ar,
            description_ar: bindValues[4] ?? s.description_ar,
            name_en: bindValues[5] ?? s.name_en,
            description_en: bindValues[6] ?? s.description_en,
            default_unit: bindValues[7] ?? s.default_unit,
            default_price: Number(bindValues[8]) ?? s.default_price,
            is_active: typeof bindValues[9] === "number" ? bindValues[9] : s.is_active,
            updated_at: new Date().toISOString(),
          };
        }
        return s;
      });
      this.saveServicesToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO clients
    if (trimmed.toUpperCase().includes("INSERT INTO CLIENTS")) {
      const newId = this.nextClientId++;
      const newClient = {
        id: newId,
        type: bindValues[0] ?? "individual",
        name: bindValues[1] ?? "",
        contact_person: bindValues[2] ?? "",
        phone: bindValues[3] ?? "",
        address: bindValues[4] ?? "",
        city: bindValues[5] ?? "",
        email: bindValues[6] ?? "",
        ice: bindValues[7] ?? "",
        if_tax: bindValues[8] ?? "",
        rc: bindValues[9] ?? "",
        notes: bindValues[10] ?? "",
        is_active: typeof bindValues[11] === "number" ? bindValues[11] : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.clients.unshift(newClient);
      this.saveClientsToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE clients SET is_active = 0 (Archive) or 1 (Restore)
    if (trimmed.toUpperCase().includes("UPDATE CLIENTS SET IS_ACTIVE =")) {
      const isArchived = trimmed.toUpperCase().includes("IS_ACTIVE = 0") ? 0 : 1;
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.clients = this.clients.map((c) => {
        if (Number(c.id) === targetId) {
          return { ...c, is_active: isArchived, updated_at: new Date().toISOString() };
        }
        return c;
      });
      this.saveClientsToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE clients SET ... full edit
    if (trimmed.toUpperCase().includes("UPDATE CLIENTS SET")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.clients = this.clients.map((c) => {
        if (Number(c.id) === targetId) {
          return {
            ...c,
            type: bindValues[0] ?? c.type,
            name: bindValues[1] ?? c.name,
            contact_person: bindValues[2] ?? c.contact_person,
            phone: bindValues[3] ?? c.phone,
            address: bindValues[4] ?? c.address,
            city: bindValues[5] ?? c.city,
            email: bindValues[6] ?? c.email,
            ice: bindValues[7] ?? c.ice,
            if_tax: bindValues[8] ?? c.if_tax,
            rc: bindValues[9] ?? c.rc,
            notes: bindValues[10] ?? c.notes,
            is_active: typeof bindValues[11] === "number" ? bindValues[11] : c.is_active,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      this.saveClientsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO invoices
    if (trimmed.toUpperCase().includes("INSERT INTO INVOICES")) {
      const newId = this.nextInvoiceId++;
      const newInvoice: Record<string, unknown> = {
        id: newId,
        invoice_number: bindValues[0] ?? `FAC-2026-000${newId}`,
        sequence_number: Number(bindValues[1]) || newId,
        sequence_year: Number(bindValues[2]) || new Date().getFullYear(),
        prefix: bindValues[3] ?? "FAC",
        status: bindValues[4] ?? "draft",
        language: bindValues[5] ?? "fr",
        currency: bindValues[6] ?? "MAD",
        client_id: bindValues[7] ?? null,
        client_name: bindValues[8] ?? "",
        client_type: bindValues[9] ?? "individual",
        client_contact_person: bindValues[10] ?? "",
        client_phone: bindValues[11] ?? "",
        client_address: bindValues[12] ?? "",
        client_city: bindValues[13] ?? "",
        client_email: bindValues[14] ?? "",
        client_ice: bindValues[15] ?? "",
        client_if: bindValues[16] ?? "",
        client_rc: bindValues[17] ?? "",
        seller_name: bindValues[18] ?? "",
        seller_contact_person: bindValues[19] ?? "",
        seller_phone: bindValues[20] ?? "",
        seller_address: bindValues[21] ?? "",
        seller_city: bindValues[22] ?? "",
        seller_email: bindValues[23] ?? "",
        seller_ice: bindValues[24] ?? "",
        seller_if: bindValues[25] ?? "",
        seller_rc: bindValues[26] ?? "",
        seller_patente: bindValues[27] ?? "",
        seller_cnss: bindValues[28] ?? "",
        seller_bank_name: bindValues[29] ?? "",
        seller_rib: bindValues[30] ?? "",
        invoice_date: bindValues[31] ?? new Date().toISOString().split("T")[0],
        due_date: bindValues[32] ?? "",
        notes: bindValues[33] ?? "",
        payment_terms: bindValues[34] ?? "",
        subtotal_cents: Number(bindValues[35]) || 0,
        discount_type: bindValues[36] ?? "fixed",
        discount_rate: Number(bindValues[37]) || 0,
        discount_amount_cents: Number(bindValues[38]) || 0,
        tax_rate: Number(bindValues[39]) || 0,
        tax_amount_cents: Number(bindValues[40]) || 0,
        total_cents: Number(bindValues[41]) || 0,
        paid_amount_cents: Number(bindValues[42]) || 0,
        balance_cents: Number(bindValues[43]) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.invoices.unshift(newInvoice);
      this.saveInvoicesToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE invoices SET status = ? WHERE id = ?
    if (trimmed.toUpperCase().includes("UPDATE INVOICES SET STATUS =")) {
      const status = bindValues[0];
      const targetId = Number(bindValues[1]);
      this.invoices = this.invoices.map((inv) => {
        if (Number(inv.id) === targetId) {
          return { ...inv, status, updated_at: new Date().toISOString() };
        }
        return inv;
      });
      this.saveInvoicesToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE invoices SET paid_amount_cents = ?, balance_cents = ?, status = ?
    if (trimmed.toUpperCase().includes("UPDATE INVOICES SET") && trimmed.toUpperCase().includes("PAID_AMOUNT_CENTS =")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.invoices = this.invoices.map((inv) => {
        if (Number(inv.id) === targetId) {
          return {
            ...inv,
            paid_amount_cents: Number(bindValues[0]) || 0,
            balance_cents: Number(bindValues[1]) || 0,
            status: bindValues[2] ?? inv.status,
            updated_at: new Date().toISOString(),
          };
        }
        return inv;
      });
      this.saveInvoicesToStorage();
      return { rowsAffected: 1 };
    }

    // DELETE FROM invoices WHERE id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM INVOICES WHERE ID =")) {
      const targetId = Number(bindValues[0]);
      this.invoices = this.invoices.filter((inv) => Number(inv.id) !== targetId);
      this.invoiceItems = this.invoiceItems.filter((item) => Number(item.invoice_id) !== targetId);
      this.payments = this.payments.filter((p) => Number(p.invoice_id) !== targetId);
      this.saveInvoicesToStorage();
      this.saveInvoiceItemsToStorage();
      this.savePaymentsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO invoice_items
    if (trimmed.toUpperCase().includes("INSERT INTO INVOICE_ITEMS")) {
      const newId = this.nextInvoiceItemId++;
      const newItem: Record<string, unknown> = {
        id: newId,
        invoice_id: Number(bindValues[0]) || 0,
        service_id: bindValues[1] ?? null,
        position: Number(bindValues[2]) || 0,
        name: bindValues[3] ?? "",
        name_ar: bindValues[4] ?? "",
        name_en: bindValues[5] ?? "",
        description: bindValues[6] ?? "",
        description_ar: bindValues[7] ?? "",
        description_en: bindValues[8] ?? "",
        unit: bindValues[9] ?? "U",
        quantity: Number(bindValues[10]) || 1,
        unit_price_cents: Number(bindValues[11]) || 0,
        discount_type: bindValues[12] ?? "fixed",
        discount_rate: Number(bindValues[13]) || 0,
        discount_amount_cents: Number(bindValues[14]) || 0,
        tax_rate: Number(bindValues[15]) || 0,
        tax_amount_cents: Number(bindValues[16]) || 0,
        total_cents: Number(bindValues[17]) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.invoiceItems.push(newItem);
      this.saveInvoiceItemsToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // DELETE FROM invoice_items WHERE invoice_id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM INVOICE_ITEMS WHERE INVOICE_ID =")) {
      const invoiceId = Number(bindValues[0]);
      this.invoiceItems = this.invoiceItems.filter((item) => Number(item.invoice_id) !== invoiceId);
      this.saveInvoiceItemsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO payments
    if (trimmed.toUpperCase().includes("INSERT INTO PAYMENTS")) {
      const newId = this.nextPaymentId++;
      const newPayment: Record<string, unknown> = {
        id: newId,
        invoice_id: Number(bindValues[0]) || 0,
        amount_cents: Number(bindValues[1]) || 0,
        payment_date: bindValues[2] ?? new Date().toISOString().split("T")[0],
        payment_method: bindValues[3] ?? "cash",
        reference: bindValues[4] ?? "",
        notes: bindValues[5] ?? "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.payments.push(newPayment);
      this.savePaymentsToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // DELETE FROM payments WHERE id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM PAYMENTS WHERE ID =")) {
      const paymentId = Number(bindValues[0]);
      this.payments = this.payments.filter((p) => Number(p.id) !== paymentId);
      this.savePaymentsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO quotations
    if (trimmed.toUpperCase().includes("INSERT INTO QUOTATIONS")) {
      const newId = this.nextQuotationId++;
      const newQuotation: Record<string, unknown> = {
        id: newId,
        quotation_number: bindValues[0] ?? "",
        sequence_number: Number(bindValues[1]) || 0,
        sequence_year: Number(bindValues[2]) || new Date().getFullYear(),
        prefix: bindValues[3] ?? "DEV",
        status: bindValues[4] ?? "draft",
        language: bindValues[5] ?? "fr",
        currency: bindValues[6] ?? "MAD",
        client_id: bindValues[7] ?? null,
        client_name: bindValues[8] ?? "",
        client_type: bindValues[9] ?? "individual",
        client_contact_person: bindValues[10] ?? "",
        client_phone: bindValues[11] ?? "",
        client_address: bindValues[12] ?? "",
        client_city: bindValues[13] ?? "",
        client_email: bindValues[14] ?? "",
        client_ice: bindValues[15] ?? "",
        client_if: bindValues[16] ?? "",
        client_rc: bindValues[17] ?? "",
        seller_name: bindValues[18] ?? "",
        seller_contact_person: bindValues[19] ?? "",
        seller_phone: bindValues[20] ?? "",
        seller_address: bindValues[21] ?? "",
        seller_city: bindValues[22] ?? "",
        seller_email: bindValues[23] ?? "",
        seller_ice: bindValues[24] ?? "",
        seller_if: bindValues[25] ?? "",
        seller_rc: bindValues[26] ?? "",
        seller_patente: bindValues[27] ?? "",
        seller_cnss: bindValues[28] ?? "",
        seller_bank_name: bindValues[29] ?? "",
        seller_rib: bindValues[30] ?? "",
        quotation_date: bindValues[31] ?? new Date().toISOString().split("T")[0],
        valid_until_date: bindValues[32] ?? "",
        notes: bindValues[33] ?? "",
        payment_terms: bindValues[34] ?? "",
        subtotal_cents: Number(bindValues[35]) || 0,
        discount_type: bindValues[36] ?? "fixed",
        discount_rate: Number(bindValues[37]) || 0,
        discount_amount_cents: Number(bindValues[38]) || 0,
        tax_rate: Number(bindValues[39]) || 0,
        tax_amount_cents: Number(bindValues[40]) || 0,
        total_cents: Number(bindValues[41]) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.quotations.push(newQuotation);
      this.saveQuotationsToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE quotations SET status = ? / converted_invoice_id = ? ...
    if (trimmed.toUpperCase().includes("UPDATE QUOTATIONS")) {
      const id = Number(bindValues[bindValues.length - 1]);
      this.quotations = this.quotations.map((q) => {
        if (Number(q.id) === id) {
          const updated: Record<string, unknown> = { ...q, updated_at: new Date().toISOString() };
          
          if (trimmed.toUpperCase().includes("STATUS = ?") && trimmed.toUpperCase().includes("CONVERTED_INVOICE_ID = ?")) {
            updated.status = bindValues[0];
            updated.converted_invoice_id = bindValues[1];
          } else if (trimmed.toUpperCase().includes("STATUS = ?")) {
            updated.status = bindValues[0];
          }
          return updated;
        }
        return q;
      });
      this.saveQuotationsToStorage();
      return { rowsAffected: 1 };
    }

    // DELETE FROM quotations WHERE id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM QUOTATIONS WHERE ID =")) {
      const targetId = Number(bindValues[0]);
      this.quotations = this.quotations.filter((q) => Number(q.id) !== targetId);
      this.quotationItems = this.quotationItems.filter((item) => Number(item.quotation_id) !== targetId);
      this.saveQuotationsToStorage();
      this.saveQuotationItemsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO quotation_items
    if (trimmed.toUpperCase().includes("INSERT INTO QUOTATION_ITEMS")) {
      const newId = this.nextQuotationItemId++;
      const newItem: Record<string, unknown> = {
        id: newId,
        quotation_id: Number(bindValues[0]) || 0,
        service_id: bindValues[1] ?? null,
        position: Number(bindValues[2]) || 0,
        name: bindValues[3] ?? "",
        name_ar: bindValues[4] ?? "",
        name_en: bindValues[5] ?? "",
        description: bindValues[6] ?? "",
        description_ar: bindValues[7] ?? "",
        description_en: bindValues[8] ?? "",
        unit: bindValues[9] ?? "U",
        quantity: Number(bindValues[10]) || 1,
        unit_price_cents: Number(bindValues[11]) || 0,
        discount_type: bindValues[12] ?? "fixed",
        discount_rate: Number(bindValues[13]) || 0,
        discount_amount_cents: Number(bindValues[14]) || 0,
        tax_rate: Number(bindValues[15]) || 0,
        tax_amount_cents: Number(bindValues[16]) || 0,
        total_cents: Number(bindValues[17]) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.quotationItems.push(newItem);
      this.saveQuotationItemsToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // DELETE FROM quotation_items WHERE quotation_id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM QUOTATION_ITEMS WHERE QUOTATION_ID =")) {
      const qId = Number(bindValues[0]);
      this.quotationItems = this.quotationItems.filter((item) => Number(item.quotation_id) !== qId);
      this.saveQuotationItemsToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO logos
    if (trimmed.toUpperCase().includes("INSERT INTO LOGOS")) {
      const newId = this.nextLogoId++;
      const newLogo: Record<string, unknown> = {
        id: newId,
        name: bindValues[0] ?? "",
        file_name: bindValues[1] ?? "logo.png",
        file_data: bindValues[2] ?? "",
        file_type: bindValues[3] ?? "image/png",
        file_size: Number(bindValues[4]) || 0,
        is_default: Number(bindValues[5]) || 0,
        is_archived: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.logos.unshift(newLogo);
      this.saveLogosToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE logos SET is_default = 0
    if (trimmed.toUpperCase().includes("UPDATE LOGOS SET IS_DEFAULT = 0")) {
      this.logos = this.logos.map((l) => ({ ...l, is_default: 0, updated_at: new Date().toISOString() }));
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE logos SET name = ?
    if (trimmed.toUpperCase().includes("UPDATE LOGOS SET NAME =")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.logos = this.logos.map((l) => {
        if (Number(l.id) === targetId) {
          return { ...l, name: bindValues[0] ?? l.name, updated_at: new Date().toISOString() };
        }
        return l;
      });
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE logos SET is_default = 1
    if (trimmed.toUpperCase().includes("UPDATE LOGOS SET IS_DEFAULT = 1")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.logos = this.logos.map((l) => {
        if (Number(l.id) === targetId) {
          return { ...l, is_default: 1, updated_at: new Date().toISOString() };
        }
        return l;
      });
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE logos SET is_archived = 1
    if (trimmed.toUpperCase().includes("UPDATE LOGOS SET IS_ARCHIVED = 1")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.logos = this.logos.map((l) => {
        if (Number(l.id) === targetId) {
          return { ...l, is_archived: 1, is_default: 0, updated_at: new Date().toISOString() };
        }
        return l;
      });
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE logos SET is_archived = 0
    if (trimmed.toUpperCase().includes("UPDATE LOGOS SET IS_ARCHIVED = 0")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.logos = this.logos.map((l) => {
        if (Number(l.id) === targetId) {
          return { ...l, is_archived: 0, updated_at: new Date().toISOString() };
        }
        return l;
      });
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // DELETE FROM logos WHERE id = ?
    if (trimmed.toUpperCase().includes("DELETE FROM LOGOS WHERE ID =")) {
      const targetId = Number(bindValues[0]);
      this.logos = this.logos.filter((l) => Number(l.id) !== targetId);
      this.saveLogosToStorage();
      return { rowsAffected: 1 };
    }

    // INSERT INTO invoice_styles
    if (trimmed.toUpperCase().includes("INSERT INTO INVOICE_STYLES")) {
      const newId = (this.invoiceStyles.length > 0 ? Math.max(...this.invoiceStyles.map((s) => Number(s.id) || 1)) : 0) + 1;
      const newStyle: Record<string, unknown> = {
        id: newId,
        style_key: bindValues[0] ?? `style_${newId}`,
        name: bindValues[1] ?? `Style ${newId}`,
        description: bindValues[2] || null,
        logo_id: bindValues[3] || null,
        primary_color: bindValues[4] ?? "#0047AB",
        header_color: bindValues[5] ?? "#0047AB",
        accent_color: bindValues[6] ?? "#0047AB",
        footer_color: bindValues[7] ?? "#0047AB",
        header_bg_color: bindValues[8] ?? "#0047AB",
        header_text_color: bindValues[9] ?? "#ffffff",
        table_header_bg_color: bindValues[10] ?? "#0047AB",
        table_header_text_color: bindValues[11] ?? "#ffffff",
        footer_bg_color: bindValues[12] ?? "#0047AB",
        footer_text_color: bindValues[13] ?? "#ffffff",
        footer_text: bindValues[14] ?? "Merci de votre confiance.",
        show_ice: bindValues[15] !== undefined ? Number(bindValues[15]) : 1,
        show_tax_id: bindValues[16] !== undefined ? Number(bindValues[16]) : 1,
        show_rc: bindValues[17] !== undefined ? Number(bindValues[17]) : 1,
        show_cnss: bindValues[18] !== undefined ? Number(bindValues[18]) : 0,
        show_iban: bindValues[19] !== undefined ? Number(bindValues[19]) : 1,
        show_phone: bindValues[20] !== undefined ? Number(bindValues[20]) : 1,
        show_email: bindValues[21] !== undefined ? Number(bindValues[21]) : 1,
        show_address: bindValues[22] !== undefined ? Number(bindValues[22]) : 1,
        show_due_date: bindValues[23] !== undefined ? Number(bindValues[23]) : 1,
        is_default: bindValues[24] !== undefined ? Number(bindValues[24]) : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.invoiceStyles.push(newStyle);
      this.saveInvoiceStylesToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    // UPDATE invoice_styles SET is_default = 0
    if (trimmed.toUpperCase().includes("UPDATE INVOICE_STYLES SET IS_DEFAULT = 0")) {
      this.invoiceStyles = this.invoiceStyles.map((s) => ({ ...s, is_default: 0, updated_at: new Date().toISOString() }));
      this.saveInvoiceStylesToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE invoice_styles SET is_default = 1
    if (trimmed.toUpperCase().includes("UPDATE INVOICE_STYLES SET IS_DEFAULT = 1")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.invoiceStyles = this.invoiceStyles.map((s) => {
        if (Number(s.id) === targetId) {
          return { ...s, is_default: 1, updated_at: new Date().toISOString() };
        }
        return s;
      });
      this.saveInvoiceStylesToStorage();
      return { rowsAffected: 1 };
    }

    // UPDATE invoice_styles SET ...
    if (trimmed.toUpperCase().includes("UPDATE INVOICE_STYLES SET")) {
      const targetId = Number(bindValues[bindValues.length - 1]);
      this.invoiceStyles = this.invoiceStyles.map((s) => {
        if (Number(s.id) === targetId) {
          return {
            ...s,
            name: bindValues[0] !== undefined ? String(bindValues[0]) : s.name,
            description: bindValues[1] !== undefined ? bindValues[1] : s.description,
            logo_id: bindValues[2] !== undefined ? bindValues[2] : s.logo_id,
            primary_color: bindValues[3] !== undefined ? String(bindValues[3]) : s.primary_color,
            header_color: bindValues[4] !== undefined ? String(bindValues[4]) : s.header_color,
            accent_color: bindValues[5] !== undefined ? String(bindValues[5]) : s.accent_color,
            footer_color: bindValues[6] !== undefined ? String(bindValues[6]) : s.footer_color,
            header_bg_color: bindValues[7] !== undefined ? String(bindValues[7]) : (s.header_bg_color || "#0047AB"),
            header_text_color: bindValues[8] !== undefined ? String(bindValues[8]) : (s.header_text_color || "#ffffff"),
            table_header_bg_color: bindValues[9] !== undefined ? String(bindValues[9]) : (s.table_header_bg_color || "#0047AB"),
            table_header_text_color: bindValues[10] !== undefined ? String(bindValues[10]) : (s.table_header_text_color || "#ffffff"),
            footer_bg_color: bindValues[11] !== undefined ? String(bindValues[11]) : (s.footer_bg_color || "#0047AB"),
            footer_text_color: bindValues[12] !== undefined ? String(bindValues[12]) : (s.footer_text_color || "#ffffff"),
            footer_text: bindValues[13] !== undefined ? String(bindValues[13]) : s.footer_text,
            show_ice: bindValues[14] !== undefined ? Number(bindValues[14]) : s.show_ice,
            show_tax_id: bindValues[15] !== undefined ? Number(bindValues[15]) : s.show_tax_id,
            show_rc: bindValues[16] !== undefined ? Number(bindValues[16]) : s.show_rc,
            show_cnss: bindValues[17] !== undefined ? Number(bindValues[17]) : s.show_cnss,
            show_iban: bindValues[18] !== undefined ? Number(bindValues[18]) : s.show_iban,
            show_phone: bindValues[19] !== undefined ? Number(bindValues[19]) : s.show_phone,
            show_email: bindValues[20] !== undefined ? Number(bindValues[20]) : s.show_email,
            show_address: bindValues[21] !== undefined ? Number(bindValues[21]) : s.show_address,
            show_due_date: bindValues[22] !== undefined ? Number(bindValues[22]) : (s.show_due_date ?? 1),
            updated_at: new Date().toISOString(),
          };
        }
        return s;
      });
      this.saveInvoiceStylesToStorage();
      return { rowsAffected: 1 };
    }

    // APP_USERS handlers
    if (trimmed.toUpperCase().includes("INSERT INTO APP_USERS")) {
      const newId = this.nextUserId++;
      const newUser = {
        id: newId,
        username: String(bindValues[0] || ""),
        password_hash: String(bindValues[1] || ""),
        must_change_password: typeof bindValues[2] === "number" ? bindValues[2] : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.saveUsersToStorage();
      return { rowsAffected: 1, lastInsertId: newId };
    }

    if (trimmed.toUpperCase().includes("UPDATE APP_USERS")) {
      const targetVal = bindValues[bindValues.length - 1];
      this.users = this.users.map((u) => {
        const matches =
          String(u.username).toLowerCase() === String(targetVal).toLowerCase() ||
          Number(u.id) === Number(targetVal);
        if (matches) {
          const updated: Record<string, unknown> = { ...u, updated_at: new Date().toISOString() };
          if (trimmed.toUpperCase().includes("PASSWORD_HASH =")) {
            updated.password_hash = String(bindValues[0]);
          }
          if (trimmed.toUpperCase().includes("MUST_CHANGE_PASSWORD =")) {
            const mcIdx = trimmed.toUpperCase().includes("PASSWORD_HASH =") ? 1 : 0;
            updated.must_change_password = Number(bindValues[mcIdx]) || 0;
          }
          if (trimmed.toUpperCase().includes("USERNAME =")) {
            updated.username = String(bindValues[0]);
          }
          return updated;
        }
        return u;
      });
      this.saveUsersToStorage();
      return { rowsAffected: 1 };
    }

    return { rowsAffected: 1 };
  }

  async select<T = unknown>(query: string, bindValues: unknown[] = []): Promise<T[]> {
    const trimmed = query.trim().toUpperCase();
    console.log(`[DB Web Client: SELECT] ${trimmed.slice(0, 100)}...`, bindValues);

    if (trimmed.includes("FROM APP_USERS")) {
      let filtered = [...this.users];
      if (trimmed.includes("WHERE USERNAME =") && bindValues.length > 0) {
        const targetName = String(bindValues[0]).toLowerCase();
        filtered = filtered.filter((u) => String(u.username).toLowerCase() === targetName);
      } else if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const targetId = Number(bindValues[0]);
        filtered = filtered.filter((u) => Number(u.id) === targetId);
      }
      return filtered as unknown as T[];
    }

    if (trimmed.includes("PRAGMA FOREIGN_KEYS")) {
      return [{ foreign_keys: 1 }] as unknown as T[];
    }

    if (trimmed.includes("FROM _SCHEMA_MIGRATIONS")) {
      return [...this.appliedMigrations] as unknown as T[];
    }

    if (trimmed.includes("FROM APP_METADATA")) {
      const rows = Array.from(this.metadata.entries()).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));
      return rows as unknown as T[];
    }

    if (trimmed.includes("FROM COMPANY_SETTINGS")) {
      return [{ ...this.companySettings }] as unknown as T[];
    }

    if (trimmed.includes("FROM SERVICES")) {
      let filtered = [...this.services];

      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((s) => Number(s.id) === id);
      } else if (trimmed.includes("IS_ACTIVE = 1")) {
        filtered = filtered.filter((s) => Number(s.is_active) === 1);
      } else if (trimmed.includes("IS_ACTIVE = 0")) {
        filtered = filtered.filter((s) => Number(s.is_active) === 0);
      }

      return filtered as unknown as T[];
    }

    if (trimmed.includes("FROM CLIENTS")) {
      let filtered = [...this.clients];

      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((c) => Number(c.id) === id);
      } else if (trimmed.includes("IS_ACTIVE = 1")) {
        filtered = filtered.filter((c) => Number(c.is_active) === 1);
      } else if (trimmed.includes("IS_ACTIVE = 0")) {
        filtered = filtered.filter((c) => Number(c.is_active) === 0);
      }

      return filtered as unknown as T[];
    }

    // Invoices Aggregate Stats
    if (trimmed.includes("FROM INVOICES") && trimmed.includes("COUNT(ID) AS TOTAL_COUNT")) {
      let draftCount = 0;
      let unpaidCount = 0;
      let paidCount = 0;
      let totalUnpaidBalance = 0;
      let totalPaidRevenue = 0;
      let totalInvoiced = 0;

      for (const inv of this.invoices) {
        const status = String(inv.status || "");
        if (status === "draft") draftCount++;
        if (status === "sent" || status === "partially_paid" || status === "overdue") unpaidCount++;
        if (status === "paid") paidCount++;
        if (status !== "cancelled") {
          totalUnpaidBalance += Number(inv.balance_cents) || 0;
          totalPaidRevenue += Number(inv.paid_amount_cents) || 0;
          totalInvoiced += Number(inv.total_cents) || 0;
        }
      }

      return [
        {
          total_count: this.invoices.length,
          draft_count: draftCount,
          unpaid_count: unpaidCount,
          paid_count: paidCount,
          total_unpaid_balance: totalUnpaidBalance,
          total_paid_revenue: totalPaidRevenue,
          total_invoiced: totalInvoiced,
        },
      ] as unknown as T[];
    }

    // MAX(sequence_number) for invoice sequence
    if (trimmed.includes("FROM INVOICES") && trimmed.includes("MAX(SEQUENCE_NUMBER)")) {
      const year = Number(bindValues[0]) || new Date().getFullYear();
      const prefix = String(bindValues[1] || "FAC");
      const matching = this.invoices.filter(
        (inv) => Number(inv.sequence_year) === year && String(inv.prefix) === prefix
      );
      const maxSeq = matching.length > 0 ? Math.max(...matching.map((inv) => Number(inv.sequence_number) || 0)) : 0;
      return [{ max_seq: maxSeq }] as unknown as T[];
    }

    // Invoices List / Single
    if (trimmed.includes("FROM INVOICES")) {
      let filtered = [...this.invoices];

      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((inv) => Number(inv.id) === id);
      } else if (trimmed.includes("WHERE INVOICE_NUMBER =") && bindValues.length > 0) {
        const num = String(bindValues[0]);
        filtered = filtered.filter((inv) => String(inv.invoice_number) === num);
      } else if (bindValues.length > 0 && trimmed.includes("STATUS = ?")) {
        const status = String(bindValues[0]);
        filtered = filtered.filter((inv) => String(inv.status) === status);
      }

      return filtered as unknown as T[];
    }

    // Invoice Items
    if (trimmed.includes("FROM INVOICE_ITEMS")) {
      let filtered = [...this.invoiceItems];
      if (trimmed.includes("WHERE INVOICE_ID =") && bindValues.length > 0) {
        const invoiceId = Number(bindValues[0]);
        filtered = filtered.filter((item) => Number(item.invoice_id) === invoiceId);
      }
      return filtered as unknown as T[];
    }

    // Payments
    if (trimmed.includes("FROM PAYMENTS")) {
      if (trimmed.includes("SUM(AMOUNT_CENTS)")) {
        const invoiceId = Number(bindValues[0]);
        const invoicePayments = this.payments.filter((p) => Number(p.invoice_id) === invoiceId);
        const sum = invoicePayments.reduce((acc, curr) => acc + (Number(curr.amount_cents) || 0), 0);
        return [{ total_paid: sum }] as unknown as T[];
      }

      let filtered = [...this.payments];
      if (trimmed.includes("WHERE INVOICE_ID =") && bindValues.length > 0) {
        const invoiceId = Number(bindValues[0]);
        filtered = filtered.filter((p) => Number(p.invoice_id) === invoiceId);
      } else if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((p) => Number(p.id) === id);
      }
      return filtered as unknown as T[];
    }

    // MAX(sequence_number) for quotation sequence
    if (trimmed.includes("FROM QUOTATIONS") && trimmed.includes("MAX(SEQUENCE_NUMBER)")) {
      const year = Number(bindValues[0]) || new Date().getFullYear();
      const prefix = String(bindValues[1] || "DEV");
      const matching = this.quotations.filter(
        (q) => Number(q.sequence_year) === year && String(q.prefix) === prefix
      );
      const maxSeq = matching.length > 0 ? Math.max(...matching.map((q) => Number(q.sequence_number) || 0)) : 0;
      return [{ max_seq: maxSeq }] as unknown as T[];
    }

    // Quotations List / Single
    if (trimmed.includes("FROM QUOTATIONS")) {
      let filtered = [...this.quotations];

      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((q) => Number(q.id) === id);
      } else if (trimmed.includes("WHERE QUOTATION_NUMBER =") && bindValues.length > 0) {
        const num = String(bindValues[0]);
        filtered = filtered.filter((q) => String(q.quotation_number) === num);
      } else if (bindValues.length > 0 && trimmed.includes("STATUS = ?")) {
        const status = String(bindValues[0]);
        filtered = filtered.filter((q) => String(q.status) === status);
      }

      return filtered as unknown as T[];
    }

    // Quotation Items
    if (trimmed.includes("FROM QUOTATION_ITEMS")) {
      let filtered = [...this.quotationItems];
      if (trimmed.includes("WHERE QUOTATION_ID =") && bindValues.length > 0) {
        const quotationId = Number(bindValues[0]);
        filtered = filtered.filter((item) => Number(item.quotation_id) === quotationId);
      }
      return filtered as unknown as T[];
    }

    // Logos
    if (trimmed.includes("FROM LOGOS")) {
      let filtered = [...this.logos];
      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((l) => Number(l.id) === id);
      } else if (trimmed.includes("IS_DEFAULT = 1")) {
        filtered = filtered.filter((l) => Number(l.is_default) === 1 && Number(l.is_archived || 0) === 0);
      } else if (trimmed.includes("IS_ARCHIVED = 0")) {
        filtered = filtered.filter((l) => Number(l.is_archived || 0) === 0);
      }
      return filtered as unknown as T[];
    }

    // Invoice Styles
    if (trimmed.includes("FROM INVOICE_STYLES")) {
      let filtered = [...this.invoiceStyles];
      if (trimmed.includes("WHERE ID =") && bindValues.length > 0) {
        const id = Number(bindValues[0]);
        filtered = filtered.filter((s) => Number(s.id) === id);
      } else if (trimmed.includes("STYLE_KEY =") && bindValues.length > 0) {
        const key = String(bindValues[0]);
        filtered = filtered.filter((s) => String(s.style_key) === key);
      } else if (trimmed.includes("IS_DEFAULT = 1")) {
        filtered = filtered.filter((s) => Number(s.is_default) === 1);
      }
      return filtered as unknown as T[];
    }

    return [] as T[];
  }

  async close(): Promise<boolean> {
    return true;
  }
}

/**
 * Native Tauri SQLite client adapter wrapping @tauri-apps/plugin-sql.
 */
class TauriSqliteClient implements DbClient {
  readonly driver: DatabaseDriverType = "tauri-sqlite";

  constructor(private nativeDb: Database) {}

  async execute(query: string, bindValues?: unknown[]): Promise<QueryResult> {
    console.log(`[DB Tauri: EXEC] ${query.slice(0, 120)}...`, bindValues || []);
    try {
      const result = await this.nativeDb.execute(query, (bindValues || []) as unknown[]);
      return {
        rowsAffected: result.rowsAffected,
        lastInsertId: result.lastInsertId,
      };
    } catch (err) {
      console.error("[DB Tauri: EXEC ERROR]", err, { query, bindValues });
      throw err;
    }
  }

  async select<T = unknown>(query: string, bindValues?: unknown[]): Promise<T[]> {
    console.log(`[DB Tauri: SELECT] ${query.slice(0, 120)}...`, bindValues || []);
    try {
      const rows = await this.nativeDb.select<T[]>(query, (bindValues || []) as unknown[]);
      return rows;
    } catch (err) {
      console.error("[DB Tauri: SELECT ERROR]", err, { query, bindValues });
      throw err;
    }
  }

  async close(): Promise<boolean> {
    return await this.nativeDb.close();
  }
}

/**
 * Initializes the SQLite database, verifies foreign keys, and executes all pending migrations.
 */
export async function initDatabase(): Promise<DbClient> {
  if (dbInstance && dbStatus === "ready") {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    dbStatus = "initializing";
    console.log("[DB] Starting database initialization...");

    try {
      let client: DbClient;
      const isTauri = isTauriEnvironment();

      if (isTauri) {
        console.log("[DB] Running under Tauri desktop environment. Loading sqlite:fatora.db...");
        const nativeDb = await Database.load("sqlite:fatora.db");
        client = new TauriSqliteClient(nativeDb);
      } else {
        console.log("[DB] Running outside Tauri runtime. Using offline local SQLite emulator...");
        client = new WebLocalSqliteClient();
      }

      // 1. Enable Foreign Keys
      console.log("[DB] Enabling SQLite foreign key constraints...");
      await client.execute("PRAGMA foreign_keys = ON;");

      // Verify foreign key pragma
      let fkEnabled = true;
      try {
        const fkResult = await client.select<{ foreign_keys: number }>("PRAGMA foreign_keys;");
        if (fkResult && fkResult.length > 0) {
          fkEnabled = fkResult[0].foreign_keys === 1;
        }
      } catch (fkErr) {
        console.warn("[DB] Could not verify PRAGMA foreign_keys value:", fkErr);
      }

      console.log(`[DB] Foreign keys active: ${fkEnabled ? "YES" : "NO"}`);

      // 2. Run Database Migrations
      console.log("[DB] Executing migration check...");
      const migrationSummary: MigrationSummary = await runMigrations(client, MIGRATIONS);

      dbInstance = client;
      dbStatus = "ready";

      dbHealth = {
        status: "ready",
        driver: client.driver,
        isOffline: true,
        foreignKeysEnabled: fkEnabled,
        migrationVersion: migrationSummary.currentVersion,
        totalMigrations: migrationSummary.totalMigrations,
      };

      console.log("[DB] Database initialized successfully!", dbHealth);
      return client;
    } catch (error) {
      dbStatus = "error";
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[DB] Failed to initialize database:", error);

      dbHealth = {
        status: "error",
        driver: isTauriEnvironment() ? "tauri-sqlite" : "web-local-sqlite",
        isOffline: true,
        foreignKeysEnabled: false,
        migrationVersion: 0,
        totalMigrations: MIGRATIONS.length,
        error: errorMsg,
      };

      throw error;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Asynchronously retrieves the active DbClient instance, automatically
 * initializing the database if it has not completed initialization yet.
 */
export async function getDatabaseAsync(): Promise<DbClient> {
  if (dbInstance && dbStatus === "ready") {
    return dbInstance;
  }
  return initDatabase();
}

/**
 * Synchronously retrieves the active DbClient instance.
 * Throws an error if initDatabase() has not completed.
 */
export function getDatabase(): DbClient {
  if (!dbInstance) {
    // If not initialized yet, start initialization in background and throw clear error or return instance if ready
    if (!initPromise && dbStatus === "uninitialized") {
      initDatabase().catch((e) => console.error("[DB] Background init failed:", e));
    }
    throw new Error(
      "Database has not been initialized yet. Ensure initDatabase() is called before database operations."
    );
  }
  return dbInstance;
}

/**
 * Returns current database health and migration status without throwing.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (dbStatus === "uninitialized") {
    try {
      await initDatabase();
    } catch {
      // Error handled in initDatabase
    }
  }
  return dbHealth;
}
