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

export const Style1Classique: React.FC<StyleLayoutProps> = ({
  style,
  company,
  logoData,
  invoice,
}) => {
  return (
    <div className="bg-white p-6 sm:p-8 text-slate-800 text-xs shadow-sm font-sans rounded-xl border border-slate-200 space-y-6">
      {/* Top Header Block with Primary Background */}
      <div
        className="p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start gap-4"
        style={{
          backgroundColor: style.header_color || "#f8fafc",
          borderColor: style.primary_color || "#1e3a8a",
        }}
      >
        {/* Company Identity & Logo */}
        <div className="space-y-2">
          {logoData ? (
            <img src={logoData} alt="Logo" className="max-h-14 max-w-[200px] object-contain mb-2" />
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
              <div>{company.address}, {company.city}</div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
              {style.show_phone && company.phone && <span>Tél : {company.phone}</span>}
              {style.show_email && company.email && <span>Email : {company.email}</span>}
            </div>
          </div>
        </div>

        {/* Invoice Title & Meta */}
        <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
          <div
            className="text-lg font-black uppercase tracking-wide"
            style={{ color: style.primary_color }}
          >
            FACTURE
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">{invoice.number}</div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Date : {invoice.date}</div>
            <div>Échéance : {invoice.dueDate}</div>
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
            Facturé à
          </div>
          <div className="font-bold text-slate-900 text-xs">{invoice.clientName}</div>
          {invoice.clientAddress && <div className="text-[11px] text-slate-600">{invoice.clientAddress}</div>}
          {invoice.clientIce && <div className="text-[11px] font-mono text-slate-500">ICE : {invoice.clientIce}</div>}
        </div>

        {/* Company Tax/Legal Badges */}
        <div className="p-3.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1 text-[11px] text-slate-600">
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: style.accent_color }}
          >
            Émetteur — Identifiants légaux
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono">
            {style.show_ice && company.ice && <div>ICE: <span className="font-bold text-slate-800">{company.ice}</span></div>}
            {style.show_tax_id && company.if_tax && <div>IF: <span className="font-bold text-slate-800">{company.if_tax}</span></div>}
            {style.show_rc && company.rc && <div>RC: <span className="font-bold text-slate-800">{company.rc}</span></div>}
            {style.show_cnss && company.cnss && <div>CNSS: <span className="font-bold text-slate-800">{company.cnss}</span></div>}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              style={{
                backgroundColor: style.primary_color,
                color: "#ffffff",
              }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-center">Qté</th>
              <th className="py-2.5 px-3 text-right">P.U. (MAD)</th>
              <th className="py-2.5 px-3 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {invoice.items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                <td className="py-2.5 px-3 font-medium text-slate-900">{item.description}</td>
                <td className="py-2.5 px-3 text-center font-mono">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatMoney(item.unitPriceCents, "MAD", false)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">{formatMoney(item.totalCents, "MAD", false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Totals Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
        {/* Payment / IBAN Note */}
        <div className="text-[11px] text-slate-600 space-y-1 max-w-xs">
          {style.show_iban && company.rib_iban && (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold block text-[10px] text-slate-700 uppercase">Règlement bancaire :</span>
              <span className="font-mono text-[10px] font-bold text-slate-800">{company.bank_name || "Banque"}</span>
              <div className="font-mono text-[10px] break-all">{company.rib_iban}</div>
            </div>
          )}
        </div>

        {/* Totals Table */}
        <div className="w-full sm:w-64 space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between text-slate-600">
            <span>Total HT :</span>
            <span className="font-mono font-bold text-slate-800">{formatMoney(invoice.subtotalCents, "MAD", true)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>TVA ({invoice.taxRate}%) :</span>
            <span className="font-mono font-bold text-slate-800">{formatMoney(invoice.taxAmountCents, "MAD", true)}</span>
          </div>
          <div
            className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-300"
            style={{ color: style.primary_color }}
          >
            <span>TOTAL TTC :</span>
            <span className="font-mono">{formatMoney(invoice.totalCents, "MAD", true)}</span>
          </div>
          {invoice.paidCents > 0 && (
            <div className="flex justify-between text-emerald-700 pt-1 text-[10px] font-bold">
              <span>Montant réglé :</span>
              <span className="font-mono">{formatMoney(invoice.paidCents, "MAD", true)}</span>
            </div>
          )}
          {invoice.balanceCents > 0 && (
            <div className="flex justify-between text-rose-700 text-[11px] font-bold pt-1 border-t border-dashed border-slate-200">
              <span>Reste à payer :</span>
              <span className="font-mono">{formatMoney(invoice.balanceCents, "MAD", true)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Text */}
      <div
        className="pt-3 border-t text-center text-[10px] font-medium rounded-b-lg p-2.5"
        style={{
          backgroundColor: style.footer_color || "#f1f5f9",
          borderColor: style.primary_color || "#1e3a8a",
          color: "#475569",
        }}
      >
        {style.footer_text}
      </div>
    </div>
  );
};
