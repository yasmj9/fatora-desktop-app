import { z } from "zod";

export const serviceSchema = z.object({
  // Référence optionnelle
  code: z.string(),

  // Français (Langue principale visible)
  name_fr: z
    .string()
    .trim()
    .min(1, "Le nom du service en français est obligatoire"),
  description_fr: z.string(),

  // Traductions (Secondaires / Facultatives)
  name_ar: z.string(),
  description_ar: z.string(),
  name_en: z.string(),
  description_en: z.string(),

  // Unité et Prix
  default_unit: z.string().trim().min(1, "L'unité par défaut est requise"),
  default_price: z.number().min(0, "Le prix par défaut ne peut pas être négatif"),

  // Statut
  is_active: z.number(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;
