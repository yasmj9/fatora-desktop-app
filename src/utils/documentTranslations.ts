export type DocumentLanguage = "fr" | "en" | "ar";

export interface DocumentLabels {
  invoiceTitle: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  billedTo: string;
  issuerInfo: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalHT: string;
  subtotalHT: string;
  discount: string;
  tax: string;
  totalTTC: string;
  paidAmount: string;
  remainingAmount: string;
  paymentMethod: string;
  paymentHistory: string;
  reference: string;
  notes: string;
  bankDetails: string;
  ice: string;
  ifTax: string;
  rc: string;
  cnss: string;
  phone: string;
  email: string;
  address: string;
  statusPaid: string;
  statusPartiallyPaid: string;
  statusUnpaid: string;
  statusCancelled: string;
}

export const DOCUMENT_TRANSLATIONS: Record<DocumentLanguage, DocumentLabels> = {
  fr: {
    invoiceTitle: "FACTURE",
    invoiceNumber: "N° Facture",
    date: "Date d'émission",
    dueDate: "Date d'échéance",
    billedTo: "Facturé à",
    issuerInfo: "Émetteur — Identifiants légaux",
    description: "Description",
    unit: "Unité",
    quantity: "Qté",
    unitPrice: "Prix unitaire",
    totalHT: "Total HT",
    subtotalHT: "Sous-total HT",
    discount: "Remise",
    tax: "TVA",
    totalTTC: "TOTAL TTC",
    paidAmount: "Montant réglé",
    remainingAmount: "Reste à payer",
    paymentMethod: "Mode de règlement",
    paymentHistory: "Historique des règlements",
    reference: "Réf",
    notes: "Notes / Remarques",
    bankDetails: "Règlement bancaire",
    ice: "ICE",
    ifTax: "IF",
    rc: "RC",
    cnss: "CNSS",
    phone: "Tél",
    email: "Email",
    address: "Adresse",
    statusPaid: "Payée",
    statusPartiallyPaid: "Partiellement payée",
    statusUnpaid: "Non payée",
    statusCancelled: "Annulée",
  },
  en: {
    invoiceTitle: "INVOICE",
    invoiceNumber: "Invoice No.",
    date: "Issue Date",
    dueDate: "Due Date",
    billedTo: "Billed To",
    issuerInfo: "Issuer — Legal Identifiers",
    description: "Description",
    unit: "Unit",
    quantity: "Qty",
    unitPrice: "Unit Price",
    totalHT: "Total Excl. Tax",
    subtotalHT: "Subtotal Excl. Tax",
    discount: "Discount",
    tax: "VAT / Tax",
    totalTTC: "TOTAL INCL. TAX",
    paidAmount: "Amount Paid",
    remainingAmount: "Balance Due",
    paymentMethod: "Payment Method",
    paymentHistory: "Payment History",
    reference: "Ref",
    notes: "Notes / Terms",
    bankDetails: "Bank Details",
    ice: "ICE",
    ifTax: "Tax ID",
    rc: "CR",
    cnss: "CNSS",
    phone: "Tel",
    email: "Email",
    address: "Address",
    statusPaid: "Paid",
    statusPartiallyPaid: "Partially Paid",
    statusUnpaid: "Unpaid",
    statusCancelled: "Cancelled",
  },
  ar: {
    invoiceTitle: "فاتـورة",
    invoiceNumber: "رقم الفاتورة",
    date: "تاريخ الإصدار",
    dueDate: "تاريخ الاستحقاق",
    billedTo: "مفوترة إلى (العميل)",
    issuerInfo: "المُصدر — البيانات القانونية",
    description: "الوصف / الخدمة",
    unit: "الوحدة",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    totalHT: "المجموع بدون ضريبة",
    subtotalHT: "المجموع الفرعي",
    discount: "الخصم",
    tax: "الضريبة",
    totalTTC: "المجموع الإجمالي الشامل",
    paidAmount: "المبلغ المدفوع",
    remainingAmount: "المبلغ المتبقي",
    paymentMethod: "طريقة الدفع",
    paymentHistory: "سجل الدفعات",
    reference: "مرجع",
    notes: "ملاحظات",
    bankDetails: "تفاصيل الحساب البنكي",
    ice: "ICE",
    ifTax: "المعرف الضريبي",
    rc: "السجل التجاري",
    cnss: "CNSS",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    statusPaid: "مدفوعة",
    statusPartiallyPaid: "مدفوعة جزئياً",
    statusUnpaid: "غير مدفوعة",
    statusCancelled: "ملغاة",
  },
};

export function getPaymentMethodLabel(method: string, lang: DocumentLanguage): string {
  if (lang === "ar") {
    switch (method) {
      case "cash":
        return "نقداً";
      case "bank_transfer":
        return "تحويل بنكي";
      case "check":
        return "شيك";
      case "card":
        return "بطاقة بنكية";
      default:
        return "طريقة أخرى";
    }
  }
  if (lang === "en") {
    switch (method) {
      case "cash":
        return "Cash";
      case "bank_transfer":
        return "Bank Transfer";
      case "check":
        return "Check";
      case "card":
        return "Credit Card";
      default:
        return "Other";
    }
  }
  switch (method) {
    case "cash":
      return "Espèces";
    case "bank_transfer":
      return "Virement bancaire";
    case "check":
      return "Chèque";
    case "card":
      return "Carte bancaire";
    default:
      return "Autre";
  }
}

/**
  * Safely normalizes invoice number and client name into a clean, safe filename.
  * Example: FAC-2026-0023-Ahmed-Bennani.pdf
  */
export function generateSafeFilename(
  invoiceNumber: string,
  clientName: string,
  extension: string = "pdf"
): string {
  const cleanNumber = invoiceNumber
    .trim()
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-");

  const cleanClient = clientName
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-zA-Z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const base = `${cleanNumber}${cleanClient ? `-${cleanClient}` : ""}`;
  return `${base}.${extension}`;
}
