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
      className="bg-white p-6 sm:p-8 text-slate-800 text-xs shadow-sm font-sans rounded-xl border border-slate-200 space-y-6"
      style={{
        fontFamily: isRtl
          ? "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans Arabic', 'Cairo', 'Amiri', 'Tahoma', sans-serif"
          : undefined,
      }}
    >
      {/* Top Header Block */}
      <div
        className="p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start gap-4"
        style={{
          backgroundColor: style.header_color || "#f8fafc",
          borderColor: style.primary_color || "#1e3a8a",
        }}
      >
        {/* Company Identity & Logo */}
        <div className="space-y-2">
          {company.logoDataUrl ? (
            <img
              src={company.logoDataUrl}
              alt="Logo"
              className="max-h-14 max-w-[200px] object-contain mb-2"
            />
          ) : (
            <div
              className="font-extrabold text-base tracking-tight"
              style={{ color: style.primary_color }}
            >
              {company.name || "Nom de l'entreprise"}
            </div>
          )}

          <div className="space-y-0.5 text-[11px] text-slate-600">
            {style.show_address && company.address && (
              <div>
                {company.address}
                {company.city ? `, ${company.city}` : ""}
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
              {style.show_phone && company.phone && (
                <span>
                  {labels.phone} : {company.phone}
                </span>
              )}
              {style.show_email && company.email && (
                <span>
                  {labels.email} : {company.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Title & Meta */}
        <div className={`${isRtl ? "text-left" : "text-right"} w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200`}>
          <div
            className="text-lg font-black uppercase tracking-wide"
            style={{ color: style.primary_color }}
          >
            {labels.invoiceTitle}
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">{documentNumber}</div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>
              {labels.date} : {date}
            </div>
            {dueDate && (
              <div>
                {labels.dueDate} : {dueDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client & Legal Information Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Client Box */}
        <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1">
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: style.accent_color }}
          >
            {labels.billedTo}
          </div>
          <div className="font-bold text-slate-900 text-xs">{client.name}</div>
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

        {/* Company Tax/Legal Badges */}
        <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-600">
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: style.accent_color }}
          >
            {labels.issuerInfo}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono">
            {style.show_ice && company.ice && (
              <div>
                {labels.ice}: <span className="font-bold text-slate-800">{company.ice}</span>
              </div>
            )}
            {style.show_tax_id && company.ifTax && (
              <div>
                {labels.ifTax}: <span className="font-bold text-slate-800">{company.ifTax}</span>
              </div>
            )}
            {style.show_rc && company.rc && (
              <div>
                {labels.rc}: <span className="font-bold text-slate-800">{company.rc}</span>
              </div>
            )}
            {style.show_cnss && company.cnss && (
              <div>
                {labels.cnss}: <span className="font-bold text-slate-800">{company.cnss}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr
              style={{
                backgroundColor: style.primary_color,
                color: "#ffffff",
              }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              <th className={`py-2.5 px-3 ${isRtl ? "text-right" : "text-left"}`}>
                {labels.description}
              </th>
              <th className="py-2.5 px-3 text-center">{labels.quantity}</th>
              <th className={`py-2.5 px-3 ${isRtl ? "text-left" : "text-right"}`}>
                {labels.unitPrice} ({currency})
              </th>
              <th className={`py-2.5 px-3 ${isRtl ? "text-left" : "text-right"}`}>
                {labels.totalHT}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className={`py-2.5 px-3 font-medium text-slate-900 ${isRtl ? "text-right" : "text-left"}`}>
                  {item.description}
                </td>
                <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                <td className={`py-2.5 px-3 font-mono ${isRtl ? "text-left" : "text-right"}`}>
                  {formatMoney(item.unitPriceCents, currency, false)}
                </td>
                <td className={`py-2.5 px-3 font-mono font-bold ${isRtl ? "text-left" : "text-right"}`}>
                  {formatMoney(item.totalCents, currency, false)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Totals & Banking Details Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
        {/* IBAN & Notes */}
        <div className="text-[11px] text-slate-600 space-y-2 max-w-sm">
          {style.show_iban && company.ribIban && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
              <span className="font-bold block text-[10px] text-slate-700 uppercase">
                {labels.bankDetails} :
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-800">
                {company.bankName || "Banque"}
              </span>
              <div className="font-mono text-[10px] break-all">{company.ribIban}</div>
            </div>
          )}

          {paymentTerms && (
            <div className="p-2 bg-slate-50/60 rounded-lg text-[10px] text-slate-500">
              <span className="font-semibold">{labels.notes}:</span> {paymentTerms}
            </div>
          )}
        </div>

        {/* Totals Table */}
        <div className="w-full sm:w-64 space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>{labels.subtotalHT} :</span>
            <span className="font-mono font-bold text-slate-800">
              {formatMoney(subtotalCents, currency, true)}
            </span>
          </div>

          {discountCents > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>{labels.discount} :</span>
              <span className="font-mono font-bold">
                - {formatMoney(discountCents, currency, true)}
              </span>
            </div>
          )}

          {taxAmountCents > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>
                {labels.tax} ({taxRate}%) :
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatMoney(taxAmountCents, currency, true)}
              </span>
            </div>
          )}

          <div
            className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-300"
            style={{ color: style.primary_color }}
          >
            <span>{labels.totalTTC} :</span>
            <span className="font-mono">{formatMoney(totalCents, currency, true)}</span>
          </div>

          {paidAmountCents > 0 && (
            <div className="flex justify-between text-emerald-700 pt-1 text-[10px] font-bold">
              <span>{labels.paidAmount} :</span>
              <span className="font-mono">{formatMoney(paidAmountCents, currency, true)}</span>
            </div>
          )}

          {remainingBalanceCents > 0 && (
            <div className="flex justify-between text-rose-700 text-[11px] font-bold pt-1 border-t border-dashed border-slate-200">
              <span>{labels.remainingAmount} :</span>
              <span className="font-mono">{formatMoney(remainingBalanceCents, currency, true)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment History Block (If present) */}
      {payments && payments.length > 0 && (
        <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1.5">
          <div
            className="text-[10px] font-bold uppercase tracking-wider text-slate-500"
            style={{ color: style.accent_color }}
          >
            {labels.paymentHistory}
          </div>
          <div className="space-y-1 text-[11px]">
            {payments.map((p, idx) => (
              <div key={p.id || idx} className="flex justify-between items-center text-slate-700 font-mono">
                <span>
                  {p.date} — {getPaymentMethodLabel(p.method, language)}
                  {p.reference ? ` (${labels.reference}: ${p.reference})` : ""}
                </span>
                <span className="font-bold text-emerald-700">
                  + {formatMoney(p.amountCents, currency, true)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Notes */}
      {notes && (
        <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-[11px] text-amber-900">
          <span className="font-bold block mb-0.5">{labels.notes} :</span>
          <p className="whitespace-pre-line">{notes}</p>
        </div>
      )}

      {/* Footer Text */}
      <div
        className="pt-3 border-t text-center text-[10px] font-medium rounded-b-lg p-2.5"
        style={{
          backgroundColor: style.footer_color || "#f1f5f9",
          borderColor: style.primary_color || "#1e3a8a",
          color: "#475569",
        }}
      >
        {style.footer_text || "Merci de votre confiance."}
      </div>
    </div>
  );
};
