import { useState, useEffect, useCallback } from "react";
import {
  Quotation,
  QuotationCreateInput,
  QuotationStatus,
  QuotationFilterOptions,
} from "../types/quotation";
import { Invoice } from "../types/invoice";
import { quotationRepository } from "../db/repositories/quotationRepository";

export function useQuotations(initialStatusFilter: "all" | QuotationStatus = "all") {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<"all" | QuotationStatus>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadQuotations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: QuotationFilterOptions = {
        status: statusFilter,
        search: searchQuery,
      };
      const list = await quotationRepository.getQuotations(filters);
      setQuotations(list);
    } catch (err) {
      console.error("[useQuotations] Failed to load quotations:", err);
      setError("Impossible de charger les devis depuis la base de données locale.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const createQuotation = async (input: QuotationCreateInput): Promise<Quotation | null> => {
    setError(null);
    try {
      const created = await quotationRepository.createQuotation(input);
      setActionSuccess(`Le devis ${created.quotation_number} a été créé avec succès.`);
      await loadQuotations();
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création du devis.";
      setError(msg);
      return null;
    }
  };

  const updateStatus = async (id: number, status: QuotationStatus): Promise<boolean> => {
    setError(null);
    try {
      const ok = await quotationRepository.updateQuotationStatus(id, status);
      if (ok) {
        setActionSuccess("Statut du devis mis à jour.");
        await loadQuotations();
      }
      return ok;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut.";
      setError(msg);
      return false;
    }
  };

  const convertToInvoice = async (quotationId: number): Promise<Invoice | null> => {
    setError(null);
    try {
      const createdInvoice = await quotationRepository.convertQuotationToInvoice(quotationId);
      if (createdInvoice) {
        setActionSuccess(
          `Devis converti avec succès en facture N° ${createdInvoice.invoice_number}.`
        );
        await loadQuotations();
        return createdInvoice;
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la conversion du devis en facture.";
      setError(msg);
      return null;
    }
  };

  const clearMessages = () => {
    setActionSuccess(null);
    setError(null);
  };

  return {
    quotations,
    isLoading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    actionSuccess,
    error,
    clearMessages,
    loadQuotations,
    createQuotation,
    updateStatus,
    convertToInvoice,
  };
}
