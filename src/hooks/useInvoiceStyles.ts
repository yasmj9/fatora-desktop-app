import { useState, useEffect, useCallback } from "react";
import { InvoiceStyle, InvoiceStyleUpdateInput } from "../types/invoiceStyle";
import { invoiceStyleRepository } from "../db/repositories/invoiceStyleRepository";

export function useInvoiceStyles() {
  const [styles, setStyles] = useState<InvoiceStyle[]>([]);
  const [defaultStyle, setDefaultStyleState] = useState<InvoiceStyle | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<InvoiceStyle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadStyles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [all, def] = await Promise.all([
        invoiceStyleRepository.getAllStyles(),
        invoiceStyleRepository.getDefaultStyle(),
      ]);
      setStyles(all);
      setDefaultStyleState(def);

      // Keep current selection if valid, or default to the default style
      setSelectedStyle((prev) => {
        if (prev) {
          const match = all.find((s) => s.id === prev.id);
          if (match) return match;
        }
        return def || all[0] || null;
      });
    } catch (err) {
      console.error("[useInvoiceStyles] Error loading styles:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des styles de factures."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const updateStyleConfig = async (id: number, input: InvoiceStyleUpdateInput) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await invoiceStyleRepository.updateStyle(id, input);
      setSuccessMessage(`Style "${updated.name}" enregistré avec succès.`);
      await loadStyles();
      setSelectedStyle(updated);
      return updated;
    } catch (err) {
      console.error("[useInvoiceStyles] Error updating style:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour du style.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultStyle = async (id: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await invoiceStyleRepository.setDefaultStyle(id);
      setSuccessMessage("Ce style a été configuré comme le style par défaut pour toutes vos factures.");
      await loadStyles();
    } catch (err) {
      console.error("[useInvoiceStyles] Error setting default style:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sélection du style par défaut."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    styles,
    defaultStyle,
    selectedStyle,
    setSelectedStyle,
    isLoading,
    isSaving,
    error,
    successMessage,
    updateStyleConfig,
    setDefaultStyle: handleSetDefaultStyle,
    reloadStyles: loadStyles,
    clearMessages,
  };
}
