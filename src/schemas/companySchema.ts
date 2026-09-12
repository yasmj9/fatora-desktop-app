import { z } from "zod";

export const companySettingsSchema = z.object({
  // Informations prioritaires pour l'artisan
  name: z
    .string()
    .trim()
    .min(1, "Le nom de votre entreprise ou raison sociale est obligatoire"),
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire pour vos factures"),
  address: z.string(),
  city: z.string(),
  country: z.string(),

  // Contact et présence en ligne
  contact_person: z.string(),
  email: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Veuillez saisir une adresse email valide (ex: contact@atelier.ma)"
    ),
  website: z.string(),

  // Informations juridiques & fiscales (Maroc)
  ice: z.string(),
  if_tax: z.string(),
  rc: z.string(),
  patente: z.string(),
  cnss: z.string(),

  // Informations bancaires pour les paiements
  bank_name: z.string(),
  rib_iban: z.string(),

  // Préférences des documents
  currency: z.string(),
  document_language: z.enum(["fr", "ar", "en"]),
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

