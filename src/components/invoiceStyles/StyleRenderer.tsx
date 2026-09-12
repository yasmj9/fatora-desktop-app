import React from "react";
import { InvoiceStyle } from "../../types/invoiceStyle";
import { CompanySettings } from "../../types/company";
import { DocumentData } from "../../types/documentData";
import { Style1Classique } from "./layouts/Style1Classique";
import { Style2Moderne } from "./layouts/Style2Moderne";
import { Style3Epure } from "./layouts/Style3Epure";
import { sampleCompany, sampleInvoiceData } from "./sampleData";

interface StyleRendererProps {
  documentData?: DocumentData;
  style?: InvoiceStyle;
  company?: CompanySettings;
  logoData?: string | null;
  invoiceData?: typeof sampleInvoiceData;
}

/**
 * Master Registry Component for Invoice Styles.
 * Decouples document data from visual rendering.
 * Consumes DocumentData and delegates rendering to specific visual layout components.
 */
export const StyleRenderer: React.FC<StyleRendererProps> = ({
  documentData,
  style,
  company = sampleCompany,
  logoData = null,
  invoiceData = sampleInvoiceData,
}) => {
  // If documentData is provided, use it directly
  let docData: DocumentData;

  if (documentData) {
    docData = documentData;
  } else if (style) {
    // Construct fallback DocumentData for style preview screens
    docData = {
      documentNumber: invoiceData.number,
      type: "invoice",
      date: invoiceData.date,
      dueDate: invoiceData.dueDate,
      language: "fr",
      currency: "MAD",

      company: {
        name: company.name,
        contactPerson: company.contact_person,
        address: company.address,
        city: company.city,
        country: company.country,
        phone: company.phone,
        email: company.email,
        website: company.website,
        ice: company.ice,
        ifTax: company.if_tax,
        rc: company.rc,
        patente: company.patente,
        cnss: company.cnss,
        bankName: company.bank_name,
        ribIban: company.rib_iban,
        logoDataUrl: logoData,
      },

      client: {
        name: invoiceData.clientName,
        address: invoiceData.clientAddress,
        phone: invoiceData.clientPhone,
        ice: invoiceData.clientIce,
      },

      items: invoiceData.items.map((it, idx) => ({
        id: idx + 1,
        description: it.description,
        quantity: it.quantity,
        unitPriceCents: it.unitPriceCents,
        totalCents: it.totalCents,
      })),

      subtotalCents: invoiceData.subtotalCents,
      discountCents: 0,
      taxRate: invoiceData.taxRate,
      taxAmountCents: invoiceData.taxAmountCents,
      totalCents: invoiceData.totalCents,
      paidAmountCents: invoiceData.paidCents,
      remainingBalanceCents: invoiceData.balanceCents,
      status: invoiceData.status as DocumentData["status"],
      payments: [],
      style,
    };
  } else {
    throw new Error("StyleRenderer requires either documentData or style prop.");
  }

  const key = docData.style.style_key;

  switch (key) {
    case "style_1":
      return <Style1Classique documentData={docData} />;
    case "style_2":
      return <Style2Moderne documentData={docData} />;
    case "style_3":
      return <Style3Epure documentData={docData} />;
    default:
      return <Style1Classique documentData={docData} />;
  }
};
