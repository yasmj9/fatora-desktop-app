import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  Languages,
  ChevronDown,
  ChevronUp,
  Coins,
  Tag,
  Layers,
  Sparkles,
} from "lucide-react";
import { Service, ServiceCreateInput, COMMON_SERVICE_UNITS } from "../../types/service";
import { serviceSchema, ServiceFormData } from "../../schemas/serviceSchema";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ServiceCreateInput) => Promise<void>;
  serviceToEdit?: Service | null;
  currency?: string;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceToEdit,
  currency = "MAD",
}) => {
  const [showTranslations, setShowTranslations] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = Boolean(serviceToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      code: "",
      name_fr: "",
      description_fr: "",
      name_ar: "",
      description_ar: "",
      name_en: "",
      description_en: "",
      default_unit: "Unité",
      default_price: 0,
      is_active: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (serviceToEdit) {
        reset({
          code: serviceToEdit.code || "",
          name_fr: serviceToEdit.name_fr || "",
          description_fr: serviceToEdit.description_fr || "",
          name_ar: serviceToEdit.name_ar || "",
          description_ar: serviceToEdit.description_ar || "",
          name_en: serviceToEdit.name_en || "",
          description_en: serviceToEdit.description_en || "",
          default_unit: serviceToEdit.default_unit || "Unité",
          default_price: serviceToEdit.default_price ?? 0,
          is_active: serviceToEdit.is_active ?? 1,
        });
        // Auto expand translations if any exist
        if (
          serviceToEdit.name_ar ||
          serviceToEdit.description_ar ||
          serviceToEdit.name_en ||
          serviceToEdit.description_en
        ) {
          setShowTranslations(true);
        } else {
          setShowTranslations(false);
        }
      } else {
        reset({
          code: "",
          name_fr: "",
          description_fr: "",
          name_ar: "",
          description_ar: "",
          name_en: "",
          description_en: "",
          default_unit: "Unité",
          default_price: 0,
          is_active: 1,
        });
        setShowTranslations(false);
      }
      setSubmitError(null);
    }
  }, [isOpen, serviceToEdit, reset]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: ServiceFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        code: data.code.trim(),
        name_fr: data.name_fr.trim(),
        description_fr: data.description_fr.trim(),
        name_ar: data.name_ar.trim(),
        description_ar: data.description_ar.trim(),
        name_en: data.name_en.trim(),
        description_en: data.description_en.trim(),
        default_unit: data.default_unit.trim() || "Unité",
        default_price: Number(data.default_price) || 0,
        is_active: data.is_active ?? 1,
      });
      onClose();
    } catch (err: unknown) {
      console.error("Submit service error:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="service-form-modal"
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditing ? "Modifier le service" : "Nouveau service"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? "Mettez à jour les informations et le tarif de base de cette prestation."
                : "Ajoutez une prestation habituelle à votre catalogue pour vos futurs devis et factures."}
            </p>
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
          {/* Main French Information */}
          <div className="space-y-4">
            {/* Nom du service */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-1.5">
                Nom de la prestation (Français) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("name_fr")}
                  type="text"
                  placeholder="Ex: Installation caméra de surveillance, Pose carrelage..."
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name_fr ? "border-rose-400 focus:ring-rose-200" : "border-slate-300 focus:ring-blue-200"
                  } focus:outline-hidden focus:ring-4 focus:border-blue-600 text-slate-900 text-base font-medium placeholder:text-slate-400`}
                />
              </div>
              {errors.name_fr && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5">
                  {errors.name_fr.message}
                </p>
              )}
            </div>

            {/* Code / Reference & Unit & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Reference/Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Code / Référence <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Tag size={16} />
                  </div>
                  <input
                    {...register("code")}
                    type="text"
                    placeholder="Ex: ELEC-004"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800"
                  />
                </div>
              </div>

              {/* Default Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prix par défaut ({currency}) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Coins size={16} />
                  </div>
                  <input
                    {...register("default_price", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                      errors.default_price ? "border-rose-400" : "border-slate-300"
                    } focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm font-bold text-slate-900`}
                  />
                </div>
                {errors.default_price && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.default_price.message}
                  </p>
                )}
              </div>

              {/* Default Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unité de facturation <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Layers size={16} />
                  </div>
                  <input
                    {...register("default_unit")}
                    type="text"
                    list="service-units-list"
                    placeholder="Ex: Unité, Forfait"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800"
                  />
                  <datalist id="service-units-list">
                    {COMMON_SERVICE_UNITS.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Description (Français) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description de la prestation (Français) <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                {...register("description_fr")}
                rows={3}
                placeholder="Détails des travaux inclus dans cette prestation, fournitures ou modalités d'intervention..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-3 focus:ring-blue-100 focus:border-blue-600 text-sm text-slate-800 resize-y placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Collapsible Translations Section */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              id="btn-toggle-translations"
              onClick={() => setShowTranslations(!showTranslations)}
              className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-100/70 hover:bg-slate-100 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Languages size={18} className="text-blue-600" />
                <div>
                  <span className="text-sm font-bold text-slate-800">
                    Traductions (Arabe & Anglais)
                  </span>
                  <span className="ml-2 text-xs text-slate-500 font-normal">
                    Facultatif
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <span>{showTranslations ? "Masquer" : "Afficher"}</span>
                {showTranslations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showTranslations && (
              <div className="p-5 space-y-5 bg-white border-t border-slate-200">
                {/* Arabic Section */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Arabe (العربية)
                    </span>
                    <span className="text-[11px] text-amber-700 font-medium">Pour documents en arabe</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom en arabe (اسم الخدمة)
                    </label>
                    <input
                      {...register("name_ar")}
                      dir="rtl"
                      type="text"
                      placeholder="مثال: تركيب كاميرا مراقبة"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm text-right font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description en arabe (وصف الخدمة)
                    </label>
                    <textarea
                      {...register("description_ar")}
                      dir="rtl"
                      rows={2}
                      placeholder="تفاصيل الخدمة والأشغال المشمولة..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm text-right"
                    />
                  </div>
                </div>

                {/* English Section */}
                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Anglais (English)
                    </span>
                    <span className="text-[11px] text-sky-700 font-medium">For international clients</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Service name in English
                    </label>
                    <input
                      {...register("name_en")}
                      type="text"
                      placeholder="E.g.: Security camera installation"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description in English
                    </label>
                    <textarea
                      {...register("description_en")}
                      rows={2}
                      placeholder="Details of services, installation steps or materials included..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
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
              id="btn-save-service"
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
                  <span>Créer le service</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
