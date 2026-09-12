import React from "react";
import { InvoiceStyle } from "../../types/invoiceStyle";
import { CompanySettings } from "../../types/company";
import { Style1Classique } from "./layouts/Style1Classique";
import { Style2Moderne } from "./layouts/Style2Moderne";
import { Style3Epure } from "./layouts/Style3Epure";
import { sampleCompany, sampleInvoiceData } from "./sampleData";

interface StyleRendererProps {
  style: InvoiceStyle;
  company?: CompanySettings;
  logoData?: string | null;
  invoiceData?: typeof sampleInvoiceData;
}

/**
 * Master Registry Component for Invoice Styles.
 * Adding a new style (e.g. Style 3, Style 4) is straightforward:
 * 1. Create a layout component in ./layouts/
 * 2. Add a new case in this switch statement
 */
export const StyleRenderer: React.FC<StyleRendererProps> = ({
  style,
  company = sampleCompany,
  logoData = null,
  invoiceData = sampleInvoiceData,
}) => {
  switch (style.style_key) {
    case "style_1":
      return <Style1Classique style={style} company={company} logoData={logoData} invoice={invoiceData} />;
    case "style_2":
      return <Style2Moderne style={style} company={company} logoData={logoData} invoice={invoiceData} />;
    case "style_3":
      return <Style3Epure style={style} company={company} logoData={logoData} invoice={invoiceData} />;
    default:
      return <Style1Classique style={style} company={company} logoData={logoData} invoice={invoiceData} />;
  }
};
