import React from "react";
import { ClipboardList, Plus, Search } from "lucide-react";

export const DevisPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-devis"
            type="text"
            placeholder="Rechercher un devis (nom de client, numéro...)"
            disabled
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-500 placeholder-slate-400 focus:outline-none cursor-not-allowed opacity-75"
          />
        </div>

        <button
          id="btn-nouveau-devis"
          type="button"
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-xs min-h-[44px]"
        >
          <Plus size={18} />
          <span>+ Nouveau devis</span>
        </button>
      </div>

      {/* Empty State Placeholder Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <ClipboardList size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Aucun devis pour le moment
        </h3>
        <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
          Créez vos devis chiffrés pour vos clients et transformez-les facilement en factures une fois acceptés.
        </p>
        <button
          id="btn-create-first-devis"
          type="button"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer min-h-[44px]"
        >
          Créer mon premier devis
        </button>
      </div>
    </div>
  );
};
