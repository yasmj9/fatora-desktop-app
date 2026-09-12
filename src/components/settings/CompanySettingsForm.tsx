import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Phone,
  MapPin,
  Mail,
  Globe,
  FileCheck,
  CreditCard,
  Sliders,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  ShieldAlert,
} from "lucide-react";
import { companySettingsSchema, CompanySettingsFormData } from "../../schemas/companySchema";
import { useCompanySettings } from "../../hooks/useCompanySettings";

export const CompanySettingsForm: React.FC = () => {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings, clearMessages } =
    useCompanySettings();

  // Accordion state for advanced / optional sections to keep the UI clean and uncluttered
  const [showLegalSection, setShowLegalSection] = useState(false);
  const [showBankSection, setShowBankSection] = useState(false);
  const [showContactSection, setShowContactSection] = useState(false);

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
      });

      // Automatically open sections if existing data exists in them
      if (settings.ice || settings.if_tax || settings.rc || settings.patente || settings.cnss) {
        setShowLegalSection(true);
      }
      if (settings.bank_name || settings.rib_iban) {
        setShowBankSection(true);
      }
      if (settings.contact_person || settings.email || settings.website) {
        setShowContactSection(true);
      }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1"
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
            className="text-rose-700 hover:text-rose-900 text-xs font-semibold px-2 py-1"
          >
            Fermer
          </button>
        </div>
      )}

      {/* SECTION 1: ESSENTIAL & PRIORITIZED INFORMATION */}
      <div className="bg-white rounded-2xl border-2 border-blue-200/70 p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Informations principales de votre entreprise
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ces coordonnées indispensables figureront sur l'en-tête de tous vos devis et factures.
              </p>
            </div>
          </div>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold w-fit">
              <CheckCircle size={14} /> Profil configuré
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
              className="block text-sm font-bold text-slate-800 mb-1.5"
            >
              Nom de votre entreprise ou atelier <span className="text-rose-600">*</span>
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
                placeholder="Ex: Électricité Bennis, Menuiserie de l'Atlas, Plomberie Moderne..."
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div className="md:col-span-1">
            <label
              htmlFor="company-phone-input"
              className="block text-sm font-bold text-slate-800 mb-1.5"
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
                placeholder="Ex: 06 61 23 45 67 ou 05 22 10 20 30"
                className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-300 focus:ring-blue-500/20 focus:border-blue-600"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle size={14} /> {errors.phone.message}
              </p>
            )}
          </div>

          {/* Ville */}
          <div className="md:col-span-1">
            <label
              htmlFor="company-city-input"
              className="block text-sm font-bold text-slate-800 mb-1.5"
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
                placeholder="Ex: Casablanca, Rabat, Marrakech, Fès, Tanger..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Adresse complète */}
          <div className="md:col-span-2">
            <label
              htmlFor="company-address-input"
              className="block text-sm font-bold text-slate-800 mb-1.5"
            >
              Adresse de l'atelier ou bureau
            </label>
            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3.5 top-3.5 text-slate-400"
              />
              <textarea
                id="company-address-input"
                rows={2}
                {...register("address")}
                placeholder="Ex: 24 Rue des Artisans, Quartier Industriel Sidi Bernoussi"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTACT & WEB (COLLAPSIBLE / CLEAR SEPARATION) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          type="button"
          id="btn-toggle-contact-section"
          onClick={() => setShowContactSection(!showContactSection)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <User size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Contact & Présence en ligne (Facultatif)
              </h4>
              <p className="text-xs text-slate-500">
                Responsable, adresse e-mail et site web.
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showContactSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showContactSection && (
          <div className="p-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
            {/* Responsable */}
            <div>
              <label
                htmlFor="company-contact-person-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Nom du responsable / Artisan
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="company-contact-person-input"
                  type="text"
                  {...register("contact_person")}
                  placeholder="Ex: Hassan Bennis"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="company-email-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="company-email-input"
                  type="email"
                  {...register("email")}
                  placeholder="Ex: contact@electricite-bennis.ma"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-600"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Site Web */}
            <div>
              <label
                htmlFor="company-website-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Site internet ou page professionnelle
              </label>
              <div className="relative">
                <Globe
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="company-website-input"
                  type="text"
                  {...register("website")}
                  placeholder="Ex: www.electricite-bennis.ma"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label
                htmlFor="company-country-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Pays
              </label>
              <input
                id="company-country-input"
                type="text"
                {...register("country")}
                placeholder="Maroc"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: LEGAL & TAX IDENTIFIERS (MAROC) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          type="button"
          id="btn-toggle-legal-section"
          onClick={() => setShowLegalSection(!showLegalSection)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <FileCheck size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Identifiants légaux & fiscaux (Facultatif)
              </h4>
              <p className="text-xs text-slate-500">
                ICE, IF, RC, Patente et CNSS (mentions légales au bas des factures).
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showLegalSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showLegalSection && (
          <div className="p-6 border-t border-slate-200 space-y-4 bg-white">
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              💡 Renseignez uniquement les numéros dont vous disposez. Si vous êtes auto-entrepreneur ou artisan indépendant non assujetti, vous pouvez laisser ces cases vides.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ICE */}
              <div>
                <label
                  htmlFor="company-ice-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  ICE (Identifiant Commun de l'Entreprise)
                </label>
                <input
                  id="company-ice-input"
                  type="text"
                  {...register("ice")}
                  placeholder="Ex: 001234567000089 (15 chiffres)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* IF */}
              <div>
                <label
                  htmlFor="company-if-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  IF (Identifiant Fiscal)
                </label>
                <input
                  id="company-if-input"
                  type="text"
                  {...register("if_tax")}
                  placeholder="Ex: 12345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* RC */}
              <div>
                <label
                  htmlFor="company-rc-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  RC (Registre du Commerce)
                </label>
                <input
                  id="company-rc-input"
                  type="text"
                  {...register("rc")}
                  placeholder="Ex: 123456 Casablanca"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Patente */}
              <div>
                <label
                  htmlFor="company-patente-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Patente / Taxe Professionnelle
                </label>
                <input
                  id="company-patente-input"
                  type="text"
                  {...register("patente")}
                  placeholder="Ex: 34567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* CNSS */}
              <div className="md:col-span-2">
                <label
                  htmlFor="company-cnss-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  N° CNSS
                </label>
                <input
                  id="company-cnss-input"
                  type="text"
                  {...register("cnss")}
                  placeholder="Ex: 7890123"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: BANK DETAILS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <button
          type="button"
          id="btn-toggle-bank-section"
          onClick={() => setShowBankSection(!showBankSection)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Coordonnées bancaires pour vos virements (Facultatif)
              </h4>
              <p className="text-xs text-slate-500">
                Affichez votre RIB sur les factures pour faciliter les paiements par virement.
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            {showBankSection ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {showBankSection && (
          <div className="p-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
            {/* Nom de la banque */}
            <div className="md:col-span-1">
              <label
                htmlFor="company-bank-name-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Nom de votre banque
              </label>
              <input
                id="company-bank-name-input"
                type="text"
                {...register("bank_name")}
                placeholder="Ex: Attijariwafa bank, Banque Populaire, CIH..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* RIB / IBAN */}
            <div className="md:col-span-1">
              <label
                htmlFor="company-rib-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                RIB (Relevé d'Identité Bancaire / 24 chiffres)
              </label>
              <input
                id="company-rib-input"
                type="text"
                {...register("rib_iban")}
                placeholder="Ex: 007 780 0001234567890123 45"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 5: DOCUMENT PREFERENCES (CURRENCY & LANGUAGE) */}
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

          {/* Langue des documents */}
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
