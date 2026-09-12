import React from "react";
import { Quotation } from "../../types/quotation";
import { formatMoney } from "../../utils/money";
import { ArrowRight, AlertCircle, FileCheck, X, Sparkles, Loader2 } from "lucide-react";

interface ConvertQuotationModalProps {
  quotation: Quotation;
  isOpen: boolean;
  isConverting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConvertQuotationModal: React.FC<ConvertQuotationModalProps> = ({
  quotation,
  isOpen,
  isConverting,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Convertir en facture</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Devis N° {quotation.quotation_number}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isConverting}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Client :</span>
              <strong className="text-slate-900 font-bold">{quotation.client_name}</strong>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Prestations :</span>
              <strong className="text-slate-900 font-bold">
                {quotation.items?.length || 0} ligne{(quotation.items?.length || 0) > 1 ? "s" : ""}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 font-medium">Montant total TTC :</span>
              <span className="text-base font-extrabold font-mono text-blue-600">
                {formatMoney(quotation.total_cents, quotation.currency || "MAD", true)}
              </span>
            </div>
          </div>

          {/* Transformation Visual Diagram */}
          <div className="flex items-center justify-center gap-3 py-2 bg-blue-50/60 border border-blue-100 rounded-2xl px-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px]">
                {quotation.quotation_number}
              </span>
            </div>
            <ArrowRight size={16} className="text-blue-600 shrink-0 animate-pulse" />
            <div className="flex items-center gap-1.5 text-blue-700">
              <FileCheck size={14} className="text-blue-600" />
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[11px] shadow-2xs">
                FAC-2026-XXXX
              </span>
            </div>
          </div>

          {/* Guarantee / Rules List */}
          <div className="space-y-2 text-xs text-slate-600 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-start gap-2 text-amber-900 font-bold mb-1">
              <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>Conditions de conversion :</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              <li>
                Une <strong>NOUVELLE facture</strong> sera générée avec un numéro officiel distinct.
              </li>
              <li>
                Le devis original <strong>{quotation.quotation_number}</strong> sera conservé intact et son statut passera à <strong>Facturé</strong>.
              </li>
              <li>
                Toutes les prestations, prix, remises et taxes seront fidèlement recopiés.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isConverting}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            id="btn-confirm-convert-quotation"
            onClick={onConfirm}
            disabled={isConverting}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[40px]"
          >
            {isConverting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Conversion en cours...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Convertir en facture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
