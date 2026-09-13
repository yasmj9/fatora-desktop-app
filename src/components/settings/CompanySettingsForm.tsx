import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Sliders,
  FileText,
  ShieldAlert,
  Image as ImageIcon,
  ArrowRight,
  Hash,
} from "lucide-react";
import { companySettingsSchema, CompanySettingsFormData } from "../../schemas/companySchema";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import { useLogos } from "../../hooks/useLogos";
import { formatInvoiceNumber } from "../../utils/invoiceNumberFormatter";

interface CompanySettingsFormProps {
  onGoToLogos?: () => void;
  onGoToNumbering?: () => void;
}

export const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ onGoToLogos, onGoToNumbering }) => {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings, clearMessages } =
    useCompanySettings();
  const { defaultLogo } = useLogos();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      country: "Maroc",
      contact_person: "",
      email: "",
      website: "",
      ice: "",
      if_tax: "",
      rc: "",
      patente: "",
      cnss: "",
      bank_name: "",
      rib_iban: "",
      currency: "MAD",
      document_language: "fr",
      invoice_prefix: "FAC",
      invoice_pattern: "{PREFIX}-{YEAR}-{SEQ}",
      invoice_sequence_padding: 4,
      invoice_next_number: 1,
    },
  });

  // Populate form values whenever database settings are loaded
  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name || "",
        phone: settings.phone || "",
        address: settings.address || "",
        city: settings.city || "",
        country: settings.country || "Maroc",
        contact_person: settings.contact_person || "",
        email: settings.email || "",
        website: settings.website || "",
        ice: settings.ice || "",
        if_tax: settings.if_tax || "",
        rc: settings.rc || "",
        patente: settings.patente || "",
        cnss: settings.cnss || "",
        bank_name: settings.bank_name || "",
        rib_iban: settings.rib_iban || "",
        currency: settings.currency || "MAD",
        document_language: (settings.document_language as "fr" | "ar" | "en") || "fr",
        invoice_prefix: settings.invoice_prefix !== undefined && settings.invoice_prefix !== null ? settings.invoice_prefix : "FAC",
        invoice_pattern: settings.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}",
        invoice_sequence_padding: Number(settings.invoice_sequence_padding) || 4,
        invoice_next_number: Number(settings.invoice_next_number) || 1,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: CompanySettingsFormData) => {
    clearMessages();
    await saveSettings(data);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
        <p className="text-slate-600 text-sm font-medium">
          Chargement des coordonnées de votre entreprise...
        </p>
      </div>
    );
  }

  const isConfigured = Boolean(settings.name && settings.phone);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* Feedback Messages */}
      {successMessage && (
        <div
          id="company-settings-success-alert"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-xs"
        >
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900">Enregistrement réussi</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {error && (
        <div
          id="company-settings-error-alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 shadow-xs"
        >
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-900">Erreur d'enregistrement</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold px-2 py-1 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* CARD 1: COMPANY INFORMATION + ICE & RC */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Informations de l'entreprise
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ces coordonnées et numéros légaux (ICE, RC) apparaîtront sur vos devis et factures.
              </p>
            </div>
          </div>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold w-fit">
              <CheckCircle size={14} /> Configuré
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold w-fit">
              <ShieldAlert size={14} /> À compléter
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nom de l'entreprise */}
          <div className="md:col-span-2">
            <label
              htmlFor="company-name-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Nom de l'entreprise <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="company-name-input"
                type="text"
                {...register("name")}
                placeholder="Ex: Mon Entreprise SARL"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label
              htmlFor="company-phone-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Téléphone <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="company-phone-input"
                type="text"
                {...register("phone")}
                placeholder="Ex: 06 61 23 45 67"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.phone.message}
              </p>
            )}
          </div>

          {/* Ville */}
          <div>
            <label
              htmlFor="company-city-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Ville
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="company-city-input"
                type="text"
                {...register("city")}
                placeholder="Ex: Casablanca"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="md:col-span-2">
            <label
              htmlFor="company-address-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Adresse
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3.5 top-3 text-slate-400"
              />
              <textarea
                id="company-address-input"
                rows={2}
                {...register("address")}
                placeholder="Ex: 12 Boulevard Mohammed V"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>
          </div>

          {/* ICE */}
          <div>
            <label
              htmlFor="company-ice-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              ICE (Identifiant Commun de l'Entreprise)
            </label>
            <div className="relative">
              <FileText
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="company-ice-input"
                type="text"
                {...register("ice")}
                placeholder="Ex: 001234567000089"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* RC */}
          <div>
            <label
              htmlFor="company-rc-input"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              RC (Registre du Commerce)
            </label>
            <div className="relative">
              <FileText
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="company-rc-input"
                type="text"
                {...register("rc")}
                placeholder="Ex: 123456 Casablanca"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: DOCUMENT PREFERENCES (CURRENCY, LANGUAGE & LOGO) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
            <Sliders size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Préférences par défaut des documents
            </h4>
            <p className="text-xs text-slate-500">
              Devise monétaire et langue d'édition par défaut pour vos factures et devis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Devise */}
          <div>
            <label
              htmlFor="company-currency-select"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Devise par défaut
            </label>
            <select
              id="company-currency-select"
              {...register("currency")}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
            >
              <option value="MAD">MAD - Dirham Marocain (د.م.)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="USD">USD - Dollar ($)</option>
            </select>
          </div>

          {/* Langue */}
          <div>
            <label
              htmlFor="company-language-select"
              className="block text-xs font-bold text-slate-700 mb-1.5"
            >
              Langue des documents par défaut
            </label>
            <select
              id="company-language-select"
              {...register("document_language")}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
            >
              <option value="fr">Français (par défaut)</option>
              <option value="ar">Arabe (العربية)</option>
              <option value="en">Anglais (English)</option>
            </select>
          </div>
        </div>

        {/* LOGO PREVIEW SHORTCUT */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            {defaultLogo ? (
              <div className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                <img src={defaultLogo.file_data} alt={defaultLogo.name} className="max-h-10 max-w-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                <ImageIcon size={22} />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-slate-900">
                {defaultLogo ? `Logo d'en-tête : ${defaultLogo.name}` : "Aucun logo d'en-tête configuré"}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {defaultLogo
                  ? "Ce logo apparaîtra automatiquement sur vos devis et factures."
                  : "Ajoutez un logo pour personnaliser vos devis et factures."}
              </p>
            </div>
          </div>

          {onGoToLogos && (
            <button
              type="button"
              id="btn-manage-logos-shortcut"
              onClick={onGoToLogos}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span>{defaultLogo ? "Gérer mes logos" : "Ajouter un logo"}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* INVOICE NUMBERING SHORTCUT */}
        <div className="mt-3 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Hash size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Format de numérotation actif :</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded text-blue-700 border border-slate-200 text-xs font-bold">
                  {formatInvoiceNumber({
                    prefix: settings.invoice_prefix !== undefined && settings.invoice_prefix !== null ? settings.invoice_prefix : "FAC",
                    pattern: settings.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}",
                    sequenceNumber: Number(settings.invoice_next_number) || 1,
                    padding: Number(settings.invoice_sequence_padding) || 4,
                  })}
                </code>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Personnalisez la structure (ex: <code className="font-mono">001/2026</code> ou <code className="font-mono">FACT-00001-2026</code>) dans l'onglet dédié.
              </p>
            </div>
          </div>

          {onGoToNumbering && (
            <button
              type="button"
              id="btn-manage-numbering-shortcut"
              onClick={onGoToNumbering}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-blue-700 border border-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <span>Personnaliser le format</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SAVE ACTION BAR */}
      <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between gap-4">
        <div className="hidden sm:block text-xs text-slate-500 font-medium">
          {isDirty ? (
            <span className="text-amber-600 font-semibold">
              ● Modifications non enregistrées
            </span>
          ) : (
            <span className="text-slate-500">
              Dernière mise à jour enregistrée localement
            </span>
          )}
        </div>

        <button
          id="btn-save-company-settings"
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-xs min-h-[48px]"
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Enregistrement en cours...</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>Enregistrer les modifications</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
