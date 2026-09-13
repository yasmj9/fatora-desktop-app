import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Archive,
} from "lucide-react";
import { Service, ServiceCreateInput } from "../types/service";
import { useServices } from "../hooks/useServices";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { ServiceTable } from "../components/services/ServiceTable";
import { ServiceFormModal } from "../components/services/ServiceFormModal";
import { ServiceDetailsModal } from "../components/services/ServiceDetailsModal";

export const ServicesPage: React.FC = () => {
  const {
    services,
    isLoading,
    error,
    actionSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    createService,
    updateService,
    archiveService,
    restoreService,
    clearMessages,
  } = useServices("active");

  const { settings } = useCompanySettings();
  const currency = settings.currency || "MAD";

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [detailsService, setDetailsService] = useState<Service | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Archive confirmation modal state
  const [serviceToArchive, setServiceToArchive] = useState<Service | null>(null);

  const handleOpenCreate = () => {
    setServiceToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setServiceToEdit(service);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (service: Service) => {
    setDetailsService(service);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (data: ServiceCreateInput) => {
    if (serviceToEdit) {
      await updateService(serviceToEdit.id, data);
    } else {
      await createService(data);
    }
  };

  const handleConfirmArchive = async () => {
    if (!serviceToArchive) return;
    await archiveService(serviceToArchive.id, serviceToArchive.name_fr);
    setServiceToArchive(null);
  };

  const handleRestore = async (service: Service) => {
    await restoreService(service.id, service.name_fr);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Catalogue des services
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez la liste de vos prestations habituelles, tarifs indicatifs et unités de travail.
          </p>
        </div>

        <button
          id="btn-nouveau-service"
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[44px] shrink-0"
        >
          <Plus size={20} />
          <span>Nouveau service</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div
          id="service-success-alert"
          className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {error && (
        <div
          id="service-error-alert"
          className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search Bar & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            id="tab-services-active"
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Actifs
          </button>
          <button
            type="button"
            id="tab-services-archived"
            onClick={() => setStatusFilter("archived")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "archived"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Archivés
          </button>
          <button
            type="button"
            id="tab-services-all"
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tous
          </button>
        </div>

        {/* Forgiving Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id="search-services-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (ex: cam, caméra, ELEC, peinture...)"
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-600">Chargement des services...</p>
        </div>
      ) : services.length > 0 ? (
        <ServiceTable
          services={services}
          currency={currency}
          onEdit={handleOpenEdit}
          onViewDetails={handleOpenDetails}
          onArchive={(service) => setServiceToArchive(service)}
          onRestore={handleRestore}
        />
      ) : (
        /* Empty States */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Wrench size={32} />
          </div>

          {searchQuery ? (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Aucun résultat pour "{searchQuery}"
              </h3>
              <p className="text-slate-500 text-sm max-w-md mb-5">
                Essayez un autre mot-clé ou effacez la recherche pour voir toutes les prestations.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Effacer la recherche
              </button>
            </>
          ) : statusFilter === "archived" ? (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Aucun service archivé
              </h3>
              <p className="text-slate-500 text-sm max-w-md">
                Les services archivés restent conservés pour vos anciennes factures sans encombrer votre catalogue quotidien.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Votre catalogue est vide
              </h3>
              <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                Ajoutez vos prestations courantes avec leurs prix et unités habituels pour gagner du temps lors de la facturation.
              </p>
              <button
                id="btn-create-first-service-empty"
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm min-h-[44px]"
              >
                <Plus size={18} />
                <span>Nouveau service</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Service Create / Edit Modal */}
      <ServiceFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        serviceToEdit={serviceToEdit}
        currency={currency}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        service={detailsService}
        onEdit={handleOpenEdit}
        onArchive={(service) => setServiceToArchive(service)}
        onRestore={handleRestore}
        currency={currency}
      />

      {/* Confirmation Modal for Archiving */}
      {serviceToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Archive size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Archiver ce service ?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Le service <span className="font-semibold text-slate-900">"{serviceToArchive.name_fr}"</span> sera masqué de la liste principale.
                Il ne sera pas supprimé et vos devis et factures existants resteront intacts.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setServiceToArchive(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-archive-service"
                onClick={handleConfirmArchive}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Confirmer l'archivage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
