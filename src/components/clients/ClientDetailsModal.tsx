import React from "react";
import {
  X,
  Edit2,
  Archive,
  RotateCcw,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Building,
  Trash2,
} from "lucide-react";
import { Client } from "../../types/client";

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  client,
  isOpen,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) => {
  if (!isOpen || !client) return null;

  const isActive = Number(client.is_active) === 1;
  const isCompany = client.type === "company";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="client-details-modal"
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {isCompany ? <Building2 size={24} /> : <User size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCompany
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isCompany ? "Entreprise / Société" : "Particulier"}
                </span>
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
                {client.name}
              </h3>
              {client.contact_person && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Contact : {client.contact_person}
                </p>
              )}
            </div>
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Main Direct Contact: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
                  <Phone size={14} />
                  <span>Téléphone</span>
                </div>
                <a
                  href={`tel:${client.phone.replace(/\s+/g, "")}`}
                  className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {client.phone || "Non renseigné"}
                </a>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                <Mail size={14} />
                <span>Email</span>
              </div>
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm font-semibold text-slate-800 hover:text-blue-600 truncate block"
                >
                  {client.email}
                </a>
              ) : (
                <span className="text-sm text-slate-400">Non renseigné</span>
              )}
            </div>
          </div>

          {/* Location / Address */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              <MapPin size={14} />
              <span>Adresse & Ville</span>
            </div>
            <p className="text-sm font-medium text-slate-900">
              {client.address ? client.address : "Adresse non spécifiée"}
            </p>
            {client.city && (
              <p className="text-xs font-semibold text-slate-600">
                Ville : {client.city}
              </p>
            )}
          </div>

          {/* Moroccan Fiscal identifiers if provided */}
          {(client.ice || client.if_tax || client.rc) && (
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <Building size={14} className="text-blue-600" />
                <span>Identifiants légaux & fiscaux (Maroc)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">ICE</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {client.ice || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">IF (Fiscal)</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {client.if_tax || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">RC</span>
                  <span className="text-xs font-bold font-mono text-slate-900">
                    {client.rc || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {client.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <FileText size={14} />
                <span>Notes & Remarques internes</span>
              </div>
              <p className="text-xs text-slate-700 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed whitespace-pre-line">
                {client.notes}
              </p>
            </div>
          )}

          {/* Dates footer */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              Enregistré le : {new Date(client.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div>
            {isActive ? (
              <button
                type="button"
                id="btn-modal-archive-client"
                onClick={() => {
                  onArchive(client);
                  onClose();
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
              >
                <Archive size={16} />
                <span>Archiver ce client</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-modal-restore-client"
                  onClick={() => {
                    onRestore(client);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>Restaurer</span>
                </button>
                <button
                  type="button"
                  id="btn-modal-delete-client"
                  onClick={() => {
                    onDelete(client);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Supprimer définitivement</span>
                </button>
              </div>
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
              id="btn-modal-edit-client"
              onClick={() => {
                onClose();
                onEdit(client);
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
