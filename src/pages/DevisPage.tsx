import React, { useState } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Eye,
  Sparkles,
  X,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Quotation, QuotationStatus, QuotationCreateInput } from "../types/quotation";
import { useQuotations } from "../hooks/useQuotations";
import { QuotationStatusBadge } from "../components/quotations/QuotationStatusBadge";
import { QuotationDetailView } from "../components/quotations/QuotationDetailView";
import { ConvertQuotationModal } from "../components/quotations/ConvertQuotationModal";
import { QuotationFormModal } from "../components/quotations/QuotationFormModal";
import { formatMoney } from "../utils/money";

interface DevisPageProps {
  onNavigateToInvoice?: (invoiceId: number) => void;
}

const STATUS_FILTERS: { id: "all" | QuotationStatus; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "draft", label: "Brouillons" },
  { id: "sent", label: "Envoyés" },
  { id: "accepted", label: "Acceptés" },
  { id: "rejected", label: "Refusés" },
  { id: "invoiced", label: "Facturés" },
];

export const DevisPage: React.FC<DevisPageProps> = ({ onNavigateToInvoice }) => {
  const {
    quotations,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionSuccess,
    error,
    clearMessages,
    createQuotation,
    convertToInvoice,
  } = useQuotations("all");

  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);

  // Convert Modal state
  const [convertModalQuotation, setConvertModalQuotation] = useState<Quotation | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [lastConvertedInvoiceId, setLastConvertedInvoiceId] = useState<number | null>(null);

  // New Quotation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleOpenDetail = (id: number) => {
    setSelectedQuotationId(id);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedQuotationId(null);
    setViewMode("list");
  };

  const handleCreateQuotation = async (input: QuotationCreateInput): Promise<boolean> => {
    const created = await createQuotation(input);
    return !!created;
  };

  const handleConfirmConvert = async () => {
    if (!convertModalQuotation) return;
    setIsConverting(true);
    try {
      const invoice = await convertToInvoice(convertModalQuotation.id);
      if (invoice) {
        setLastConvertedInvoiceId(invoice.id);
        setConvertModalQuotation(null);
      }
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Global Toast Messages */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastConvertedInvoiceId && onNavigateToInvoice && (
              <button
                type="button"
                id="btn-goto-invoice-toast"
                onClick={() => onNavigateToInvoice(lastConvertedInvoiceId)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Ouvrir la facture ›
              </button>
            )}
            <button
              type="button"
              onClick={clearMessages}
              className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW 1: DETAIL VIEW */}
      {viewMode === "detail" && selectedQuotationId ? (
        <QuotationDetailView
          quotationId={selectedQuotationId}
          onBack={handleBackToList}
          onNavigateToInvoice={onNavigateToInvoice}
        />
      ) : (
        /* VIEW 2: QUOTATIONS LIST VIEW */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Devis & Estimations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Créez vos devis et convertissez-les en factures en un clic.
              </p>
            </div>

            <button
              id="btn-nouveau-devis"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[44px]"
            >
              <Plus size={18} />
              <span>Nouveau devis</span>
            </button>
          </div>

          {/* Search Bar & Filter Tabs */}
          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="search-devis"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par numéro de devis (DEV-2026...), client ou téléphone..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  id={`filter-devis-status-${f.id}`}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === f.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quotation Table */}
          {isLoading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Chargement des devis...</p>
            </div>
          ) : quotations.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 sm:px-6">N° Devis</th>
                      <th className="py-3.5 px-4 sm:px-6">Client</th>
                      <th className="py-3.5 px-4 sm:px-6">Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Montant TTC</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Statut</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {quotations.map((q) => {
                      const isInvoiced = q.status === "invoiced";

                      return (
                        <tr
                          key={q.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDetail(q.id)}
                        >
                          {/* N° Devis */}
                          <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                            <span className="text-blue-600 group-hover:underline">
                              {q.quotation_number}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-bold text-slate-900 text-sm">
                              {q.client_name}
                            </div>
                            {q.client_phone && (
                              <div className="text-slate-400 text-[11px] mt-0.5">
                                {q.client_phone}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 sm:px-6 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{q.quotation_date}</span>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-4 px-4 sm:px-6 text-right font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                            {formatMoney(q.total_cents, q.currency || "MAD", true)}
                          </td>

                          {/* Statut */}
                          <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                            <QuotationStatusBadge status={q.status} size="sm" />
                          </td>

                          {/* Actions */}
                          <td
                            className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Voir Button */}
                              <button
                                type="button"
                                id={`btn-view-devis-${q.id}`}
                                onClick={() => handleOpenDetail(q.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Eye size={13} className="text-slate-500" />
                                <span>Voir</span>
                              </button>

                              {/* Convertir en facture Button */}
                              {!isInvoiced ? (
                                <button
                                  type="button"
                                  id={`btn-convert-devis-${q.id}`}
                                  onClick={() => setConvertModalQuotation(q)}
                                  title="Convertir ce devis en facture"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Sparkles size={13} />
                                  <span>Convertir en facture</span>
                                </button>
                              ) : (
                                q.converted_invoice_id && onNavigateToInvoice && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToInvoice(q.converted_invoice_id!)}
                                    title="Voir la facture associée"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    <span>Voir facture ›</span>
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {quotations.length} devis trouvé{quotations.length > 1 ? "s" : ""}
                </span>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Afficher tous les devis
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ClipboardList size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchQuery || statusFilter !== "all"
                  ? "Aucun devis ne correspond à votre recherche"
                  : "Aucun devis pour le moment"}
              </h3>
              <p className="text-slate-500 text-xs max-w-md mb-6 leading-relaxed">
                {searchQuery || statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de statut ou le texte de recherche."
                  : "Créez vos devis chiffrés pour vos clients et transformez-les facilement en factures une fois acceptés."}
              </p>

              {searchQuery || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  id="btn-create-first-devis"
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer min-h-[44px] shadow-sm hover:shadow-md"
                >
                  Créer mon premier devis
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Convert Quotation Modal */}
      {convertModalQuotation && (
        <ConvertQuotationModal
          quotation={convertModalQuotation}
          isOpen={!!convertModalQuotation}
          isConverting={isConverting}
          onClose={() => setConvertModalQuotation(null)}
          onConfirm={handleConfirmConvert}
        />
      )}

      {/* Create New Quotation Modal */}
      {isCreateModalOpen && (
        <QuotationFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateQuotation}
        />
      )}
    </div>
  );
};
