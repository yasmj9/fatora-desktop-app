import React from "react";
import {
  Home,
  FileText,
  ClipboardList,
  Users,
  Wrench,
  Settings,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { NavPageId } from "../../types/navigation";
import { useDatabaseStatus } from "../../context/DatabaseContext";

interface SidebarProps {
  currentPage: NavPageId;
  onNavigate: (page: NavPageId) => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { status } = useDatabaseStatus();

  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen shrink-0 select-none shadow-xs"
    >
      {/* Top Section: App Branding & Logo */}
      <div>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              F
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">
                Fatora
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Facturation & Devis
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5" aria-label="Menu principal">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-left transition-all duration-150 cursor-pointer min-h-[48px] ${
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
                <span className="text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Offline Status & Security */}
      <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-2 mb-1">
          {status === "ready" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                Mode Hors-Ligne Actif
              </span>
            </>
          ) : status === "initializing" ? (
            <>
              <Loader2 size={14} className="text-amber-500 animate-spin" />
              <span className="text-xs font-semibold text-slate-700">
                Initialisation locale...
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={14} className="text-rose-500" />
              <span className="text-xs font-semibold text-rose-700">
                Stockage local hors service
              </span>
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          Vos données restent 100% sur votre ordinateur.
        </p>
      </div>
    </aside>
  );
};
