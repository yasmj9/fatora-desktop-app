import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserSession } from "../types/user";
import { userRepository } from "../db/repositories/userRepository";
import { hashPassword, verifyPassword } from "../utils/crypto";

interface AuthContextType {
  isLoading: boolean;
  hasInitialUser: boolean;
  user: UserSession | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  setupInitialUser: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  forceChangePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  emergencyResetPassword: (targetUsername?: string) => Promise<{ success: boolean; defaultUsername: string; error?: string }>;
  logout: () => void;
  refreshUsersState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialUser, setHasInitialUser] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);

  const checkUsersExist = async () => {
    try {
      setIsLoading(true);
      const count = await userRepository.getUserCount();
      setHasInitialUser(count > 0);

      // Restore active session if present
      const storedSession = sessionStorage.getItem("fatora_user_session");
      if (storedSession && count > 0) {
        try {
          const parsed = JSON.parse(storedSession) as UserSession;
          // Verify user still exists in DB
          const dbUser = await userRepository.getUserByUsername(parsed.username);
          if (dbUser) {
            setUser({
              id: dbUser.id,
              username: dbUser.username,
              must_change_password: dbUser.must_change_password === 1,
            });
          } else {
            sessionStorage.removeItem("fatora_user_session");
            setUser(null);
          }
        } catch {
          sessionStorage.removeItem("fatora_user_session");
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Error checking auth users state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUsersExist();
  }, []);

  const refreshUsersState = async () => {
    await checkUsersExist();
  };

  const setupInitialUser = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!username.trim() || username.trim().length < 3) {
        return { success: false, error: "Le nom d'utilisateur doit contenir au moins 3 caractères." };
      }
      if (!password || password.length < 4) {
        return { success: false, error: "Le mot de passe doit contenir au moins 4 caractères." };
      }

      const pHash = await hashPassword(password);
      const newUser = await userRepository.createUser(username.trim(), pHash, false);

      const session: UserSession = {
        id: newUser.id,
        username: newUser.username,
        must_change_password: false,
      };

      setUser(session);
      sessionStorage.setItem("fatora_user_session", JSON.stringify(session));
      setHasInitialUser(true);

      return { success: true };
    } catch (err: any) {
      console.error("Setup initial user error:", err);
      return { success: false, error: err?.message || "Erreur lors de la création du compte." };
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }> => {
    try {
      if (!username.trim() || !password) {
        return { success: false, error: "Veuillez saisir le nom d'utilisateur et le mot de passe." };
      }

      const dbUser = await userRepository.getUserByUsername(username.trim());
      if (!dbUser) {
        return { success: false, error: "Nom d'utilisateur ou mot de passe incorrect." };
      }

      const isValid = await verifyPassword(password, dbUser.password_hash);
      if (!isValid) {
        return { success: false, error: "Nom d'utilisateur ou mot de passe incorrect." };
      }

      const mustChange = dbUser.must_change_password === 1;
      const session: UserSession = {
        id: dbUser.id,
        username: dbUser.username,
        must_change_password: mustChange,
      };

      setUser(session);
      sessionStorage.setItem("fatora_user_session", JSON.stringify(session));

      return { success: true, mustChangePassword: mustChange };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err?.message || "Erreur lors de la connexion." };
    }
  };

  const forceChangePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: "Aucun utilisateur connecté." };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "Le nouveau mot de passe doit contenir au moins 4 caractères." };
      }
      if (newPassword === "123456") {
        return { success: false, error: "Veuillez choisir un mot de passe différent du mot de passe temporaire '123456'." };
      }

      const newHash = await hashPassword(newPassword);
      await userRepository.updatePassword(user.username, newHash, false);

      const updatedSession: UserSession = {
        ...user,
        must_change_password: false,
      };

      setUser(updatedSession);
      sessionStorage.setItem("fatora_user_session", JSON.stringify(updatedSession));

      return { success: true };
    } catch (err: any) {
      console.error("Force change password error:", err);
      return { success: false, error: err?.message || "Erreur lors de la mise à jour du mot de passe." };
    }
  };

  const emergencyResetPassword = async (targetUsername?: string): Promise<{ success: boolean; defaultUsername: string; error?: string }> => {
    try {
      const resetHash = await hashPassword("123456");
      let usernameToReset = targetUsername?.trim();

      if (!usernameToReset) {
        const users = await userRepository.getUsers();
        if (users.length > 0) {
          usernameToReset = users[0].username;
        } else {
          return { success: false, defaultUsername: "admin", error: "Aucun compte utilisateur trouvé." };
        }
      }

      await userRepository.emergencyResetUserPassword(usernameToReset, resetHash);

      return { success: true, defaultUsername: usernameToReset };
    } catch (err: any) {
      console.error("Emergency reset error:", err);
      return { success: false, defaultUsername: "admin", error: err?.message || "Erreur lors de la réinitialisation de secours." };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("fatora_user_session");
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        hasInitialUser,
        user,
        isAuthenticated: Boolean(user),
        mustChangePassword: Boolean(user?.must_change_password),
        login,
        setupInitialUser,
        forceChangePassword,
        emergencyResetPassword,
        logout,
        refreshUsersState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
