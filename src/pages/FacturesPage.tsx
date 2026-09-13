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
  Eye,
  AlertTriangle,
  X,
  Calendar,
} from "lucide-react";
import { Client } from "../types/client";
import { DocumentLanguage, PaymentMethod, Invoice, InvoiceStatus } from "../types/invoice";
import { DraftInvoiceItem, DraftPaymentState } from "../types/draftInvoice";
import { useInvoices } from "../hooks/useInvoices";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { invoiceRepository } from "../db/repositories/invoiceRepository";
import { InvoiceClientSelector } from "../components/invoices/InvoiceClientSelector";
import { InvoiceItemsSection } from "../components/invoices/InvoiceItemsSection";
import { InvoicePaymentSection } from "../components/invoices/InvoicePaymentSection";
import { InvoiceVerificationSection } from "../components/invoices/InvoiceVerificationSection";
import { InvoiceSuccessScreen } from "../components/invoices/InvoiceSuccessScreen";
import { InvoiceStatusBadge } from "../components/invoices/InvoiceStatusBadge";
import { InvoiceDetailView } from "../components/invoices/InvoiceDetailView";
import { AddPaymentModal } from "../components/invoices/AddPaymentModal";
import { CancelInvoiceDialog } from "../components/invoices/CancelInvoiceDialog";
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

const STATUS_FILTERS: { id: "all" | InvoiceStatus; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "sent", label: "Non payées" },
  { id: "partially_paid", label: "Partiellement payées" },
  { id: "paid", label: "Payées" },
  { id: "draft", label: "Brouillons" },
  { id: "cancelled", label: "Annulées" },
];

interface FacturesPageProps {
  initialInvoiceId?: number | null;
}

