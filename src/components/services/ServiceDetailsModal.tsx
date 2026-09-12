import React from "react";
import {
  X,
  Edit2,
  Archive,
  RotateCcw,
  Coins,
  Layers,
  Calendar,
  Languages,
} from "lucide-react";
import { Service } from "../../types/service";

interface ServiceDetailsModalProps {
  service: Service | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (service: Service) => void;
  onArchive: (service: Service) => void;
  onRestore: (service: Service) => void;
  currency?: string;
}

export const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  isOpen,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  currency = "MAD",
}) => {
  if (!isOpen || !service) return null;

  const isActive = Number(service.is_active) === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="service-details-modal"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {service.code && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold font-mono">
                  {service.code}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {isActive ? "Actif" : "Archivé"}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {service.name_fr}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics: Price & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Coins size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Tarif de base
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900">
                {Number(service.default_price).toLocaleString("fr-FR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-sm font-semibold text-slate-600">{currency}</span>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Layers size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Unité de mesure
                </span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {service.default_unit || "Unité"}
              </p>
            </div>
          </div>

          {/* Description FR */}
          {service.description_fr && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Description détaillée (Français)
              </h4>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-line">
                {service.description_fr}
              </p>
            </div>
          )}

          {/* Translations if present */}
          {(service.name_ar || service.description_ar || service.name_en || service.description_en) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <Languages size={16} className="text-blue-600" />
                <span>Traductions enregistrées</span>
              </div>

              {/* Arabic */}
              {(service.name_ar || service.description_ar) && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">Arabe (العربية)</span>
                  </div>
                  {service.name_ar && (
                    <p className="text-sm font-bold text-slate-900 text-right" dir="rtl">
                      {service.name_ar}
                    </p>
                  )}
                  {service.description_ar && (
                    <p className="text-xs text-slate-700 text-right whitespace-pre-line" dir="rtl">
                      {service.description_ar}
                    </p>
                  )}
                </div>
              )}

              {/* English */}
              {(service.name_en || service.description_en) && (
                <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900">Anglais (English)</span>
                  </div>
                  {service.name_en && (
                    <p className="text-sm font-bold text-slate-900">
                      {service.name_en}
                    </p>
                  )}
                  {service.description_en && (
                    <p className="text-xs text-slate-700 whitespace-pre-line">
                      {service.description_en}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Meta dates */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              Créé le : {new Date(service.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div>
            {isActive ? (
              <button
                type="button"
                id="btn-modal-archive-service"
                onClick={() => {
                  onArchive(service);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <Archive size={16} />
                <span>Archiver ce service</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-modal-restore-service"
                onClick={() => {
                  onRestore(service);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Restaurer ce service</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              id="btn-modal-edit-service"
              onClick={() => {
                onClose();
                onEdit(service);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Edit2 size={16} />
              <span>Modifier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
