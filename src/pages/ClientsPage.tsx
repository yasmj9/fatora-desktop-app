import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  Archive,
  Trash2,
} from "lucide-react";
import { Client, ClientCreateInput } from "../types/client";
import { useClients } from "../hooks/useClients";
import { ClientTable } from "../components/clients/ClientTable";
import { ClientFormModal } from "../components/clients/ClientFormModal";
import { ClientDetailsModal } from "../components/clients/ClientDetailsModal";

export const ClientsPage: React.FC = () => {
  const {
    clients,
    isLoading,
    error,
    actionSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    createClient,
    updateClient,
    archiveClient,
    restoreClient,
    deleteClient,
    clearMessages,
  } = useClients("active");

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Archive and delete confirmation modal states
  const [clientToArchive, setClientToArchive] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setClientToEdit(client);
    setIsFormModalOpen(true);
  };

  const handleOpenDetails = (client: Client) => {
    setDetailsClient(client);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (data: ClientCreateInput) => {
    if (clientToEdit) {
      await updateClient(clientToEdit.id, data);
    } else {
      await createClient(data);
    }
  };

  const handleConfirmArchive = async () => {
    if (!clientToArchive) return;
    await archiveClient(clientToArchive.id, clientToArchive.name);
    setClientToArchive(null);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    await deleteClient(clientToDelete.id, clientToDelete.name);
    setClientToDelete(null);
  };

  const handleRestore = async (client: Client) => {
    await restoreClient(client.id, client.name);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Carnet de clients
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos clients particuliers et entreprises, leurs coordonnées et leurs informations de facturation.
          </p>
        </div>

        <button
          id="btn-nouveau-client"
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[44px] shrink-0"
        >
          <Plus size={20} />
          <span>Nouveau client</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div
          id="client-success-alert"
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
          id="client-error-alert"
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
            id="tab-clients-active"
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
            id="tab-clients-archived"
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
            id="tab-clients-all"
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
            id="search-clients-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (ex: ahm, Ahmed, 0661..., ICE, Bati...)"
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
          <p className="text-sm font-medium text-slate-600">Chargement des clients...</p>
        </div>
      ) : clients.length > 0 ? (
        <ClientTable
          clients={clients}
          onEdit={handleOpenEdit}
          onViewDetails={handleOpenDetails}
          onArchive={(client) => setClientToArchive(client)}
          onRestore={handleRestore}
          onDelete={(client) => setClientToDelete(client)}
        />
      ) : (
        /* Empty States */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users size={32} />
          </div>

          {searchQuery ? (
            <>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Aucun client trouvé pour "{searchQuery}"
              </h3>
              <p className="text-slate-500 text-sm max-w-md mb-5">
                Essayez un autre nom, numéro de téléphone ou identifiant ICE.
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
                Aucun client archivé
              </h3>
              <p className="text-slate-500 text-sm max-w-md">
                Les clients archivés sont conservés pour vos anciennes factures sans encombrer votre carnet quotidien.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Votre carnet de clients est vide
              </h3>
              <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                Enregistrez vos clients avec leurs coordonnées pour les sélectionner rapidement lors de la création de vos devis et factures.
              </p>
              <button
                id="btn-create-first-client-empty"
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm min-h-[44px]"
              >
                <Plus size={18} />
                <span>Nouveau client</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Client Create / Edit Modal */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        clientToEdit={clientToEdit}
      />

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        client={detailsClient}
        onEdit={handleOpenEdit}
        onArchive={(client) => setClientToArchive(client)}
        onRestore={handleRestore}
        onDelete={(client) => setClientToDelete(client)}
      />

      {/* Confirmation Modal for Archiving */}
      {clientToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Archive size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Archiver ce client ?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Le client <span className="font-semibold text-slate-900">"{clientToArchive.name}"</span> sera masqué de la liste active.
                Ses factures et devis passés ne seront pas affectés et vous pourrez le réactiver à tout moment.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToArchive(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-archive-client"
                onClick={handleConfirmArchive}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Confirmer l'archivage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Permanent Deletion */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Supprimer définitivement le client ?
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Voulez-vous vraiment supprimer le client <span className="font-semibold text-slate-900">"{clientToDelete.name}"</span> ?
              </p>
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
                ⚠️ Attention : Cette action est irréversible et supprimera également <strong>toutes les factures et tous les devis</strong> associés à ce client.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-confirm-delete-client"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Oui, tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
