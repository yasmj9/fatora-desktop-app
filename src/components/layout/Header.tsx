import React from "react";
import { NavPageId } from "../../types/navigation";

interface HeaderProps {
  currentPage: NavPageId;
}

const PAGE_TITLES: Record<NavPageId, { title: string; subtitle: string }> = {
  accueil: {
    title: "Accueil",
    subtitle: "Bienvenue sur votre espace de gestion artisanale",
  },
  factures: {
    title: "Factures",
    subtitle: "Consultez, créez et gérez vos factures clients",
  },
  devis: {
    title: "Devis",
    subtitle: "Créez et suivez vos devis et estimations",
  },
  clients: {
    title: "Clients",
    subtitle: "Gérez votre carnet de clients particuliers et professionnels",
  },
  services: {
    title: "Services",
    subtitle: "Catalogue de vos prestations et tarifs habituels",
  },
  parametres: {
    title: "Paramètres",
    subtitle: "Configuration de votre entreprise et personnalisation",
  },
};

export const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const currentInfo = PAGE_TITLES[currentPage] || {
    title: "Fatora",
    subtitle: "Gestion Artisan",
  };

  return (
    <header
      id="app-header"
      className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0"
    >
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {currentInfo.title}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
          Application Locale
        </div>
      </div>
    </header>
  );
};
