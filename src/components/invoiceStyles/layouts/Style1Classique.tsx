import React from "react";
import { DocumentData } from "../../../types/documentData";
import { DOCUMENT_TRANSLATIONS } from "../../../utils/documentTranslations";
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
    style,
  } = documentData;

  const isRtl = language === "ar";
  const labels = DOCUMENT_TRANSLATIONS[language] || DOCUMENT_TRANSLATIONS.fr;

  // Default header background color: dark yellow (#ca8a04)
  const headerBg = style.header_bg_color || "#ca8a04";
  const headerText = style.header_text_color || "#111827";
  const tableHeaderBg = style.table_header_bg_color || "#1e293b";
  const tableHeaderText = style.table_header_text_color || "#ffffff";
  const footerBg = style.footer_bg_color || headerBg;
  const footerTextClr = style.footer_text_color || headerText;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-white text-slate-800 text-xs shadow-sm font-sans rounded-xl border border-slate-200 flex flex-col justify-between min-h-[820px] overflow-hidden"
      style={{
        fontFamily: isRtl
          ? "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans Arabic', 'Cairo', 'Amiri', 'Tahoma', sans-serif"
          : undefined,
      }}
    >
      <div className="flex flex-col flex-1">
        {/* TOP FULL-WIDTH HEADER with margin on top and dark yellow background */}
        <div className="pt-3 px-3">
          <div
            className="w-full px-6 py-5 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xs"
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
                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                  {company.name || "Nom de l'entreprise"}
                </h1>
                {company.city && (
                  <p className="text-xs font-semibold opacity-85">
                    {company.city}{company.country ? `, ${company.country}` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT: Invoice Title and Invoice Number */}
            <div className={`${isRtl ? "sm:text-left" : "sm:text-right"} space-y-0.5`}>
              <div className="text-xl sm:text-2xl font-black uppercase tracking-wider">
                {labels.invoiceTitle}
              </div>
              <div className="text-sm font-bold font-mono tracking-wide opacity-95">
                {labels.invoiceNumber} : <span className="font-extrabold">#{documentNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col">
          {/* SECTION 2: BILL TO (LEFT) & FROM (RIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-2">
            {/* LEFT: Bill To (Client information) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2">
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider pb-1 border-b border-slate-200"
                style={{ color: style.accent_color || "#ca8a04" }}
              >
                {labels.billedTo}
              </div>
              <div className="font-bold text-slate-900 text-sm">{client.name}</div>
              {client.address && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium text-slate-500">{labels.address} :</span> {client.address}
                  {client.city ? `, ${client.city}` : ""}
                </div>
              )}
              {client.phone && (
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium text-slate-500">{labels.phone} :</span> {client.phone}
                </div>
              )}
              {style.show_ice && client.ice && (
                <div className="text-[11px] font-mono text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                  <span className="font-bold text-slate-600">{labels.ice} :</span> {client.ice}
                </div>
              )}
            </div>

            {/* RIGHT: From (Company information) */}
            <div className={`bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-2 ${isRtl ? "text-left" : "text-right"}`}>
              <div
                className="text-[11px] font-extrabold uppercase tracking-wider pb-1 border-b border-slate-200"
                style={{ color: style.accent_color || "#ca8a04" }}
              >
                {labels.issuerInfo}
              </div>
              <div className="font-bold text-slate-900 text-sm">{company.name}</div>
              
              {style.show_address && company.address && (
                <div className="text-[11px] text-slate-600">
                  {company.address}{company.city ? `, ${company.city}` : ""}
                </div>
              )}

              <div className="text-[11px] text-slate-600 space-y-0.5">
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
              <div className={`flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-600 pt-1 ${isRtl ? "justify-start" : "justify-end"}`}>
                {style.show_ice && company.ice && (
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <strong>{labels.ice}:</strong> {company.ice}
                  </span>
                )}
                {style.show_tax_id && company.ifTax && (
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <strong>{labels.ifTax}:</strong> {company.ifTax}
                  </span>
                )}
                {style.show_rc && company.rc && (
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <strong>{labels.rc}:</strong> {company.rc}
                  </span>
                )}
                {style.show_cnss && company.cnss && (
                  <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <strong>{labels.cnss}:</strong> {company.cnss}
                  </span>
                )}
              </div>

              {/* Date and Due Date */}
              <div className="text-[11px] text-slate-700 font-medium pt-1.5 border-t border-slate-200/80">
                <span>{labels.date} : <strong>{date}</strong></span>
                {style.show_due_date !== false && dueDate && (
                  <span className="ml-2 inline-block">
                    | {labels.dueDate} : <strong className="text-amber-800">{dueDate}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: LINE ITEMS TABLE */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mt-2">
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
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className={`py-3 px-4 font-medium text-slate-900 ${isRtl ? "text-right" : "text-left"}`}>
                      {item.description}
                    </td>
                    <td className={`py-3 px-4 font-mono ${isRtl ? "text-left" : "text-right"}`}>
                      {formatMoney(item.unitPriceCents, currency, false)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{item.quantity}</td>
                    <td className={`py-3 px-4 font-mono font-bold text-slate-900 ${isRtl ? "text-left" : "text-right"}`}>
                      {formatMoney(item.totalCents, currency, false)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: SUMMARY OF TOTAL WITH TAX */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-80 space-y-1.5 text-[11px] bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200">
                <span className="font-semibold uppercase">{labels.subtotalHT}</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatMoney(subtotalCents, currency, true)}
                </span>
              </div>

              {discountCents > 0 && (
                <div className="flex justify-between text-emerald-700 py-1 border-b border-slate-200">
                  <span className="font-semibold uppercase">{labels.discount}</span>
                  <span className="font-mono font-bold">
                    - {formatMoney(discountCents, currency, true)}
                  </span>
                </div>
              )}

              {taxAmountCents > 0 && (
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200">
                  <span className="font-semibold uppercase">
                    {labels.tax} ({taxRate}%)
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(taxAmountCents, currency, true)}
                  </span>
                </div>
              )}

              <div
                className="flex justify-between text-base font-black pt-2.5 pb-1 border-t-2 border-slate-900"
                style={{ color: style.primary_color || "#1e293b" }}
              >
                <span className="uppercase">{labels.totalTTC}</span>
                <span className="font-mono font-extrabold">{formatMoney(totalCents, currency, true)}</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: LOWER GRID (REF OF PAYMENT ON LEFT, SIGNATURE ON RIGHT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 mt-auto items-end">
            {/* LEFT: Reference of payment / Bank details & notes */}
            <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div
                className="text-[10px] font-extrabold uppercase tracking-wider pb-1 border-b border-slate-200"
                style={{ color: style.accent_color || "#ca8a04" }}
              >
                {labels.bankDetails}
              </div>
              
              {style.show_iban && company.ribIban ? (
                <div className="text-[11px] text-slate-700 font-mono space-y-1">
                  {company.bankName && (
                    <div className="font-bold text-slate-900">{company.bankName}</div>
                  )}
                  <div className="bg-white p-2 rounded border border-slate-200 text-xs font-bold text-slate-800">
                    {company.ribIban}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  Paiement selon les conditions convenues.
                </div>
              )}

              {style.footer_text && (
                <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
                  {style.footer_text}
                </p>
              )}
            </div>

            {/* RIGHT: Signature Section */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-3 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {labels.signature}
              </div>
              <div className="h-16 w-48 border-b-2 border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[10px] font-serif italic text-slate-400">
                  Cachet & Signature
                </span>
              </div>
              <div className="text-[10px] font-bold text-slate-600">
                {company.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: FULL-WIDTH FOOTER with background color matching header */}
      <div className="p-3 pt-0 mt-auto">
        <div
          className="w-full px-6 py-3 rounded-lg text-center text-[10px] font-semibold leading-relaxed shadow-xs"
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



