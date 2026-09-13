import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, User, Lock, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

export const InstallationSetupScreen: React.FC = () => {
  const { setupInitialUser } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Veuillez saisir un nom d'utilisateur.");
      return;
    }

    if (password.length < 4) {
      setError("Le mot de passe doit comporter au moins 4 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas. Veuillez recontrôler.");
      return;
    }

    setIsSubmitting(true);
    const result = await setupInitialUser(username.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue lors de la création du compte.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0047AB] to-blue-500 text-white shadow-xl shadow-blue-500/20 mb-2">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Installation & Configuration Initiale
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Bienvenue ! Veuillez configurer le compte administrateur principal pour sécuriser votre application Fatora.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
            <span>
              Étape unique lors du premier démarrage. Ces identifiants vous permettront de déverrouiller l'application.
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nom d'utilisateur <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex: admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirmer le mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
              {password && confirmPassword && password === confirmPassword && (
                <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Les mots de passe correspondent parfaitement.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0047AB] hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Création du compte en cours...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Terminer l'installation et Se Connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Fatora Desktop • Version Hors-ligne Sécurisée
        </p>
      </div>
    </div>
  );
};
