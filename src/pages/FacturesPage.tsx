import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  User,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Client } from "../types/client";
import { DocumentLanguage, PaymentMethod, Invoice } from "../types/invoice";
import { DraftInvoiceItem, DraftPaymentState } from "../types/draftInvoice";
import { useInvoices } from "../hooks/useInvoices";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { invoiceRepository } from "../db/repositories/invoiceRepository";
import { InvoiceClientSelector } from "../components/invoices/InvoiceClientSelector";
import { InvoiceItemsSection } from "../components/invoices/InvoiceItemsSection";
import { InvoicePaymentSection } from "../components/invoices/InvoicePaymentSection";
import { InvoiceVerificationSection } from "../components/invoices/InvoiceVerificationSection";
import { InvoiceSuccessScreen } from "../components/invoices/InvoiceSuccessScreen";
import {
  formatMoney,
  calculateInvoiceFinancials,
  derivePaymentStatus,
} from "../utils/money";

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const INITIAL_PAYMENT_STATE: DraftPaymentState = {
  paid_amount: 0,
  paid_amount_cents: 0,
  payment_method: "cash" as PaymentMethod,
  payment_date: getTodayDateString(),
  payment_reference: "",
  notes: "",
};

export const FacturesPage: React.FC = () => {
  const { invoices, isLoading, searchQuery, setSearchQuery, createInvoice } =
    useInvoices("all");
  const { settings } = useCompanySettings();

  const [viewMode, setViewMode] = useState<"list" | "create">("list");
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Invoice creation draft state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [documentLanguage, setDocumentLanguage] = useState<DocumentLanguage>(
    (settings.document_language as DocumentLanguage) || "fr"
  );
  const [draftItems, setDraftItems] = useState<DraftInvoiceItem[]>([]);
  const [draftPayment, setDraftPayment] =
    useState<DraftPaymentState>(INITIAL_PAYMENT_STATE);

  // Next invoice number prediction
  const [predictedInvoiceNumber, setPredictedInvoiceNumber] = useState<string>("FAC-2026-0001");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  const currency = settings.currency || "MAD";

  // Load predicted next invoice number
  useEffect(() => {
    let isMounted = true;
    invoiceRepository
      .getNextInvoiceNumber()
      .then((res) => {
        if (isMounted && res?.invoiceNumber) {
          setPredictedInvoiceNumber(res.invoiceNumber);
        }
      })
      .catch((err) => {
        console.warn("Could not load next invoice number:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [viewMode, currentStep]);

  const handleStartCreate = () => {
    setSelectedClient(null);
    setDraftItems([]);
    setDraftPayment(INITIAL_PAYMENT_STATE);
    setDocumentLanguage(
      (settings.document_language as DocumentLanguage) || "fr"
    );
    setCreatedInvoice(null);
    setSaveError(null);
    setCurrentStep(1);
    setViewMode("create");
  };

  const handleCancelCreate = () => {
    setSelectedClient(null);
    setDraftItems([]);
    setDraftPayment(INITIAL_PAYMENT_STATE);
    setCreatedInvoice(null);
    setSaveError(null);
    setCurrentStep(1);
    setViewMode("list");
  };

  const handleClientSelected = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      setCurrentStep(2);
    }
  };

  // Financial totals calculation
  const totals = calculateInvoiceFinancials({
    items: draftItems.map((it) => ({
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      discountType: it.discount_type,
      discountRate: it.discount_rate,
      discountAmountCents: it.discount_amount_cents,
      taxRate: it.tax_rate,
    })),
    paidAmountCents: draftPayment.paid_amount_cents,
  });

  const paymentStatus = derivePaymentStatus(
    totals.totalCents,
    draftPayment.paid_amount_cents
  );

  // Save the invoice to SQLite via transaction
  const handleSaveInvoice = async () => {
    if (!selectedClient) {
      setSaveError("Veuillez sélectionner un client.");
      return;
    }

    if (draftItems.length === 0) {
      setSaveError("Veuillez ajouter au moins une prestation à la facture.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const created = await createInvoice({
        language: documentLanguage,
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
        items: draftItems.map((it, idx) => ({
          service_id: it.service_id,
          position: idx,
          name: it.name,
          name_ar: it.name_ar,
          name_en: it.name_en,
          description: it.description,
          description_ar: it.description_ar,
          description_en: it.description_en,
          unit: it.unit,
          quantity: it.quantity,
          unit_price_cents: it.unit_price_cents,
          discount_type: it.discount_type,
          discount_rate: it.discount_rate,
          discount_amount_cents: it.discount_amount_cents,
          tax_rate: it.tax_rate,
        })),
        initial_payment:
          draftPayment.paid_amount_cents > 0
            ? {
                amount_cents: draftPayment.paid_amount_cents,
                payment_method: draftPayment.payment_method,
                payment_date: draftPayment.payment_date || getTodayDateString(),
                reference: draftPayment.payment_reference,
                notes: draftPayment.notes,
              }
            : undefined,
      });

      if (created) {
        setCreatedInvoice(created);
      } else {
        setSaveError("Une erreur est survenue lors de l'enregistrement de la facture.");
      }
    } catch (err: unknown) {
      console.error("Save invoice error:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Erreur inattendue lors de la création de la facture."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {viewMode === "create" ? (
        /* ================= INVOICE CREATION WORKFLOW ================= */
        <div className="space-y-6">
          {/* If invoice has been successfully created, show Success Screen */}
          {createdInvoice ? (
            <InvoiceSuccessScreen
              invoice={createdInvoice}
              onNewInvoice={handleStartCreate}
              onBackToHome={handleCancelCreate}
            />
          ) : (
            <>
              {/* Top navigation & Step Progress Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <button
                  type="button"
                  id="btn-back-to-invoices"
                  onClick={handleCancelCreate}
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors cursor-pointer w-fit py-1.5 px-2.5 -ml-2.5 rounded-lg hover:bg-slate-100"
                >
                  <ArrowLeft size={18} />
                  <span>Retour aux factures</span>
                </button>

                {/* Stepper navigation buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold overflow-x-auto py-1">
                  {/* Step 1: Client */}
                  <button
                    type="button"
                    id="stepper-step-1"
                    onClick={() => setCurrentStep(1)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      currentStep === 1
                        ? "bg-blue-600 text-white shadow-xs"
                        : selectedClient
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {selectedClient ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">
                        1
                      </span>
                    )}
                    <span>1. Client</span>
                  </button>

                  <span className="text-slate-300">›</span>

                  {/* Step 2: Prestations */}
                  <button
                    type="button"
                    id="stepper-step-2"
                    onClick={() => {
                      if (selectedClient) setCurrentStep(2);
                    }}
                    disabled={!selectedClient}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      currentStep === 2
                        ? "bg-blue-600 text-white shadow-xs"
                        : draftItems.length > 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        : selectedClient
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {draftItems.length > 0 ? (
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                        2
                      </span>
                    )}
                    <span>2. Prestations</span>
                    {draftItems.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded-full text-[10px]">
                        {draftItems.length}
                      </span>
                    )}
                  </button>

                  <span className="text-slate-300">›</span>

                  {/* Step 3: Règlement & Paiement */}
                  <button
                    type="button"
                    id="stepper-step-3"
                    onClick={() => {
                      if (selectedClient && draftItems.length > 0) setCurrentStep(3);
                    }}
                    disabled={!selectedClient || draftItems.length === 0}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      currentStep === 3
                        ? "bg-blue-600 text-white shadow-xs"
                        : selectedClient && draftItems.length > 0
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <CreditCard size={13} />
                    <span>3. Paiement</span>
                    {currentStep !== 3 && draftPayment.paid_amount_cents > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded-full text-[10px]">
                        Payé
                      </span>
                    )}
                  </button>

                  <span className="text-slate-300">›</span>

                  {/* Step 4: Vérification & Création */}
                  <button
                    type="button"
                    id="stepper-step-4"
                    onClick={() => {
                      if (selectedClient && draftItems.length > 0) setCurrentStep(4);
                    }}
                    disabled={!selectedClient || draftItems.length === 0}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      currentStep === 4
                        ? "bg-blue-600 text-white shadow-xs"
                        : selectedClient && draftItems.length > 0
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span>4. Vérification</span>
                  </button>
                </div>
              </div>

              {/* Persistent Client Summary Banner when in Step 2, 3, or 4 */}
              {currentStep > 1 && currentStep < 4 && selectedClient && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900">Client facturé :</span>
                        <strong className="text-sm font-bold text-slate-900">
                          {selectedClient.name}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({selectedClient.type === "company" ? "Entreprise" : "Particulier"})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedClient.phone ? `Tél : ${selectedClient.phone}` : ""}{" "}
                        {selectedClient.city ? `· Ville : ${selectedClient.city}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      id="btn-back-to-client-step"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors cursor-pointer"
                    >
                      Changer de client
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: CLIENT SELECTION */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <InvoiceClientSelector
                    selectedClient={selectedClient}
                    onSelectClient={handleClientSelected}
                  />

                  {selectedClient && (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-blue-600" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Client prêt : {selectedClient.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500">
                          Passez à l'ajout des prestations pour cette facture.
                        </p>
                      </div>

                      <button
                        type="button"
                        id="btn-continue-to-services"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px]"
                      >
                        <span>Continuer vers les prestations</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SERVICES / ITEMS SECTION */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <InvoiceItemsSection
                    items={draftItems}
                    onChangeItems={setDraftItems}
                    documentLanguage={documentLanguage}
                    onChangeDocumentLanguage={setDocumentLanguage}
                    currency={currency}
                  />

                  {/* Navigation between steps */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      id="btn-back-step-1"
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>‹ Étape précédente (Client)</span>
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-right sm:pr-2">
                        <div className="text-xs text-slate-500 font-medium">
                          {draftItems.length} prestation{draftItems.length > 1 ? "s" : ""}
                        </div>
                        <div className="text-base font-extrabold font-mono text-slate-900">
                          Total: {formatMoney(totals.totalCents, currency, true)}
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-continue-to-payment"
                        onClick={() => setCurrentStep(3)}
                        disabled={draftItems.length === 0}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px]"
                      >
                        <span>Continuer vers le paiement</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT SECTION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <InvoicePaymentSection
                    totalCents={totals.totalCents}
                    paymentState={draftPayment}
                    onChangePaymentState={setDraftPayment}
                    currency={currency}
                  />

                  {/* Navigation between steps */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <button
                      type="button"
                      id="btn-back-step-2"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>‹ Étape précédente (Prestations)</span>
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-right sm:pr-2">
                        <div className="text-xs text-slate-500 font-medium">
                          Statut :{" "}
                          <strong className="text-slate-900">
                            {paymentStatus.statusLabel}
                          </strong>
                        </div>
                        <div className="text-base font-extrabold font-mono text-slate-900">
                          Reste :{" "}
                          {formatMoney(totals.balanceCents, currency, true)}
                        </div>
                      </div>

                      <button
                        type="button"
                        id="btn-continue-to-verification"
                        onClick={() => setCurrentStep(4)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[48px]"
                      >
                        <span>Vérifier et créer la facture</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: VERIFICATION SUMMARY */}
              {currentStep === 4 && selectedClient && (
                <InvoiceVerificationSection
                  client={selectedClient}
                  items={draftItems}
                  payment={draftPayment}
                  documentLanguage={documentLanguage}
                  currency={currency}
                  nextInvoiceNumber={predictedInvoiceNumber}
                  isSaving={isSaving}
                  errorMessage={saveError}
                  onEditStep={(step) => setCurrentStep(step)}
                  onCreateInvoice={handleSaveInvoice}
                />
              )}
            </>
          )}
        </div>
      ) : (
        /* ================= INVOICE LIST VIEW ================= */
        <div className="space-y-6">
          {/* Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search-factures"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par client, numéro, montant..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>

            <button
              id="btn-nouvelle-facture"
              type="button"
              onClick={handleStartCreate}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[44px]"
            >
              <Plus size={18} />
              <span>+ Nouvelle facture</span>
            </button>
          </div>

          {/* Invoice List or Empty State */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Chargement des factures...</p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {inv.invoice_number}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : inv.status === "partially_paid"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {inv.status === "paid"
                            ? "Payée"
                            : inv.status === "partially_paid"
                            ? "Partielle"
                            : "Non payée"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Client : <strong className="text-slate-900">{inv.client_name}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-sm font-extrabold font-mono text-slate-900">
                      {formatMoney(inv.total_cents, inv.currency || "MAD", true)}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Date : {inv.invoice_date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Aucune facture pour le moment
              </h3>
              <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                Créez vos factures en quelques clics pour vos clients et gardez un historique clair 100% hors-ligne.
              </p>
              <button
                id="btn-create-first-facture"
                type="button"
                onClick={handleStartCreate}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer min-h-[44px] shadow-sm hover:shadow-md"
              >
                Créer ma première facture
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
