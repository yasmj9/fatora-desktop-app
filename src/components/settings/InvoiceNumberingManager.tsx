import React, { useState, useEffect } from "react";
import {
  Hash,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Sparkles,
  HelpCircle,
  Layers,
} from "lucide-react";
import { useCompanySettings } from "../../hooks/useCompanySettings";
import {
  formatInvoiceNumber,
  NUMBERING_PRESETS,
  NumberingPreset,
} from "../../utils/invoiceNumberFormatter";

export const InvoiceNumberingManager: React.FC = () => {
  const { settings, isLoading, isSaving, error, successMessage, saveSettings, clearMessages } =
    useCompanySettings();

  const currentYear = new Date().getFullYear();

  const [prefix, setPrefix] = useState("FAC");
  const [pattern, setPattern] = useState("{PREFIX}-{YEAR}-{SEQ}");
  const [padding, setPadding] = useState(4);
  const [nextNumber, setNextNumber] = useState(1);
  const [isDirty, setIsDirty] = useState(false);

  // Sync settings once loaded
  useEffect(() => {
    if (settings) {
      setPrefix(settings.invoice_prefix !== undefined && settings.invoice_prefix !== null ? settings.invoice_prefix : "FAC");
      setPattern(settings.invoice_pattern || "{PREFIX}-{YEAR}-{SEQ}");
      setPadding(Number(settings.invoice_sequence_padding) || 4);
      setNextNumber(Number(settings.invoice_next_number) || 1);
      setIsDirty(false);
    }
  }, [settings]);

  // Live preview calculation
  const previewNumber = formatInvoiceNumber({
    prefix,
    pattern,
    sequenceNumber: nextNumber || 1,
    year: currentYear,
    padding,
  });

  const handleApplyPreset = (preset: NumberingPreset) => {
    setPrefix(preset.prefix);
    setPattern(preset.pattern);
    setPadding(preset.padding);
    setIsDirty(true);
    clearMessages();
  };

  const handleInsertTag = (tag: string) => {
    setPattern((prev) => `${prev}${tag}`);
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    await saveSettings({
      name: settings.name || "Mon Entreprise",
      phone: settings.phone || "0600000000",
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
      invoice_prefix: prefix,
      invoice_pattern: pattern,
      invoice_sequence_padding: padding,
      invoice_next_number: nextNumber,
    });

    setIsDirty(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-3" />
        <p className="text-slate-600 text-sm font-medium">
          Chargement de la configuration de numérotation...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Feedback Messages */}
      {successMessage && (
        <div
          id="numbering-settings-success-alert"
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-xs"
        >
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900">Format enregistré avec succès</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Les prochaines factures générées respecteront ce format de numérotation.
            </p>
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
          id="numbering-settings-error-alert"
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

      {/* CARD 1: LIVE INTERACTIVE PREVIEW */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300">
              <Sparkles size={14} className="text-blue-400" />
              <span>Aperçu en direct du numéro de facture</span>
            </div>
            <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              Prochaine facture générée
            </h3>
            <div className="font-mono text-3xl sm:text-4xl font-extrabold text-white tracking-wider drop-shadow-sm break-all">
              {previewNumber || "001/2026"}
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/80 rounded-2xl p-4 sm:min-w-[240px] space-y-2 text-xs">
            <div className="text-slate-400 font-semibold mb-2">Composants détectés :</div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Préfixe :</span>
              <span className="font-mono font-bold text-blue-300">
                {prefix ? `"${prefix}"` : "(aucun)"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Séquence (padding) :</span>
              <span className="font-mono font-bold text-emerald-300">
                {String(nextNumber || 1).padStart(padding, "0")} ({padding} chiffres)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Année :</span>
              <span className="font-mono font-bold text-amber-300">{currentYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: QUICK PRESETS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Layers size={17} />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Modèles de format
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {NUMBERING_PRESETS.map((preset) => {
            const isSelected =
              preset.pattern === pattern &&
              preset.prefix === prefix &&
              preset.padding === padding;

            return (
              <button
                type="button"
                key={preset.id}
                id={`preset-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border font-mono text-xs font-extrabold transition-all cursor-pointer truncate ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
                }`}
                title={preset.example}
              >
                <span className="truncate">{preset.example}</span>
                {isSelected && (
                  <CheckCircle size={14} className="text-blue-600 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARD 3: CUSTOM CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Hash size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Personnalisation avancée du format
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configurez le motif, le préfixe, le nombre de chiffres et le compteur de départ.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Format Pattern String */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="invoice-pattern-input"
                className="text-xs font-bold text-slate-700"
              >
                Structure / Motif du numéro de facture <span className="text-rose-600">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Ex: 001/2026 ou FACT-00001-2026</span>
            </div>

            <div className="relative">
              <input
                id="invoice-pattern-input"
                type="text"
                value={pattern}
                onChange={(e) => {
                  setPattern(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="{SEQ}/{YEAR} ou {PREFIX}-{SEQ}-{YEAR}"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            {/* Clickable Helper Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Balises disponibles :</span>
              <button
                type="button"
                onClick={() => handleInsertTag("{SEQ}")}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200"
                title="Insérer la séquence du numéro"
              >
                <span>{`{SEQ}`}</span>
                <span className="text-[10px] text-slate-500 font-sans">(séquence)</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag("{YEAR}")}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200"
                title="Insérer l'année à 4 chiffres (2026)"
              >
                <span>{`{YEAR}`}</span>
                <span className="text-[10px] text-slate-500 font-sans">(année 2026)</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag("{YY}")}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200"
                title="Insérer l'année courte à 2 chiffres (26)"
              >
                <span>{`{YY}`}</span>
                <span className="text-[10px] text-slate-500 font-sans">(année 26)</span>
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag("{PREFIX}")}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer border border-slate-200"
                title="Insérer le préfixe textuel (ex: FACT)"
              >
                <span>{`{PREFIX}`}</span>
                <span className="text-[10px] text-slate-500 font-sans">(préfixe)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Préfixe */}
            <div>
              <label
                htmlFor="invoice-prefix-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Préfixe personnalisé
              </label>
              <input
                id="invoice-prefix-input"
                type="text"
                value={prefix}
                onChange={(e) => {
                  setPrefix(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Ex: FACT ou FAC (optionnel)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Laissez vide pour des formats sans préfixe comme <code className="font-mono">001/2026</code>.
              </p>
            </div>

            {/* Sequence Padding / Longueur */}
            <div>
              <label
                htmlFor="invoice-padding-select"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Format du numéro de séquence
              </label>
              <select
                id="invoice-padding-select"
                value={padding}
                onChange={(e) => {
                  setPadding(Number(e.target.value));
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer transition-all"
              >
                <option value={1}>1 chiffre (1, 2, 3...)</option>
                <option value={2}>2 chiffres (01, 02, 03...)</option>
                <option value={3}>3 chiffres (001, 002, 003...)</option>
                <option value={4}>4 chiffres (0001, 0002...)</option>
                <option value={5}>5 chiffres (00001, 00002...)</option>
                <option value={6}>6 chiffres (000001...)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Définit le nombre de zéros au début du numéro.
              </p>
            </div>

            {/* Next Sequence Number Start */}
            <div>
              <label
                htmlFor="invoice-next-number-input"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Prochain numéro (compteur)
              </label>
              <input
                id="invoice-next-number-input"
                type="number"
                min={1}
                value={nextNumber}
                onChange={(e) => {
                  setNextNumber(Math.max(1, Number(e.target.value) || 1));
                  setIsDirty(true);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Numéro de départ de la séquence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 4: MOROCCAN LEGAL & PRACTICAL GUIDELINES */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <HelpCircle size={18} />
        </div>
        <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
          <div className="font-bold text-slate-900">Règle légale de numérotation :</div>
          <p>
            La numérotation des factures doit respecter une série chronologique continue et sans rupture. 
            Vous pouvez réinitialiser la séquence chaque année civile (ex: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">001/2026</code>) ou conserver un compteur continu global (ex: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">FACT-00001-2026</code>).
          </p>
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
              Configuration de numérotation synchronisée
            </span>
          )}
        </div>

        <button
          id="btn-save-numbering-settings"
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
              <span>Enregistrer le format</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
