import React from "react";
import { QuotationStatus } from "../../types/quotation";
import { FileText, Send, CheckCircle, XCircle, Clock, CheckCheck } from "lucide-react";

interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  size?: "sm" | "md" | "lg";
}

export const QuotationStatusBadge: React.FC<QuotationStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[11px] gap-1",
    md: "px-3 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  switch (status) {
    case "draft":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <FileText size={iconSizes} className="text-slate-500" />
          <span>Brouillon</span>
        </span>
      );

    case "sent":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <Send size={iconSizes} className="text-blue-600" />
          <span>Envoyé</span>
        </span>
      );

    case "accepted":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle size={iconSizes} className="text-emerald-600" />
          <span>Accepté</span>
        </span>
      );

    case "rejected":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <XCircle size={iconSizes} className="text-rose-600" />
          <span>Refusé</span>
        </span>
      );

    case "expired":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <Clock size={iconSizes} className="text-amber-600" />
          <span>Expiré</span>
        </span>
      );

    case "invoiced":
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${sizeClasses}`}
        >
          <CheckCheck size={iconSizes} className="text-indigo-600" />
          <span>Facturé</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <span>{status}</span>
        </span>
      );
  }
};
