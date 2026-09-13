import React from "react";
import {
  Home,
  FileText,
  ClipboardList,
  Users,
  Wrench,
  Settings,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { NavPageId } from "../../types/navigation";
import { useDatabaseStatus } from "../../context/DatabaseContext";

interface SidebarProps {
  currentPage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: NavPageId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: "accueil",
    label: "Accueil",
    icon: Home,
  },
  {
    id: "factures",
    label: "Factures",
    icon: FileText,
  },
  {
    id: "devis",
    label: "Devis",
    icon: ClipboardList,
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
  },
  {
    id: "services",
    label: "Services",
    icon: Wrench,
  },
  {
    id: "parametres",
    label: "Paramètres",
    icon: Settings,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onToggle }) => {
  const { status } = useDatabaseStatus();

  return (
    <aside
      id="main-sidebar"
      className={`${
        isOpen ? "w-64" : "w-20"
      } bg-white border-r border-slate-200 flex flex-col justify-between h-screen shrink-0 select-none shadow-md lg:shadow-xs z-30 transition-all duration-300 ease-in-out`}
    >
      {/* Top Section: App Branding & Logo / Toggle */}
      <div>
        <div 
          className={`p-4 border-b border-slate-100 flex items-center ${isOpen ? "justify-start cursor-pointer hover:bg-slate-50 transition-colors" : "justify-center"}`}
          onClick={() => {
            if (isOpen) onToggle();
          }}
          title={isOpen ? "Réduire le menu" : undefined}
        >
          {isOpen ? (
            <div className="flex items-center gap-3 overflow-hidden w-full">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs shrink-0">
                <img
                  src="./logo.svg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "./logo.png";
                  }}
                  alt="Fatora"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="truncate flex-1">
                <h1 className="font-bold text-lg text-slate-900 leading-tight truncate">
                  Fatora
                </h1>
                <p className="text-xs text-slate-500 font-medium truncate">
                  Facturation & Devis
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title="Ouvrir le menu"
            >
              <img
                src="./logo.svg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "./logo.png";
                }}
                alt="Fatora"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5" aria-label="Menu principal">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                type="button"
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center ${
                  isOpen ? "gap-3 px-4 py-3" : "justify-center px-0 py-3"
                } rounded-xl font-medium text-left transition-all duration-150 cursor-pointer min-h-[48px] ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
                }`}
              >
                <Icon
                  size={20}
                  className={`shrink-0 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                />
                {isOpen && <span className="text-sm tracking-wide truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Offline Status & Security */}
      <div className={`p-3 m-3 rounded-xl bg-slate-50 border border-slate-200/80 ${!isOpen ? "flex flex-col items-center justify-center text-center" : ""}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {status === "ready" ? (
            <div title="Mode Hors-Ligne Actif">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0"></span>
            </div>
          ) : status === "initializing" ? (
            <div title="Initialisation...">
              <Loader2 size={14} className="text-amber-500 animate-spin shrink-0" />
            </div>
          ) : (
            <div title="Erreur stockage">
              <AlertCircle size={14} className="text-rose-500 shrink-0" />
            </div>
          )}
          {isOpen && (
            <span className="text-xs font-semibold text-slate-700 truncate">
              {status === "ready" ? "Hors-Ligne Actif" : status === "initializing" ? "Init..." : "Erreur"}
            </span>
          )}
        </div>
        {isOpen && (
          <p className="text-[11px] text-slate-500 leading-normal truncate">
            Données 100% locales
          </p>
        )}
      </div>
    </aside>
  );
};
