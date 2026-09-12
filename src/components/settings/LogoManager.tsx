import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  Upload,
  CheckCircle2,
  Star,
  Edit2,
  Archive,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Trash2,
  X,
  FileImage,
  Shield,
} from "lucide-react";
import { useLogos } from "../../hooks/useLogos";
import { Logo } from "../../types/logo";

export const LogoManager: React.FC = () => {
  const {
    logos,
    showArchived,
    setShowArchived,
    isLoading,
    isSaving,
    error,
    successMessage,
    addLogo,
    renameLogo,
    setDefaultLogo,
    archiveLogo,
    restoreLogo,
    deleteLogoPermanently,
    clearMessages,
  } = useLogos();

  // Modal / Action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [logoNameInput, setLogoNameInput] = useState("");
  const [isDefaultCheckbox, setIsDefaultCheckbox] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Rename modal state
  const [renameLogoItem, setRenameLogoItem] = useState<Logo | null>(null);
  const [newLogoName, setNewLogoName] = useState("");

  // Archive modal state
  const [archiveTarget, setArchiveTarget] = useState<Logo | null>(null);

  // Full preview modal
  const [previewTarget, setPreviewTarget] = useState<Logo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Drop / Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    setUploadError(null);

    // Validate image format
    if (!file.type.startsWith("image/")) {
      setUploadError("Le fichier sélectionné doit être une image (PNG, JPG, SVG, WEBP).");
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    setSelectedFile(file);

    // Default friendly name based on original file name without extension
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    const formattedName = baseName
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    setLogoNameInput(formattedName || "Mon Logo");

    // Read Data URL for local preview and database storage
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewDataUrl(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError("Erreur lors de la lecture du fichier image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewDataUrl || !selectedFile) {
      setUploadError("Veuillez sélectionner un fichier d'image valide.");
      return;
    }

    if (!logoNameInput.trim()) {
      setUploadError("Veuillez saisir un nom pour ce logo.");
      return;
    }

    try {
      await addLogo({
        name: logoNameInput.trim(),
        file_name: selectedFile.name,
        file_data: previewDataUrl,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        is_default: isDefaultCheckbox,
      });

      // Reset and close
      setIsAddModalOpen(false);
      setSelectedFile(null);
      setPreviewDataUrl(null);
      setLogoNameInput("");
      setIsDefaultCheckbox(false);
      setUploadError(null);
    } catch {
      // Error handled in hook
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameLogoItem) return;
    try {
      await renameLogo(renameLogoItem.id, newLogoName);
      setRenameLogoItem(null);
      setNewLogoName("");
    } catch {
      // Error handled in hook
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archiveLogo(archiveTarget.id);
      setArchiveTarget(null);
    } catch {
      // Error handled in hook
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "Taille inconnue";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <ImageIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Gestion des logos d'entreprise</h3>
                <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-100">
                  {logos.filter((l) => !l.is_archived).length} actif(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Vos logos sont enregistrés dans le stockage local sécurisé de l'application. Vos fichiers originaux restent protégés même s'ils sont déplacés ou supprimés de votre ordinateur.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-add-logo-trigger"
            onClick={() => {
              clearMessages();
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Ajouter un logo</span>
          </button>
        </div>
      </div>

      {/* Messages / Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-xs">
          <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-medium">{successMessage}</div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Masquer
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 shadow-xs">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-medium">{error}</div>
          <button
            type="button"
            onClick={clearMessages}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold"
          >
            Masquer
          </button>
        </div>
      )}

      {/* Filter / Toggle Archived */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Vos visuels & entêtes
        </div>

        <button
          type="button"
          id="btn-toggle-archived-logos"
          onClick={() => setShowArchived(!showArchived)}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
            showArchived
              ? "bg-slate-800 text-white border-slate-800"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          {showArchived ? "Masquer les archivés" : "Afficher les logos archivés"}
        </button>
      </div>

      {/* Logos Grid */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Chargement des logos...</p>
        </div>
      ) : logos.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 mx-auto flex items-center justify-center">
            <FileImage size={32} />
          </div>
          <h4 className="text-base font-bold text-slate-900">Aucun logo enregistré</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ajoutez le logo de votre entreprise pour personnaliser automatiquement l'en-tête de vos devis et factures.
          </p>
          <button
            type="button"
            id="btn-add-logo-empty"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Ajouter votre premier logo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {logos.map((logo) => (
            <div
              key={logo.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between shadow-xs relative ${
                logo.is_default
                  ? "border-2 border-emerald-500 ring-2 ring-emerald-500/10"
                  : logo.is_archived
                  ? "border-slate-200 bg-slate-50/70 opacity-75"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Badge Status */}
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  {logo.is_default ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Star size={12} className="fill-emerald-600 text-emerald-600" />
                      Logo par défaut
                    </span>
                  ) : logo.is_archived ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                      <Archive size={12} />
                      Archivé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                      Actif
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewTarget(logo)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  title="Aperçu grand format"
                >
                  <Eye size={16} />
                </button>
              </div>

              {/* Visual Thumbnail Container with checkerboard background */}
              <div
                className="p-6 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px] bg-slate-100/60 min-h-[160px] cursor-pointer group"
                onClick={() => setPreviewTarget(logo)}
              >
                <img
                  src={logo.file_data}
                  alt={logo.name}
                  className="max-h-28 max-w-full object-contain drop-shadow-xs transition-transform group-hover:scale-105"
                />
              </div>

              {/* Logo Information */}
              <div className="p-4 border-t border-slate-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm truncate" title={logo.name}>
                      {logo.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setRenameLogoItem(logo);
                        setNewLogoName(logo.name);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Renommer le logo"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1 font-mono">
                    <span className="truncate max-w-[140px]">{logo.file_name}</span>
                    <span>{formatFileSize(logo.file_size)}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!logo.is_archived && !logo.is_default && (
                    <button
                      type="button"
                      onClick={() => setDefaultLogo(logo.id)}
                      disabled={isSaving}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>Définir par défaut</span>
                    </button>
                  )}

                  {!logo.is_archived ? (
                    <button
                      type="button"
                      onClick={() => setArchiveTarget(logo)}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      title="Archiver ce logo"
                    >
                      <Archive size={14} />
                      <span>Archiver</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full gap-2">
                      <button
                        type="button"
                        onClick={() => restoreLogo(logo.id)}
                        disabled={isSaving}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Rétablir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLogoPermanently(logo.id)}
                        disabled={isSaving}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL 1: ADD LOGO --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Upload size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ajouter un nouveau logo</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedFile(null);
                  setPreviewDataUrl(null);
                  setUploadError(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewLogo} className="p-6 space-y-5">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              {!previewDataUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/80 rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 mx-auto flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Cliquez pour choisir une image</p>
                    <p className="text-xs text-slate-400 mt-0.5">Formats acceptés : PNG, JPG, WEBP, SVG (max 5 Mo)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative p-4 bg-slate-100/70 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[140px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]">
                    <img
                      src={previewDataUrl}
                      alt="Aperçu"
                      className="max-h-28 object-contain drop-shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDataUrl(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-white text-slate-600 hover:text-rose-600 rounded-full shadow-md transition-colors cursor-pointer"
                      title="Changer d'image"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="truncate">{selectedFile?.name}</span>
                    <span>{selectedFile ? formatFileSize(selectedFile.size) : ""}</span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Logo Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom d'affichage du logo <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={logoNameInput}
                  onChange={(e) => setLogoNameInput(e.target.value)}
                  placeholder="Ex: Logo principal 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Default Logo Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-is-default-logo"
                  checked={isDefaultCheckbox}
                  onChange={(e) => setIsDefaultCheckbox(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="checkbox-is-default-logo"
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                >
                  Définir immédiatement comme logo par défaut pour mes factures
                </label>
              </div>

              {/* Local Storage Guarantee Note */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2 text-[11px] text-blue-800">
                <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Ce logo sera copié directement dans le stockage local de l'application. Il fonctionnera toujours hors-ligne.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !previewDataUrl}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Enregistrer le logo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: RENAME LOGO --- */}
      {renameLogoItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Renommer le logo</h3>
              <button
                type="button"
                onClick={() => setRenameLogoItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouveau nom d'affichage
                </label>
                <input
                  type="text"
                  value={newLogoName}
                  onChange={(e) => setNewLogoName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameLogoItem(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newLogoName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CONFIRM ARCHIVE LOGO --- */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Archive size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Archiver ce logo ?</h3>
              <p className="text-xs text-slate-500">
                "{archiveTarget.name}" sera masqué de la sélection courante. Vos anciens documents enregistrés ne seront pas altérés.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
              <img src={archiveTarget.file_data} alt={archiveTarget.name} className="max-h-20 object-contain" />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Archiver le logo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: FULL PREVIEW MODAL --- */}
      {previewTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-white">
              <div>
                <h3 className="font-bold text-base">{previewTarget.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{previewTarget.file_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[220px]">
              <img
                src={previewTarget.file_data}
                alt={previewTarget.name}
                className="max-h-56 max-w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Taille : {formatFileSize(previewTarget.file_size)}</span>
              <span>Type : {previewTarget.file_type}</span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
