import { useState, useEffect, useCallback } from "react";
import { Client, ClientCreateInput, ClientUpdateInput } from "../types/client";
import { clientRepository } from "../db/repositories/clientRepository";

export type ClientStatusFilter = "all" | "active" | "archived";

export function useClients(initialStatus: ClientStatusFilter = "active") {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await clientRepository.getClients({
        status: statusFilter,
        search: searchQuery,
      });
      setClients(data);
    } catch (err: unknown) {
      console.error("[useClients] Error loading clients:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger la liste des clients"
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const createClient = async (input: ClientCreateInput): Promise<Client> => {
    setError(null);
    setActionSuccess(null);
    try {
      const created = await clientRepository.createClient(input);
      setActionSuccess(`Le client "${created.name}" a été ajouté avec succès.`);
      await loadClients();
      return created;
    } catch (err: unknown) {
      console.error("[useClients] Error creating client:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la création du client";
      setError(msg);
      throw err;
    }
  };

  const updateClient = async (
    id: number,
    input: ClientUpdateInput
  ): Promise<Client> => {
    setError(null);
    setActionSuccess(null);
    try {
      const updated = await clientRepository.updateClient(id, input);
      setActionSuccess(`Le client "${updated.name}" a été mis à jour.`);
      await loadClients();
      return updated;
    } catch (err: unknown) {
      console.error("[useClients] Error updating client:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du client";
      setError(msg);
      throw err;
    }
  };

  const archiveClient = async (id: number, clientName: string) => {
    setError(null);
    setActionSuccess(null);
    try {
      await clientRepository.archiveClient(id);
      setActionSuccess(`Le client "${clientName}" a été archivé.`);
      await loadClients();
    } catch (err: unknown) {
      console.error("[useClients] Error archiving client:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de l'archivage du client";
      setError(msg);
      throw err;
    }
  };

  const restoreClient = async (id: number, clientName: string) => {
    setError(null);
    setActionSuccess(null);
    try {
      await clientRepository.restoreClient(id);
      setActionSuccess(`Le client "${clientName}" a été réactivé.`);
      await loadClients();
    } catch (err: unknown) {
      console.error("[useClients] Error restoring client:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la réactivation du client";
      setError(msg);
      throw err;
    }
  };

  const clearMessages = () => {
    setError(null);
    setActionSuccess(null);
  };

  return {
    clients,
    isLoading,
    error,
    actionSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loadClients,
    createClient,
    updateClient,
    archiveClient,
    restoreClient,
    clearMessages,
  };
}
