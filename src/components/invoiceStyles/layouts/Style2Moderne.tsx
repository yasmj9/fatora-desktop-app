import React from "react";
import { DocumentData } from "../../../types/documentData";
import { DOCUMENT_TRANSLATIONS, getPaymentMethodLabel } from "../../../utils/documentTranslations";
import { formatMoney } from "../../../utils/money";

interface StyleLayoutProps {
  documentData: DocumentData;
}

export const Style2Moderne: React.FC<StyleLayoutProps> = ({ documentData }) => {
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
    paidAmountCents,
    remainingBalanceCents,
    payments,
    notes,
    paymentTerms,
    style,
  } = documentData;

  const isRtl = language === "ar";
  const labels = DOCUMENT_TRANSLATIONS[language] || DOCUMENT_TRANSLATIONS.fr;

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs font-sans text-slate-800 relative space-y-0"
      style={{
        fontFamily: isRtl
          ? "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans Arabic', 'Cairo', 'Amiri', 'Tahoma', sans-serif"
          : undefined,
      }}
    >
      {/* Accent Top Banner */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: style.accent_color || "#0d9488" }}
      />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            {company.logoDataUrl ? (
              <img
                src={company.logoDataUrl}
                alt="Logo"
                className="max-h-16 max-w-[220px] object-contain mb-2"
              />
            ) : (
              <div
                className="font-black text-xl tracking-tight"
                style={{ color: style.primary_color }}
              >
                {company.name || "Nom de l'entreprise"}
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-0.5">
              {style.show_address && company.address && (
                <div>
                  {company.address}
                  {company.city ? `, ${company.city}` : ""}
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-slate-600 font-medium">
                {style.show_phone && company.phone && <span>{company.phone}</span>}
                {style.show_email && company.email && <span>{company.email}</span>}
              </div>
            </div>
          </div>

          <div className={`${isRtl ? "text-left" : "text-right"} space-y-1 w-full sm:w-auto`}>
            <span
              className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest text-white shadow-xs"
              style={{ backgroundColor: style.accent_color || "#0d9488" }}
            >
              {labels.invoiceTitle}
            </span>
            <div className="font-mono font-extrabold text-slate-900 text-base">
              {documentNumber}
            </div>
            <div className="text-[11px] text-slate-500">
              {labels.date} : <span className="font-semibold text-slate-700">{date}</span>
            </div>
            {dueDate && (
              <div className="text-[11px] text-slate-500">
                {labels.dueDate} : <span className="font-semibold text-slate-700">{dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Client & Issuer References */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {labels.billedTo}
            </div>
            <div className="font-bold text-slate-900 text-sm">{client.name}</div>
            {client.contactPerson && (
              <div className="text-[11px] text-slate-600">{client.contactPerson}</div>
            )}
            {client.phone && (
              <div className="text-[11px] text-slate-600">
                {labels.phone} : {client.phone}
              </div>
            )}
            {client.address && (
              <div className="text-[11px] text-slate-600">
                {client.address}
                {client.city ? `, ${client.city}` : ""}
              </div>
            )}
            {client.ice && (
              <div className="text-[11px] font-mono text-slate-500">
                {labels.ice} : {client.ice}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              {labels.issuerInfo}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
              {style.show_ice && company.ice && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  {labels.ice}: {company.ice}
                </span>
              )}
              {style.show_tax_id && company.ifTax && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  {labels.ifTax}: {company.ifTax}
                </span>
              )}
              {style.show_rc && company.rc && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  {labels.rc}: {company.rc}
                </span>
              )}
              {style.show_cnss && company.cnss && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  {labels.cnss}: {company.cnss}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className={`py-3 px-4 ${isRtl ? "text-right" : "text-left"}`}>
                  {labels.description}
                </th>
                <th className="py-3 px-4 text-center">{labels.quantity}</th>
                <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                  {labels.unitPrice}
                </th>
                <th className={`py-3 px-4 ${isRtl ? "text-left" : "text-right"}`}>
                  {labels.totalHT}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {items.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-slate-50/50"
                  style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
                >
                  <td className={`py-3 px-4 font-semibold text-slate-800 ${isRtl ? "text-right" : "text-left"}`}>
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                  <td className={`py-3 px-4 font-mono ${isRtl ? "text-left" : "text-right"}`}>
                    {formatMoney(item.unitPriceCents, currency, false)}
                  </td>
                  <td className={`py-3 px-4 font-mono font-bold text-slate-900 ${isRtl ? "text-left" : "text-right"}`}>
                    {formatMoney(item.totalCents, currency, false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Bank Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
          {style.show_iban && company.ribIban ? (
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-1 text-[11px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {labels.bankDetails} :
              </div>
              <div className="font-bold text-slate-800">{company.bankName || "Banque"}</div>
              <div className="font-mono text-[10px] text-slate-600 break-all">
                {company.ribIban}
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>{labels.subtotalHT}</span>
              <span className="font-mono font-bold text-slate-800">
                {formatMoney(subtotalCents, currency, true)}
              </span>
            </div>

            {discountCents > 0 && (
              <div className="flex justify-between text-emerald-700 text-[11px]">
                <span>{labels.discount}</span>
                <span className="font-mono font-bold">
                  - {formatMoney(discountCents, currency, true)}
                </span>
              </div>
            )}

            {taxAmountCents > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>
                  {labels.tax} ({taxRate}%)
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {formatMoney(taxAmountCents, currency, true)}
                </span>
              </div>
            )}

            <div
              className="flex justify-between text-base font-black pt-2 border-t border-slate-200"
              style={{ color: style.primary_color }}
            >
              <span>{labels.totalTTC}</span>
              <span className="font-mono">{formatMoney(totalCents, currency, true)}</span>
            </div>

            {paidAmountCents > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                <span>{labels.paidAmount}</span>
                <span className="font-mono">{formatMoney(paidAmountCents, currency, true)}</span>
              </div>
            )}

            {remainingBalanceCents > 0 && (
              <div className="flex justify-between text-rose-600 font-bold text-[11px] pt-1 border-t border-dashed border-slate-200">
                <span>{labels.remainingAmount}</span>
                <span className="font-mono">{formatMoney(remainingBalanceCents, currency, true)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment History (if present) */}
        {payments && payments.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {labels.paymentHistory}
            </div>
            <div className="space-y-1 text-[11px]">
              {payments.map((p, idx) => (
                <div key={p.id || idx} className="flex justify-between font-mono text-slate-700">
                  <span>
                    {p.date} — {getPaymentMethodLabel(p.method, language)}
                  </span>
                  <span className="font-bold text-emerald-700">
                    + {formatMoney(p.amountCents, currency, true)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Terms */}
        {(notes || paymentTerms) && (
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
            {paymentTerms && (
              <div>
                <span className="font-bold">{labels.notes} :</span> {paymentTerms}
              </div>
            )}
            {notes && <p className="whitespace-pre-line">{notes}</p>}
          </div>
        )}

        {/* Footer Note */}
        <div
          className="p-3 rounded-xl text-center text-[10px] font-medium"
          style={{
            backgroundColor: style.footer_color || "#f8fafc",
            color: "#475569",
          }}
        >
          {style.footer_text || "Merci de votre confiance."}
        </div>
      </div>
    </div>
  );
};
