export type ClientType = "individual" | "company";

export interface Client {
  id: number;
  type: ClientType;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  ice: string;
  if_tax: string;
  rc: string;
  notes: string;
  is_active: number; // 1 = active, 0 = archived
  created_at: string;
  updated_at: string;
}

export type ClientCreateInput = {
  type: ClientType;
  name: string;
  contact_person: string;
  phone: string;
  address: string;
  city: string;
  email: string;
  ice: string;
  if_tax: string;
  rc: string;
  notes: string;
  is_active: number;
};

export type ClientUpdateInput = Partial<ClientCreateInput>;

export const COMMON_MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Fès",
  "Agadir",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan",
  "Salé",
  "Temara",
  "Mohammédia",
  "El Jadida",
  "Nador",
  "Béni Mellal",
  "Safi",
] as const;
