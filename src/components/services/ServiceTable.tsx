import React from "react";
import { Edit2, Archive, RotateCcw, Eye, Wrench } from "lucide-react";
import { Service } from "../../types/service";

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onViewDetails: (service: Service) => void;
  onArchive: (service: Service) => void;
  onRestore: (service: Service) => void;
  currency?: string;
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  onEdit,
  onViewDetails,
  onArchive,
  onRestore,
  currency = "MAD",
}) => {
  if (services.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">Service</th>
              <th className="py-4 px-6 text-right">Prix par défaut</th>
              <th className="py-4 px-6">Unité</th>
              <th className="py-4 px-6 text-center">Statut</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {services.map((service) => {
              const isActive = Number(service.is_active) === 1;

              return (
                <tr
                  key={service.id}
                  id={`service-row-${service.id}`}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Service Name & Code */}
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Wrench size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails(service)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                          >
                            {service.name_fr}
                          </button>
                          {service.code && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                              {service.code}
                            </span>
                          )}
                        </div>
                        {service.description_fr && (
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                            {service.description_fr}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Prix par défaut */}
                  <td className="py-4 px-6 text-right font-mono">
                    <span className="text-base font-black text-slate-900">
                      {Number(service.default_price).toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>{" "}
                    <span className="text-xs font-bold text-slate-500">{currency}</span>
                  </td>

                  {/* Unité */}
                  <td className="py-4 px-6">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {service.default_unit || "Unité"}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="py-4 px-6 text-center">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Archivé
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        id={`btn-view-service-${service.id}`}
                        onClick={() => onViewDetails(service)}
                        title="Voir les détails"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        id={`btn-edit-service-${service.id}`}
                        onClick={() => onEdit(service)}
                        title="Modifier le service"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 size={17} />
                      </button>

                      {isActive ? (
                        <button
                          type="button"
                          id={`btn-archive-service-${service.id}`}
                          onClick={() => onArchive(service)}
                          title="Archiver ce service"
                          className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Archive size={17} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`btn-restore-service-${service.id}`}
                          onClick={() => onRestore(service)}
                          title="Restaurer ce service"
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <RotateCcw size={17} />
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
