import { useState, useEffect, useCallback } from "react";
import {
  Invoice,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceFilterOptions,
  InvoiceStatus,
  PaymentCreateInput,
} from "../types/invoice";
import { invoiceRepository, InvoiceStats } from "../db/repositories/invoiceRepository";
import { paymentRepository } from "../db/repositories/paymentRepository";

export function useInvoices(initialStatusFilter: "all" | InvoiceStatus = "all") {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoicesCount: 0,
    draftCount: 0,
    unpaidCount: 0,
    paidCount: 0,
    totalUnpaidBalanceCents: 0,
    totalPaidRevenueCents: 0,
    totalInvoicedCents: 0,
  });
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(initialStatusFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: InvoiceFilterOptions = {
        status: statusFilter,
        search: searchQuery,
      };
      const [fetchedInvoices, fetchedStats] = await Promise.all([
        invoiceRepository.getInvoices(filters),
        invoiceRepository.getInvoiceStats(),
      ]);
      setInvoices(fetchedInvoices);
      setStats(fetchedStats);
      setError(null);
    } catch (err: unknown) {
      console.error("[useInvoices] Error fetching invoices:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des factures.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const createInvoice = async (data: InvoiceCreateInput): Promise<Invoice | null> => {
    try {
      const created = await invoiceRepository.createInvoice(data);
      setActionSuccess(`Facture ${created.invoice_number} créée avec succès.`);
      await loadInvoices();
      return created;
    } catch (err: unknown) {
      console.error("[useInvoices] Error creating invoice:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la facture.");
      return null;
    }
  };

  const updateInvoice = async (id: number, data: InvoiceUpdateInput): Promise<Invoice | null> => {
    try {
      const updated = await invoiceRepository.updateInvoice(id, data);
      setActionSuccess(`Facture ${updated.invoice_number} mise à jour avec succès.`);
      await loadInvoices();
      return updated;
    } catch (err: unknown) {
      console.error("[useInvoices] Error updating invoice:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour de la facture.");
      return null;
    }
  };

  const updateStatus = async (id: number, status: InvoiceStatus): Promise<boolean> => {
    try {
      const success = await invoiceRepository.updateInvoiceStatus(id, status);
      if (success) {
        setActionSuccess("Statut de la facture mis à jour.");
        await loadInvoices();
      }
      return success;
    } catch (err: unknown) {
      console.error("[useInvoices] Error updating status:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du changement de statut.");
      return false;
    }
  };

  const deleteInvoice = async (id: number, invoiceNumber: string): Promise<boolean> => {
    try {
      const success = await invoiceRepository.deleteInvoice(id);
      if (success) {
        setActionSuccess(`Facture ${invoiceNumber} supprimée.`);
        await loadInvoices();
      }
      return success;
    } catch (err: unknown) {
      console.error("[useInvoices] Error deleting invoice:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la facture.");
      return false;
    }
  };

  const addPayment = async (input: PaymentCreateInput): Promise<boolean> => {
    try {
      await paymentRepository.addPayment(input);
      setActionSuccess("Paiement enregistré avec succès.");
      await loadInvoices();
      return true;
    } catch (err: unknown) {
      console.error("[useInvoices] Error adding payment:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du paiement.");
      return false;
    }
  };

  const clearMessages = () => {
    setError(null);
    setActionSuccess(null);
  };

  return {
    invoices,
    stats,
    isLoading,
    error,
    actionSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loadInvoices,
    createInvoice,
    updateInvoice,
    updateStatus,
    deleteInvoice,
    addPayment,
    clearMessages,
  };
}
