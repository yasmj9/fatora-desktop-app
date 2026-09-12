export interface Service {
  id: number;
  code: string;
  name_fr: string;
  description_fr: string;
  name_ar: string;
  description_ar: string;
  name_en: string;
  description_en: string;
  default_unit: string;
  default_price: number;
  is_active: number; // 1 = active, 0 = archived
  created_at: string;
  updated_at: string;
}

export type ServiceCreateInput = {
  code: string;
  name_fr: string;
  description_fr: string;
  name_ar: string;
  description_ar: string;
  name_en: string;
  description_en: string;
  default_unit: string;
  default_price: number;
  is_active: number;
};

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

export const COMMON_SERVICE_UNITS = [
  "Unité",
  "Forfait",
  "Heure",
  "Jour",
  "m²",
  "mètre",
  "Pièce",
  "Lot",
  "kg",
] as const;
