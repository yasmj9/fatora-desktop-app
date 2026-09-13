import React from "react";
import { DocumentData } from "../../../types/documentData";
import { DOCUMENT_TRANSLATIONS, getPaymentMethodLabel } from "../../../utils/documentTranslations";
import { formatMoney } from "../../../utils/money";

interface StyleLayoutProps {
  documentData: DocumentData;
}

export const Style1Classique: React.FC<StyleLayoutProps> = ({ documentData }) => {
  const {
    documentNumber,
    date,
    dueDate,
    language,
    currency,
    company,
    client,
    items,
    subtotalCents,
    discountCents,
    taxRate,
    taxAmountCents,
    totalCents,
    payments,
    paymentTerms,
    style,
  } = documentData;

  const isRtl = language === "ar";
  const labels = DOCUMENT_TRANSLATIONS[language] || DOCUMENT_TRANSLATIONS.fr;

  // Resolve payment mode and reference
  const primaryPayment = payments && payments.length > 0 ? payments[0] : null;
  const paymentMethodDisplay = primaryPayment
    ? getPaymentMethodLabel(primaryPayment.method, language)
    : paymentTerms || (language === "ar" ? "تحويل بنكي" : language === "en" ? "Bank Transfer" : "Virement bancaire");
  const paymentRefDisplay = primaryPayment?.reference || `#${documentNumber}`;

  // Header and Footer background colors (default dark yellow / amber)
  const headerBg = style.header_bg_color || "#ca8a04";
  const headerText = style.header_text_color || "#111827";
  const tableHeaderBg = style.table_header_bg_color || "#1e293b";
  const tableHeaderText = style.table_header_text_color || "#ffffff";
  const footerBg = style.footer_bg_color || headerBg;
  const footerTextClr = style.footer_text_color || headerText;
  const accentColor = style.accent_color || "#ca8a04";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="text-slate-800 text-xs font-sans flex flex-col justify-between min-h-[1120px] w-full bg-white box-border"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: isRtl
          ? "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans Arabic', 'Cairo', 'Amiri', 'Tahoma', sans-serif"
          : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div className="flex flex-col flex-1">
        {/* TOP FULL-WIDTH HEADER with margin on top and dark yellow background */}
        <div className="pt-4 px-4 sm:pt-6 sm:px-6">
          <div
            className="w-full px-6 py-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xs"
            style={{
              backgroundColor: headerBg,
              color: headerText,
            }}
          >
            {/* LEFT: Logo and Name of Company */}
            <div className="flex items-center gap-4">
              {company.logoDataUrl ? (
                <img
                  src={company.logoDataUrl}
                  alt={company.name || "Logo"}
                  className="max-h-16 max-w-[180px] object-contain rounded-md"
                />
              ) : null}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase" style={{ color: headerText }}>
                  {company.name || "Nom de l'entreprise"}
                </h1>
                {company.city && (
                  <p className="text-xs font-semibold opacity-90" style={{ color: headerText }}>
                    {company.city}{company.country ? `, ${company.country}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Invoice Title and Invoice Number */}
            <div className={`${isRtl ? "sm:text-left" : "sm:text-right"} space-y-0.5`}>
              <div className="text-xl sm:text-2xl font-black uppercase tracking-wider" style={{ color: headerText }}>
                {labels.invoiceTitle}
              </div>
              <div className="text-sm font-bold font-mono tracking-wide" style={{ color: headerText }}>
                {labels.invoiceNumber} : <span className="font-black">#{documentNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col">
          {/* SECTION 2: BILL TO (LEFT) & FROM (RIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-2">
            {/* LEFT: Facturé à (Client information) */}
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
              }}
            >
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider pb-1 border-b"
                style={{
                  color: accentColor,
                  borderColor: "#e2e8f0",
                }}
              >
                {labels.billedTo}
              </div>
              <div className="font-bold text-sm" style={{ color: "#0f172a" }}>
                {client.name}
              </div>
              {client.address && (
                <div className="text-[11px]" style={{ color: "#334155" }}>
                  <span className="font-semibold text-slate-500">{labels.address} :</span> {client.address}
                  {client.city ? `, ${client.city}` : ""}
                </div>
              )}
              {client.phone && (
                <div className="text-[11px]" style={{ color: "#334155" }}>
                  <span className="font-semibold text-slate-500">{labels.phone} :</span> {client.phone}
                </div>
              )}
              {style.show_ice && client.ice && (
                <div
                  className="text-[11px] font-mono px-2 py-0.5 rounded border inline-block"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    color: "#1e293b",
                  }}
                >
                  <span className="font-bold text-slate-600">{labels.ice} :</span> {client.ice}
                </div>
              )}
            </div>

            {/* RIGHT: Émetteur (Company information) */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${isRtl ? "text-left" : "text-right"}`}
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
              }}
            >
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider pb-1 border-b"
                style={{
                  color: accentColor,
                  borderColor: "#e2e8f0",
                }}
              >
                {labels.issuerInfo}
              </div>
              <div className="font-bold text-sm" style={{ color: "#0f172a" }}>
                {company.name}
              </div>
              
              {style.show_address && company.address && (
                <div className="text-[11px]" style={{ color: "#334155" }}>
                  {company.address}{company.city ? `, ${company.city}` : ""}
                </div>
              )}

              <div className="text-[11px] space-y-0.5" style={{ color: "#334155" }}>
                {style.show_phone && company.phone && (
                  <div>
                    <span className="text-slate-500">{labels.phone} :</span> {company.phone}
                  </div>
                )}
                {style.show_email && company.email && (
                  <div>
                    <span className="text-slate-500">{labels.email} :</span> {company.email}
                  </div>
                )}
              </div>

              {/* Legal Badges (ICE, IF, RC, CNSS) */}
              <div className={`flex flex-wrap gap-1.5 text-[10px] font-mono pt-1 ${isRtl ? "justify-start" : "justify-end"}`}>
                {style.show_ice && company.ice && (
                  <span
                    className="px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
                  >
                    <strong>{labels.ice}:</strong> {company.ice}
                  </span>
                )}
                {style.show_tax_id && company.ifTax && (
                  <span
                    className="px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
                  >
                    <strong>{labels.ifTax}:</strong> {company.ifTax}
                  </span>
                )}
                {style.show_rc && company.rc && (
                  <span
                    className="px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
                  >
                    <strong>{labels.rc}:</strong> {company.rc}
                  </span>
                )}
                {style.show_cnss && company.cnss && (
                  <span
                    className="px-1.5 py-0.5 rounded border"
                    style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", color: "#1e293b" }}
                  >
                    <strong>{labels.cnss}:</strong> {company.cnss}
                  </span>
                )}
              </div>

              {/* Date and Due Date */}
              <div
                className="text-[11px] font-medium pt-1.5 border-t"
                style={{
                  color: "#1e293b",
                  borderColor: "#e2e8f0",
                }}
              >
                <span>{labels.date} : <strong>{date}</strong></span>
                {style.show_due_date !== false && dueDate && (
                  <span className="ml-2 inline-block">
                    | {labels.dueDate} : <strong style={{ color: "#b45309" }}>{dueDate}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: LINE ITEMS TABLE */}
          <div
            className="rounded-lg overflow-hidden border mt-2"
            style={{ borderColor: "#e2e8f0" }}
          >
            <table className="w-full border-collapse">
              <thead>
                <tr
                  style={{
                    backgroundColor: tableHeaderBg,
                    color: tableHeaderText,
                  }}
                  className="text-[11px] font-bold uppercase tracking-wider"
                >
                  <th className={`py-3 px-4 ${isRtl ? "text-right" : "text-left"}`}>
                    {labels.description}
                  </th>
                  <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                    {labels.unitPrice} ({currency})
                  </th>
                  <th className="py-3 px-4 text-center">{labels.quantity}</th>
                  <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                    {labels.totalHT} ({currency})
                  </th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      borderTop: "1px solid #e2e8f0",
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <td
                      className={`py-3 px-4 font-semibold ${isRtl ? "text-right" : "text-left"}`}
                      style={{ color: "#0f172a" }}
                    >
                      {item.description}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono ${isRtl ? "text-left" : "text-right"}`}
                      style={{ color: "#334155" }}
                    >
                      {formatMoney(item.unitPriceCents, currency, false)}
                    </td>
                    <td
                      className="py-3 px-4 text-center font-mono font-bold"
                      style={{ color: "#0f172a" }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className={`py-3 px-4 font-mono font-bold ${isRtl ? "text-left" : "text-right"}`}
                      style={{ color: "#0f172a" }}
                    >
                      {formatMoney(item.totalCents, currency, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: SUMMARY OF TOTAL WITH TAX */}
          <div className="flex justify-end pt-2" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
            <div
              className="w-full sm:w-80 space-y-1.5 text-[11px] p-4 rounded-xl border"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
              }}
            >
              <div
                className="flex justify-between py-1 border-b"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                <span className="font-semibold uppercase">{labels.subtotalHT}</span>
                <span className="font-mono font-bold" style={{ color: "#0f172a" }}>
                  {formatMoney(subtotalCents, currency, true)}
                </span>
              </div>

              {discountCents > 0 && (
                <div
                  className="flex justify-between py-1 border-b"
                  style={{ borderColor: "#e2e8f0", color: "#047857" }}
                >
                  <span className="font-semibold uppercase">{labels.discount}</span>
                  <span className="font-mono font-bold">
                    - {formatMoney(discountCents, currency, true)}
                  </span>
                </div>
              )}

              {taxAmountCents > 0 && (
                <div
                  className="flex justify-between py-1 border-b"
                  style={{ borderColor: "#e2e8f0", color: "#475569" }}
                >
                  <span className="font-semibold uppercase">
                    {labels.tax} ({taxRate}%)
                  </span>
                  <span className="font-mono font-bold" style={{ color: "#0f172a" }}>
                    {formatMoney(taxAmountCents, currency, true)}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between text-base font-black pt-2.5 pb-1 border-t-2"
                style={{
                  borderColor: "#0f172a",
                  color: style.primary_color || "#0f172a",
                }}
              >
                <span className="uppercase">{labels.totalTTC}</span>
                <span className="font-mono font-black" style={{ color: "#0f172a" }}>
                  {formatMoney(totalCents, currency, true)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 5: LOWER GRID (REF OF PAYMENT ON LEFT, SIGNATURE ON RIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 mt-auto items-end">
            {/* LEFT: Reference of payment / Payment details */}
            <div
              className="space-y-2.5 p-4 rounded-xl border"
              style={{
                backgroundColor: "#f8fafc",
                borderColor: "#e2e8f0",
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <div
                className="text-[10px] font-extrabold uppercase tracking-wider pb-1.5 border-b"
                style={{
                  color: accentColor,
                  borderColor: "#e2e8f0",
                }}
              >
                {labels.bankDetails}
              </div>

              <div className="space-y-2 text-[11px]" style={{ color: "#334155" }}>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{labels.paymentMethod} :</span>
                  <span className="font-bold text-slate-800">{paymentMethodDisplay}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">{labels.reference} :</span>
                  <span className="font-mono font-bold text-slate-800">{paymentRefDisplay}</span>
                </div>

                {style.show_iban && company.ribIban && (
                  <div className="pt-1.5 space-y-1">
                    {company.bankName && (
                      <div className="font-bold text-slate-700 text-[10px]">{company.bankName}</div>
                    )}
                    <div
                      className="p-2 rounded-lg border font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: "#ffffff",
                        borderColor: "#cbd5e1",
                        color: "#0f172a",
                      }}
                    >
                      {company.ribIban}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Signature Section */}
            <div
              className={`flex flex-col ${isRtl ? "items-start text-left" : "items-end text-right"} p-4 space-y-2`}
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <div
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#475569" }}
              >
                {labels.signature}
              </div>
              <div className="h-16 w-44" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: FULL-WIDTH FOOTER with background color matching header */}
      <div className="p-4 pt-0 sm:p-6 sm:pt-0 mt-auto">
        <div
          className="w-full px-6 py-3.5 rounded-xl text-center text-[10px] font-bold leading-relaxed shadow-2xs"
          style={{
            backgroundColor: footerBg,
            color: footerTextClr,
          }}
        >
          {style.footer_text || `${company.name || "Entreprise"} — ${company.email || ""} ${company.phone ? `• ${company.phone}` : ""}`}
        </div>
      </div>
    </div>
  );
};
