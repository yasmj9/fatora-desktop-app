import React, { useState, useEffect } from "react";
import { Quotation } from "../../types/quotation";
import { QuotationStatusBadge } from "./QuotationStatusBadge";
import { ConvertQuotationModal } from "./ConvertQuotationModal";
import { quotationRepository } from "../../db/repositories/quotationRepository";
import { invoiceStyleRepository } from "../../db/repositories/invoiceStyleRepository";
import { logoRepository } from "../../db/repositories/logoRepository";
import { pdfService } from "../../services/pdfService";
import { buildDocumentData } from "../../utils/documentDataBuilder";
import { formatMoney } from "../../utils/money";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Printer,
  Download,
  ExternalLink,
  Calendar,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface QuotationDetailViewProps {
  quotationId: number;
  onBack: () => void;
  onNavigateToInvoice?: (invoiceId: number) => void;
  onRefreshList?: () => void;
}

export const QuotationDetailView: React.FC<QuotationDetailViewProps> = ({
  quotationId,
  onBack,
  onNavigateToInvoice,
  onRefreshList,
}) => {
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Conversion modal state
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionSuccessMessage, setConversionSuccessMessage] = useState<string | null>(null);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<number | null>(null);

  // Load quotation data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = await quotationRepository.getQuotationById(quotationId);
      if (q) {
        setQuotation(q);
      } else {
        setError(`Le devis ID ${quotationId} est introuvable.`);
      }
    } catch (err: unknown) {
      console.error("Error loading quotation detail:", err);
      setError("Erreur lors du chargement des détails du devis.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [quotationId]);

  // Execute quotation to invoice conversion
  const handleConfirmConversion = async () => {
    if (!quotation) return;
    setIsConverting(true);
    setError(null);
    try {
      const invoice = await quotationRepository.convertQuotationToInvoice(quotation.id);
      if (invoice) {
        setCreatedInvoiceId(invoice.id);
        setConversionSuccessMessage(
          `Devis converti avec succès en facture N° ${invoice.invoice_number} !`
        );
        setIsConvertModalOpen(false);
        await loadData();
        if (onRefreshList) onRefreshList();
      }
    } catch (err: unknown) {
      console.error("Conversion error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la conversion du devis en facture."
      );
      setIsConvertModalOpen(false);
    } finally {
      setIsConverting(false);
    }
  };

  // PDF Actions
  const handleOpenPdf = async () => {
    if (!quotation) return;
    try {
      const el = document.getElementById("quotation-detail-card") || document.body;
      await pdfService.openPdfInNewTab(el);
    } catch (err) {
      console.error("Error opening PDF:", err);
    }
  };

  const handlePrintPdf = async () => {
    if (!quotation) return;
    try {
      const el = document.getElementById("quotation-detail-card") || document.body;
      await pdfService.printDocument(el);
    } catch (err) {
      console.error("Error printing PDF:", err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;
    try {
      const el = document.getElementById("quotation-detail-card") || document.body;
      const invoiceAdapter: any = {
        id: quotation.id,
        invoice_number: quotation.quotation_number,
        sequence_number: quotation.sequence_number,
        sequence_year: quotation.sequence_year,
        prefix: quotation.prefix,
        status: quotation.status === "invoiced" ? "paid" : "sent",
        language: quotation.language || "fr",
        currency: quotation.currency || "MAD",
        client_name: quotation.client_name,
        client_type: quotation.client_type,
        client_contact_person: quotation.client_contact_person,
        client_phone: quotation.client_phone,
        client_address: quotation.client_address,
        client_city: quotation.client_city,
        client_email: quotation.client_email,
        client_ice: quotation.client_ice,
        client_if: quotation.client_if,
        client_rc: quotation.client_rc,
        seller_name: quotation.seller_name,
        seller_contact_person: quotation.seller_contact_person,
        seller_phone: quotation.seller_phone,
        seller_address: quotation.seller_address,
        seller_city: quotation.seller_city,
        seller_email: quotation.seller_email,
        seller_ice: quotation.seller_ice,
        seller_if: quotation.seller_if,
        seller_rc: quotation.seller_rc,
        seller_patente: quotation.seller_patente,
        seller_cnss: quotation.seller_cnss,
        seller_bank_name: quotation.seller_bank_name,
        seller_rib: quotation.seller_rib,
        invoice_date: quotation.quotation_date,
        due_date: quotation.valid_until_date,
        notes: quotation.notes,
        payment_terms: quotation.payment_terms,
        subtotal_cents: quotation.subtotal_cents,
        discount_type: quotation.discount_type,
        discount_rate: quotation.discount_rate,
        discount_amount_cents: quotation.discount_amount_cents,
        tax_rate: quotation.tax_rate,
        tax_amount_cents: quotation.tax_amount_cents,
        total_cents: quotation.total_cents,
        paid_amount_cents: quotation.total_cents,
        balance_cents: 0,
        items: (quotation.items || []).map((it) => ({
          id: it.id,
          service_id: it.service_id,
          position: it.position,
          name: it.name,
          name_ar: it.name_ar,
          name_en: it.name_en,
          description: it.description,
          description_ar: it.description_ar,
          description_en: it.description_en,
          unit: it.unit,
          quantity: it.quantity,
          unit_price_cents: it.unit_price_cents,
          discount_type: it.discount_type,
          discount_rate: it.discount_rate,
          discount_amount_cents: it.discount_amount_cents,
          tax_rate: it.tax_rate,
          tax_amount_cents: it.tax_amount_cents,
          total_cents: it.total_cents,
        })),
      };

      const [activeStyle, activeLogo] = await Promise.all([
        invoiceStyleRepository.getDefaultStyle(),
        logoRepository.getDefaultLogo(),
      ]);

      const effectiveStyle: any = activeStyle || {
        id: 1,
        style_key: "style_1",
        name: "Style 1",
        logo_id: null,
        description: null,
        primary_color: "#1e293b",
        header_color: "#ca8a04",
        accent_color: "#ca8a04",
        footer_color: "#ca8a04",
        header_bg_color: "#ca8a04",
        header_text_color: "#111827",
        table_header_bg_color: "#1e293b",
        table_header_text_color: "#ffffff",
        footer_bg_color: "#ca8a04",
        footer_text_color: "#111827",
        footer_text: "Merci de votre confiance.",
        show_ice: true,
        show_tax_id: true,
        show_rc: true,
        show_cnss: false,
        show_iban: true,
        show_phone: true,
        show_email: true,
        show_address: true,
        show_due_date: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const documentData = buildDocumentData(invoiceAdapter, effectiveStyle, activeLogo?.file_data || null);
      await pdfService.downloadPdf(el, documentData);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Chargement du devis...</p>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-base font-bold text-slate-900">
          {error || "Devis introuvable"}
        </h3>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Retourner aux devis
        </button>
      </div>
    );
  }

  const items = quotation.items || [];
  const currency = quotation.currency || "MAD";
  const isInvoiced = quotation.status === "invoiced";

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          type="button"
          id="btn-back-to-quotation-list"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors cursor-pointer w-fit py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft size={18} />
          <span>Retour aux devis</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Action: Convert to Invoice */}
          {!isInvoiced ? (
            <button
              type="button"
              id="btn-trigger-convert-quotation"
              onClick={() => setIsConvertModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-xl text-xs shadow-sm hover:shadow-md transition-all cursor-pointer min-h-[40px]"
            >
              <Sparkles size={16} />
              <span>Convertir en facture</span>
            </button>
          ) : (
            quotation.converted_invoice_id && onNavigateToInvoice && (
              <button
                type="button"
                id="btn-view-converted-invoice"
                onClick={() => onNavigateToInvoice(quotation.converted_invoice_id!)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <ExternalLink size={15} />
                <span>Voir la facture associée</span>
              </button>
            )
          )}

          {/* PDF Action Buttons */}
          <button
            type="button"
            id="btn-open-pdf-quotation"
            onClick={handleOpenPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileText size={15} className="text-slate-500" />
            <span>Ouvrir PDF</span>
          </button>

          <button
            type="button"
            id="btn-print-pdf-quotation"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer size={15} className="text-slate-500" />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            id="btn-save-pdf-quotation"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Download size={15} className="text-slate-500" />
            <span>Enregistrer PDF</span>
          </button>
        </div>
      </div>

      {/* Conversion Banner if Invoiced or Just Converted */}
      {conversionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{conversionSuccessMessage}</span>
          </div>
          {createdInvoiceId && onNavigateToInvoice && (
            <button
              type="button"
              onClick={() => onNavigateToInvoice(createdInvoiceId)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Ouvrir la nouvelle facture ›
            </button>
          )}
        </div>
      )}

      {isInvoiced && !conversionSuccessMessage && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-indigo-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold">Ce devis a été converti en facture.</strong>
              <p className="text-indigo-700 mt-0.5">
                La facture a son propre numéro officiel. L'historique et les montants originaux de ce devis restent sauvegardés.
              </p>
            </div>
          </div>
          {quotation.converted_invoice_id && onNavigateToInvoice && (
            <button
              type="button"
              onClick={() => onNavigateToInvoice(quotation.converted_invoice_id!)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Accéder à la facture
            </button>
          )}
        </div>
      )}

      {/* Main Quotation Header Card */}
      <div id="quotation-detail-card" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                {quotation.quotation_number}
              </h1>
              <QuotationStatusBadge status={quotation.status} size="lg" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium">
                <Calendar size={13} className="text-slate-400" />
                Date : {quotation.quotation_date}
              </span>
              {quotation.valid_until_date && (
                <span className="flex items-center gap-1 font-medium">
                  · Valide jusqu'au : {quotation.valid_until_date}
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Montant Total TTC</span>
            <div className="text-2xl font-black font-mono text-blue-600">
              {formatMoney(quotation.total_cents, currency, true)}
            </div>
          </div>
        </div>

        {/* Client & Seller Information Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Info */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200/80">
              <User size={15} className="text-blue-600" />
              <span>Informations Client</span>
            </div>
            <div className="text-sm font-bold text-slate-900 pt-1">
              {quotation.client_name}
            </div>
            {quotation.client_phone && (
              <div className="text-xs text-slate-600">Tél : {quotation.client_phone}</div>
            )}
            {quotation.client_address && (
              <div className="text-xs text-slate-600">
                {quotation.client_address}
                {quotation.client_city ? `, ${quotation.client_city}` : ""}
              </div>
            )}
            {quotation.client_ice && (
              <div className="text-xs text-slate-500 font-mono pt-1">
                ICE : {quotation.client_ice}
              </div>
            )}
          </div>

          {/* Seller / Company Info */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200/80">
              <Building size={15} className="text-slate-600" />
              <span>Émetteur du Devis</span>
            </div>
            <div className="text-sm font-bold text-slate-900 pt-1">
              {quotation.seller_name || "Votre Entreprise"}
            </div>
            {quotation.seller_phone && (
              <div className="text-xs text-slate-600">Tél : {quotation.seller_phone}</div>
            )}
            {quotation.seller_address && (
              <div className="text-xs text-slate-600">
                {quotation.seller_address}
                {quotation.seller_city ? `, ${quotation.seller_city}` : ""}
              </div>
            )}
            {quotation.seller_ice && (
              <div className="text-xs text-slate-500 font-mono pt-1">
                ICE : {quotation.seller_ice}
              </div>
            )}
          </div>
        </div>

        {/* Prestations / Line Items Table */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Prestations & Produits
          </h3>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-4 text-center">Qté</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Montant Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.quantity} {item.unit || "U"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                        {formatMoney(item.unit_price_cents, currency, true)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatMoney(item.total_cents, currency, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Financial Totals Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-1 text-xs text-slate-500 max-w-sm">
            {quotation.notes && (
              <div>
                <strong className="text-slate-900">Notes :</strong>
                <p className="mt-0.5 text-slate-600">{quotation.notes}</p>
              </div>
            )}
            {quotation.payment_terms && (
              <div className="mt-2">
                <strong className="text-slate-900">Modalités de paiement :</strong>
                <p className="mt-0.5 text-slate-600">{quotation.payment_terms}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Sous-total HT :</span>
              <span className="font-mono font-bold text-slate-900">
                {formatMoney(quotation.subtotal_cents, currency, true)}
              </span>
            </div>

            {quotation.discount_amount_cents > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Remise :</span>
                <span className="font-mono font-bold">
                  -{formatMoney(quotation.discount_amount_cents, currency, true)}
                </span>
              </div>
            )}

            {quotation.tax_amount_cents > 0 && (
              <div className="flex justify-between text-slate-600 font-medium">
                <span>TVA ({quotation.tax_rate}%) :</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatMoney(quotation.tax_amount_cents, currency, true)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>Total TTC :</span>
              <span className="font-mono text-base text-blue-600">
                {formatMoney(quotation.total_cents, currency, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Convert Quotation Modal */}
      {isConvertModalOpen && quotation && (
        <ConvertQuotationModal
          quotation={quotation}
          isOpen={isConvertModalOpen}
          isConverting={isConverting}
          onClose={() => setIsConvertModalOpen(false)}
          onConfirm={handleConfirmConversion}
        />
      )}
    </div>
  );
};
