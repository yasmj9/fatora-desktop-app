import React, { useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle,
  CreditCard,
  FileCheck2,
  HelpCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  Wallet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PaymentMethod } from "../../types/invoice";
import { DraftPaymentState } from "../../types/draftInvoice";
import {
  formatMoney,
  toCents,
  fromCents,
  derivePaymentStatus,
  validatePaymentAmount,
} from "../../utils/money";

interface InvoicePaymentSectionProps {
  totalCents: number;
  paymentState: DraftPaymentState;
  onChangePaymentState: (state: DraftPaymentState) => void;
  currency?: string;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: "cash",
    label: "Espèces",
    icon: <Banknote size={22} className="text-emerald-600" />,
    description: "Règlement direct en espèces / liquide",
  },
  {
    id: "bank_transfer",
    label: "Virement bancaire",
    icon: <Building2 size={22} className="text-blue-600" />,
    description: "Virement sur compte bancaire / RIB",
  },
  {
    id: "check",
    label: "Chèque",
    icon: <FileCheck2 size={22} className="text-purple-600" />,
    description: "Paiement par chèque bancaire",
  },
  {
    id: "card",
    label: "Carte",
    icon: <CreditCard size={22} className="text-amber-600" />,
    description: "Paiement par TPE / carte bancaire",
  },
  {
    id: "other",
    label: "Autre",
    icon: <HelpCircle size={22} className="text-slate-600" />,
    description: "Autre moyen de règlement ou compensation",
  },
];

