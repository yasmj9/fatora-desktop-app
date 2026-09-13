import React, { useState, useEffect } from "react";
import {
  Palette,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
  Eye,
  Sliders,
  Building2,
  FileText,
  Sparkles,
  Info,
} from "lucide-react";
import { useInvoiceStyles } from "../../hooks/useInvoiceStyles";
import { useLogos } from "../../hooks/useLogos";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import { StyleRenderer } from "../invoiceStyles/StyleRenderer";
import { InvoiceStyle, InvoiceStyleUpdateInput } from "../../types/invoiceStyle";

// Preset Color Palettes for Quick Selection
const COLOR_PRESETS = [
  { name: "Bleu Institutionnel", primary: "#1e3a8a", header: "#f8fafc", accent: "#2563eb", footer: "#f1f5f9" },
  { name: "Émeraude Moderne", primary: "#065f46", header: "#f0fdf4", accent: "#059669", footer: "#ecfdf5" },
  { name: "Anthracite Épuré", primary: "#0f172a", header: "#ffffff", accent: "#0d9488", footer: "#f8fafc" },
  { name: "Bordeau Prestige", primary: "#831843", header: "#fdf2f8", accent: "#db2777", footer: "#fce7f3" },
  { name: "Sable & Bronze", primary: "#78350f", header: "#fffbeb", accent: "#d97706", footer: "#fef3c7" },
];

