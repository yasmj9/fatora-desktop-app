import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { KeyRound, Lock, ShieldCheck, CheckCircle2, AlertCircle, Info, User } from "lucide-react";

export const AccountSecuritySettings: React.FC = () => {
  const { user, forceChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 4) {
      setError("Le nouveau mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    if (newPassword === "123456") {
      setError("Veuillez choisir un mot de passe sécurisé différent du mot de passe par défaut '123456'.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas. Veuillez recontrôler.");
      return;
    }

    setIsSubmitting(true);
    const res = await forceChangePassword(newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg("Votre mot de passe a été modifié avec succès !");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setError(res.error || "Erreur lors du changement de mot de passe.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#0047AB]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Compte & Sécurité</h3>
            <p className="text-xs text-slate-500">
              Gérez votre mot de passe administrateur et consultez les procédures de récupération.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Form */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#0047AB]" />
              <h4 className="text-sm font-bold text-slate-900">Changer le mot de passe</h4>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.username}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047AB] focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#0047AB] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mettre à jour le mot de passe</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Recovery Procedure Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Info className="w-5 h-5" />
              <h4 className="text-sm font-bold">Procédure de Secours (Oubli de mot de passe)</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              En cas d'oubli de votre mot de passe lors de la connexion, vous pouvez utiliser la procédure de réinitialisation d'urgence :
            </p>

            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 font-medium">
              <li>
                Sur l'écran de connexion, cliquez sur <strong className="text-amber-300">"Mot de passe oublié ?"</strong>.
              </li>
              <li>
                Cliquez sur le bouton de secours : le mot de passe sera remis temporairement à <code className="bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded font-mono">123456</code>.
              </li>
              <li>
                Connectez-vous avec <code className="bg-slate-700 text-amber-300 px-1.5 py-0.5 rounded font-mono">123456</code>.
              </li>
              <li>
                L'application vous exigera immédiatement de configurer votre nouveau mot de passe personnalisé.
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
            🔒 Vos identifiants sont stockés en toute sécurité dans votre base de données locale SQLite (Tauri) et chiffrés.
          </div>
        </div>
      </div>
    </div>
  );
};