export const InvoicePaymentSection: React.FC<InvoicePaymentSectionProps> = ({
  totalCents,
  paymentState,
  onChangePaymentState,
  currency = "MAD",
}) => {
  const [showAdvancedDetails, setShowAdvancedDetails] = useState<boolean>(false);

  // Derived calculations
  const paidCents = paymentState.paid_amount_cents;
  const balanceCents = Math.max(0, totalCents - paidCents);
  const statusInfo = derivePaymentStatus(totalCents, paidCents);
  const validation = validatePaymentAmount(paidCents, totalCents, currency);

  // Handle amount change from numeric input
  const handleAmountChange = (rawInput: string) => {
    const parsed = parseFloat(rawInput);
    if (isNaN(parsed) || rawInput === "") {
      onChangePaymentState({
        ...paymentState,
        paid_amount: 0,
        paid_amount_cents: 0,
      });
      return;
    }

    const clampedDecimal = Math.max(0, parsed);
    const inCents = toCents(clampedDecimal);
    onChangePaymentState({
      ...paymentState,
      paid_amount: clampedDecimal,
      paid_amount_cents: inCents,
    });
  };

  // Quick action shortcuts
  const handleSetZero = () => {
    onChangePaymentState({
      ...paymentState,
      paid_amount: 0,
      paid_amount_cents: 0,
    });
  };

  const handleSetFull = () => {
    const fullDecimal = fromCents(totalCents);
    onChangePaymentState({
      ...paymentState,
      paid_amount: fullDecimal,
      paid_amount_cents: totalCents,
    });
  };

  const handleSetPercentage = (pct: number) => {
    const fractionCents = Math.round((totalCents * pct) / 100);
    const fractionDecimal = fromCents(fractionCents);
    onChangePaymentState({
      ...paymentState,
      paid_amount: fractionDecimal,
      paid_amount_cents: fractionCents,
    });
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    onChangePaymentState({
      ...paymentState,
      payment_method: method,
    });
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-2">
        <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md mb-1">
          Étape 3 · Règlement & Paiement
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Comment ce montant est-il réglé ?
        </h2>
        <p className="text-slate-600 text-sm">
          Indiquez le montant perçu à la commande ou à la livraison. Le reste à payer et le statut sont calculés automatiquement.
        </p>
      </div>

      {/* Main Financial Balance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. TOTAL DE LA FACTURE */}
        <div
          id="card-payment-total"
          className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">
              TOTAL FACTURE
            </span>
            <Wallet size={20} className="text-blue-400" />
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {formatMoney(totalCents, currency, true)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Montant total TTC de la prestation
            </p>
          </div>
        </div>

        {/* 2. MONTANT PAYÉ (INPUT) */}
        <div
          id="card-payment-paid-input"
          className="bg-white rounded-2xl p-6 border-2 border-blue-600 shadow-sm flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-slate-700">
            <label
              htmlFor="input-montant-paye"
              className="text-xs font-bold uppercase tracking-wider text-blue-900"
            >
              Montant payé (Encaissé)
            </label>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Saisie
            </span>
          </div>

          <div className="relative">
            <input
              id="input-montant-paye"
              type="number"
              step="0.01"
              min="0"
              value={paymentState.paid_amount === 0 ? "" : paymentState.paid_amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-3 pr-14 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-2xl font-black font-mono text-slate-900 text-right focus:outline-none transition-colors"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-slate-500 pointer-events-none">
              {currency}
            </span>
          </div>

          <p className="text-[11px] text-slate-500">
            Montant déjà versé par le client
          </p>
        </div>

        {/* 3. RESTE À PAYER (PROMINENT RESULT) */}
        <div
          id="card-payment-remaining-balance"
          className={`rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all ${
            balanceCents === 0
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-amber-50/80 border-amber-300 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-extrabold uppercase tracking-wider ${
                balanceCents === 0 ? "text-emerald-800" : "text-amber-900"
              }`}
            >
              RESTE À PAYER
            </span>
            {balanceCents === 0 ? (
              <CheckCircle size={22} className="text-emerald-600" />
            ) : (
              <AlertCircle size={22} className="text-amber-600" />
            )}
          </div>

          <div>
            <div
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                balanceCents === 0 ? "text-emerald-700" : "text-amber-900"
              }`}
            >
              {formatMoney(balanceCents, currency, true)}
            </div>

            <p
              className={`text-xs font-semibold mt-1 ${
                balanceCents === 0 ? "text-emerald-700" : "text-amber-800"
              }`}
            >
              {balanceCents === 0
                ? "Facture entièrement soldée"
                : "Solde restant à percevoir"}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Message (If invalid amount) */}
      {!validation.isValid && validation.errorMessage && (
        <div
          id="payment-validation-error"
          className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm font-semibold"
        >
          <AlertCircle size={20} className="text-rose-600 shrink-0" />
          <span>{validation.errorMessage}</span>
        </div>
      )}

      {/* Quick Amount Shortcuts for Fast Input */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Raccourcis rapides d'encaissement :
          </span>
          <span className="text-[11px] text-slate-500">
            Un clic pour remplir le montant
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            id="btn-shortcut-unpaid"
            onClick={handleSetZero}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              paidCents === 0
                ? "bg-amber-100 text-amber-900 border-amber-400 shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>Non payée (0 {currency})</span>
          </button>

          <button
            type="button"
            id="btn-shortcut-acompte-30"
            onClick={() => handleSetPercentage(30)}
            className="px-3 py-2.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>Acompte 30%</span>
            <span className="block text-[10px] text-slate-400 font-mono">
              ({formatMoney(Math.round((totalCents * 30) / 100), currency, true)})
            </span>
          </button>

          <button
            type="button"
            id="btn-shortcut-acompte-50"
            onClick={() => handleSetPercentage(50)}
            className="px-3 py-2.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>Acompte 50%</span>
            <span className="block text-[10px] text-slate-400 font-mono">
              ({formatMoney(Math.round((totalCents * 50) / 100), currency, true)})
            </span>
          </button>

          <button
            type="button"
            id="btn-shortcut-paid-full"
            onClick={handleSetFull}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              paidCents >= totalCents && totalCents > 0
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-emerald-800 hover:bg-emerald-50 border-emerald-300 hover:border-emerald-400"
            }`}
          >
            <span>Payée en totalité</span>
            <span className="block text-[10px] opacity-80 font-mono">
              ({formatMoney(totalCents, currency, true)})
            </span>
          </button>
        </div>
      </div>

      {/* Automatically Derived Status Box */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Statut attribué automatiquement
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {statusInfo.statusDescription}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            id="badge-derived-status"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold border shadow-2xs ${statusInfo.statusBadgeClasses}`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current" />
            <span>{statusInfo.statusLabel}</span>
          </span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Mode de règlement
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez le moyen utilisé pour ce paiement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentState.payment_method === method.id;
            return (
              <button
                key={method.id}
                type="button"
                id={`btn-payment-method-${method.id}`}
                onClick={() => handleSelectMethod(method.id)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-2 bg-slate-100 rounded-lg">{method.icon}</div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {method.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {method.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional details (Date, Reference, Notes) */}
        <div className="pt-2">
          <button
            type="button"
            id="btn-toggle-payment-details"
            onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer py-1"
          >
            <span>
              {showAdvancedDetails
                ? "Masquer les détails supplémentaires"
                : "+ Ajouter date de règlement, référence ou note"}
            </span>
            {showAdvancedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAdvancedDetails && (
            <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date du règlement
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={14} />
                  </div>
                  <input
                    type="date"
                    id="input-payment-date"
                    value={paymentState.payment_date}
                    onChange={(e) =>
                      onChangePaymentState({
                        ...paymentState,
                        payment_date: e.target.value,
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Reference / Check number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Référence / N° Chèque ou Virement (optionnel)
                </label>
                <input
                  type="text"
                  id="input-payment-reference"
                  value={paymentState.payment_reference}
                  onChange={(e) =>
                    onChangePaymentState({
                      ...paymentState,
                      payment_reference: e.target.value,
                    })
                  }
                  placeholder="Ex: CHQ-849204, Virement BMCE..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>

              {/* Internal Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note ou observation sur le paiement (optionnel)
                </label>
                <input
                  type="text"
                  id="input-payment-notes"
                  value={paymentState.notes}
                  onChange={(e) =>
                    onChangePaymentState({
                      ...paymentState,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Ex: Acompte versé à la commande, solde prévu fin de chantier..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
