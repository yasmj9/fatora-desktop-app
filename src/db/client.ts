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
    updated_at: new Date().toISOString(),
  };
  private services: Array<Record<string, unknown>> = [
    {
      id: 1,
      code: "ELEC-004",
      name_fr: "Installation caméra de surveillance",
      description_fr: "Pose, raccordement et paramétrage d'une caméra IP HD avec accès mobile",
      name_ar: "تركيب كاميرا مراقبة",
      description_ar: "تركيب وربط وبرمجة كاميرا مراقبة مع تطبيق الهاتف",
      name_en: "Security camera installation",
      description_en: "Mounting, wiring, and configuration of HD IP camera with mobile access",
      default_unit: "Unité",
      default_price: 500,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      code: "ELEC-001",
      name_fr: "Diagnostic électrique & Recherche de panne",
      description_fr: "Vérification complète du tableau et des circuits de l'atelier ou du logement",
      name_ar: "تشخيص الأعطال الكهربائية",
      description_ar: "فحص شامل للوحة التوزيع والأسلاك الكهربائية",
      name_en: "Electrical diagnostics & troubleshooting",
      description_en: "Full checkup of electrical panel and circuit continuity",
      default_unit: "Forfait",
      default_price: 350,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      code: "PLOMB-002",
      name_fr: "Remplacement chauffe-eau électrique",
      description_fr: "Dépose de l'ancien appareil, fixation du nouveau et raccordements étanches",
      name_ar: "تغيير سخان الماء الكهربائي",
      description_ar: "إزالة السخان القديم وتثبيت وربط السخان الجديد",
      name_en: "Electric water heater replacement",
      description_en: "Removal of old heater, mounting and leak-tested plumbing connection",
      default_unit: "Forfait",
      default_price: 450,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  private nextServiceId = 4;

  private clients: Array<Record<string, unknown>> = [
    {
      id: 1,
      type: "individual",
      name: "Ahmed Bennani",
      contact_person: "",
      phone: "0661234567",
      address: "25 Bd Zerktouni, Maarif",
      city: "Casablanca",
      email: "ahmed.bennani@gmail.com",
      ice: "",
      if_tax: "",
      rc: "",
      notes: "Client régulier pour travaux électriques et domotique",
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      type: "company",
      name: "BATI-MAROC SARL",
      contact_person: "Karim Idrissi (Gérant)",
      phone: "0522987654",
      address: "Lot 45, Zone Industrielle Sidi Maârouf",
      city: "Casablanca",
      email: "contact@bati-maroc.ma",
      ice: "001234567000089",
      if_tax: "40129876",
      rc: "189452",
      notes: "Paiement à 30 jours par virement bancaire",
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      type: "individual",
      name: "Fatima Zahra Alami",
      contact_person: "",
      phone: "0663456789",
      address: "12 Rue des Orangers, Agdal",
      city: "Rabat",
      email: "fz.alami@yahoo.fr",
      ice: "",
      if_tax: "",
      rc: "",
      notes: "Rénovation plomberie et sanitaire",
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  private nextClientId = 4;

  private invoices: Array<Record<string, unknown>> = [];
  private nextInvoiceId = 1;
  private invoiceItems: Array<Record<string, unknown>> = [];
  private nextInvoiceItemId = 1;
  private payments: Array<Record<string, unknown>> = [];
  private nextPaymentId = 1;

  constructor() {
    console.log("[DB Web Client] Initialized offline browser SQLite fallback adapter.");
    try {
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

    if (trimmed.toUpperCase().includes("PRAGMA FOREIGN_KEYS = ON")) {
      return { rowsAffected: 0 };
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

    return { rowsAffected: 1 };
  }

  async select<T = unknown>(query: string, bindValues: unknown[] = []): Promise<T[]> {
    const trimmed = query.trim().toUpperCase();
    console.log(`[DB Web Client: SELECT] ${trimmed.slice(0, 100)}...`, bindValues);

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
