import { Migration } from "../types";

/**
 * Migration 007: Invoice Styles Table
 * 
 * Manages presentation configurations (colors, logo assignment, displayed company attributes, footer text)
 * separate from invoice financial/business data.
 * Seeds initial records for Style 1 (Classique) and Style 2 (Moderne).
 */
export const migration007: Migration = {
  id: 7,
  name: "007_invoice_styles",
  up: `
    CREATE TABLE IF NOT EXISTS invoice_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      style_key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      logo_id INTEGER,
      primary_color TEXT NOT NULL DEFAULT '#1e3a8a',
      header_color TEXT NOT NULL DEFAULT '#f8fafc',
      accent_color TEXT NOT NULL DEFAULT '#2563eb',
      footer_color TEXT NOT NULL DEFAULT '#f1f5f9',
      footer_text TEXT NOT NULL DEFAULT 'Merci de votre confiance. Facture à régler à réception.',
      show_ice INTEGER NOT NULL DEFAULT 1,
      show_tax_id INTEGER NOT NULL DEFAULT 1,
      show_rc INTEGER NOT NULL DEFAULT 1,
      show_cnss INTEGER NOT NULL DEFAULT 0,
      show_iban INTEGER NOT NULL DEFAULT 1,
      show_phone INTEGER NOT NULL DEFAULT 1,
      show_email INTEGER NOT NULL DEFAULT 1,
      show_address INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO invoice_styles (
      id, style_key, name, description, logo_id, primary_color, header_color, accent_color, footer_color, footer_text, show_ice, show_tax_id, show_rc, show_cnss, show_iban, show_phone, show_email, show_address, is_default
    ) VALUES (
      1,
      'style_1',
      'Style 1 — Classique',
      'Présentation traditionnelle et structurée avec en-tête encadré et grille de facturation nette.',
      NULL,
      '#1e3a8a',
      '#f8fafc',
      '#2563eb',
      '#f1f5f9',
      'Merci de votre confiance. Facture payable selon les conditions convenues.',
      1, 1, 1, 0, 1, 1, 1, 1,
      1
    );

    INSERT OR IGNORE INTO invoice_styles (
      id, style_key, name, description, logo_id, primary_color, header_color, accent_color, footer_color, footer_text, show_ice, show_tax_id, show_rc, show_cnss, show_iban, show_phone, show_email, show_address, is_default
    ) VALUES (
      2,
      'style_2',
      'Style 2 — Moderne',
      'Style contemporain et épuré mettant en valeur la typographie avec bande latérale d''accentuation.',
      NULL,
      '#0f172a',
      '#ffffff',
      '#0d9488',
      '#f8fafc',
      'Document officiel établi conformément aux réglementations commerciales en vigueur.',
      1, 1, 1, 0, 1, 1, 1, 1,
      0
    );

    INSERT OR IGNORE INTO invoice_styles (
      id, style_key, name, description, logo_id, primary_color, header_color, accent_color, footer_color, footer_text, show_ice, show_tax_id, show_rc, show_cnss, show_iban, show_phone, show_email, show_address, is_default
    ) VALUES (
      3,
      'style_3',
      'Style 3 — Épuré',
      'Design minimaliste axé sur le contraste visuel fort et la clarté maximale des montants.',
      NULL,
      '#334155',
      '#ffffff',
      '#ea580c',
      '#ffffff',
      'Paiement par virement bancaire recommandé avec mention du numéro de facture.',
      1, 1, 1, 0, 1, 1, 1, 1,
      0
    );
  `,
};
