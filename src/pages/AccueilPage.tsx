import React from "react";
import {
  FileText,
  ClipboardList,
  Users,
  Wrench,
  Plus,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Wallet,
  Clock,
  Sparkles,
} from "lucide-react";
import { NavPageId } from "../types/navigation";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { useClients } from "../hooks/useClients";
import { useServices } from "../hooks/useServices";
import { useInvoices } from "../hooks/useInvoices";
import { formatMoney } from "../utils/money";

interface AccueilPageProps {
  onNavigate: (page: NavPageId) => void;
}

export const AccueilPage: React.FC<AccueilPageProps> = ({ onNavigate }) => {
  const { settings } = useCompanySettings();
  const { clients } = useClients("active");
  const { services } = useServices("active");
  const { invoices, stats } = useInvoices("all");

  const isConfigured = Boolean(settings.name && settings.phone);
  const currency = settings.currency || "MAD";

  // Formatted current date in French
  const todayFormatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const recentInvoices = invoices.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-7">
      {/* 1. Header / Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                Espace Artisan
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {settings.name ? `Bonjour, ${settings.name}` : "Bonjour et bienvenue"}
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Gérez vos devis, factures et clients simplement, 100% hors-ligne.
            </p>
          </div>

          {/* Company configuration prompt or confirmed badge */}
          {!isConfigured ? (
            <button
              type="button"
              id="btn-accueil-configurer-entreprise"
              onClick={() => onNavigate("parametres")}
              className="flex items-center gap-3.5 p-4 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 rounded-2xl text-left cursor-pointer transition-colors shrink-0 max-w-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 size={22} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">
                  Renseignez vos coordonnées
                </h4>
                <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                  Nom et téléphone pour qu'ils apparaissent sur vos factures.
                </p>
              </div>
              <ChevronRight size={18} className="text-amber-700 shrink-0" />
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl shrink-0">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Entreprise configurée</p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {settings.phone || "Prêt pour la facturation"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Large Obvious Actions: + Nouvelle facture & + Nouveau devis */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-0.5">
          Actions principales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Action 1: + Nouvelle facture */}
          <button
            id="btn-accueil-nouvelle-facture"
            onClick={() => onNavigate("factures")}
            type="button"
            className="flex items-center gap-4 p-5 sm:p-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left cursor-pointer group min-h-[96px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Plus size={20} className="shrink-0" />
                  <span>Nouvelle facture</span>
                </h3>
                <ArrowRight
                  size={20}
                  className="text-blue-200 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-snug">
                Créer et éditer une facture pour un client
              </p>
            </div>
          </button>

          {/* Action 2: + Nouveau devis */}
          <button
            id="btn-accueil-nouveau-devis"
            onClick={() => onNavigate("devis")}
            type="button"
            className="flex items-center gap-4 p-5 sm:p-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left cursor-pointer group min-h-[96px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList size={28} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Plus size={20} className="shrink-0" />
                  <span>Nouveau devis</span>
                </h3>
                <ArrowRight
                  size={20}
                  className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                />
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-snug">
                Préparer une proposition chiffrée ou une estimation
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Easy Access to Clients, Services, Factures, Devis */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-0.5">
          Accès directs
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Factures */}
          <button
            id="quick-link-factures"
            onClick={() => onNavigate("factures")}
            type="button"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                Factures
              </h4>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Consulter l'historique
            </p>
          </button>

          {/* Devis */}
          <button
            id="quick-link-devis"
            onClick={() => onNavigate("devis")}
            type="button"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ClipboardList size={20} />
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                Devis
              </h4>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Suivi des estimations
            </p>
          </button>

          {/* Clients with real count */}
          <button
            id="quick-link-clients"
            onClick={() => onNavigate("clients")}
            type="button"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users size={20} />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {clients.length} {clients.length <= 1 ? "client" : "clients"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                Clients
              </h4>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Carnet de contacts
            </p>
          </button>

          {/* Services with real count */}
          <button
            id="quick-link-services"
            onClick={() => onNavigate("services")}
            type="button"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wrench size={20} />
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                {services.length} {services.length <= 1 ? "service" : "services"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                Services
              </h4>
              <ArrowRight size={15} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Catalogue de tarifs
            </p>
          </button>
        </div>
      </div>

      {/* 4. Small Amount of Useful Information & Honest Simple Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unpaid Balance Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  stats.totalUnpaidBalanceCents === 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
                    : "text-amber-700 bg-amber-50 border-amber-200/70"
                }`}
              >
                {stats.totalUnpaidBalanceCents === 0 ? "À jour" : "À encaisser"}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Montant restant à encaisser
            </h3>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 font-mono">
              {formatMoney(stats.totalUnpaidBalanceCents, currency, true)}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {stats.totalUnpaidBalanceCents === 0
                ? "Aucun paiement en attente. Vos règlements sont à jour."
                : `${stats.unpaidCount} facture(s) avec solde restant à percevoir.`}
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Règlements & Impayés</span>
            <span className="font-semibold text-slate-600">
              {stats.unpaidCount} facture{stats.unpaidCount > 1 ? "s" : ""} impayée{stats.unpaidCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Recent Invoices Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Dernières factures
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("factures")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Voir tout
              </button>
            </div>

            {/* List or Simple Honest Empty State */}
            {recentInvoices.length > 0 ? (
              <div className="space-y-2.5">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onNavigate("factures")}
                    className="p-3 bg-slate-50/80 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {inv.invoice_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "partially_paid"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {inv.status === "paid"
                            ? "Payée"
                            : inv.status === "partially_paid"
                            ? "Partielle"
                            : "En cours"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {inv.client_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {formatMoney(inv.total_cents, currency, true)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {inv.invoice_date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 p-4">
                <Clock size={24} className="text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Aucune facture émise
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-3">
                  Vos prochaines factures s'afficheront ici avec leurs montants et dates.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("factures")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Créer une facture</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">
              {recentInvoices.length > 0
                ? `${stats.totalInvoicesCount} facture(s) enregistrée(s)`
                : "Prêt pour votre première facture"}
            </span>
          </div>
        </div>

        {/* Recent Quotations Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList size={18} className="text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Derniers devis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("devis")}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Voir tout
              </button>
            </div>

            {/* Simple Honest Empty State */}
            <div className="py-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 p-4">
              <Clock size={24} className="text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 mb-1">
                Aucun devis en attente
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-3">
                Vos propositions chiffrées et estimations apparaîtront ici.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("devis")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-purple-400 hover:text-purple-700 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Créer un devis</span>
              </button>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-400">
              Estimations et chiffrages
            </span>
          </div>
        </div>
      </div>

      {/* 5. Guide de démarrage simple pour artisan */}
      <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-blue-600 shrink-0" />
          <h3 className="font-bold text-slate-900 text-sm">
            Conseils pour bien démarrer
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">
                Vos coordonnées
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Renseignez votre nom, ville et téléphone dans <strong>Paramètres</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">
                Tarifs et Clients
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Ajoutez vos prestations fréquentes et vos contacts pour remplir vos factures en 1 clic.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900">
                Facturez sereinement
              </h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Créez vos documents et imprimez-les directement, même sans internet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



