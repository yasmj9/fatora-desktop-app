import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  User,
  Layers,
  FileText,
  AlertTriangle,
  Plus,
  Clock,
  Printer,
  FileDown,
  Info,
} from "lucide-react";
import { Invoice, PaymentMethod } from "../../types/invoice";
import { invoiceRepository } from "../../db/repositories/invoiceRepository";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney } from "../../utils/money";

interface InvoiceDetailViewProps {
  invoiceId: number;
  onBack: () => void;
  onOpenAddPayment: (invoice: Invoice) => void;
  onOpenCancelDialog: (invoice: Invoice) => void;
  onRefreshList: () => void;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  bank_transfer: "Virement bancaire",
  check: "Chèque",
  card: "Carte bancaire",
  other: "Autre",
};

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoiceId,
  onBack,
  onOpenAddPayment,
  onOpenCancelDialog,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    setIsLoading(true);
    try {
      const data = await invoiceRepository.getInvoiceById(invoiceId);
      if (data) {
        setInvoice(data);
      } else {
        setError("Facture introuvable.");
      }
    } catch (err: unknown) {
      console.error("Error loading invoice:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Chargement de la facture...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          {error || "Facture introuvable"}
        </h3>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Retour à la liste</span>
        </button>
      </div>
    );
  }

  const currency = invoice.currency || "MAD";
  const canAddPayment =
    invoice.status !== "cancelled" &&
    invoice.status !== "paid" &&
    (invoice.balance_cents ?? invoice.total_cents) > 0;
  const canCancel = invoice.status !== "cancelled";

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          id="btn-detail-back"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer w-fit py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
          <span>Retour aux factures</span>
        </button>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canAddPayment && (
            <button
              type="button"
              id="btn-detail-add-payment"
              onClick={() => onOpenAddPayment(invoice)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs min-h-[38px]"
            >
              <Plus size={16} />
              <span>Ajouter un paiement</span>
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              id="btn-detail-cancel-invoice"
              onClick={() => onOpenCancelDialog(invoice)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <AlertTriangle size={15} />
              <span>Annuler la facture</span>
            </button>
          )}
        </div>
      </div>

      {/* Invoice Main Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {invoice.invoice_number}
                </h2>
                <InvoiceStatusBadge status={invoice.status} size="md" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Langue : {invoice.language === "ar" ? "Arabe" : invoice.language === "en" ? "Anglais" : "Français"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total TTC
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {formatMoney(invoice.total_cents, currency, true)}
            </div>
          </div>
        </div>

        {/* 2-Column: Client & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Client Card */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client facturé
                </h4>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                {invoice.client_type === "company" ? "Entreprise" : "Particulier"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900">
                {invoice.client_name}
              </div>

              {invoice.client_contact_person && (
                <p className="text-xs text-slate-600">
                  Contact : <strong className="text-slate-800">{invoice.client_contact_person}</strong>
                </p>
              )}

              {invoice.client_phone && (
                <p className="text-xs text-slate-600">
                  Téléphone : <strong className="text-slate-800">{invoice.client_phone}</strong>
                </p>
              )}

              {invoice.client_email && (
                <p className="text-xs text-slate-600">
                  Email : {invoice.client_email}
                </p>
              )}

              {invoice.client_address && (
                <p className="text-xs text-slate-600">
                  Adresse : {invoice.client_address}
                  {invoice.client_city ? `, ${invoice.client_city}` : ""}
                </p>
              )}

              {invoice.client_ice && (
                <p className="text-xs font-mono text-slate-700 pt-1">
                  <span className="font-sans text-slate-500">ICE :</span> {invoice.client_ice}
                </p>
              )}
            </div>
          </div>

          {/* Dates & Financial Status Card */}
          <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Dates & Modalités
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">Date d'émission</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {invoice.invoice_date}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                  <span className="text-[11px] text-slate-400 font-medium">Date d'échéance</span>
                  <div className="font-bold text-slate-800 text-sm">
                    {invoice.due_date || "Non spécifiée"}
                  </div>
                </div>
              </div>

              {invoice.payment_terms && (
                <p className="text-xs text-slate-600">
                  <span className="text-slate-400 font-medium">Conditions :</span>{" "}
                  {invoice.payment_terms}
                </p>
              )}
            </div>

            {/* Balances */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Payé :</span>
                <div className="text-sm font-bold font-mono text-emerald-700">
                  {formatMoney(invoice.paid_amount_cents || 0, currency, true)}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Reste à payer :</span>
                <div className="text-sm font-bold font-mono text-amber-700">
                  {formatMoney(invoice.balance_cents ?? invoice.total_cents, currency, true)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prestations / Items Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Prestations et Services ({invoice.items?.length || 0})
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Unité</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">Prix unit.</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{it.name}</div>
                          {it.description && (
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              {it.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {it.unit || "U"}
                        </td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                          {it.quantity}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatMoney(it.unit_price_cents, currency, true)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatMoney(it.total_cents, currency, true)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400">
                        Aucune prestation enregistrée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Footer */}
            <div className="bg-slate-50 p-5 border-t border-slate-200">
              <div className="max-w-xs ml-auto space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Sous-total HT :</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatMoney(invoice.subtotal_cents, currency, true)}
                  </span>
                </div>

                {invoice.discount_amount_cents > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 font-medium">
                    <span>Remise :</span>
                    <span className="font-mono font-bold">
                      - {formatMoney(invoice.discount_amount_cents, currency, true)}
                    </span>
                  </div>
                )}

                {invoice.tax_amount_cents > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>TVA :</span>
                    <span className="font-mono font-bold text-slate-900">
                      + {formatMoney(invoice.tax_amount_cents, currency, true)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-slate-900 uppercase">
                    TOTAL :
                  </span>
                  <span className="text-lg font-extrabold font-mono text-slate-950">
                    {formatMoney(invoice.total_cents, currency, true)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-bold uppercase">Payé :</span>
                  <span className="font-mono font-bold text-sm">
                    {formatMoney(invoice.paid_amount_cents || 0, currency, true)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold uppercase">Reste :</span>
                  <span className="font-mono font-bold text-sm">
                    {formatMoney(invoice.balance_cents ?? invoice.total_cents, currency, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Historique des règlements ({invoice.payments?.length || 0})
              </h3>
            </div>

            {canAddPayment && (
              <button
                type="button"
                id="btn-add-payment-section"
                onClick={() => onOpenAddPayment(invoice)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Ajouter un règlement</span>
              </button>
            )}
          </div>

          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
              {invoice.payments.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </span>
                        {p.reference && (
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.2 rounded-md">
                            Réf: {p.reference}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        <span>Date : {p.payment_date}</span>
                        {p.notes && <span className="text-slate-500">· {p.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-extrabold font-mono text-emerald-700 pl-12 sm:pl-0">
                    + {formatMoney(p.amount_cents, currency, true)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Aucun règlement n'a été enregistré pour cette facture.
              </p>
              {canAddPayment && (
                <button
                  type="button"
                  onClick={() => onOpenAddPayment(invoice)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Enregistrer le premier paiement</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notes (if any) */}
        {invoice.notes && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Remarques
            </span>
            <p className="text-xs text-slate-700 whitespace-pre-line">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* PDF Placeholder Info */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info size={16} className="text-slate-400 shrink-0" />
            <span>Actions d'impression et PDF</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              title="L'impression sera disponible avec le module PDF."
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 font-medium text-xs flex items-center gap-1.5 cursor-not-allowed opacity-75"
            >
              <Printer size={14} />
              <span>Imprimer (Bientôt disponible)</span>
            </button>
            <button
              type="button"
              disabled
              title="L'ouverture PDF sera disponible avec le module PDF."
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 font-medium text-xs flex items-center gap-1.5 cursor-not-allowed opacity-75"
            >
              <FileDown size={14} />
              <span>Ouvrir PDF (Bientôt disponible)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
