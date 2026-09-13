import React from "react";
import { NavPageId } from "../../types/navigation";
import { PanelLeftClose, PanelLeftOpen, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface HeaderProps {
  currentPage: NavPageId;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const PAGE_TITLES: Record<NavPageId, { title: string; subtitle: string }> = {
  accueil: {
    title: "Accueil",
    subtitle: "Bienvenue sur votre espace de gestion et facturation",
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

export const Header: React.FC<HeaderProps> = ({ currentPage, isSidebarOpen, onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const currentInfo = PAGE_TITLES[currentPage] || {
    title: "Fatora",
    subtitle: "Gestion de Facturation",
  };

  return (
    <header
      id="app-header"
      className="h-20 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Fermer le menu latéral" : "Ouvrir le menu latéral"}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {currentInfo.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800">{user.username}</span>
            <button
              type="button"
              onClick={logout}
              title="Se déconnecter"
              className="ml-1.5 p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
