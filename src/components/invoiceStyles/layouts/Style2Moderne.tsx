import React from "react";
import { InvoiceStyle } from "../../../types/invoiceStyle";
import { CompanySettings } from "../../../types/company";
import { formatMoney } from "../../../utils/money";

interface StyleLayoutProps {
  style: InvoiceStyle;
  company: CompanySettings;
  logoData: string | null;
  invoice: typeof import("../sampleData").sampleInvoiceData;
}

export const Style2Moderne: React.FC<StyleLayoutProps> = ({
  style,
  company,
  logoData,
  invoice,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs font-sans text-slate-800 relative">
      {/* Accent Top/Side Banner */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: style.accent_color || "#0d9488" }}
      />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            {logoData ? (
              <img src={logoData} alt="Logo" className="max-h-16 max-w-[220px] object-contain mb-2" />
            ) : (
              <div
                className="font-black text-xl tracking-tight"
                style={{ color: style.primary_color }}
              >
                {company.name || "Nom de l'entreprise"}
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-0.5">
              {style.show_address && company.address && <div>{company.address}, {company.city}</div>}
              <div className="flex gap-3 text-slate-600 font-medium">
                {style.show_phone && company.phone && <span>{company.phone}</span>}
                {style.show_email && company.email && <span>{company.email}</span>}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest text-white shadow-xs"
              style={{ backgroundColor: style.accent_color }}
            >
              FACTURE
            </span>
            <div className="font-mono font-extrabold text-slate-900 text-base">{invoice.number}</div>
            <div className="text-[11px] text-slate-500">
              Émise le <span className="font-semibold text-slate-700">{invoice.date}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Échéance : <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
            </div>
          </div>
        </div>

        {/* Client & Legal Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              CLIENT / DESTINATAIRE
            </div>
            <div className="font-bold text-slate-900 text-sm">{invoice.clientName}</div>
            {invoice.clientAddress && <div className="text-[11px] text-slate-600">{invoice.clientAddress}</div>}
            {invoice.clientIce && <div className="text-[11px] font-mono text-slate-500">ICE : {invoice.clientIce}</div>}
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              RÉFÉRENCES ÉMETTEUR
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono">
              {style.show_ice && company.ice && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  ICE: {company.ice}
                </span>
              )}
              {style.show_tax_id && company.if_tax && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  IF: {company.if_tax}
                </span>
              )}
              {style.show_rc && company.rc && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  RC: {company.rc}
                </span>
              )}
              {style.show_cnss && company.cnss && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-slate-700">
                  CNSS: {company.cnss}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Table */}
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Prestation / Description</th>
                <th className="py-3 px-4 text-center">Quantité</th>
                <th className="py-3 px-4 text-right">Prix Unitaire</th>
                <th className="py-3 px-4 text-right">Montant HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.description}</td>
                  <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatMoney(item.unitPriceCents, "MAD", false)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatMoney(item.totalCents, "MAD", false)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Totals & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end pt-2">
          {style.show_iban && company.rib_iban ? (
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-1 text-[11px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coordonnées de virement :</div>
              <div className="font-bold text-slate-800">{company.bank_name || "Banque"}</div>
              <div className="font-mono text-[10px] text-slate-600 break-all">{company.rib_iban}</div>
            </div>
          ) : (
            <div />
          )}

          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Sous-total HT</span>
              <span className="font-mono font-bold text-slate-800">{formatMoney(invoice.subtotalCents, "MAD", true)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>TVA ({invoice.taxRate}%)</span>
              <span className="font-mono font-bold text-slate-800">{formatMoney(invoice.taxAmountCents, "MAD", true)}</span>
            </div>

            <div
              className="flex justify-between text-base font-black pt-2 border-t border-slate-200"
              style={{ color: style.primary_color }}
            >
              <span>Total TTC</span>
              <span className="font-mono">{formatMoney(invoice.totalCents, "MAD", true)}</span>
            </div>

            {invoice.paidCents > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold text-[11px]">
                <span>Acompte perçu</span>
                <span className="font-mono">{formatMoney(invoice.paidCents, "MAD", true)}</span>
              </div>
            )}
            {invoice.balanceCents > 0 && (
              <div className="flex justify-between text-rose-600 font-bold text-[11px] pt-1 border-t border-dashed border-slate-200">
                <span>Reste à payer</span>
                <span className="font-mono">{formatMoney(invoice.balanceCents, "MAD", true)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div
          className="p-3 rounded-xl text-center text-[10px] font-medium"
          style={{
            backgroundColor: style.footer_color || "#f8fafc",
            color: "#475569",
          }}
        >
          {style.footer_text}
        </div>
      </div>
    </div>
  );
};
