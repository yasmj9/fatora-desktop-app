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

export const Style3Epure: React.FC<StyleLayoutProps> = ({
  style,
  company,
  logoData,
  invoice,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 text-xs font-sans text-slate-800">
      {/* High-Contrast Bold Top Header Bar */}
      <div
        className="p-6 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start gap-4"
        style={{ backgroundColor: style.primary_color || "#334155" }}
      >
        <div className="space-y-2">
          {logoData ? (
            <img src={logoData} alt="Logo" className="max-h-14 max-w-[200px] object-contain brightness-0 invert mb-1" />
          ) : (
            <div className="font-black text-xl tracking-tight text-white">{company.name || "Nom de l'entreprise"}</div>
          )}
          <div className="text-[11px] text-slate-200 space-y-0.5">
            {style.show_address && company.address && <div>{company.address}, {company.city}</div>}
            <div className="flex gap-3 text-slate-300 font-medium">
              {style.show_phone && company.phone && <span>{company.phone}</span>}
              {style.show_email && company.email && <span>{company.email}</span>}
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right space-y-0.5">
          <div className="text-sm font-extrabold tracking-widest text-slate-300 uppercase">FACTURE N°</div>
          <div className="text-xl font-mono font-black text-white">{invoice.number}</div>
          <div className="text-[11px] text-slate-300 pt-1">Date: {invoice.date}</div>
        </div>
      </div>

      {/* Client Block */}
      <div className="flex flex-col sm:flex-row justify-between gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">FACTURÉ À</span>
          <div className="font-extrabold text-slate-900 text-sm">{invoice.clientName}</div>
          {invoice.clientAddress && <div className="text-[11px] text-slate-600 mt-0.5">{invoice.clientAddress}</div>}
          {invoice.clientIce && <div className="text-[11px] font-mono text-slate-500 mt-0.5">ICE Client: {invoice.clientIce}</div>}
        </div>

        <div className="text-left sm:text-right text-[11px] font-mono text-slate-600 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">IDENTIFIANTS LÉGAUX</span>
          {style.show_ice && company.ice && <div>ICE: {company.ice}</div>}
          {style.show_tax_id && company.if_tax && <div>IF: {company.if_tax}</div>}
          {style.show_rc && company.rc && <div>RC: {company.rc}</div>}
        </div>
      </div>

      {/* Clean Table */}
      <table className="w-full text-left">
        <thead>
          <tr
            className="border-b-2 text-[10px] font-black uppercase tracking-wider"
            style={{ borderColor: style.accent_color || "#ea580c", color: style.accent_color || "#ea580c" }}
          >
            <th className="py-2 pb-3">Désignation</th>
            <th className="py-2 pb-3 text-center">Qté</th>
            <th className="py-2 pb-3 text-right">P.U. HT</th>
            <th className="py-2 pb-3 text-right">Montant HT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-[11px]">
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 font-semibold text-slate-900">{item.description}</td>
              <td className="py-3 text-center font-mono">{item.quantity}</td>
              <td className="py-3 text-right font-mono">{formatMoney(item.unitPriceCents, "MAD", false)}</td>
              <td className="py-3 text-right font-mono font-bold text-slate-900">
                {formatMoney(item.totalCents, "MAD", false)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Block */}
      <div className="flex justify-end pt-2">
        <div className="w-full sm:w-72 space-y-2 p-4 bg-slate-900 text-white rounded-xl">
          <div className="flex justify-between text-slate-300 text-[11px]">
            <span>Sous-total HT</span>
            <span className="font-mono font-bold">{formatMoney(invoice.subtotalCents, "MAD", true)}</span>
          </div>
          <div className="flex justify-between text-slate-300 text-[11px]">
            <span>TVA ({invoice.taxRate}%)</span>
            <span className="font-mono font-bold">{formatMoney(invoice.taxAmountCents, "MAD", true)}</span>
          </div>
          <div className="flex justify-between text-base font-black pt-2 border-t border-slate-800 text-white">
            <span>TOTAL TTC</span>
            <span className="font-mono">{formatMoney(invoice.totalCents, "MAD", true)}</span>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="pt-4 border-t border-slate-100 text-center text-[10px] font-medium text-slate-500">
        {style.footer_text}
      </div>
    </div>
  );
};
