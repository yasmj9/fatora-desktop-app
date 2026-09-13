import React, { useRef, useState } from "react";
import {
  X,
  FileText,
  Printer,
  Download,
  Check,
  Globe,
  Palette,
  Loader2,
} from "lucide-react";
import { useDocumentData } from "../../hooks/useDocumentData";
import { StyleRenderer } from "../invoiceStyles/StyleRenderer";
import { pdfService } from "../../services/pdfService";
import { DocumentLanguage } from "../../utils/documentTranslations";

interface PdfDocumentModalProps {
  invoiceId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfDocumentModal: React.FC<PdfDocumentModalProps> = ({
  invoiceId,
  isOpen,
  onClose,
}) => {
  const [selectedStyleId, setSelectedStyleId] = useState<number | undefined>(undefined);
  const [selectedLang, setSelectedLang] = useState<DocumentLanguage>("fr");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const documentRef = useRef<HTMLDivElement>(null);

  const { documentData, availableStyles, isLoading } = useDocumentData(
    isOpen ? invoiceId : null,
    selectedStyleId,
    selectedLang
  );

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleOpenPdf = async () => {
    if (!documentRef.current) return;
    try {
      setActionLoading("open");
      await pdfService.openPdfInNewTab(documentRef.current);
      showFeedback("Aperçu PDF ouvert dans un nouvel onglet.");
    } catch (err) {
      console.error(err);
      showFeedback("Erreur lors de l'ouverture du PDF.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = async () => {
    if (!documentRef.current) return;
    try {
      setActionLoading("print");
      await pdfService.printDocument(documentRef.current);
      showFeedback("Impression démarrée.");
    } catch (err) {
      console.error(err);
      showFeedback("Erreur lors de l'impression.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async () => {
    if (!documentRef.current || !documentData) return;
    try {
      setActionLoading("download");
      const filename = await pdfService.downloadPdf(documentRef.current, documentData);
      showFeedback(`PDF enregistré : ${filename}`);
    } catch (err) {
      console.error(err);
      showFeedback("Erreur lors de l'enregistrement du PDF.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Génération PDF & Document A4
            </h2>
            <p className="text-xs text-slate-500">
              {documentData ? `Facture N° ${documentData.documentNumber}` : "Chargement..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Language & Style Selector */}
        <div className="bg-white/90 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Language Switcher */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Langue :</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(
                [
                  { code: "fr", label: "Français" },
                  { code: "en", label: "English" },
                  { code: "ar", label: "العربية" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    selectedLang === lang.code
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style Switcher */}
          {availableStyles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">Style :</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                {availableStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      (selectedStyleId === style.id) ||
                      (!selectedStyleId && documentData?.style?.id === style.id)
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-5 py-2 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap gap-2.5 items-center justify-end">
          <button
            onClick={handleOpenPdf}
            disabled={!documentData || isLoading || !!actionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 shadow-xs transition-all cursor-pointer"
          >
            {actionLoading === "open" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <FileText className="w-4 h-4 text-blue-600" />
            )}
            Générer / Ouvrir PDF
          </button>

          <button
            onClick={handlePrint}
            disabled={!documentData || isLoading || !!actionLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 shadow-xs transition-all cursor-pointer"
          >
            {actionLoading === "print" ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <Printer className="w-4 h-4 text-slate-600" />
            )}
            Imprimer
          </button>

          <button
            onClick={handleDownload}
            disabled={!documentData || isLoading || !!actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
          >
            {actionLoading === "download" ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Enregistrer PDF
          </button>
        </div>

        {/* Scrollable Document Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex justify-center bg-slate-200/70">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-medium">Préparation du document PDF...</p>
            </div>
          ) : documentData ? (
            <div
              ref={documentRef}
              data-title={`Facture-${documentData.documentNumber}`}
              className="w-full max-w-[794px] min-h-[1120px] bg-white shadow-2xl transition-all"
            >
              <StyleRenderer documentData={documentData} />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Impossible de charger les données du document.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
