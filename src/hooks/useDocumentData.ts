import { useState, useEffect, useCallback } from "react";
import { DocumentData } from "../types/documentData";
import { InvoiceStyle } from "../types/invoiceStyle";
import { DocumentLanguage } from "../utils/documentTranslations";
import { invoiceRepository } from "../db/repositories/invoiceRepository";
import { invoiceStyleRepository } from "../db/repositories/invoiceStyleRepository";
import { logoRepository } from "../db/repositories/logoRepository";
import { buildDocumentData } from "../utils/documentDataBuilder";

export function useDocumentData(
  invoiceId: number | null,
  overrideStyleId?: number,
  overrideLang?: DocumentLanguage
) {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [availableStyles, setAvailableStyles] = useState<InvoiceStyle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocumentData = useCallback(async () => {
    if (!invoiceId) {
      setDocumentData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [invoice, styles] = await Promise.all([
        invoiceRepository.getInvoiceById(invoiceId),
        invoiceStyleRepository.getAllStyles(),
      ]);

      if (!invoice) {
        setError("Facture introuvable");
        setIsLoading(false);
        return;
      }

      setAvailableStyles(styles);

      // Determine style to use
      let style: InvoiceStyle | null = null;
      if (overrideStyleId) {
        style = styles.find((s) => s.id === overrideStyleId) || null;
      }
      if (!style && invoice.style_id) {
        style = styles.find((s) => s.id === invoice.style_id) || null;
      }
      if (!style) {
        style = styles.find((s) => s.is_default) || styles[0] || null;
      }

      // Determine logo
      let logoDataUrl: string | null = null;
      if (style?.logo_id) {
        const logoObj = await logoRepository.getLogoById(style.logo_id);
        if (logoObj) {
          logoDataUrl = logoObj.file_data;
        }
      }
      if (!logoDataUrl) {
        const defaultLogoObj = await logoRepository.getDefaultLogo();
        if (defaultLogoObj) {
          logoDataUrl = defaultLogoObj.file_data;
        }
      }

      // Determine target language
      const targetInvoice = {
        ...invoice,
        language: overrideLang || invoice.language || "fr",
      };

      if (style) {
        const doc = buildDocumentData(targetInvoice, style, logoDataUrl);
        setDocumentData(doc);
      } else {
        setError("Aucun style de document disponible");
      }
    } catch (err: unknown) {
      console.error("Error building document data:", err);
      setError("Erreur lors du chargement des données du document");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, overrideStyleId, overrideLang]);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  return {
    documentData,
    availableStyles,
    isLoading,
    error,
    refreshDocumentData: loadDocumentData,
  };
}
