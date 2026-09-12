import { useState, useEffect, useCallback } from "react";
import { companyRepository } from "../db/repositories/companyRepository";
import { CompanySettings, DEFAULT_COMPANY_SETTINGS } from "../types/company";
import { CompanySettingsFormData } from "../schemas/companySchema";
import { useDatabaseStatus } from "../context/DatabaseContext";

export function useCompanySettings() {
  const { isReady } = useDatabaseStatus();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!isReady) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await companyRepository.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("[useCompanySettings] Error loading settings:", err);
      setError("Impossible de charger les paramètres de l'entreprise.");
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (formData: CompanySettingsFormData): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await companyRepository.updateSettings(formData);
      setSettings(updated);
      setSuccessMessage("Les coordonnées de votre entreprise ont été enregistrées avec succès.");
      return true;
    } catch (err) {
      console.error("[useCompanySettings] Error saving settings:", err);
      setError("Une erreur est survenue lors de l'enregistrement des paramètres.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return {
    settings,
    isLoading,
    isSaving,
    error,
    successMessage,
    saveSettings,
    reloadSettings: loadSettings,
    clearMessages,
  };
}
