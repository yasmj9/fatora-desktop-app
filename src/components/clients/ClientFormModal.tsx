import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Sparkles,
} from "lucide-react";
import {
  Client,
  ClientCreateInput,
  ClientType,
  COMMON_MOROCCAN_CITIES,
} from "../../types/client";
import { clientSchema, ClientFormData } from "../../schemas/clientSchema";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientCreateInput) => Promise<void>;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clientToEdit,
}) => {
  const [showMoreInfo, setShowMoreInfo] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(clientToEdit);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      type: "individual",
      name: "",
      phone: "",
      contact_person: "",
      address: "",
      city: "Casablanca",
      email: "",
      ice: "",
      if_tax: "",
      rc: "",
      notes: "",
      is_active: 1,
    },
  });

  const selectedType = watch("type") as ClientType;

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        reset({
          type: clientToEdit.type || "individual",
          name: clientToEdit.name || "",
          phone: clientToEdit.phone || "",
          contact_person: clientToEdit.contact_person || "",
          address: clientToEdit.address || "",
          city: clientToEdit.city || "",
          email: clientToEdit.email || "",
          ice: clientToEdit.ice || "",
          if_tax: clientToEdit.if_tax || "",
          rc: clientToEdit.rc || "",
          notes: clientToEdit.notes || "",
          is_active: clientToEdit.is_active ?? 1,
        });

        // Automatically expand if extra information is populated
        if (
          clientToEdit.contact_person ||
          clientToEdit.address ||
          clientToEdit.email ||
          clientToEdit.ice ||
          clientToEdit.if_tax ||
          clientToEdit.rc ||
          clientToEdit.notes ||
          clientToEdit.type === "company"
        ) {
          setShowMoreInfo(true);
        } else {
          setShowMoreInfo(false);
        }
      } else {
        reset({
          type: "individual",
          name: "",
          phone: "",
          contact_person: "",
          address: "",
          city: "Casablanca",
          email: "",
          ice: "",
          if_tax: "",
          rc: "",
          notes: "",
          is_active: 1,
        });
        setShowMoreInfo(false);
      }
      setSubmitError(null);
    }
  }, [isOpen, clientToEdit, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        type: data.type,
        name: data.name.trim(),
        phone: data.phone.trim(),
        contact_person: data.contact_person.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        email: data.email.trim(),
        ice: data.ice.trim(),
        if_tax: data.if_tax.trim(),
        rc: data.rc.trim(),
        notes: data.notes.trim(),
        is_active: data.is_active ?? 1,
      });
      onClose();
    } catch (err: unknown) {
      console.error("Submit client error:", err);
      const msg =
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="client-form-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {selectedType === "company" ? (
                <Building2 size={20} />
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEditing ? "Modifier le client" : "Nouveau client"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? "Modifiez les coordonnées et informations de facturation du client."
                  : "Ajoutez un contact ou une entreprise à votre carnet d'adresses."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            {submitError}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Client Type Segmented Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Type de client
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                id="client-type-individual"
                onClick={() => setValue("type", "individual")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  selectedType === "individual"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <User size={18} />
                <span>Particulier</span>
              </button>
              <button
                type="button"
                id="client-type-company"
                onClick={() => {
                  setValue("type", "company");
                  setShowMoreInfo(true);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  selectedType === "company"
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Building2 size={18} />
                <span>Entreprise / Société</span>
              </button>
            </div>
          </div>

          {/* Core Essential Fields: Nom & Téléphone */}
          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                {selectedType === "company"
                  ? "Raison sociale / Nom de l'entreprise"
                  : "Nom & Prénom du client"}{" "}
                <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("name")}
                  type="text"
                  placeholder={
                    selectedType === "company"
                      ? "Ex: BATI-MAROC SARL, Ste Electro-Sud..."
                      : "Ex: Ahmed Bennani, M. Karim..."
                  }
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 focus:ring-blue-200"
                  } focus:outline-hidden focus:ring-4 focus:border-blue-600 text-slate-900 text-base font-semibold placeholder:text-slate-400`}
                />
              </div>
              {errors.name && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Numéro de téléphone <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="Ex: 06 61 23 45 67 ou 05 22 12 34 56"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
                    errors.phone
                      ? "border-rose-400 focus:ring-rose-200"
                      : "border-slate-300 focus:ring-blue-200"
                  } focus:outline-hidden focus:ring-4 focus:border-blue-600 text-slate-900 text-base font-semibold placeholder:text-slate-400`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Progressive Disclosure Section: 'Plus d'informations' */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              id="btn-toggle-client-more-info"
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-100/70 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={18} className="text-blue-600" />
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    Plus d'informations (Adresse, Ville, ICE, Email, Notes...)
                  </span>
                  <span className="ml-2 text-xs text-slate-500 font-normal">
                    {showMoreInfo ? "Facultatif" : "Cliquer pour afficher"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <span>{showMoreInfo ? "Masquer" : "Afficher"}</span>
                {showMoreInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showMoreInfo && (
              <div className="p-5 space-y-5 bg-white border-t border-slate-200">
                {/* Contact person & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {selectedType === "company"
                        ? "Interlocuteur / Contact dans l'entreprise"
                        : "Nom du contact secondaire"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserPlus size={16} />
                      </div>
                      <input
                        {...register("contact_person")}
                        type="text"
                        placeholder="Ex: M. Karim (Responsable achats)"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="Ex: client@gmail.com"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                          errors.email ? "border-rose-400" : "border-slate-300"
                        } focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* City & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ville
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MapPin size={16} />
                      </div>
                      <input
                        {...register("city")}
                        type="text"
                        list="moroccan-cities-list"
                        placeholder="Ex: Casablanca"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800"
                      />
                      <datalist id="moroccan-cities-list">
                        {COMMON_MOROCCAN_CITIES.map((city) => (
                          <option key={city} value={city} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse complète ou quartier
                    </label>
                    <input
                      {...register("address")}
                      type="text"
                      placeholder="Ex: 25 Bd Zerktouni, Maarif, Casablanca"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800"
                    />
                  </div>
                </div>

                {/* Moroccan Legal & Fiscal Identifiers (ICE, IF, RC) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Identifiants fiscaux du client (Optionnel / Pour factures pro)
                    </span>
                    <span className="text-[11px] text-slate-500">Maroc</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        ICE (15 chiffres)
                      </label>
                      <input
                        {...register("ice")}
                        type="text"
                        maxLength={15}
                        placeholder="Ex: 001234567000089"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        IF (Identifiant Fiscal)
                      </label>
                      <input
                        {...register("if_tax")}
                        type="text"
                        placeholder="Ex: 40129876"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        RC (Registre de Commerce)
                      </label>
                      <input
                        {...register("rc")}
                        type="text"
                        placeholder="Ex: 189452 Casa"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes & Internal Remarks */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes ou remarques internes sur le client
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={2}
                    placeholder="Instructions d'accès au chantier, conditions de paiement convenues, préférences..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800 resize-y placeholder:text-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-save-client"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enregistrement...</span>
              ) : isEditing ? (
                <span>Enregistrer les modifications</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Ajouter le client</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
