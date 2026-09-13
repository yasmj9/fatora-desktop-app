export interface LogEntry {
  id: string;
  timestamp: string; // ISO String
  timeFormatted: string; // HH:mm:ss
  dateFormatted: string; // DD/MM/YYYY
  level: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "ACTION";
  category: string; // e.g. "DATABASE", "AUTH", "PDF", "FACTURE", "DEVIS", "SYSTEME"
  message: string;
  details?: string;
  stack?: string;
}

type LogListener = (logs: LogEntry[]) => void;

const STORAGE_KEY = "fatora_app_logs";
const MAX_LOGS = 300;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.loadLogsFromStorage();
    this.setupGlobalErrorListeners();
    this.logInfo("SYSTEME", "Démarrage du système de journalisation (Logger) Fatora");
  }

  private loadLogsFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.logs = JSON.parse(data);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogsToStorage() {
    try {
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(0, MAX_LOGS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Ignore quota exceeded
    }
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn([...this.logs]);
      } catch {
        // Ignore listener error
      }
    });
  }

  private setupGlobalErrorListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      const msg = event.message || "Erreur JavaScript non interceptée";
      const stack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
      this.logError("SYSTEME", `Erreur d'exécution: ${msg}`, stack);
    });

    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const msg = typeof reason === "object" && reason?.message ? reason.message : String(reason);
      const stack = typeof reason === "object" && reason?.stack ? reason.stack : undefined;
      this.logError("SYSTEME", `Promesse rejetée non gérée: ${msg}`, stack);
    });
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public addLog(
    level: LogEntry["level"],
    category: string,
    message: string,
    details?: string | object,
    stack?: string
  ): LogEntry {
    const now = new Date();
    const formattedDetails =
      typeof details === "object" ? JSON.stringify(details, null, 2) : details;

    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      dateFormatted: now.toLocaleDateString("fr-FR"),
      level,
      category: category.toUpperCase(),
      message,
      details: formattedDetails,
      stack,
    };

    // Prepend new logs so recent is first
    this.logs.unshift(entry);
    this.saveLogsToStorage();
    this.notifyListeners();

    // Also mirror to browser console for developer convenience
    const consoleMsg = `[FATORA ${level}][${entry.category}] ${message}`;
    if (level === "ERROR") {
      console.error(consoleMsg, details || "", stack || "");
    } else if (level === "WARN") {
      console.warn(consoleMsg, details || "");
    } else {
      console.log(consoleMsg, details || "");
    }

    return entry;
  }

  public logInfo(category: string, message: string, details?: string | object) {
    return this.addLog("INFO", category, message, details);
  }

  public logSuccess(category: string, message: string, details?: string | object) {
    return this.addLog("SUCCESS", category, message, details);
  }

  public logWarn(category: string, message: string, details?: string | object) {
    return this.addLog("WARN", category, message, details);
  }

  public logError(category: string, message: string, stack?: string, details?: string | object) {
    return this.addLog("ERROR", category, message, details, stack);
  }

  public logAction(category: string, actionName: string, details?: string | object) {
    return this.addLog("ACTION", category, actionName, details);
  }

  public clearLogs() {
    this.logs = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    this.notifyListeners();
  }

  public exportLogsToJSON(): void {
    const jsonStr = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fatora_system_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const loggerService = new LoggerService();
