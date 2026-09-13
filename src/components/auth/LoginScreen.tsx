import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, User, LogIn, KeyRound, AlertCircle, CheckCircle2, ShieldAlert, X } from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { login, emergencyResetPassword } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!username.trim() || !password) {
      setError("Veuillez remplir le nom d'utilisateur et le mot de passe.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Nom d'utilisateur ou mot de passe incorrect.");
    }
  };

  const handleEmergencyReset = async () => {
    setIsResetting(true);
    setError(null);

    const result = await emergencyResetPassword(username.trim() || undefined);
    setIsResetting(false);

    if (result.success) {
      setUsername(result.defaultUsername);
      setPassword("123456");
      setShowForgotModal(false);
      setInfoMessage(
        `Le mot de passe de '${result.defaultUsername}' a été réinitialisé d'urgence à '123456'. Cliquez sur "Se Connecter" pour définir votre nouveau mot de passe.`
      );
    } else {
      setError(result.error || "Erreur lors de la réinitialisation de secours.");
      setShowForgotModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0047AB] text-white shadow-xl shadow-blue-600/30 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Connexion Fatora
          </h1>
          <p className="text-sm text-slate-400">
            Saisissez vos identifiants pour accéder à votre gestion de facturation.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nom d'utilisateur
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Mot de passe oublié ?</span>
                </button>
              </div>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0047AB] hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Verification...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Fatora Application • Connexion Sécurisée
        </p>
      </div>

      {/* Emergency Reset Trick Modal */}
      {showForgotModal && (
        <div className="fixed inset-[#0] bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="font-bold text-lg text-white">Réinitialisation de Secours</h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
              <p className="font-medium text-amber-200">
                💡 Astuce de Récupération d'Urgence :
              </p>
              <p>
                Si vous avez oublié votre mot de passe, vous pouvez forcer la réinitialisation temporaire à <strong className="text-white bg-slate-700 px-1.5 py-0.5 rounded font-mono">123456</strong>.
              </p>
              <p>
                Une fois la connexion effectuée avec <strong className="text-white font-mono">123456</strong>, l'application exigera immédiatement la création d'un nouveau mot de passe personnalisé.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleEmergencyReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isResetting ? (
                  <span>Réinitialisation...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Réinitialiser à '123456'</span>
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
