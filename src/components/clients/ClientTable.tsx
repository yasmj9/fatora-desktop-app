import React from "react";
import {
  Edit2,
  Archive,
  RotateCcw,
  Eye,
  User,
  Building2,
  Phone,
  MapPin,
  Building,
} from "lucide-react";
import { Client } from "../../types/client";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onViewDetails: (client: Client) => void;
  onArchive: (client: Client) => void;
  onRestore: (client: Client) => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  onEdit,
  onViewDetails,
  onArchive,
  onRestore,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Desktop / Tablet Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Client</th>
              <th className="py-3.5 px-4">Téléphone</th>
              <th className="py-3.5 px-4">Ville / Adresse</th>
              <th className="py-3.5 px-4">ICE / Identifiants</th>
              <th className="py-3.5 px-4">Statut</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {clients.map((client) => {
              const isActive = Number(client.is_active) === 1;
              const isCompany = client.type === "company";

              return (
                <tr
                  key={client.id}
                  id={`client-row-${client.id}`}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Client Name & Type */}
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCompany
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {isCompany ? <Building2 size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails(client)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                          >
                            {client.name}
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isCompany
                                ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isCompany ? "Entreprise" : "Particulier"}
                          </span>
                        </div>
                        {client.contact_person && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Contact : {client.contact_person}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {client.phone ? (
                      <a
                        href={`tel:${client.phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-blue-600 transition-colors"
                      >
                        <Phone size={14} className="text-slate-400" />
                        <span>{client.phone}</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Non renseigné
                      </span>
                    )}
                  </td>

                  {/* City / Address */}
                  <td className="py-4 px-4">
                    <div className="max-w-[200px]">
                      {client.city ? (
                        <div className="flex items-center gap-1 text-slate-800 font-medium">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{client.city}</span>
                        </div>
                      ) : null}
                      {client.address ? (
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {client.address}
                        </p>
                      ) : !client.city ? (
                        <span className="text-slate-400 text-xs italic">—</span>
                      ) : null}
                    </div>
                  </td>

                  {/* ICE / Identifiers */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {client.ice ? (
                      <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md max-w-fit">
                        <Building size={12} className="text-slate-500" />
                        <span>ICE {client.ice}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {isActive ? "Actif" : "Archivé"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`btn-view-client-${client.id}`}
                        onClick={() => onViewDetails(client)}
                        title="Voir les détails du client"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye size={13} className="text-slate-500" />
                        <span>Voir</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-edit-client-${client.id}`}
                        onClick={() => onEdit(client)}
                        title="Modifier les coordonnées"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit2 size={13} className="text-slate-500" />
                        <span>Modifier</span>
                      </button>

                      {isActive ? (
                        <button
                          type="button"
                          id={`btn-archive-client-${client.id}`}
                          onClick={() => onArchive(client)}
                          title="Archiver ce client"
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          <Archive size={13} className="text-amber-600" />
                          <span>Archiver</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`btn-restore-client-${client.id}`}
                          onClick={() => onRestore(client)}
                          title="Restaurer ce client"
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                        >
                          <RotateCcw size={13} className="text-emerald-600" />
                          <span>Restaurer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
