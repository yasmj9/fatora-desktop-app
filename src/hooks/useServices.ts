import { useState, useEffect, useCallback } from "react";
import { Service, ServiceCreateInput, ServiceUpdateInput } from "../types/service";
import { serviceRepository } from "../db/repositories/serviceRepository";

export type ServiceStatusFilter = "all" | "active" | "archived";

export function useServices(initialStatus: ServiceStatusFilter = "active") {
  const [services, setServices] = useState<Service[]>([]);
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await serviceRepository.getServices({
        status: statusFilter,
        search: searchQuery,
      });
      setServices(data);
    } catch (err) {
      console.error("[useServices] Error loading services:", err);
      setError("Impossible de charger la liste des services.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const createService = async (data: ServiceCreateInput): Promise<Service> => {
    try {
      const newService = await serviceRepository.createService(data);
      setActionSuccess(`Le service "${newService.name_fr}" a été créé avec succès.`);
      await loadServices();
      return newService;
    } catch (err) {
      console.error("[useServices] Error creating service:", err);
      setError("Une erreur est survenue lors de la création du service.");
      throw err;
    }
  };

  const updateService = async (id: number, data: ServiceUpdateInput): Promise<Service> => {
    try {
      const updated = await serviceRepository.updateService(id, data);
      setActionSuccess(`Le service "${updated.name_fr}" a été mis à jour.`);
      await loadServices();
      return updated;
    } catch (err) {
      console.error("[useServices] Error updating service:", err);
      setError("Une erreur est survenue lors de la mise à jour du service.");
      throw err;
    }
  };

  const archiveService = async (id: number, serviceName: string): Promise<void> => {
    try {
      await serviceRepository.archiveService(id);
      setActionSuccess(`Le service "${serviceName}" a été archivé.`);
      await loadServices();
    } catch (err) {
      console.error("[useServices] Error archiving service:", err);
      setError("Une erreur est survenue lors de l'archivage.");
      throw err;
    }
  };

  const restoreService = async (id: number, serviceName: string): Promise<void> => {
    try {
      await serviceRepository.restoreService(id);
      setActionSuccess(`Le service "${serviceName}" a été restauré avec succès.`);
      await loadServices();
    } catch (err) {
      console.error("[useServices] Error restoring service:", err);
      setError("Une erreur est survenue lors de la restauration.");
      throw err;
    }
  };

  const clearMessages = () => {
    setError(null);
    setActionSuccess(null);
  };

  return {
    services,
    isLoading,
    error,
    actionSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loadServices,
    createService,
    updateService,
    archiveService,
    restoreService,
    clearMessages,
  };
}
