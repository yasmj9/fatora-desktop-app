import React, { useState, useEffect } from "react";
import { loggerService, LogEntry } from "../../services/loggerService";
import {
  Terminal,
  Search,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Filter,
} from "lucide-react";

export const SystemLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const unsubscribe = loggerService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  // Filter logic
  const categories = Array.from(new Set(logs.map((l) => l.category)));

  const filteredLogs = logs.filter((log) => {
    // Level filter
    if (selectedLevel !== "ALL" && log.level !== selectedLevel) {
      return false;
    }
    // Category filter
    if (selectedCategory !== "ALL" && log.category !== selectedCategory) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      const matchLevel = log.level.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q) || false;
      const matchStack = log.stack?.toLowerCase().includes(q) || false;
      return matchMsg || matchCat || matchLevel || matchDetails || matchStack;
    }
    return true;
  });

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;
  const successCount = logs.filter((l) => l.level === "SUCCESS").length;

  const handleCopyLog = (log: LogEntry) => {
    const text = `[${log.dateFormatted} ${log.timeFormatted}] [${log.level}][${log.category}] ${log.message}${
      log.details ? `\nDétails: ${log.details}` : ""
    }${log.stack ? `\nStack: ${log.stack}` : ""}`;

    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${l.dateFormatted} ${l.timeFormatted}] [${l.level}][${l.category}] ${l.message}${
            l.details ? `\n  Details: ${l.details}` : ""
          }${l.stack ? `\n  Stack: ${l.stack}` : ""}`
      )
      .join("\n----------------------------------------\n");

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const renderLevelBadge = (level: LogEntry["level"]) => {
    switch (level) {
      case "ERROR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            ERREUR
          </span>
        );
      case "WARN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            ATTENTION
          </span>
        );
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            SUCCÈS
          </span>
        );
      case "ACTION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Activity className="w-3 h-3 text-blue-400" />
            ACTION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
            <Info className="w-3 h-3 text-slate-400" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 select-none font-sans">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 text-blue-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Journal des Événements & Erreurs (Logs)</h3>
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 rounded-full text-xs font-mono font-semibold border border-slate-700">
                  {filteredLogs.length} / {logs.length} entrées
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez l'historique complet des actions, requêtes base de données, générations de PDF et erreurs système.
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Copier tous les logs filtrés"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? "Copié !" : "Copier"}</span>
            </button>

            <button
              type="button"
              onClick={() => loggerService.exportLogsToJSON()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              title="Exporter les logs au format JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm("Voulez-vous vraiment effacer tous les logs système ?")) {
                  loggerService.clearLogs();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              title="Effacer le journal"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer</span>
            </button>
          </div>
        </div>

        {/* Counters summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Logs</span>
            <span className="text-sm font-bold font-mono text-slate-200">{logs.length}</span>
          </div>
          <div className="bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40 flex items-center justify-between">
            <span className="text-xs text-rose-300 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Erreurs
            </span>
            <span className="text-sm font-bold font-mono text-rose-300">{errorCount}</span>
          </div>
          <div className="bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/40 flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Avertissements
            </span>
            <span className="text-sm font-bold font-mono text-amber-300">{warnCount}</span>
          </div>
          <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/40 flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Succès
            </span>
            <span className="text-sm font-bold font-mono text-emerald-300">{successCount}</span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé, erreur, module..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {/* Level Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {["ALL", "ERROR", "WARN", "SUCCESS", "ACTION", "INFO"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedLevel === lvl
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {lvl === "ALL" ? "Tous" : lvl}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <div className="relative flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-2"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  Toutes catégories
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Logs Console Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold">Aucun événement à afficher</p>
            <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
              Toutes les actions utilisateur, erreurs et requêtes système apparaîtront ici en temps réel.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasExtra = Boolean(log.details || log.stack);

              return (
                <div
                  key={log.id}
                  className={`p-3 transition-colors ${
                    log.level === "ERROR"
                      ? "bg-rose-950/20 hover:bg-rose-950/30"
                      : log.level === "WARN"
                      ? "bg-amber-950/15 hover:bg-amber-950/25"
                      : "hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span className="text-slate-500 text-[11px] whitespace-nowrap mt-0.5 select-all">
                        [{log.timeFormatted}]
                      </span>
                      {renderLevelBadge(log.level)}
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        {log.category}
                      </span>
                      <p className="text-slate-200 font-medium break-words leading-relaxed flex-1">
                        {log.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasExtra && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? "Masquer" : "Détails"}</span>
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyLog(log)}
                        className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copier ce log"
                      >
                        {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details / stack trace box */}
                  {isExpanded && hasExtra && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px] text-slate-300 overflow-x-auto">
                      {log.details && (
                        <div>
                          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                            Détails de l'action / Données :
                          </div>
                          <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-slate-300 whitespace-pre-wrap text-[11px] font-mono">
                            {log.details}
                          </pre>
                        </div>
                      )}

                      {log.stack && (
                        <div>
                          <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                            Pile d'exécution (Stack Trace Error) :
                          </div>
                          <pre className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/40 text-rose-300 whitespace-pre-wrap text-[10px] font-mono">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
