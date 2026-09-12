import React, { useState } from "react";
import {
  CreditCard,
  X,
  Banknote,
  Building2,
  FileCheck2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { Invoice, PaymentMethod } from "../../types/invoice";
import { formatMoney, toCents, fromCents } from "../../utils/money";

interface AddPaymentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: {
    invoice_id: number;
    amount_cents: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference?: string;
    notes?: string;
  }) => Promise<void>;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "cash", label: "Espèces", icon: <Banknote size={16} /> },
  { id: "bank_transfer", label: "Virement", icon: <Building2 size={16} /> },
  { id: "check", label: "Chèque", icon: <FileCheck2 size={16} /> },
  { id: "card", label: "Carte", icon: <CreditCard size={16} /> },
  { id: "other", label: "Autre", icon: <CreditCard size={16} /> },
];

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  invoice,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const currency = invoice.currency || "MAD";
  const remainingBalanceCents = Math.max(
    0,
    invoice.balance_cents ?? invoice.total_cents - (invoice.paid_amount_cents || 0)
  );

  const [amountStr, setAmountStr] = useState<string>(
    fromCents(remainingBalanceCents).toString()
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAmountChange = (val: string) => {
    setAmountStr(val);
    setError(null);
  };

  const handleApplyPreset = (ratio: number) => {
    const targetCents = Math.round(remainingBalanceCents * ratio);
    setAmountStr(fromCents(targetCents).toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amountStr.replace(",", "."));

    if (isNaN(num) || num <= 0) {
      setError("Veuillez saisir un montant supérieur à 0.");
      return;
    }

    const inputCents = toCents(num);
    if (inputCents > remainingBalanceCents) {
      setError(
        `Le montant saisi dépasse le reste à payer (${formatMoney(
          remainingBalanceCents,
          currency,
          true
        )}).`
      );
      return;
    }

    try {
      await onSubmit({
        invoice_id: invoice.id,
        amount_cents: inputCents,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du paiement."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Ajouter un paiement
              </h3>
              <p className="text-xs text-slate-500">
                Facture <strong className="font-mono text-slate-700">{invoice.invoice_number}</strong> · {invoice.client_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Financial Recap Box */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total</span>
            <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
              {formatMoney(invoice.total_cents, currency, true)}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase">Déjà payé</span>
            <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
              {formatMoney(invoice.paid_amount_cents || 0, currency, true)}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase">Reste</span>
            <div className="text-xs font-mono font-extrabold text-amber-700 mt-0.5">
              {formatMoney(remainingBalanceCents, currency, true)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Montant & Shortcuts */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Montant reçu ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-payment-amount"
                type="text"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {currency}
              </span>
            </div>

            {/* Shortcut Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleApplyPreset(1)}
                className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                Solde total ({formatMoney(remainingBalanceCents, currency, true)})
              </button>
              {remainingBalanceCents > 100 && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset(0.5)}
                  className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  50% ({formatMoney(Math.round(remainingBalanceCents * 0.5), currency, true)})
                </button>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Mode de paiement
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    paymentMethod === method.id
                      ? "bg-blue-50 border-blue-600 text-blue-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className={paymentMethod === method.id ? "text-blue-600" : "text-slate-400"}>
                    {method.icon}
                  </span>
                  <span>{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Date de paiement
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
                <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                N° de référence / chèque
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: CHQ-48201 / VIR-901"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-600">
              Remarques (optionnel)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acompte remis en mains propres"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-submit-add-payment"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer le paiement</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
