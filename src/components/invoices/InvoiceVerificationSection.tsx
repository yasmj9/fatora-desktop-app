import React from "react";
import {
  User,
  Layers,
  CreditCard,
  Edit3,
  CheckCircle2,
  FileText,
  AlertCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Client } from "../../types/client";
import { DocumentLanguage, PaymentMethod } from "../../types/invoice";
import { DraftInvoiceItem, DraftPaymentState } from "../../types/draftInvoice";
import {
  formatMoney,
  calculateInvoiceFinancials,
  derivePaymentStatus,
} from "../../utils/money";

interface InvoiceVerificationSectionProps {
  client: Client;
  items: DraftInvoiceItem[];
  payment: DraftPaymentState;
  documentLanguage: DocumentLanguage;
  currency: string;
  nextInvoiceNumber?: string;
  isSaving: boolean;
  errorMessage: string | null;
  onEditStep: (step: 1 | 2 | 3) => void;
  onCreateInvoice: () => void;
}

export const InvoiceVerificationSection: React.FC<InvoiceVerificationSectionProps> = ({
  client,
  items,
  payment,
  currency,
  nextInvoiceNumber = "FAC-2026-0001",
  isSaving,
  errorMessage,
  onEditStep,
  onCreateInvoice,
}) => {
  // Financial totals calculation
  const totals = calculateInvoiceFinancials({
    items: items.map((it) => ({
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      discountType: it.discount_type,
      discountRate: it.discount_rate,
      discountAmountCents: it.discount_amount_cents,
      taxRate: it.tax_rate,
    })),
    paidAmountCents: payment.paid_amount_cents,
  });

  const paymentStatus = derivePaymentStatus(
    totals.totalCents,
    payment.paid_amount_cents
  );

  const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: "Espèces",
    bank_transfer: "Virement bancaire",
    check: "Chèque",
    card: "Carte bancaire",
    other: "Autre",
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Vérification avant enregistrement
              </span>
              <span className="bg-blue-200/70 text-blue-900 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono">
                {nextInvoiceNumber}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Récapitulatif de la facture
            </h3>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-white/80 px-3.5 py-2 rounded-xl border border-blue-200 flex items-center gap-2">
          <Sparkles size={15} className="text-blue-600" />
          <span>Vérifiez les données avant la création définitive.</span>
        </div>
      </div>

      {/* Error Message if saving fails */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertCircle size={20} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Client & Payment summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Client Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Client
                </h4>
              </div>
              <button
                type="button"
                id="btn-edit-client-summary"
                onClick={() => onEditStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {client.name}
                </h3>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {client.type === "company" ? "Entreprise" : "Particulier"}
                </span>
              </div>

              {client.phone && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400">Tél :</span> {client.phone}
                </p>
              )}

              {client.address && (
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <span className="text-slate-400">Adresse :</span> {client.address}
                  {client.city ? `, ${client.city}` : ""}
                </p>
              )}

              {client.ice && (
                <p className="text-xs font-mono text-slate-600">
                  <span className="text-slate-400 font-sans">ICE :</span> {client.ice}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 2. Règlement & Statut Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-blue-600" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Règlement
                </h4>
              </div>
              <button
                type="button"
                id="btn-edit-payment-summary"
                onClick={() => onEditStep(3)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Modifier</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Statut du paiement :</span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    paymentStatus.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : paymentStatus.status === "partially_paid"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {paymentStatus.statusLabel}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Mode de paiement :</span>
                <span className="text-xs font-bold text-slate-800">
                  {payment.paid_amount_cents > 0
                    ? paymentMethodLabels[payment.payment_method]
                    : "Non spécifié"}
                </span>
              </div>

              {payment.payment_reference && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Référence :</span>
                  <span className="text-xs font-mono text-slate-700">
                    {payment.payment_reference}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Date :</span>
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  {payment.payment_date || new Date().toISOString().split("T")[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Prestations / Services Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Prestations ({items.length})
            </h4>
          </div>

          <button
            type="button"
            id="btn-edit-items-summary"
            onClick={() => onEditStep(2)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 size={13} />
            <span>Modifier les prestations</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const lineTotalCents = Math.round(
              item.quantity * item.unit_price_cents
            );

            return (
              <div
                key={item.uid || index}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <strong className="text-sm font-bold text-slate-900">
                      {item.name}
                    </strong>
                    {item.unit && (
                      <span className="text-[11px] text-slate-400">
                        ({item.unit})
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 pl-7">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-7 sm:pl-0">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-900 font-mono">
                      {item.quantity}
                    </span>{" "}
                    × {formatMoney(item.unit_price_cents, currency, true)}
                  </div>

                  <div className="text-sm font-bold font-mono text-slate-900 text-right min-w-[100px]">
                    {formatMoney(lineTotalCents, currency, true)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Recap Table Footer */}
        <div className="bg-slate-50/80 p-5 border-t border-slate-200">
          <div className="max-w-xs ml-auto space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Sous-total prestations :</span>
              <span className="font-mono font-bold text-slate-800">
                {formatMoney(totals.subtotalCents, currency, true)}
              </span>
            </div>

            {totals.discountAmountCents > 0 && (
              <div className="flex justify-between text-xs text-emerald-700">
                <span>Remise appliquée :</span>
                <span className="font-mono font-bold">
                  - {formatMoney(totals.discountAmountCents, currency, true)}
                </span>
              </div>
            )}

            {totals.taxAmountCents > 0 && (
              <div className="flex justify-between text-xs text-slate-600">
                <span>TVA :</span>
                <span className="font-mono font-bold text-slate-800">
                  + {formatMoney(totals.taxAmountCents, currency, true)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
              <span className="text-sm font-extrabold uppercase tracking-wide text-slate-900">
                TOTAL :
              </span>
              <span className="text-xl font-extrabold font-mono text-slate-950">
                {formatMoney(totals.totalCents, currency, true)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-blue-800 bg-blue-50/60 p-2 rounded-lg border border-blue-200">
              <span className="font-bold uppercase tracking-wide">PAYÉ :</span>
              <span className="font-bold font-mono text-sm text-blue-950">
                {formatMoney(payment.paid_amount_cents, currency, true)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-amber-900 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
              <span className="font-bold uppercase tracking-wide">RESTE À PAYER :</span>
              <span className="font-bold font-mono text-sm text-amber-950">
                {formatMoney(totals.balanceCents, currency, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actions Bar */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          id="btn-verification-back-step-3"
          onClick={() => onEditStep(3)}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <Edit3 size={16} />
          <span>Modifier</span>
        </button>

        <button
          type="button"
          id="btn-create-invoice-confirm"
          onClick={onCreateInvoice}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl text-base transition-all cursor-pointer shadow-md hover:shadow-lg min-h-[52px]"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création en cours...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              <span>Créer la facture</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
