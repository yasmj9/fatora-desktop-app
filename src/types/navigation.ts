export type NavPageId = 
  | "accueil" 
  | "factures" 
  | "devis" 
  | "clients" 
  | "services" 
  | "parametres";

export interface NavItem {
  id: NavPageId;
  label: string;
  description?: string;
}
