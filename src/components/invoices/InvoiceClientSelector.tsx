import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  User,
  Building2,
  Phone,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Edit2,
  X,
} from "lucide-react";
import { Client, ClientCreateInput } from "../../types/client";
import { useClients } from "../../hooks/useClients";
import { ClientFormModal } from "../clients/ClientFormModal";

interface InvoiceClientSelectorProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
}

export const InvoiceClientSelector: React.FC<InvoiceClientSelectorProps> = ({
  selectedClient,
  onSelectClient,
}) => {
  const { clients, isLoading, createClient, updateClient } = useClients("active");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  // Filter clients based on search query
  const filteredClients = clients.filter((client) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const name = (client.name || "").toLowerCase();
    const phone = (client.phone || "").replace(/\D/g, "");
    const city = (client.city || "").toLowerCase();
    const ice = (client.ice || "").toLowerCase();
    const contact = (client.contact_person || "").toLowerCase();

    return (
      name.includes(query) ||
      phone.includes(query.replace(/\D/g, "")) ||
      city.includes(query) ||
      ice.includes(query) ||
      contact.includes(query)
    );
  });

  const handleOpenCreateNew = (initialName: string = "") => {
    if (initialName.trim()) {
      setClientToEdit({
        id: 0,
        type: "individual",
        name: initialName.trim(),
        contact_person: "",
        phone: "",
        address: "",
        city: "",
        email: "",
        ice: "",
        if_tax: "",
        rc: "",
        notes: "",
        is_active: 1,
        created_at: "",
        updated_at: "",
      });
    } else {
      setClientToEdit(null);
    }
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setClientToEdit(client);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (data: ClientCreateInput) => {
    if (clientToEdit && clientToEdit.id > 0) {
      const updated = await updateClient(clientToEdit.id, data);
      onSelectClient(updated);
    } else {
      const created = await createClient(data);
      onSelectClient(created);
    }
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Clear Prompt Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md mb-2">
              Étape 1 · Destinataire
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Pour quel client ?
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Sélectionnez un client existant ou ajoutez-en un nouveau rapidement.
            </p>
          </div>

          {!selectedClient && (
            <button
              type="button"
              id="btn-invoice-quick-create-client"
              onClick={() => handleOpenCreateNew(searchQuery)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px] shrink-0"
            >
              <Plus size={20} />
              <span>+ Nouveau client</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual State: Client IS Selected */}
      {selectedClient ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-1 text-xs font-bold rounded-bl-xl flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 size={14} />
            <span>Client sélectionné</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                {selectedClient.type === "company" ? (
                  <Building2 size={28} />
                ) : (
                  <User size={28} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedClient.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {selectedClient.type === "company" ? "Entreprise" : "Particulier"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
                  {selectedClient.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{selectedClient.phone}</span>
                    </div>
                  )}

                  {selectedClient.city && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{selectedClient.city} {selectedClient.address ? `(${selectedClient.address})` : ""}</span>
                    </div>
                  )}

                  {selectedClient.ice && (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-400 text-[10px]">ICE:</span>
                      <span className="font-mono text-slate-800">{selectedClient.ice}</span>
                    </div>
                  )}

                  {selectedClient.contact_person && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-slate-400 shrink-0" />
                      <span>Contact : {selectedClient.contact_person}</span>
                    </div>
                  )}
                </div>

                {selectedClient.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-lg mt-2">
                    « {selectedClient.notes} »
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons for chosen client */}
            <div className="flex items-center gap-2.5 pt-2 md:pt-0 shrink-0">
              <button
                type="button"
                id="btn-edit-selected-client"
                onClick={() => handleOpenEdit(selectedClient)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer min-h-[40px]"
              >
                <Edit2 size={14} />
                <span>Modifier</span>
              </button>

              <button
                type="button"
                id="btn-change-selected-client"
                onClick={() => onSelectClient(null)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer min-h-[40px]"
              >
                <span>Changer de client</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. Visual State: Client is NOT selected yet -> Search & List */
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="input-search-invoice-client"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un client par nom, téléphone, ville ou ICE..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Client List */}
          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Chargement des clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  id={`btn-select-client-${client.id}`}
                  onClick={() => onSelectClient(client)}
                  className="p-4 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs transition-all text-left cursor-pointer group flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center shrink-0 transition-colors">
                      {client.type === "company" ? (
                        <Building2 size={20} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                          {client.name}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {client.type === "company" ? "Entr." : "Part."}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 truncate">
                        {client.phone && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 shrink-0">
                            <Phone size={12} className="text-slate-400" />
                            {client.phone}
                          </span>
                        )}
                        {client.city && (
                          <span className="truncate">
                            {client.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-all shrink-0 px-3 py-1.5 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg">
                    <span>Choisir</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Empty Search Results */
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <Users size={32} className="text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900">
                {searchQuery ? `Aucun client trouvé pour "${searchQuery}"` : "Aucun client enregistré"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                {searchQuery
                  ? "Voulez-vous créer ce client directement pour cette facture ?"
                  : "Créez votre premier client en quelques secondes."}
              </p>
              <button
                type="button"
                id="btn-create-client-from-search"
                onClick={() => handleOpenCreateNew(searchQuery)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs min-h-[40px]"
              >
                <Plus size={16} />
                <span>+ Créer le client {searchQuery ? `"${searchQuery}"` : ""}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Client Quick Creation Modal (reuses ClientFormModal with initial Name & Phone + Plus d'infos) */}
      <ClientFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleFormSubmit}
        clientToEdit={clientToEdit}
      />
    </div>
  );
};
