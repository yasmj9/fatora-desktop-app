import React from "react";
import { InvoiceStatus } from "../../types/invoice";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  size?: "sm" | "md";
  className?: string;
}

export const getStatusLabel = (status: InvoiceStatus): string => {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "sent":
      return "Non payée";
    case "partially_paid":
      return "Partiellement payée";
    case "paid":
      return "Payée";
    case "cancelled":
      return "Annulée";
    case "overdue":
      return "En retard";
    default:
      return status;
  }
};

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({
  status,
  size = "sm",
  className = "",
}) => {
  const label = getStatusLabel(status);

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  switch (status) {
    case "paid":
      colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
      dotColor = "bg-emerald-500";
      break;
    case "partially_paid":
      colorClasses = "bg-blue-50 text-blue-800 border-blue-200";
      dotColor = "bg-blue-500";
      break;
    case "sent":
      colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
      dotColor = "bg-amber-500";
      break;
    case "draft":
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
      dotColor = "bg-slate-400";
      break;
    case "cancelled":
      colorClasses = "bg-rose-50 text-rose-800 border-rose-200";
      dotColor = "bg-rose-500";
      break;
    case "overdue":
      colorClasses = "bg-red-50 text-red-800 border-red-200";
      dotColor = "bg-red-500";
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2.5 py-0.5"
      : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};
