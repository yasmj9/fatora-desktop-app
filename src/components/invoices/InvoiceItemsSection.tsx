import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Wrench,
  Receipt,
  Layers,
  Minus,
  Globe2,
} from "lucide-react";
import { Service, COMMON_SERVICE_UNITS } from "../../types/service";
import { DocumentLanguage } from "../../types/invoice";
import { DraftInvoiceItem } from "../../types/draftInvoice";
import { InvoiceServiceSelectorModal } from "./InvoiceServiceSelectorModal";
import {
  toCents,
  fromCents,
  formatMoney,
  calculateItemFinancials,
  calculateInvoiceFinancials,
} from "../../utils/money";

interface InvoiceItemsSectionProps {
  items: DraftInvoiceItem[];
  onChangeItems: (items: DraftInvoiceItem[]) => void;
  documentLanguage: DocumentLanguage;
  onChangeDocumentLanguage: (lang: DocumentLanguage) => void;
  currency?: string;
}

export const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onChangeItems,
  documentLanguage,
  onChangeDocumentLanguage,
  currency = "MAD",
}) => {
  const [isServiceModalOpen, setIsServiceModalOpen] = useState<boolean>(false);

  // Helper to recalculate a single item's finances
  const recalculateItem = (item: DraftInvoiceItem): DraftInvoiceItem => {
    const unitPriceCents = toCents(item.unit_price);
    const result = calculateItemFinancials({
      quantity: item.quantity,
      unitPriceCents: unitPriceCents,
      discountType: item.discount_type,
      discountRate: item.discount_rate,
      discountAmountCents: item.discount_amount_cents,
      taxRate: item.tax_rate,
    });

    return {
      ...item,
      unit_price_cents: unitPriceCents,
      subtotal_cents: result.subtotalCents,
      discount_amount_cents: result.discountAmountCents,
      tax_amount_cents: result.taxAmountCents,
      total_cents: result.totalCents,
    };
  };

  // 1. Handle adding a service from the catalogue
  const handleSelectService = (service: Service) => {
    let chosenName = service.name_fr || "Prestation";
    let chosenDescription = service.description_fr || "";

    if (documentLanguage === "ar") {
      chosenName = service.name_ar || service.name_fr || "خدمة";
      chosenDescription = service.description_ar || service.description_fr || "";
    } else if (documentLanguage === "en") {
      chosenName = service.name_en || service.name_fr || "Service";
      chosenDescription = service.description_en || service.description_fr || "";
    }

    const defaultPrice = Number(service.default_price) || 0;
    const defaultUnit = service.default_unit || "Unité";

    const newItemRaw: DraftInvoiceItem = {
      uid: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      service_id: service.id,
      code: service.code || "",
      name: chosenName,
      name_ar: service.name_ar || "",
      name_en: service.name_en || "",
      description: chosenDescription,
      description_ar: service.description_ar || "",
      description_en: service.description_en || "",
      unit: defaultUnit,
      quantity: 1,
      unit_price: defaultPrice,
      unit_price_cents: toCents(defaultPrice),
      discount_type: "percentage",
      discount_rate: 0,
      discount_amount_cents: 0,
      tax_rate: 0,
      tax_amount_cents: 0,
      subtotal_cents: 0,
      total_cents: 0,
      show_options: false,
    };

    const recalculated = recalculateItem(newItemRaw);
    onChangeItems([...items, recalculated]);
  };

  // 2. Handle adding custom line item
  const handleAddCustomItem = (customName: string) => {
    const newItemRaw: DraftInvoiceItem = {
      uid: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      service_id: null,
      code: "",
      name: customName || "Nouvelle prestation",
      name_ar: "",
      name_en: "",
      description: "",
      description_ar: "",
      description_en: "",
      unit: "Unité",
      quantity: 1,
      unit_price: 0,
      unit_price_cents: 0,
      discount_type: "percentage",
      discount_rate: 0,
      discount_amount_cents: 0,
      tax_rate: 0,
      tax_amount_cents: 0,
      subtotal_cents: 0,
      total_cents: 0,
      show_options: true,
    };

    const recalculated = recalculateItem(newItemRaw);
    onChangeItems([...items, recalculated]);
  };

  // 3. Remove an item
  const handleRemoveItem = (uid: string) => {
    const updated = items.filter((it) => it.uid !== uid);
    onChangeItems(updated);
  };

  // 4. Update specific fields of an item
  const handleUpdateItem = (uid: string, changes: Partial<DraftInvoiceItem>) => {
    const updated = items.map((it) => {
      if (it.uid !== uid) return it;
      const merged = { ...it, ...changes };
      return recalculateItem(merged);
    });
    onChangeItems(updated);
  };

  // 5. Quantity stepper helpers
  const handleIncrementQty = (item: DraftInvoiceItem) => {
    const newQty = Math.round((item.quantity + 1) * 100) / 100;
    handleUpdateItem(item.uid, { quantity: newQty });
  };

  const handleDecrementQty = (item: DraftInvoiceItem) => {
    if (item.quantity <= 1) return;
    const newQty = Math.max(1, Math.round((item.quantity - 1) * 100) / 100);
    handleUpdateItem(item.uid, { quantity: newQty });
  };

  // Toggle "Plus d'options"
  const handleToggleOptions = (uid: string) => {
    const updated = items.map((it) => {
      if (it.uid !== uid) return it;
      return { ...it, show_options: !it.show_options };
    });
    onChangeItems(updated);
  };

  // Compute live invoice-level financials
  const invoiceFinancials = calculateInvoiceFinancials({
    items: items.map((it) => ({
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      discountType: it.discount_type,
      discountRate: it.discount_rate,
      discountAmountCents: it.discount_amount_cents,
      taxRate: it.tax_rate,
    })),
  });

  return (
    <div className="space-y-6">
      {/* Step Header & Language Bar */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md mb-2">
              Étape 2 · Prestations & Tarifs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Quelles prestations facturer ?
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Ajoutez les prestations, travaux ou forfaits depuis votre catalogue ou sur-mesure.
            </p>
          </div>

          {/* Obvious "+ Ajouter un service" button */}
          <button
            type="button"
            id="btn-ajouter-un-service-main"
            onClick={() => setIsServiceModalOpen(true)}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-base transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px] shrink-0"
          >
            <Plus size={22} className="stroke-[2.5]" />
            <span>+ Ajouter un service</span>
          </button>
        </div>

        {/* Document Language selector */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Globe2 size={15} className="text-blue-600 shrink-0" />
            <span className="font-semibold">Langue du document :</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              id="btn-lang-fr"
              onClick={() => onChangeDocumentLanguage("fr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                documentLanguage === "fr"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Français
            </button>
            <button
              type="button"
              id="btn-lang-ar"
              onClick={() => onChangeDocumentLanguage("ar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                documentLanguage === "ar"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              العربية (Arabe)
            </button>
            <button
              type="button"
              id="btn-lang-en"
              onClick={() => onChangeDocumentLanguage("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                documentLanguage === "en"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Items List or Empty State */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Wrench size={30} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Aucun service ajouté pour l'instant
          </h3>
          <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
            Cliquez sur le bouton ci-dessous pour choisir une prestation dans votre catalogue ou saisir une ligne directement.
          </p>
          <button
            type="button"
            id="btn-ajouter-un-service-empty"
            onClick={() => setIsServiceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-base transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px]"
          >
            <Plus size={20} className="stroke-[2.5]" />
            <span>+ Ajouter un service</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const isOptionsOpen = Boolean(item.show_options);
            const hasDiscountsOrTaxes =
              (item.discount_rate > 0 || item.discount_amount_cents > 0) || item.tax_rate > 0;

            return (
              <div
                key={item.uid}
                id={`invoice-item-card-${index}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Item Main Row */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top line of item: Index, Name, Code, and Delete button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            handleUpdateItem(item.uid, { name: e.target.value })
                          }
                          placeholder="Nom de la prestation..."
                          className="w-full text-base sm:text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-slate-50/70 px-1 py-0.5 rounded-sm transition-colors focus:outline-none"
                        />
                      </div>

                      {item.code && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-semibold shrink-0">
                          <Tag size={11} />
                          {item.code}
                        </span>
                      )}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      id={`btn-remove-item-${index}`}
                      onClick={() => handleRemoveItem(item.uid)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title="Supprimer cette ligne"
                      aria-label="Supprimer cette ligne"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Primary Grid Controls: Quantity, Unit Price, Total */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
                    {/* Quantity with Large - and + Controls */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Quantité ({item.unit || "Unité"})
                      </label>
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                        <button
                          type="button"
                          id={`btn-qty-minus-${index}`}
                          onClick={() => handleDecrementQty(item)}
                          disabled={item.quantity <= 1}
                          className="w-10 h-10 sm:w-11 sm:h-11 bg-white hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-800 font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                          title="Diminuer la quantité"
                        >
                          <Minus size={18} className="stroke-[2.5]" />
                        </button>

                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleUpdateItem(item.uid, {
                              quantity: isNaN(val) ? 0 : val,
                            });
                          }}
                          className="w-full text-center text-lg sm:text-xl font-extrabold text-slate-900 bg-transparent focus:outline-none py-1.5"
                        />

                        <button
                          type="button"
                          id={`btn-qty-plus-${index}`}
                          onClick={() => handleIncrementQty(item)}
                          className="w-10 h-10 sm:w-11 sm:h-11 bg-white hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                          title="Augmenter la quantité"
                        >
                          <Plus size={18} className="stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Unit Price (Editable without touching catalog) */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Prix unitaire ({currency})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price === 0 ? "" : item.unit_price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            handleUpdateItem(item.uid, {
                              unit_price: isNaN(val) ? 0 : val,
                            });
                          }}
                          placeholder="0.00"
                          className="w-full pl-3 pr-12 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-base font-extrabold text-slate-900 text-right focus:outline-none transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                          {currency}
                        </span>
                      </div>
                    </div>

                    {/* Item Total (Calculated immediately) */}
                    <div className="sm:col-span-3 text-left sm:text-right space-y-1 sm:pl-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Total {item.tax_rate > 0 ? "TTC" : "HT"}
                      </label>
                      <div className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                        {formatMoney(item.total_cents, currency, true)}
                      </div>
                      {hasDiscountsOrTaxes && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          Brut: {formatMoney(item.subtotal_cents, currency, true)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle "Plus d'options" */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      id={`btn-toggle-options-${index}`}
                      onClick={() => handleToggleOptions(item.uid)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer py-1"
                    >
                      <span>{isOptionsOpen ? "Moins d'options" : "Plus d'options"}</span>
                      {isOptionsOpen ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {hasDiscountsOrTaxes && !isOptionsOpen && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Remise / TVA active
                        </span>
                      )}
                    </button>

                    {item.description && !isOptionsOpen && (
                      <span className="text-xs text-slate-500 truncate max-w-xs italic">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Advanced Options Accordion Panel */}
                {isOptionsOpen && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Unit */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unité de mesure
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Layers size={14} />
                          </div>
                          <input
                            type="text"
                            list={`units-list-${index}`}
                            value={item.unit}
                            onChange={(e) =>
                              handleUpdateItem(item.uid, { unit: e.target.value })
                            }
                            placeholder="Ex: Unité, Forfait, Heure, m²"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                          />
                          <datalist id={`units-list-${index}`}>
                            {COMMON_SERVICE_UNITS.map((u) => (
                              <option key={u} value={u} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Discount / Remise */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Remise sur la ligne
                        </label>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max={item.discount_type === "percentage" ? 100 : undefined}
                              value={
                                item.discount_type === "percentage"
                                  ? item.discount_rate || ""
                                  : fromCents(item.discount_amount_cents) || ""
                              }
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (item.discount_type === "percentage") {
                                  handleUpdateItem(item.uid, { discount_rate: val });
                                } else {
                                  handleUpdateItem(item.uid, {
                                    discount_amount_cents: toCents(val),
                                  });
                                }
                              }}
                              placeholder="0"
                              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                            />
                          </div>

                          <div className="inline-flex rounded-xl bg-slate-200 p-0.5 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.uid, {
                                  discount_type: "percentage",
                                })
                              }
                              className={`px-2 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                                item.discount_type === "percentage"
                                  ? "bg-white text-blue-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              %
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(item.uid, {
                                  discount_type: "fixed",
                                })
                              }
                              className={`px-2 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer ${
                                item.discount_type === "fixed"
                                  ? "bg-white text-blue-700 shadow-xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              {currency}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tax / TVA Rate */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          TVA applicable (%)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={item.tax_rate || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateItem(item.uid, { tax_rate: val });
                              }}
                              placeholder="Ex: 20%"
                              className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                            />
                          </div>

                          {/* Quick Tax presets for Morocco / France / Artisan */}
                          <div className="flex items-center gap-1">
                            {[0, 10, 20].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() =>
                                  handleUpdateItem(item.uid, { tax_rate: rate })
                                }
                                className={`px-2 py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  item.tax_rate === rate
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {rate}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custom Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Description personnalisée / Détails de la prestation
                      </label>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateItem(item.uid, { description: e.target.value })
                        }
                        placeholder="Précisez les pièces incluses, dimensions, marque des matériaux, ou étapes d'installation..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-800 focus:outline-none resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick bottom "+ Ajouter un service" trigger button */}
          <div className="pt-2 flex justify-center sm:justify-start">
            <button
              type="button"
              id="btn-ajouter-un-service-bottom"
              onClick={() => setIsServiceModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-blue-50/60 border border-slate-300 hover:border-blue-400 text-slate-800 hover:text-blue-700 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-xs"
            >
              <Plus size={18} className="text-blue-600" />
              <span>+ Ajouter un autre service</span>
            </button>
          </div>

          {/* Financials Totals Summary Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg space-y-4 mt-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <Receipt size={20} className="text-blue-400" />
                <h3 className="font-bold text-base text-white">
                  Récapitulatif des prestations
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {items.length} ligne{items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Total Brut / Sous-total */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Sous-total Hors Taxes
                </span>
                <div className="text-lg font-bold font-mono text-slate-200">
                  {formatMoney(invoiceFinancials.subtotalCents, currency, true)}
                </div>
              </div>

              {/* Total Remises */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Total des remises
                </span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {invoiceFinancials.discountAmountCents > 0
                    ? `- ${formatMoney(invoiceFinancials.discountAmountCents, currency, true)}`
                    : "0,00 MAD"}
                </div>
              </div>

              {/* Total TVA */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-400">
                  Total TVA
                </span>
                <div className="text-lg font-bold font-mono text-blue-300">
                  {formatMoney(invoiceFinancials.taxAmountCents, currency, true)}
                </div>
              </div>

              {/* NET / TOTAL TTC */}
              <div className="space-y-1 sm:text-right bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  TOTAL TTC
                </span>
                <div className="text-2xl font-black font-mono text-white tracking-tight">
                  {formatMoney(invoiceFinancials.totalCents, currency, true)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Services Selection Modal */}
      <InvoiceServiceSelectorModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSelectService={handleSelectService}
        onAddCustomItem={handleAddCustomItem}
        documentLanguage={documentLanguage}
        currency={currency}
      />
    </div>
  );
};
