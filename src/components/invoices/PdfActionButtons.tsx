import React, { useRef, useState } from "react";
import { FileText, Printer, Download, Loader2 } from "lucide-react";
import { useDocumentData } from "../../hooks/useDocumentData";
import { StyleRenderer } from "../invoiceStyles/StyleRenderer";
import { pdfService } from "../../services/pdfService";
import { DocumentLanguage } from "../../utils/documentTranslations";

interface PdfActionButtonsProps {
  invoiceId: number;
  language?: DocumentLanguage;
  onOpenModal?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PdfActionButtons: React.FC<PdfActionButtonsProps> = ({
  invoiceId,
  language,
  onOpenModal,
  className = "",
  size = "md",
}) => {
  const hiddenDocRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { documentData, isLoading } = useDocumentData(invoiceId, undefined, language);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleOpenPdf = async () => {
    if (onOpenModal) {
      onOpenModal();
      return;
    }
    if (!hiddenDocRef.current) return;
    try {
      setActiveAction("open");
      await pdfService.openPdfInNewTab(hiddenDocRef.current);
      notify("Document PDF ouvert.");
    } catch (err) {
      console.error(err);
      notify("Erreur lors de la création du PDF.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePrint = async () => {
    if (!hiddenDocRef.current) return;
    try {
      setActiveAction("print");
      await pdfService.printDocument(hiddenDocRef.current);
      notify("Impression en cours...");
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'impression.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleDownload = async () => {
    if (!hiddenDocRef.current || !documentData) return;
    try {
      setActiveAction("download");
      const filename = await pdfService.downloadPdf(hiddenDocRef.current, documentData);
      notify(`PDF enregistré : ${filename}`);
    } catch (err) {
      console.error(err);
      notify("Erreur lors de l'enregistrement du PDF.");
    } finally {
      setActiveAction(null);
    }
  };

  const isSmall = size === "sm";

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Action 1: Générer/Ouvrir PDF */}
        <button
          onClick={handleOpenPdf}
          disabled={isLoading || !!activeAction}
          className={`inline-flex items-center gap-2 font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
            isSmall ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-xs"
          }`}
        >
          {activeAction === "open" ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <FileText className="w-4 h-4 text-blue-600" />
          )}
          <span>Générer / Ouvrir PDF</span>
        </button>

        {/* Action 2: Imprimer */}
        <button
          onClick={handlePrint}
          disabled={isLoading || !!activeAction}
          className={`inline-flex items-center gap-2 font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
            isSmall ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-xs"
          }`}
        >
          {activeAction === "print" ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
            <Printer className="w-4 h-4 text-slate-600" />
          )}
          <span>Imprimer</span>
        </button>

        {/* Action 3: Enregistrer PDF */}
        <button
          onClick={handleDownload}
          disabled={isLoading || !!activeAction}
          className={`inline-flex items-center gap-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
            isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"
          }`}
        >
          {activeAction === "download" ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Enregistrer PDF</span>
        </button>
      </div>

      {statusMessage && (
        <div className="text-[11px] font-semibold text-emerald-700 animate-fadeIn">
          {statusMessage}
        </div>
      )}

      {/* Off-screen Container for crisp rendering & PDF capture */}
      {documentData && (
        <div
          tabIndex={-1}
          aria-hidden="true"
          className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
        >
          <div ref={hiddenDocRef} className="w-[794px] bg-white p-2">
            <StyleRenderer documentData={documentData} />
          </div>
        </div>
      )}
    </div>
  );
};
