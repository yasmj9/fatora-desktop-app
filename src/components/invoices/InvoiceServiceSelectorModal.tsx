import React, { useState } from "react";
import {
  X,
  Search,
  Plus,
  Wrench,
  Tag,
  Coins,
  Layers,
  ChevronRight,
  FilePlus2,
} from "lucide-react";
import { Service, ServiceCreateInput } from "../../types/service";
import { DocumentLanguage } from "../../types/invoice";
import { useServices } from "../../hooks/useServices";
import { formatMoney } from "../../utils/money";
import { ServiceFormModal } from "../services/ServiceFormModal";

interface InvoiceServiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (service: Service) => void;
  onAddCustomItem: (customName: string) => void;
  documentLanguage: DocumentLanguage;
  currency?: string;
}

export const InvoiceServiceSelectorModal: React.FC<InvoiceServiceSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
  onAddCustomItem,
  documentLanguage,
  currency = "MAD",
}) => {
  const { services, isLoading, createService } = useServices("active");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter services by French, Arabic, English name, code, or description
  const filteredServices = services.filter((service) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const nameFr = (service.name_fr || "").toLowerCase();
    const nameAr = (service.name_ar || "").toLowerCase();
    const nameEn = (service.name_en || "").toLowerCase();
    const code = (service.code || "").toLowerCase();
    const descFr = (service.description_fr || "").toLowerCase();

    return (
      nameFr.includes(query) ||
      nameAr.includes(query) ||
      nameEn.includes(query) ||
      code.includes(query) ||
      descFr.includes(query)
    );
  });

  const getServiceNameInLanguage = (service: Service): string => {
    if (documentLanguage === "ar" && service.name_ar) return service.name_ar;
    if (documentLanguage === "en" && service.name_en) return service.name_en;
    return service.name_fr || "Prestation sans nom";
  };

  const handleSelect = (service: Service) => {
    onSelectService(service);
    onClose();
  };

  const handleCreateNewService = async (data: ServiceCreateInput) => {
    const created = await createService(data);
    onSelectService(created);
    setIsCreateModalOpen(false);
    onClose();
  };

  const handleCreateCustom = () => {
    onAddCustomItem(searchQuery.trim() || "Nouvelle prestation");
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div
          id="invoice-service-selector-modal"
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80 shrink-0">
            <div>
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-md mb-1">
                Catalogue & Prestations
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Ajouter un service à la facture
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sélectionnez un service pour importer son prix et son unité par défaut.
              </p>
            </div>
            <button
              type="button"
              id="btn-close-service-selector"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search bar & Actions toolbar */}
          <div className="p-5 border-b border-slate-100 bg-white shrink-0 space-y-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="input-search-service-in-modal"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, code (ex: ELEC-004), mot-clé..."
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">
                {filteredServices.length} prestation{filteredServices.length > 1 ? "s" : ""} disponible{filteredServices.length > 1 ? "s" : ""}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-modal-quick-custom-item"
                  onClick={handleCreateCustom}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 hover:text-blue-700 hover:bg-blue-50 bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <FilePlus2 size={14} />
                  <span>Ligne libre / sur-mesure</span>
                </button>

                <button
                  type="button"
                  id="btn-modal-create-catalog-service"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Nouveau service</span>
                </button>
              </div>
            </div>
          </div>

          {/* Service List */}
          <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Chargement des services...</p>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="space-y-2.5">
                {filteredServices.map((service) => {
                  const displayName = getServiceNameInLanguage(service);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      id={`btn-select-service-${service.id}`}
                      onClick={() => handleSelect(service)}
                      className="w-full p-4 bg-white hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-400 transition-all text-left cursor-pointer group flex items-start justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <Wrench size={18} />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                              {displayName}
                            </h4>
                            {service.code && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-semibold">
                                <Tag size={10} />
                                {service.code}
                              </span>
                            )}
                            {documentLanguage !== "fr" && service.name_fr && (
                              <span className="text-xs text-slate-400">
                                ({service.name_fr})
                              </span>
                            )}
                          </div>

                          {(service.description_fr || service.description_ar || service.description_en) && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {documentLanguage === "ar" && service.description_ar
                                ? service.description_ar
                                : documentLanguage === "en" && service.description_en
                                ? service.description_en
                                : service.description_fr || service.description_ar || service.description_en}
                            </p>
                          )}

                          <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-600">
                            <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              <Layers size={11} className="text-slate-400" />
                              {service.default_unit || "Unité"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <div className="text-sm font-extrabold font-mono text-slate-900 group-hover:text-blue-700 transition-colors">
                          {formatMoney(service.default_price, currency, false)}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg transition-all">
                          <span>Choisir</span>
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Empty state for search */
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Coins size={32} className="text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-900">
                  {searchQuery
                    ? `Aucune prestation trouvée pour "${searchQuery}"`
                    : "Votre catalogue est vide"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? "Vous pouvez ajouter cette prestation sur-mesure pour cette facture ou l'enregistrer dans votre catalogue."
                    : "Ajoutez vos premières prestations types pour accélérer vos prochaines facturations."}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCreateCustom}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Ajouter "{searchQuery || "Prestation sur-mesure"}"
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    + Enregistrer au catalogue
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Le prix du service peut être modifié sans affecter le catalogue.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Embedded ServiceFormModal if the user wants to create a catalogue service on the fly */}
      <ServiceFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateNewService}
        currency={currency}
      />
    </>
  );
};
