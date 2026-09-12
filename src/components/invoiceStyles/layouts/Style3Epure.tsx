import React from "react";
import { DocumentData } from "../../../types/documentData";
import { DOCUMENT_TRANSLATIONS, getPaymentMethodLabel } from "../../../utils/documentTranslations";
import { formatMoney } from "../../../utils/money";

interface StyleLayoutProps {
  documentData: DocumentData;
}

export const Style3Epure: React.FC<StyleLayoutProps> = ({ documentData }) => {
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
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 text-xs font-sans text-slate-800"
      style={{
        fontFamily: isRtl
          ? "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans Arabic', 'Cairo', 'Amiri', 'Tahoma', sans-serif"
          : undefined,
      }}
    >
      {/* Bold Top Header Bar */}
      <div
        className="p-6 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start gap-4"
        style={{ backgroundColor: style.primary_color || "#334155" }}
      >
        <div className="space-y-2">
          {company.logoDataUrl ? (
            <img
              src={company.logoDataUrl}
              alt="Logo"
              className="max-h-14 max-w-[200px] object-contain brightness-0 invert mb-1"
            />
          ) : (
            <div className="font-black text-xl tracking-tight text-white">
              {company.name || "Nom de l'entreprise"}
            </div>
          )}
          <div className="text-[11px] text-slate-200 space-y-0.5">
            {style.show_address && company.address && (
              <div>
                {company.address}
                {company.city ? `, ${company.city}` : ""}
              </div>
            )}
            <div className="flex gap-3 text-slate-300 font-medium">
              {style.show_phone && company.phone && <span>{company.phone}</span>}
              {style.show_email && company.email && <span>{company.email}</span>}
            </div>
          </div>
        </div>

        <div className={`${isRtl ? "text-left" : "text-right"} space-y-0.5 w-full sm:w-auto`}>
          <div className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">
            {labels.invoiceTitle}
          </div>
          <div className="text-xl font-mono font-black text-white">{documentNumber}</div>
          <div className="text-[11px] text-slate-300 pt-1">
            {labels.date}: {date}
          </div>
          {dueDate && (
            <div className="text-[11px] text-slate-300">
              {labels.dueDate}: {dueDate}
            </div>
          )}
        </div>
      </div>

      {/* Client & Legal Identifiers */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {labels.billedTo}
          </span>
          <div className="font-extrabold text-slate-900 text-sm">{client.name}</div>
          {client.contactPerson && (
            <div className="text-[11px] text-slate-600 mt-0.5">{client.contactPerson}</div>
          )}
          {client.phone && (
            <div className="text-[11px] text-slate-600 mt-0.5">
              {labels.phone}: {client.phone}
            </div>
          )}
          {client.address && (
            <div className="text-[11px] text-slate-600 mt-0.5">
              {client.address}
              {client.city ? `, ${client.city}` : ""}
            </div>
          )}
          {client.ice && (
            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
              {labels.ice} : {client.ice}
            </div>
          )}
        </div>

        <div className={`${isRtl ? "text-right sm:text-left" : "text-left sm:text-right"} text-[11px] font-mono text-slate-600 space-y-0.5`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {labels.issuerInfo}
          </span>
          {style.show_ice && company.ice && (
            <div>
              {labels.ice}: {company.ice}
            </div>
          )}
          {style.show_tax_id && company.ifTax && (
            <div>
              {labels.ifTax}: {company.ifTax}
            </div>
          )}
          {style.show_rc && company.rc && (
            <div>
              {labels.rc}: {company.rc}
            </div>
          )}
          {style.show_cnss && company.cnss && (
            <div>
              {labels.cnss}: {company.cnss}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr
            className="border-b-2 text-[10px] font-black uppercase tracking-wider"
            style={{
              borderColor: style.accent_color || "#ea580c",
              color: style.accent_color || "#ea580c",
            }}
          >
            <th className={`py-2 pb-3 ${isRtl ? "text-right" : "text-left"}`}>
              {labels.description}
            </th>
            <th className="py-2 pb-3 text-center">{labels.quantity}</th>
            <th className={`py-2 pb-3 ${isRtl ? "text-left" : "text-right"}`}>
              {labels.unitPrice}
            </th>
            <th className={`py-2 pb-3 ${isRtl ? "text-left" : "text-right"}`}>
              {labels.totalHT}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[11px]">
          {items.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className={`py-3 font-semibold text-slate-900 ${isRtl ? "text-right" : "text-left"}`}>
                {item.description}
              </td>
              <td className="py-3 text-center font-mono">{item.quantity}</td>
              <td className={`py-3 font-mono ${isRtl ? "text-left" : "text-right"}`}>
                {formatMoney(item.unitPriceCents, currency, false)}
              </td>
              <td className={`py-3 font-mono font-bold text-slate-900 ${isRtl ? "text-left" : "text-right"}`}>
                {formatMoney(item.totalCents, currency, false)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals & IBAN Block */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-2">
        {style.show_iban && company.ribIban ? (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] max-w-xs space-y-0.5">
            <span className="font-bold text-slate-700 block uppercase text-[10px]">
              {labels.bankDetails} :
            </span>
            <span className="font-mono text-slate-800 font-bold">
              {company.bankName || "Banque"}
            </span>
            <div className="font-mono text-[10px] text-slate-600 break-all">{company.ribIban}</div>
          </div>
        ) : (
          <div />
        )}

        <div className="w-full sm:w-72 space-y-2 p-4 bg-slate-900 text-white rounded-xl">
          <div className="flex justify-between text-slate-300 text-[11px]">
            <span>{labels.subtotalHT}</span>
            <span className="font-mono font-bold">
              {formatMoney(subtotalCents, currency, true)}
            </span>
          </div>

          {discountCents > 0 && (
            <div className="flex justify-between text-emerald-400 text-[11px]">
              <span>{labels.discount}</span>
              <span className="font-mono font-bold">
                - {formatMoney(discountCents, currency, true)}
              </span>
            </div>
          )}

          {taxAmountCents > 0 && (
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>
                {labels.tax} ({taxRate}%)
              </span>
              <span className="font-mono font-bold">
                {formatMoney(taxAmountCents, currency, true)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-base font-black pt-2 border-t border-slate-800 text-white">
            <span>{labels.totalTTC}</span>
            <span className="font-mono">{formatMoney(totalCents, currency, true)}</span>
          </div>

          {paidAmountCents > 0 && (
            <div className="flex justify-between text-emerald-400 text-[11px] font-bold">
              <span>{labels.paidAmount}</span>
              <span className="font-mono">{formatMoney(paidAmountCents, currency, true)}</span>
            </div>
          )}

          {remainingBalanceCents > 0 && (
            <div className="flex justify-between text-rose-300 text-[11px] font-bold pt-1 border-t border-dashed border-slate-800">
              <span>{labels.remainingAmount}</span>
              <span className="font-mono">{formatMoney(remainingBalanceCents, currency, true)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments History */}
      {payments && payments.length > 0 && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {labels.paymentHistory}
          </div>
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

      {/* Footer Text */}
      <div className="pt-4 border-t border-slate-100 text-center text-[10px] font-medium text-slate-500">
        {style.footer_text || "Merci de votre confiance."}
      </div>
    </div>
  );
};