export const InvoiceStyleManager: React.FC = () => {
  const {
    styles,
    defaultStyle,
    selectedStyle,
    setSelectedStyle,
    isLoading,
    isSaving,
    error,
    successMessage,
    updateStyleConfig,
    setDefaultStyle,
    clearMessages,
  } = useInvoiceStyles();

  const { logos, defaultLogo } = useLogos();
  const { settings: companySettings } = useCompanySettings();

  // Draft editing state for the currently active style
  const [draftStyle, setDraftStyle] = useState<InvoiceStyleUpdateInput>({});
  const [selectedLogoOverride, setSelectedLogoOverride] = useState<string | null>(null);

  // Sync draft state whenever selectedStyle changes
  useEffect(() => {
    if (selectedStyle) {
      setDraftStyle({
        name: selectedStyle.name,
        logo_id: selectedStyle.logo_id,
        primary_color: selectedStyle.primary_color,
        header_color: selectedStyle.header_color,
        accent_color: selectedStyle.accent_color,
        footer_color: selectedStyle.footer_color,
        footer_text: selectedStyle.footer_text,
        show_ice: selectedStyle.show_ice,
        show_tax_id: selectedStyle.show_tax_id,
        show_rc: selectedStyle.show_rc,
        show_cnss: selectedStyle.show_cnss,
        show_iban: selectedStyle.show_iban,
        show_phone: selectedStyle.show_phone,
        show_email: selectedStyle.show_email,
        show_address: selectedStyle.show_address,
      });
    }
  }, [selectedStyle]);

  // Compute effective logo image string to display in live preview
  useEffect(() => {
    if (!selectedStyle) return;

    const logoId = draftStyle.logo_id !== undefined ? draftStyle.logo_id : selectedStyle.logo_id;

    if (logoId === null) {
      // Use company default active logo
      setSelectedLogoOverride(defaultLogo ? defaultLogo.file_data : null);
    } else {
      const match = logos.find((l) => l.id === logoId);
      setSelectedLogoOverride(match ? match.file_data : null);
    }
  }, [draftStyle.logo_id, selectedStyle, defaultLogo, logos]);

  if (isLoading || !selectedStyle) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Chargement des styles de factures...</p>
      </div>
    );
  }

  // Construct temporary style object for live preview
  const previewStyleObject: InvoiceStyle = {
    ...selectedStyle,
    ...draftStyle,
    logo_id: draftStyle.logo_id !== undefined ? draftStyle.logo_id : selectedStyle.logo_id,
    primary_color: draftStyle.primary_color || selectedStyle.primary_color,
    header_color: draftStyle.header_color || selectedStyle.header_color,
    accent_color: draftStyle.accent_color || selectedStyle.accent_color,
    footer_color: draftStyle.footer_color || selectedStyle.footer_color,
    footer_text: draftStyle.footer_text !== undefined ? draftStyle.footer_text : selectedStyle.footer_text,
    show_ice: draftStyle.show_ice !== undefined ? draftStyle.show_ice : selectedStyle.show_ice,
    show_tax_id: draftStyle.show_tax_id !== undefined ? draftStyle.show_tax_id : selectedStyle.show_tax_id,
    show_rc: draftStyle.show_rc !== undefined ? draftStyle.show_rc : selectedStyle.show_rc,
    show_cnss: draftStyle.show_cnss !== undefined ? draftStyle.show_cnss : selectedStyle.show_cnss,
    show_iban: draftStyle.show_iban !== undefined ? draftStyle.show_iban : selectedStyle.show_iban,
    show_phone: draftStyle.show_phone !== undefined ? draftStyle.show_phone : selectedStyle.show_phone,
    show_email: draftStyle.show_email !== undefined ? draftStyle.show_email : selectedStyle.show_email,
    show_address: draftStyle.show_address !== undefined ? draftStyle.show_address : selectedStyle.show_address,
  };

  const handleApplyPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    setDraftStyle((prev) => ({
      ...prev,
      primary_color: preset.primary,
      header_color: preset.header,
      accent_color: preset.accent,
      footer_color: preset.footer,
    }));
  };

  const handleSaveChanges = async () => {
    clearMessages();
    try {
      await updateStyleConfig(selectedStyle.id, draftStyle);
    } catch {
      // Error is caught and displayed by hook
    }
  };

  const handleSetDefault = async () => {
    clearMessages();
    try {
      await setDefaultStyle(selectedStyle.id);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Palette size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Style des factures</h3>
                {defaultStyle && (
                  <span className="text-xs bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                    <Star size={12} className="fill-emerald-600 text-emerald-600" />
                    Style par défaut : {defaultStyle.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Personnalisez la présentation visuelle de vos devis et factures (couleurs, disposition du logo, mentions légales et pied de page).
              </p>
            </div>
          </div>

          {!selectedStyle.is_default && (
            <button
              type="button"
              id="btn-set-default-style"
              onClick={handleSetDefault}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-200 transition-colors cursor-pointer shrink-0"
            >
              <Star size={16} className="fill-emerald-600 text-emerald-600" />
              <span>Définir comme style par défaut</span>
            </button>
          )}
        </div>

        {/* Style Selection Cards / Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-6 border-t border-slate-100 mt-5">
          {styles.map((st, idx) => {
            const isSelected = selectedStyle.id === st.id;
            return (
              <button
                key={st.id ?? st.style_key ?? idx}
                type="button"
                onClick={() => {
                  clearMessages();
                  setSelectedStyle(st);
                }}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                    {st.is_default && (
                      <span className="p-1 text-emerald-600" title="Style par défaut">
                        <Star size={16} className="fill-emerald-600" />
                      </span>
                    )}
                  </div>
                  {st.description && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{st.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-3 mt-2 border-t border-slate-100/80">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: st.primary_color }}
                    title="Couleur principale"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: st.accent_color }}
                    title="Couleur d'accent"
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: st.header_color }}
                    title="Couleur d'en-tête"
                  />
                  <span className="text-[10px] text-slate-400 font-mono ml-auto">
                    {isSelected ? "En cours de modification" : "Cliquer pour configurer"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-xs">
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-medium">{successMessage}</div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
          >
            Masquer
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 shadow-xs">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-medium">{error}</div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold cursor-pointer"
          >
            Masquer
          </button>
        </div>
      )}

      {/* Main Split Interface: Left = Controls, Right = Visual Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Customization Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section 1: Logo Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Building2 size={18} className="text-blue-600" />
              <h4 className="font-bold text-slate-900 text-sm">Choix du logo</h4>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logo associé à ce style
              </label>
              <select
                value={draftStyle.logo_id === null ? "default" : draftStyle.logo_id || "none"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "default") {
                    setDraftStyle((prev) => ({ ...prev, logo_id: null }));
                  } else if (val === "none") {
                    setDraftStyle((prev) => ({ ...prev, logo_id: -1 })); // internal flag for no logo
                  } else {
                    setDraftStyle((prev) => ({ ...prev, logo_id: Number(val) }));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="default">
                  {defaultLogo ? `Logo par défaut (${defaultLogo.name})` : "Logo par défaut de l'entreprise"}
                </option>
                {logos.map((logo, idx) => (
                  <option key={logo.id ?? logo.name ?? idx} value={logo.id}>
                    {logo.name} {logo.is_default ? "(Actuellement par défaut)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Vous pouvez sélectionner un logo spécifique ou utiliser le logo d'entreprise par défaut.
              </p>
            </div>
          </div>

          {/* Section 2: Colors & Palette Presets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Sliders size={18} className="text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-sm">Thème de couleurs</h4>
            </div>

            {/* Presets Bar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Palettes recommandées
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.name ?? idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Couleur principale
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftStyle.primary_color || "#1e3a8a"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, primary_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <input
                    type="text"
                    value={draftStyle.primary_color || "#1e3a8a"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, primary_color: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Couleur d'accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftStyle.accent_color || "#2563eb"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, accent_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <input
                    type="text"
                    value={draftStyle.accent_color || "#2563eb"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, accent_color: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fond de l'en-tête
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftStyle.header_color || "#f8fafc"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, header_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <input
                    type="text"
                    value={draftStyle.header_color || "#f8fafc"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, header_color: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fond du pied de page
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draftStyle.footer_color || "#f1f5f9"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, footer_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                  />
                  <input
                    type="text"
                    value={draftStyle.footer_color || "#f1f5f9"}
                    onChange={(e) => setDraftStyle((prev) => ({ ...prev, footer_color: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Company Display Attributes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <FileText size={18} className="text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm">Informations affichées</h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_ice !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_ice: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher l'ICE</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_tax_id !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_tax_id: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher l'IF</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_rc !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_rc: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher le RC</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draftStyle.show_cnss)}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_cnss: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher la CNSS</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_iban !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_iban: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher l'IBAN / RIB</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_phone !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_phone: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher le téléphone</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_email !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_email: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher l'email</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftStyle.show_address !== false}
                  onChange={(e) => setDraftStyle((prev) => ({ ...prev, show_address: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800">Afficher l'adresse</span>
              </label>
            </div>
          </div>

          {/* Section 4: Footer Text */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Sparkles size={18} className="text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm">Texte du pied de page</h4>
            </div>

            <div>
              <textarea
                value={draftStyle.footer_text || ""}
                onChange={(e) => setDraftStyle((prev) => ({ ...prev, footer_text: e.target.value }))}
                rows={3}
                placeholder="Ex: Merci de votre confiance. Facture payable par virement bancaire..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Save Action Button */}
          <div className="pt-2">
            <button
              type="button"
              id="btn-save-invoice-style"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Enregistrer les modifications du style</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Real-time Live Document Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-slate-600" />
              <h4 className="font-bold text-slate-900 text-sm">Aperçu visuel en direct</h4>
            </div>

            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              Rendu temps réel ({selectedStyle.name})
            </span>
          </div>

          {/* Interactive Paper Preview Container */}
          <div className="bg-slate-200/80 p-4 sm:p-6 rounded-2xl border border-slate-300 overflow-x-auto shadow-inner max-h-[800px] overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <StyleRenderer
                style={previewStyleObject}
                company={companySettings || undefined}
                logoData={selectedLogoOverride}
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              L'aperçu met automatiquement à jour vos coordonnées d'entreprise et les couleurs sélectionnées. Chaque devis et facture utilisera cette mise en page.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
