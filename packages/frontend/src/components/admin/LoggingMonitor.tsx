"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeConfig } from "@/types/theme";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
  source: string;
  details?: string;
}

interface LoggingMonitorProps {
  themeConfig: ThemeConfig;
}

const logLevels = ["INFO", "WARN", "ERROR", "DEBUG"] as const;
const logSources = ["system", "auth", "database", "api", "frontend"] as const;

/**
 *
 * @param root0
 * @param root0.themeConfig
 */
export function LoggingMonitor({ themeConfig }: LoggingMonitorProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(logLevels),
  );
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(logSources),
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Generate mock log entries
  const generateMockLog = (): LogEntry => {
    const levels: LogEntry["level"][] = ["INFO", "WARN", "ERROR", "DEBUG"];
    const sources: LogEntry["source"][] = [
      "system",
      "auth",
      "database",
      "api",
      "frontend",
    ];
    const messages = [
      "User authentication successful",
      "Database query executed",
      "API request processed",
      "Cache miss occurred",
      "Session timeout",
      "Rate limit exceeded",
      "File upload completed",
      "Email sent successfully",
      "Backup completed",
      "System health check passed",
    ];

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      details:
        Math.random() > 0.7 ? "Additional context information" : undefined,
    };
  };

  // Initialize logs
  useEffect(() => {
    const initialLogs = Array.from({ length: 50 }, () => generateMockLog());
    setLogs(initialLogs);
  }, []);

  // Add new logs
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLogs = [...prev, generateMockLog()];
        if (newLogs.length > 1000) {
          newLogs.splice(0, 100);
        }
        return newLogs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLevel = selectedLevels.has(log.level);
    const matchesSource = selectedSources.has(log.source);

    return matchesSearch && matchesLevel && matchesSource;
  });

  const getLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "ERROR":
        return themeConfig.colors.error || "#ff4444";
      case "WARN":
        return themeConfig.colors.warning || "#ffaa00";
      case "INFO":
        return themeConfig.colors.info || "#00aaff";
      case "DEBUG":
        return themeConfig.colors.muted;
      default:
        return themeConfig.colors.text;
    }
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  const toggleSource = (source: string) => {
    setSelectedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = filteredLogs
      .map(
        (log) =>
          `[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`,
      )
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div
        className="p-4 border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span
              className="text-sm font-mono"
              style={{ color: themeConfig.colors.accent }}
            >
              logs@portfolio:~$
            </span>
            <span className="text-sm opacity-70">./tail -f logs/*.log</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: isPaused
                  ? themeConfig.colors.success
                  : themeConfig.colors.border,
                color: isPaused
                  ? themeConfig.colors.success
                  : themeConfig.colors.text,
              }}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: themeConfig.colors.error || "#ff4444",
                color: themeConfig.colors.error || "#ff4444",
              }}
            >
              🗑️ Clear
            </button>
            <button
              onClick={exportLogs}
              className="px-3 py-1 text-xs border rounded transition-colors"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <div className="text-xs opacity-70 mb-2">Search</div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full px-3 py-2 text-sm border rounded bg-transparent font-mono"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            />
          </div>

          {/* Level Filters */}
          <div>
            <div className="text-xs opacity-70 mb-2">Log Levels</div>
            <div className="flex flex-wrap gap-1">
              {logLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${selectedLevels.has(level) ? "opacity-100" : "opacity-50"
                    }`}
                  style={{
                    borderColor: getLevelColor(level),
                    color: getLevelColor(level),
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Source Filters */}
          <div>
            <div className="text-xs opacity-70 mb-2">Sources</div>
            <div className="flex flex-wrap gap-1">
              {logSources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${selectedSources.has(source) ? "opacity-100" : "opacity-50"
                    }`}
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="mt-4 pt-4 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span>Total: {logs.length}</span>
              <span>Filtered: {filteredLogs.length}</span>
              <span>Auto-scroll: {autoScroll ? "ON" : "OFF"}</span>
            </div>
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className="px-2 py-1 border rounded transition-colors"
              style={{
                borderColor: autoScroll
                  ? themeConfig.colors.success
                  : themeConfig.colors.border,
                color: autoScroll
                  ? themeConfig.colors.success
                  : themeConfig.colors.text,
              }}
            >
              {autoScroll ? "🔒 Lock" : "🔓 Unlock"}
            </button>
          </div>
        </div>
      </div>

      {/* Log Display */}
      <div
        className="border rounded"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: themeConfig.colors.bg,
        }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-bold"
            style={{ color: themeConfig.colors.accent }}
          >
            Application Logs
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-4">
          <div className="space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 opacity-50">
                No logs match the current filters
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-2 hover:opacity-80 transition-opacity"
                >
                  <span className="opacity-50 min-w-[140px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className="min-w-[60px] font-bold"
                    style={{ color: getLevelColor(log.level) }}
                  >
                    {log.level}
                  </span>
                  <span className="opacity-70 min-w-[80px]">
                    [{log.source}]
                  </span>
                  <span className="flex-1">{log.message}</span>
                  {log.details && (
                    <span className="opacity-50 text-xs">({log.details})</span>
                  )}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
