import React, { createContext, useContext, useEffect, useState } from "react";
import { initDatabase, checkDatabaseHealth } from "../db";
import { DatabaseHealth, DatabaseStatus } from "../db/types";

interface DatabaseContextValue {
  status: DatabaseStatus;
  isReady: boolean;
  health: DatabaseHealth | null;
  error: string | null;
  retryInit: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  status: "uninitialized",
  isReady: false,
  health: null,
  error: null,
  retryInit: async () => {},
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<DatabaseStatus>("initializing");
  const [health, setHealth] = useState<DatabaseHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    setStatus("initializing");
    setError(null);
    try {
      await initDatabase();
      const currentHealth = await checkDatabaseHealth();
      setHealth(currentHealth);
      setStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
      const currentHealth = await checkDatabaseHealth();
      setHealth(currentHealth);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        status,
        isReady: status === "ready",
        health,
        error,
        retryInit: initialize,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

/**
 * Hook to access database connection state without directly writing SQL.
 */
export function useDatabaseStatus(): DatabaseContextValue {
  return useContext(DatabaseContext);
}
