import { z } from "zod";

export const clientSchema = z.object({
  // Type de client
  type: z.enum(["individual", "company"]),

  // Informations essentielles (Prioritaires)
  name: z
    .string()
    .trim()
    .min(1, "Le nom ou la raison sociale est obligatoire"),
  phone: z
    .string()
    .trim()
    .min(1, "Le numéro de téléphone est obligatoire pour contacter le client"),

  // Informations complémentaires (Section 'Plus d'informations')
  contact_person: z.string(),
  address: z.string(),
  city: z.string(),
  email: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Veuillez saisir une adresse email valide (ex: client@gmail.com)"
    ),

  // Données juridiques & fiscales (pour entreprises / factures pro)
  ice: z.string(),
  if_tax: z.string(),
  rc: z.string(),

  // Notes & remarques internes
  notes: z.string(),

  // Statut
  is_active: z.number(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