export const FacturesPage: React.FC<FacturesPageProps> = ({ initialInvoiceId }) => {
  const {
    invoices,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    createInvoice,
    addPayment,
    updateStatus,
    actionSuccess,
    error,
    clearMessages,
    loadInvoices,
  } = useInvoices("all");

  const { settings } = useCompanySettings();

  const [viewMode, setViewMode] = useState<"list" | "create" | "detail">(
    initialInvoiceId ? "detail" : "list"
  );
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    initialInvoiceId || null
  );

  useEffect(() => {
    if (initialInvoiceId) {
      setSelectedInvoiceId(initialInvoiceId);
      setViewMode("detail");
    }
  }, [initialInvoiceId]);

  // Modals state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const [cancelDialogInvoice, setCancelDialogInvoice] = useState<Invoice | null>(null);
  const [isCancellingInvoice, setIsCancellingInvoice] = useState<boolean>(false);

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

  const handleOpenDetail = (id: number) => {
    setSelectedInvoiceId(id);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedInvoiceId(null);
    setViewMode("list");
  };

  const handleClientSelected = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      setCurrentStep(2);
    }
  };

  // Financial totals calculation for draft
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

  // Save the draft invoice to SQLite via transaction
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
        tax_rate: 20,
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
          tax_rate: it.tax_rate !== undefined ? it.tax_rate : 20,
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

  // Submit payment from modal
  const handlePaymentSubmit = async (data: {
    invoice_id: number;
    amount_cents: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference?: string;
    notes?: string;
  }) => {
    setIsSubmittingPayment(true);
    try {
      const success = await addPayment(data);
      if (success) {
        setPaymentModalInvoice(null);
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Confirm invoice cancellation
  const handleConfirmCancel = async () => {
    if (!cancelDialogInvoice) return;
    setIsCancellingInvoice(true);
    try {
      await updateStatus(cancelDialogInvoice.id, "cancelled");
      setCancelDialogInvoice(null);
    } finally {
      setIsCancellingInvoice(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Global Notifications */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-rose-700 hover:text-rose-900 p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* VIEW 1: INVOICE DETAIL VIEW */}
      {viewMode === "detail" && selectedInvoiceId ? (
        <InvoiceDetailView
          invoiceId={selectedInvoiceId}
          onBack={handleBackToList}
          onOpenAddPayment={(inv) => setPaymentModalInvoice(inv)}
          onOpenCancelDialog={(inv) => setCancelDialogInvoice(inv)}
          onRefreshList={loadInvoices}
        />
      ) : viewMode === "create" ? (
        /* VIEW 2: INVOICE CREATION WORKFLOW */
        <div className="space-y-6">
          {createdInvoice ? (
            <InvoiceSuccessScreen
              invoice={createdInvoice}
              onNewInvoice={handleStartCreate}
              onBackToHome={handleCancelCreate}
            />
          ) : (
            <>
              {/* Stepper Header */}
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

                {/* Step Indicators */}
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold overflow-x-auto py-1">
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

              {/* Client banner during step 2, 3 */}
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

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100/60 px-3 py-1.5 rounded-xl border border-emerald-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Changer de client
                  </button>
                </div>
              )}

              {/* STEP 1: CLIENT */}
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

              {/* STEP 2: PRESTATIONS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <InvoiceItemsSection
                    items={draftItems}
                    onChangeItems={setDraftItems}
                    documentLanguage={documentLanguage}
                    onChangeDocumentLanguage={setDocumentLanguage}
                    currency={currency}
                  />

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

              {/* STEP 3: PAYMENT */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <InvoicePaymentSection
                    totalCents={totals.totalCents}
                    paymentState={draftPayment}
                    onChangePaymentState={setDraftPayment}
                    currency={currency}
                  />

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

              {/* STEP 4: VERIFICATION */}
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
        /* VIEW 3: MAIN INVOICE LIST */
        <div className="space-y-6">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Factures
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Gérez vos factures et règlements locaux.
              </p>
            </div>

            <button
              id="btn-nouvelle-facture"
              type="button"
              onClick={handleStartCreate}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm hover:shadow-md min-h-[44px]"
            >
              <Plus size={18} />
              <span>Nouvelle facture</span>
            </button>
          </div>

          {/* Search Bar & Status Filter Tabs */}
          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id="search-factures"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par numéro (FAC-2026...), client, téléphone ou ICE..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  id={`filter-status-${f.id}`}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === f.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Invoices Table */}
          {isLoading ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">
                Chargement des factures...
              </p>
            </div>
          ) : invoices.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 sm:px-6">Numéro</th>
                      <th className="py-3.5 px-4 sm:px-6">Client</th>
                      <th className="py-3.5 px-4 sm:px-6">Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Total</th>
                      <th className="py-3.5 px-4 sm:px-6 text-center">Statut</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoices.map((inv) => {
                      const canAddPayment =
                        inv.status !== "cancelled" &&
                        inv.status !== "paid" &&
                        (inv.balance_cents ?? inv.total_cents) > 0;
                      const canCancel = inv.status !== "cancelled";

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDetail(inv.id)}
                        >
                          {/* Numéro */}
                          <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                            <span className="text-blue-600 group-hover:underline">
                              {inv.invoice_number}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-4 px-4 sm:px-6">
                            <div className="font-bold text-slate-900 text-sm">
                              {inv.client_name}
                            </div>
                            <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                              <span>
                                {inv.client_type === "company" ? "Entreprise" : "Particulier"}
                              </span>
                              {inv.client_phone && (
                                <>
                                  <span>·</span>
                                  <span>{inv.client_phone}</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-4 px-4 sm:px-6 text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{inv.invoice_date}</span>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            <div className="font-mono font-extrabold text-slate-900 text-sm">
                              {formatMoney(inv.total_cents, inv.currency || "MAD", true)}
                            </div>
                            {inv.status === "partially_paid" && (
                              <div className="text-[11px] font-mono text-amber-700 font-semibold mt-0.5">
                                Reste: {formatMoney(inv.balance_cents ?? inv.total_cents, inv.currency || "MAD", true)}
                              </div>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                            <InvoiceStatusBadge status={inv.status} size="sm" />
                          </td>

                          {/* Action */}
                          <td
                            className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Voir Button */}
                              <button
                                type="button"
                                id={`btn-view-invoice-${inv.id}`}
                                onClick={() => handleOpenDetail(inv.id)}
                                title="Voir les détails de la facture"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Eye size={13} className="text-slate-500" />
                                <span>Voir</span>
                              </button>

                              {/* Ajouter un paiement Button */}
                              {canAddPayment && (
                                <button
                                  type="button"
                                  id={`btn-pay-invoice-${inv.id}`}
                                  onClick={() => setPaymentModalInvoice(inv)}
                                  title="Ajouter un règlement"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Plus size={13} className="text-emerald-600" />
                                  <span>Paiement</span>
                                </button>
                              )}

                              {/* Annuler Button */}
                              {canCancel && (
                                <button
                                  type="button"
                                  id={`btn-cancel-invoice-${inv.id}`}
                                  onClick={() => setCancelDialogInvoice(inv)}
                                  title="Annuler cette facture"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <AlertTriangle size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Stats */}
              <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {invoices.length} facture{invoices.length > 1 ? "s" : ""} trouvée{invoices.length > 1 ? "s" : ""}
                </span>
                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Afficher toutes les factures
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchQuery || statusFilter !== "all"
                  ? "Aucune facture ne correspond à votre recherche"
                  : "Aucune facture pour le moment"}
              </h3>
              <p className="text-slate-500 text-xs max-w-md mb-6 leading-relaxed">
                {searchQuery || statusFilter !== "all"
                  ? "Essayez de modifier vos filtres de statut ou le texte de recherche."
                  : "Créez vos factures en quelques clics pour vos clients et gardez un historique clair 100% hors-ligne."}
              </p>

              {searchQuery || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button
                  id="btn-create-first-facture"
                  type="button"
                  onClick={handleStartCreate}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer min-h-[44px] shadow-sm hover:shadow-md"
                >
                  Créer ma première facture
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Payment Modal */}
      {paymentModalInvoice && (
        <AddPaymentModal
          invoice={paymentModalInvoice}
          isOpen={!!paymentModalInvoice}
          isSubmitting={isSubmittingPayment}
          onClose={() => setPaymentModalInvoice(null)}
          onSubmit={handlePaymentSubmit}
        />
      )}

      {/* Cancel Invoice Confirmation Dialog */}
      {cancelDialogInvoice && (
        <CancelInvoiceDialog
          invoice={cancelDialogInvoice}
          isOpen={!!cancelDialogInvoice}
          isCancelling={isCancellingInvoice}
          onClose={() => setCancelDialogInvoice(null)}
          onConfirmCancel={handleConfirmCancel}
        />
      )}
    </div>
  );
};
