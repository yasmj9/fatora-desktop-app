import React, { useState, useEffect } from "react";
import { Client, ClientCreateInput } from "../../types/client";
import { Service } from "../../types/service";
import { QuotationCreateInput } from "../../types/quotation";
import { clientRepository } from "../../db/repositories/clientRepository";
import { serviceRepository } from "../../db/repositories/serviceRepository";
import { companyRepository } from "../../db/repositories/companyRepository";
import { formatMoney, toCents } from "../../utils/money";
import { ClientFormModal } from "../clients/ClientFormModal";
import {
  X,
  Plus,
  Trash2,
  User,
  Sparkles,
  AlertCircle,
  Search,
  CheckCircle2,
  Building2,
  Phone,
  ChevronDown,
} from "lucide-react";

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: QuotationCreateInput) => Promise<boolean>;
}

interface ItemRow {
  service_id?: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number; // main currency unit e.g. 1500
  tax_rate: number;
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState<boolean>(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);

  const [currency, setCurrency] = useState<string>("MAD");

  const [items, setItems] = useState<ItemRow[]>([
    { name: "", description: "", quantity: 1, unit: "U", unit_price: 0, tax_rate: 0 },
  ]);

  const [validUntilDate, setValidUntilDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Valid for 30 days default
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadDependencies = async () => {
    try {
      const [cList, sList, company] = await Promise.all([
        clientRepository.getClients({ status: "active" }),
        serviceRepository.getServices({ status: "active" }),
        companyRepository.getSettings(),
      ]);
      setClients(cList);
      setServices(sList);
      if (company.currency) setCurrency(company.currency);
      if (cList.length > 0 && !selectedClient) {
        setSelectedClient(cList[0]);
      }
    } catch (err) {
      console.warn("Could not load form dependencies:", err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadDependencies();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateNewClientSubmit = async (data: ClientCreateInput) => {
    try {
      const newClient = await clientRepository.createClient(data);
      setClients((prev) => [newClient, ...prev]);
      setSelectedClient(newClient);
      setIsNewClientModalOpen(false);
      setIsClientDropdownOpen(false);
      setClientSearchQuery("");
      setFormError(null);
    } catch (err: unknown) {
      console.error("Error creating new client from quotation modal:", err);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!clientSearchQuery.trim()) return true;
    const query = clientSearchQuery.toLowerCase().trim();
    return (
      (c.name || "").toLowerCase().includes(query) ||
      (c.phone || "").replace(/\D/g, "").includes(query.replace(/\D/g, "")) ||
      (c.city || "").toLowerCase().includes(query) ||
      (c.ice || "").toLowerCase().includes(query)
    );
  });

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", description: "", quantity: 1, unit: "U", unit_price: 0, tax_rate: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectService = (index: number, serviceIdStr: string) => {
    if (!serviceIdStr) return;
    const serviceId = Number(serviceIdStr);
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              service_id: service.id,
              name: service.name_fr,
              description: service.description_fr || "",
              unit: service.default_unit || "U",
              unit_price: service.default_price || 0,
              tax_rate: 0,
            }
          : it
      )
    );
  };

  const handleItemChange = <K extends keyof ItemRow>(
    index: number,
    field: K,
    value: ItemRow[K]
  ) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const calculateSubtotalCents = () => {
    return items.reduce((acc, it) => {
      const lineCents = toCents(it.quantity * it.unit_price);
      return acc + lineCents;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedClient || !selectedClient.id) {
      setFormError("Veuillez sélectionner un client.");
      return;
    }

    const validItems = items.filter((it) => it.name.trim() !== "" && it.quantity > 0);
    if (validItems.length === 0) {
      setFormError("Veuillez remplir au moins une prestation avec un nom valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: QuotationCreateInput = {
        status: "draft",
        currency,
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_type: selectedClient.type,
        client_contact_person: selectedClient.contact_person,
        client_phone: selectedClient.phone,
        client_address: selectedClient.address,
        client_city: selectedClient.city,
        client_email: selectedClient.email,
        client_ice: selectedClient.ice,
        client_if: selectedClient.if_tax,
        client_rc: selectedClient.rc,
        valid_until_date: validUntilDate,
        notes,
        items: validItems.map((it, idx) => ({
          service_id: it.service_id,
          position: idx,
          name: it.name,
          description: it.description,
          unit: it.unit,
          quantity: Number(it.quantity) || 1,
          unit_price_cents: toCents(it.unit_price),
          tax_rate: Number(it.tax_rate) || 0,
        })),
      };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Erreur lors de la création du devis."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCents = calculateSubtotalCents();

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">Nouveau devis</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Créez un devis estimatif pour votre client.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-2 text-xs font-medium">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Client Selection Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Client destinataire <span className="text-rose-500">*</span>
                </label>

                <button
                  type="button"
                  id="btn-quotation-add-client"
                  onClick={() => setIsNewClientModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Nouveau client</span>
                </button>
              </div>

              {selectedClient ? (
                /* Selected Client Preview Card */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        selectedClient.type === "company"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {selectedClient.type === "company" ? (
                        <Building2 size={18} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {selectedClient.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {selectedClient.type === "company" ? "Entreprise" : "Particulier"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                        {selectedClient.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={12} className="text-slate-400" />
                            {selectedClient.phone}
                          </span>
                        )}
                        {selectedClient.city && (
                          <span>· {selectedClient.city}</span>
                        )}
                        {selectedClient.ice && (
                          <span className="font-mono text-[11px] text-slate-600">
                            · ICE: {selectedClient.ice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-change-quotation-client"
                      onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Changer</span>
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Client Picker Dropdown / Search */}
              {(!selectedClient || isClientDropdownOpen) && (
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm animate-in fade-in duration-150">
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      id="search-quotation-client-input"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Rechercher par nom, téléphone, ICE, ville..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((c) => {
                        const isSelected = selectedClient?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedClient(c);
                              setIsClientDropdownOpen(false);
                              setClientSearchQuery("");
                              setFormError(null);
                            }}
                            className={`w-full p-2.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-blue-50/80 text-blue-900"
                                : "hover:bg-slate-50 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  c.type === "company"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {c.type === "company" ? (
                                  <Building2 size={13} />
                                ) : (
                                  <User size={13} />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold">{c.name}</div>
                                <div className="text-[11px] text-slate-500">
                                  {c.phone || c.city || (c.type === "company" ? "Entreprise" : "Particulier")}
                                  {c.ice ? ` · ICE: ${c.ice}` : ""}
                                </div>
                              </div>
                            </div>

                            {isSelected && (
                              <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        <p>Aucun client trouvé pour "{clientSearchQuery}".</p>
                        <button
                          type="button"
                          onClick={() => setIsNewClientModalOpen(true)}
                          className="mt-2 text-blue-600 hover:underline font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus size={13} />
                          <span>Créer le client "{clientSearchQuery}"</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Prestations / Lignes <span className="text-rose-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Ajouter une ligne</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 relative group"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Catalog Pre-select */}
                      {services.length > 0 && (
                        <div className="sm:col-span-12">
                          <select
                            onChange={(e) => handleSelectService(index, e.target.value)}
                            className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-blue-600"
                          >
                            <option value="">-- Choisir depuis le catalogue de prestations --</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name_fr} ({formatMoney(s.default_price * 100, currency, true)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Designation */}
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, "name", e.target.value)}
                          placeholder="Désignation de la prestation *"
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Qté"
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 text-center"
                          required
                        />
                      </div>

                      {/* Price Unit */}
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)
                          }
                          placeholder="Prix U. (MAD)"
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600 text-right"
                          required
                        />
                      </div>

                      {/* Delete Item */}
                      <div className="sm:col-span-1 flex items-center justify-end">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Description optionnelle..."
                        className="w-full py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Validity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Valide jusqu'au
                </label>
                <input
                  type="date"
                  value={validUntilDate}
                  onChange={(e) => setValidUntilDate(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Notes ou conditions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ex: Acompte de 30% à la commande"
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Footer Total Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Total du devis :
              </span>
              <span className="text-xl font-black font-mono text-blue-400">
                {formatMoney(totalCents, currency, true)}
              </span>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                id="btn-submit-create-quotation"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                {isSubmitting ? "Enregistrement..." : "Créer le devis"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Add Client Modal */}
      {isNewClientModalOpen && (
        <ClientFormModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onSubmit={handleCreateNewClientSubmit}
          clientToEdit={null}
        />
      )}
    </>
  );
};

