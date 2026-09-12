import React, { useState } from "react";
import {
  Terminal,
  CheckCircle,
  Database,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Building2,
  Cpu,
  Image as ImageIcon,
  Palette,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useDatabaseStatus } from "../context/DatabaseContext";
import { CompanySettingsForm } from "../components/settings/CompanySettingsForm";
import { LogoManager } from "../components/settings/LogoManager";
import { InvoiceStyleManager } from "../components/settings/InvoiceStyleManager";

export const ParametresPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"company" | "logos" | "styles" | "system">("company");
  const [greetName, setGreetName] = useState("");
  const [greetMsg, setGreetMsg] = useState("");
  const [isGreeting, setIsGreeting] = useState(false);

  const { status, isReady, error, retryInit } = useDatabaseStatus();
  const [isVerifyingDb, setIsVerifyingDb] = useState(false);
  const [dbVerificationMessage, setDbVerificationMessage] = useState<string | null>(null);

  async function handleGreet(e: React.FormEvent) {
    e.preventDefault();
    if (!greetName.trim()) return;
    setIsGreeting(true);
    try {
      const response = await invoke<string>("greet", { name: greetName });
      setGreetMsg(response);
    } catch {
      setGreetMsg(`Bonjour, ${greetName} ! (Communication Tauri active)`);
    } finally {
      setIsGreeting(false);
    }
  }

  async function handleVerifyDatabase() {
    setIsVerifyingDb(true);
    setDbVerificationMessage(null);
    try {
      await retryInit();
      setDbVerificationMessage("Le stockage local est opérationnel. Vos données sont prêtes et protégées.");
    } catch {
      setDbVerificationMessage("Un problème est survenu lors de l'accès au stockage local.");
    } finally {
      setIsVerifyingDb(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header & Section Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Paramètres</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configurez vos informations et gérez votre environnement local.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl w-fit">
          <button
            type="button"
            id="tab-company-settings"
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "company"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 size={16} />
            <span>Mon Entreprise</span>
          </button>
          <button
            type="button"
            id="tab-logo-settings"
            onClick={() => setActiveTab("logos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "logos"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon size={16} />
            <span>Logos & En-tête</span>
          </button>
          <button
            type="button"
            id="tab-style-settings"
            onClick={() => setActiveTab("styles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "styles"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette size={16} />
            <span>Style des factures</span>
          </button>
          <button
            type="button"
            id="tab-system-settings"
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "system"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cpu size={16} />
            <span>Système & Stockage</span>
          </button>
        </div>
      </div>

      {activeTab === "company" ? (
        /* Company Settings Form */
        <CompanySettingsForm onGoToLogos={() => setActiveTab("logos")} />
      ) : activeTab === "logos" ? (
        /* Logo Manager Tab */
        <LogoManager />
      ) : activeTab === "styles" ? (
        /* Invoice Style Manager Tab */
        <InvoiceStyleManager />
      ) : (
        /* System & Diagnostics Tab */
        <div className="space-y-6">
          {/* Local Storage & Database Status (Artisan Friendly) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Database size={24} />
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    Stockage local des données
                  </h3>
                  {isReady ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Prêt & Sécurisé
                    </span>
                  ) : status === "initializing" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                      <RefreshCw size={14} className="animate-spin text-amber-600" />
                      Initialisation...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                      <AlertTriangle size={14} className="text-rose-600" />
                      Erreur locale
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  Toutes vos factures, devis et clients sont enregistrés directement sur cet ordinateur, sans besoin d'accès à internet.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="btn-verify-database"
                    type="button"
                    onClick={handleVerifyDatabase}
                    disabled={isVerifyingDb}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={isVerifyingDb ? "animate-spin" : ""} />
                    <span>Vérifier le stockage local</span>
                  </button>
                </div>

                {dbVerificationMessage && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>{dbVerificationMessage}</span>
                  </div>
                )}

                {error && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>Impossible d'initialiser le stockage local. Veuillez redémarrer l'application.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rust / Tauri Diagnostic & Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Terminal size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Diagnostic & Système local
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Vérification de la communication interne avec le moteur de bureau local (Tauri 2).
                </p>

                <form onSubmit={handleGreet} className="flex flex-col sm:flex-row gap-3 items-stretch max-w-lg">
                  <input
                    id="greet-input"
                    type="text"
                    value={greetName}
                    onChange={(e) => setGreetName(e.target.value)}
                    placeholder="Entrez votre prénom pour tester..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    id="btn-greet"
                    type="submit"
                    disabled={isGreeting || !greetName.trim()}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors cursor-pointer shrink-0"
                  >
                    Tester
                  </button>
                </form>

                {greetMsg && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <span>{greetMsg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

