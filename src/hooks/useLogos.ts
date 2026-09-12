import { useState, useEffect, useCallback } from "react";
import { Logo, LogoCreateInput } from "../types/logo";
import { logoRepository } from "../db/repositories/logoRepository";

export function useLogos() {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [defaultLogo, setDefaultLogoState] = useState<Logo | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadLogos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, currentDefault] = await Promise.all([
        logoRepository.getAllLogos(showArchived),
        logoRepository.getDefaultLogo(),
      ]);
      setLogos(list);
      setDefaultLogoState(currentDefault);
    } catch (err) {
      console.error("[useLogos] Failed to load logos:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des logos."
      );
    } finally {
      setIsLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadLogos();
  }, [loadLogos]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const addLogo = async (input: LogoCreateInput) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const created = await logoRepository.addLogo(input);
      setSuccessMessage(`Logo "${created.name}" ajouté avec succès.`);
      await loadLogos();
      return created;
    } catch (err) {
      console.error("[useLogos] Failed to add logo:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors de l'ajout du logo.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const renameLogo = async (id: number, newName: string) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await logoRepository.renameLogo(id, newName);
      setSuccessMessage(`Logo renommé en "${updated.name}".`);
      await loadLogos();
      return updated;
    } catch (err) {
      console.error("[useLogos] Failed to rename logo:", err);
      const msg = err instanceof Error ? err.message : "Erreur lors du changement de nom.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultLogo = async (id: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await logoRepository.setDefaultLogo(id);
      setSuccessMessage("Logo défini comme logo par défaut pour vos documents.");
      await loadLogos();
    } catch (err) {
      console.error("[useLogos] Failed to set default logo:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sélection du logo par défaut."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveLogo = async (id: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await logoRepository.archiveLogo(id);
      setSuccessMessage("Logo archivé en toute sécurité.");
      await loadLogos();
    } catch (err) {
      console.error("[useLogos] Failed to archive logo:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'archivage du logo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreLogo = async (id: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await logoRepository.restoreLogo(id);
      setSuccessMessage("Logo rétabli parmi vos logos actifs.");
      await loadLogos();
    } catch (err) {
      console.error("[useLogos] Failed to restore logo:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du rétablissement du logo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePermanently = async (id: number) => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await logoRepository.deleteLogoPermanently(id);
      setSuccessMessage("Logo supprimé définitivement.");
      await loadLogos();
    } catch (err) {
      console.error("[useLogos] Failed to delete logo permanently:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du logo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    logos,
    defaultLogo,
    showArchived,
    setShowArchived,
    isLoading,
    isSaving,
    error,
    successMessage,
    addLogo,
    renameLogo,
    setDefaultLogo: handleSetDefaultLogo,
    archiveLogo: handleArchiveLogo,
    restoreLogo: handleRestoreLogo,
    deleteLogoPermanently: handleDeletePermanently,
    reloadLogos: loadLogos,
    clearMessages,
  };
}
