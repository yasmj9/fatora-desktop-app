import { CompanySettings } from "../../types/company";

export const sampleCompany: CompanySettings = {
  name: "ÉLECTRO & TRAVAUX MAROC S.A.R.L.",
  contact_person: "M. Youssef Bennani",
  address: "124, Boulevard Zerktouni, 3ème étage",
  city: "Casablanca",
  country: "Maroc",
  phone: "+212 5 22 33 44 55",
  email: "contact@electrotravaux.ma",
  website: "www.electrotravaux.ma",
  ice: "002849201000045",
  if_tax: "40283921",
  rc: "182940",
  patente: "3492810",
  cnss: "9823410",
  bank_name: "Attijariwafa Bank",
  rib_iban: "240 780 0000123456789012 45",
  currency: "MAD",
  document_language: "fr",
};

export const sampleInvoiceData = {
  number: "FAC-2026-0024",
  date: "12/09/2026",
  dueDate: "12/10/2026",
  clientName: "SOCIÉTÉ D'AMÉNAGEMENT DU GRAND CASABLANCA",
  clientIce: "001928374000088",
  clientAddress: "Angle Bd Anfa & Rue Molière, Casablanca",
  clientPhone: "+212 6 61 00 11 22",
  items: [
    {
      description: "Fourniture et pose de câblage armé triphasé 4x16mm²",
      quantity: 120,
      unitPriceCents: 8500, // 85.00 MAD
      totalCents: 1020000,  // 10 200.00 MAD
    },
    {
      description: "Installation et raccordement armoire électrique de distribution",
      quantity: 1,
      unitPriceCents: 450000, // 4 500.00 MAD
      totalCents: 450000,    // 4 500.00 MAD
    },
    {
      description: "Essais, mise en service et rapport de conformité technique",
      quantity: 1,
      unitPriceCents: 150000, // 1 500.00 MAD
      totalCents: 150000,    // 1 500.00 MAD
    },
  ],
  subtotalCents: 1620000, // 16 200.00 MAD
  taxRate: 20,
  taxAmountCents: 324000, // 3 240.00 MAD
  totalCents: 1944000,    // 19 440.00 MAD
  paidCents: 500000,      // 5 000.00 MAD
  balanceCents: 1444000,  // 14 440.00 MAD
  status: "partially_paid",
};
