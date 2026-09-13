import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { KeyRound, Lock, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export const ForceChangePasswordScreen: React.FC = () => {
  const { user, forceChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError("Le nouveau mot de passe doit comporter au moins 4 caractères.");
      return;
    }

    if (newPassword === "123456") {
      setError("Veuillez choisir un mot de passe sécurisé différent du mot de passe temporaire '123456'.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas. Veuillez recontrôler.");
      return;
    }

    setIsSubmitting(true);
    const result = await forceChangePassword(newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Erreur lors de la mise à jour du mot de passe.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Nouveau Mot de Passe Obligatoire
          </h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Compte : <strong className="text-white font-semibold">{user?.username}</strong>
            <br />
            Pour sécuriser votre accès, veuillez choisir votre mot de passe définitif.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
            ⚠️ Vous vous êtes connecté avec le mot de passe temporaire de secours (<strong>123456</strong>). Pour des raisons de sécurité, veuillez définir un nouveau mot de passe.
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
                Nouveau mot de passe <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choisissez un nouveau mot de passe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirmer le nouveau mot de passe <span className="text-red-400">*</span>
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
                  placeholder="Répétez le nouveau mot de passe"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Les mots de passe correspondent.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0047AB] hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Mise à jour du mot de passe...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enregistrer & Accéder à Fatora</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500">
          Sécurité Fatora • Protection des accès
        </p>
      </div>
    </div>
  );
};
