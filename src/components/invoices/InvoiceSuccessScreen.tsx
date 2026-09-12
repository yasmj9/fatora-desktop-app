import React, { useState } from "react";
import {
  CheckCircle2,
  Plus,
  ArrowLeft,
  Calendar,
  FileText,
} from "lucide-react";
import { Invoice } from "../../types/invoice";
import { formatMoney } from "../../utils/money";
import { PdfActionButtons } from "./PdfActionButtons";
import { PdfDocumentModal } from "./PdfDocumentModal";

interface InvoiceSuccessScreenProps {
  invoice: Invoice;
  onNewInvoice: () => void;
  onBackToHome: () => void;
}

export const InvoiceSuccessScreen: React.FC<InvoiceSuccessScreenProps> = ({
  invoice,
  onNewInvoice,
  onBackToHome,
}) => {
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const currency = invoice.currency || "MAD";

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      {/* Success Badge & Heading */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Facture créée avec succès
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            La facture a été enregistrée dans votre base de données.
          </p>
        </div>
      </div>

      {/* Main Facture Information Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Invoice Number & Status Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Numéro de facture
            </span>
            <div className="text-2xl font-extrabold font-mono text-blue-600 tracking-tight">
              {invoice.invoice_number}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                invoice.status === "paid"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : invoice.status === "partially_paid"
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {invoice.status === "paid"
                ? "✓ Payée"
                : invoice.status === "partially_paid"
                ? "Partiellement payée"
                : "Non payée"}
            </span>
          </div>
        </div>

        {/* Client & Date Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Client
            </span>
            <div className="font-bold text-slate-900 text-base">
              {invoice.client_name}
            </div>
            {invoice.client_phone && (
              <p className="text-xs text-slate-500">Tél : {invoice.client_phone}</p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Date d'émission
            </span>
            <div className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-400" />
              <span>{invoice.invoice_date}</span>
            </div>
            {invoice.due_date && (
              <p className="text-xs text-slate-500">Échéance : {invoice.due_date}</p>
            )}
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              TOTAL
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {formatMoney(invoice.total_cents, currency, true)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Montant payé :</span>
              <div className="text-base font-bold font-mono text-emerald-400">
                {formatMoney(invoice.paid_amount_cents || 0, currency, true)}
              </div>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-slate-400 font-medium">Reste à payer :</span>
              <div className="text-base font-bold font-mono text-amber-300">
                {formatMoney(invoice.balance_cents ?? invoice.total_cents, currency, true)}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Document Actions */}
        {invoice.id && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <span>Impression & PDF de la facture</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Aperçu complet & styles
              </button>
            </div>

            <PdfActionButtons
              invoiceId={invoice.id}
              language={invoice.language}
              onOpenModal={() => setIsPdfModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Primary Navigation Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          id="btn-back-to-home"
          onClick={onBackToHome}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer min-h-[48px]"
        >
          <ArrowLeft size={18} />
          <span>Retour à l'accueil</span>
        </button>

        <button
          type="button"
          id="btn-success-new-invoice"
          onClick={onNewInvoice}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg min-h-[48px]"
        >
          <Plus size={18} />
          <span>Créer une nouvelle facture</span>
        </button>
      </div>

      {/* PDF Modal */}
      {invoice.id && (
        <PdfDocumentModal
          invoiceId={invoice.id}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};
