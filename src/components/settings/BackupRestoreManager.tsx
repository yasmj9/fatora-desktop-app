import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  FileCheck,
  X,
  Info,
  Building2,
  Users,
  FileText,
  Briefcase,
} from "lucide-react";
import {
  backupRepository,
  BackupPayload,
} from "../../db/repositories/backupRepository";

interface BackupRestoreManagerProps {
  onDataRestored?: () => void;
}

export const BackupRestoreManager: React.FC<BackupRestoreManagerProps> = ({
  onDataRestored,
}) => {
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // Status and Notifications
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // File Upload & Restoration Modal state
  const [pendingPayload, setPendingPayload] = useState<BackupPayload | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLastBackupDate();
  }, []);

  const loadLastBackupDate = async () => {
    setIsLoading(true);
    try {
      const date = await backupRepository.getLastBackupDate();
      setLastBackupDate(date);
    } catch (err) {
      console.error("Error loading last backup date:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateFrench = (dateIso: string | null): string => {
    if (!dateIso) return "Aucune sauvegarde enregistrée";
    try {
      const d = new Date(dateIso);
      if (isNaN(d.getTime())) return dateIso;
      return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateIso;
    }
  };

  /**
   * Triggers the "Créer une sauvegarde" creation & download process.
   */
  const handleCreateBackup = async () => {
    setIsCreating(true);
    setMessage(null);

    try {
      const payload = await backupRepository.createBackupData();
      const jsonString = JSON.stringify(payload, null, 2);

      // Generate filename with date
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `sauvegarde-fatora-${dateStr}.json`;

      // Trigger browser download
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update UI timestamp
      setLastBackupDate(payload.created_at);

      setMessage({
        type: "success",
        text: `Sauvegarde créée avec succès ! Le fichier "${fileName}" a été téléchargé. Conservez-le en lieu sûr.`,
      });
    } catch (err) {
      console.error("Error creating backup:", err);
      setMessage({
        type: "error",
        text: "Impossible de générer le fichier de sauvegarde. Veuillez réinstaller ou vérifier les autorisations.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handles user selecting a backup file from disk.
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;

      // Validate the file
      const result = backupRepository.validateBackupFile(content);

      if (!result.valid || !result.payload) {
        setMessage({
          type: "error",
          text: result.error || "Fichier de sauvegarde invalide.",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Valid backup file: prepare confirmation modal
      setPendingPayload(result.payload);
      setShowConfirmModal(true);
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Erreur lors de la lecture du fichier.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsText(file);
  };

  /**
   * Executes the restoration after user confirmation in the modal.
   */
  const handleConfirmRestore = async () => {
    if (!pendingPayload) return;

    setIsRestoring(true);
    try {
      const result = await backupRepository.restoreBackupData(pendingPayload);

      setShowConfirmModal(false);
      setPendingPayload(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setLastBackupDate(result.summary.last_backup_at || new Date().toISOString());

      setMessage({
        type: "success",
        text: "Restauration effectuée avec succès ! L'ensemble de vos données a été réimporté.",
      });

      // Notify parent page to reload company settings/data
      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err: any) {
      console.error("Restore error:", err);
      setMessage({
        type: "error",
        text: err.message || "La restauration a échoué. Vos données actuelles n'ont pas été modifiées.",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCancelRestore = () => {
    setShowConfirmModal(false);
    setPendingPayload(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-sm border border-slate-700">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Sauvegarde & Restauration de vos données</h3>
              <p className="text-slate-300 text-sm mt-1">
                Protégez votre activité en conservant une copie de vos factures, devis,
                clients et paramètres en lieu sûr.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages / Toasts */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between gap-3 border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : message.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {message.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
            {message.type === "info" && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Card: Last Backup Date */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Statut des sauvegardes
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-slate-900 font-semibold text-base">
                  Dernière sauvegarde :
                </span>
                {isLoading ? (
                  <span className="text-slate-400 text-sm">Chargement...</span>
                ) : lastBackupDate ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {formatDateFrench(lastBackupDate)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Aucune sauvegarde enregistrée
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={loadLastBackupDate}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Actualiser l'état"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Cards: Créer & Restaurer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Créer une sauvegarde */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Créer une sauvegarde</h4>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Générez un fichier complet contenant l'ensemble de votre activité (clients,
                factures, devis, prestations, logos et informations d'entreprise).
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
              <div className="font-semibold text-slate-700">Contenu inclus dans le fichier :</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>Toutes les factures et règlements</li>
                <li>Tous les devis établis</li>
                <li>Fichier clients et prestations</li>
                <li>Logos d'entreprise et styles d'impression</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleCreateBackup}
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Créer une sauvegarde
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Restaurer une sauvegarde */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Restaurer une sauvegarde</h4>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                Importez un fichier de sauvegarde précédemment créé pour réinstaller toutes vos
                données sur cet appareil ou un nouvel ordinateur.
              </p>
            </div>

            <div className="bg-amber-50/60 rounded-lg p-3 text-xs text-amber-900 space-y-1 border border-amber-200/60">
              <div className="font-semibold text-amber-900 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Avertissement de sécurité :
              </div>
              <p className="text-amber-800 leading-snug">
                La restauration remplacera les données actuelles de l'application par celles du
                fichier sélectionné. Une sauvegarde automatique de sécurité sera effectuée au préalable.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Restaurer une sauvegarde
            </button>
          </div>
        </div>
      </div>

      {/* Restoration Confirmation Modal */}
      {showConfirmModal && pendingPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Confirmer la restauration des données
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vérifiez les informations contenues dans ce fichier avant de poursuivre.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelRestore}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-sm">
                <p className="font-semibold text-amber-900 mb-1">
                  Attention : Vos données actuelles vont être remplacées.
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Cette action réinscrira vos factures, devis, clients et paramètres à partir du
                  fichier sélectionné.
                </p>
              </div>

              {/* Summary of backup file */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contenu de la sauvegarde à réimporter :
                </span>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      Entreprise
                    </span>
                    <span className="font-semibold text-slate-900">
                      {pendingPayload.metadata?.company_name || "Non spécifié"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Date de création
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatDateFrench(pendingPayload.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" /> Clients
                      </span>
                      <span className="font-bold text-slate-800">
                        {pendingPayload.tables.clients?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" /> Factures
                      </span>
                      <span className="font-bold text-slate-800">
                        {pendingPayload.tables.invoices?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-500" /> Devis
                      </span>
                      <span className="font-bold text-slate-800">
                        {pendingPayload.tables.quotations?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-purple-500" /> Services
                      </span>
                      <span className="font-bold text-slate-800">
                        {pendingPayload.tables.services?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Une sauvegarde de sécurité préalable est automatiquement effectuée avant le remplacement.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelRestore}
                disabled={isRestoring}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Restauration en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Remplacer mes données actuelles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
