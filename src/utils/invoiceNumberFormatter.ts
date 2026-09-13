export interface FormatInvoiceNumberOptions {
  prefix?: string;
  pattern?: string;
  sequenceNumber: number;
  year?: number;
  padding?: number;
}

export interface NumberingPreset {
  id: string;
  name: string;
  prefix: string;
  pattern: string;
  padding: number;
  description: string;
  example: string;
}

export const NUMBERING_PRESETS: NumberingPreset[] = [
  {
    id: "seq_slash_year",
    name: "001/2026 (Séquence / Année)",
    prefix: "",
    pattern: "{SEQ}/{YEAR}",
    padding: 3,
    description: "Format simple et épuré avec séquence sur 3 chiffres et année en cours.",
    example: "001/2026",
  },
  {
    id: "fact_seq_year",
    name: "FACT-00001-2026 (Préfixe - Séquence - Année)",
    prefix: "FACT",
    pattern: "{PREFIX}-{SEQ}-{YEAR}",
    padding: 5,
    description: "Format d'entreprise complet avec préfixe FACT, séquence 5 chiffres et année.",
    example: "FACT-00001-2026",
  },
  {
    id: "fac_year_seq_4",
    name: "FAC-2026-0001 (Standard Maroc)",
    prefix: "FAC",
    pattern: "{PREFIX}-{YEAR}-{SEQ}",
    padding: 4,
    description: "Format standard marocain le plus répandu.",
    example: "FAC-2026-0001",
  },
  {
    id: "f_year_seq_3",
    name: "F-2026-001 (Compact)",
    prefix: "F",
    pattern: "{PREFIX}-{YEAR}-{SEQ}",
    padding: 3,
    description: "Format concis avec préfixe F et séquence sur 3 chiffres.",
    example: "F-2026-001",
  },
  {
    id: "year_seq",
    name: "2026-001 (Année - Séquence)",
    prefix: "",
    pattern: "{YEAR}-{SEQ}",
    padding: 3,
    description: "Format chronologique basé sur l'année sans préfixe textuel.",
    example: "2026-001",
  },
  {
    id: "fac_slash_year_slash_seq",
    name: "FAC/2026/001 (Séparateur barre oblique)",
    prefix: "FAC",
    pattern: "{PREFIX}/{YEAR}/{SEQ}",
    padding: 3,
    description: "Format avec séparateurs obliques (/)",
    example: "FAC/2026/001",
  },
];

/**
 * Formats an invoice number based on a customizable pattern and parameters.
 * Placeholders supported:
 * - {PREFIX} -> e.g. "FACT", "FAC", "F"
 * - {YEAR} or {YYYY} -> 4-digit year e.g. "2026"
 * - {YY} -> 2-digit year e.g. "26"
 * - {SEQ} or {NUM} -> Padded sequence number e.g. "001", "00001", "0001"
 */
export function formatInvoiceNumber({
  prefix = "FAC",
  pattern = "{PREFIX}-{YEAR}-{SEQ}",
  sequenceNumber = 1,
  year = new Date().getFullYear(),
  padding = 4,
}: FormatInvoiceNumberOptions): string {
  const effectivePadding = Math.max(1, Math.min(8, Number(padding) || 4));
  const safeSeq = Math.max(1, Number(sequenceNumber) || 1);
  const formattedSeq = String(safeSeq).padStart(effectivePadding, "0");
  const cleanPrefix = (prefix || "").trim();
  const currentYear = year || new Date().getFullYear();
  const fullYear = String(currentYear);
  const shortYear = fullYear.slice(-2);

  let formatted = (pattern || "{PREFIX}-{YEAR}-{SEQ}").trim();

  // Replace placeholders (case-insensitive)
  formatted = formatted
    .replace(/\{PREFIX\}/gi, cleanPrefix)
    .replace(/\{YYYY\}/gi, fullYear)
    .replace(/\{YEAR\}/gi, fullYear)
    .replace(/\{YY\}/gi, shortYear)
    .replace(/\{SEQ\}/gi, formattedSeq)
    .replace(/\{NUM\}/gi, formattedSeq);

  // If cleanPrefix was empty and pattern started with prefix separator like "-2026-0001", clean leading separator
  if (!cleanPrefix) {
    formatted = formatted.replace(/^[-/_.]+/, "");
  }

  return formatted;
}
