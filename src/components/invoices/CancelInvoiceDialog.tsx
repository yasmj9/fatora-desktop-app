import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { Invoice } from "../../types/invoice";
import { formatMoney } from "../../utils/money";

interface CancelInvoiceDialogProps {
  invoice: Invoice;
  isOpen: boolean;
  isCancelling: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export const CancelInvoiceDialog: React.FC<CancelInvoiceDialogProps> = ({
  invoice,
  isOpen,
  isCancelling,
  onClose,
  onConfirmCancel,
}) => {
  if (!isOpen) return null;

  const currency = invoice.currency || "MAD";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Voulez-vous vraiment annuler cette facture ?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cette action marquera la facture comme annulée tout en préservant son historique.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Numéro :</span>
            <span className="font-mono font-bold text-slate-900">
              {invoice.invoice_number}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Client :</span>
            <span className="font-bold text-slate-900">
              {invoice.client_name}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Montant total :</span>
            <span className="font-mono font-extrabold text-slate-900">
              {formatMoney(invoice.total_cents, currency, true)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            id="btn-cancel-dialog-retour"
            onClick={onClose}
            disabled={isCancelling}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            Retour
          </button>
          <button
            type="button"
            id="btn-confirm-annuler-facture"
            onClick={onConfirmCancel}
            disabled={isCancelling}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCancelling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Annulation en cours...</span>
              </>
            ) : (
              <span>Annuler la facture</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
