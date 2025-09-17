/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useCommandHistory } from "@portfolio/frontend/src/hooks/useCommandHistory";

// Interactive timeline data structure
interface TimelineEntry {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  executionTime?: number;
  category: string;
  favorite: boolean;
  expanded?: boolean;
  context?: string;
}

// Visual timeline configurations
interface TimelineConfig {
  groupBy: "hour" | "day" | "week" | "month";
  showDetails: boolean;
  showStats: boolean;
  animateOnLoad: boolean;
  enableFiltering: boolean;
}

// Command execution patterns
interface ExecutionPattern {
  sequence: string[];
  frequency: number;
  avgInterval: number;
  successRate: number;
  lastUsed: Date;
}

interface InteractiveCommandHistoryProps {
  /** Whether the history panel is visible */
  isVisible: boolean;
  /** Callback when user selects a command */
  onCommandSelect: (command: string) => void;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Maximum height of the component */
  maxHeight?: string;
  /** Enable real-time updates */
  enableRealTime?: boolean;
  /** Show command patterns analysis */
  showPatterns?: boolean;
  /** Enable command replay functionality */
  enableReplay?: boolean;
}

export function InteractiveCommandHistory({
  isVisible,
  onCommandSelect,
  onClose,
  maxHeight = "70vh",
  enableRealTime = true,
  showPatterns = true,
  enableReplay = true,
}: InteractiveCommandHistoryProps) {
  const { themeConfig } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>({
    groupBy: "hour",
    showDetails: true,
    showStats: true,
    animateOnLoad: true,
    enableFiltering: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [replayMode, setReplayMode] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  // Get command history data
  const { history, analytics, toggleFavorite, removeCommand, exportHistory } =
    useCommandHistory();

  // Filter and process timeline entries
  const timelineEntries = useCallback((): TimelineEntry[] => {
    const filtered = history.filter((entry) => {
      if (searchQuery) {
        return (
          entry.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return true;
    });

    // Group by time periods
    return filtered.map((entry) => ({
      ...entry,
      expanded: selectedEntry === entry.id,
    }));
  }, [history, searchQuery, selectedEntry]);

  // Detect command patterns
  const commandPatterns = useCallback((): ExecutionPattern[] => {
    if (!showPatterns || history.length < 3) return [];

    const patterns: Map<string, ExecutionPattern> = new Map();

    // Analyze command sequences (sliding window of 3)
    for (let i = 0; i <= history.length - 3; i++) {
      const sequence = history.slice(i, i + 3).map((entry) => entry.command);
      const key = sequence.join(" → ");

      if (patterns.has(key)) {
        const pattern = patterns.get(key)!;
        pattern.frequency++;
        pattern.lastUsed = history[i + 2].timestamp;
      } else {
        const timestamps = history
          .slice(i, i + 3)
          .map((entry) => entry.timestamp);
        const intervals = timestamps
          .slice(1)
          .map((time, idx) => time.getTime() - timestamps[idx].getTime());
        const avgInterval =
          intervals.reduce((sum, interval) => sum + interval, 0) /
          intervals.length;

        const successes = history
          .slice(i, i + 3)
          .filter((entry) => entry.success);
        const successRate = (successes.length / 3) * 100;

        patterns.set(key, {
          sequence,
          frequency: 1,
          avgInterval,
          successRate,
          lastUsed: history[i + 2].timestamp,
        });
      }
    }

    return Array.from(patterns.values())
      .filter((pattern) => pattern.frequency > 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }, [history, showPatterns]);

  // Format relative time
  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  // Get category color
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      info: themeConfig.colors.info || "#3B82F6",
      system: themeConfig.colors.error || "#EF4444",
      customization: themeConfig.colors.warning || "#F59E0B",
      development: themeConfig.colors.success || "#10B981",
      navigation: themeConfig.colors.accent || "#8B5CF6",
    };
    return categoryColors[category] || themeConfig.colors.muted || "#6B7280";
  };

  // Handle command replay
  const handleReplay = useCallback(
    async (commands: string[]) => {
      if (!enableReplay) return;

      setReplayMode(true);

      for (let i = 0; i < commands.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000 / replaySpeed));
        onCommandSelect(commands[i]);

        // Visual feedback during replay
        setSelectedEntry(`replay-${i}`);
      }

      setReplayMode(false);
      setSelectedEntry(null);
    },
    [enableReplay, replaySpeed, onCommandSelect],
  );

  // Handle entry click
  const handleEntryClick = (entry: TimelineEntry) => {
    if (selectedEntry === entry.id) {
      setSelectedEntry(null);
    } else {
      setSelectedEntry(entry.id);
    }
  };

  // Handle pattern selection
  const handlePatternSelect = (pattern: ExecutionPattern) => {
    setSelectedPattern(pattern.sequence.join(" → "));
    if (enableReplay) {
      handleReplay(pattern.sequence);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "r" && e.ctrlKey) {
        e.preventDefault();
        setReplayMode(!replayMode);
      } else if (e.key === "e" && e.ctrlKey) {
        e.preventDefault();
        exportHistory();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose, replayMode, exportHistory]);

  if (!isVisible) return null;

  const entries = timelineEntries();
  const patterns = commandPatterns();

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => e.target === containerRef.current && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Command History"
    >
      <div
        className="w-full max-w-6xl mx-4 rounded-lg border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
          maxHeight,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{
            backgroundColor: `${themeConfig.colors.accent}08`,
            borderColor: themeConfig.colors.border,
          }}
        >
          <div className="flex items-center gap-4">
            <h3
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.text }}
            >
              📊 Interactive Command History
            </h3>

            {replayMode && (
              <div className="flex items-center gap-2">
                <span className="animate-pulse text-red-500">🔴</span>
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Replaying commands...
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Timeline controls */}
            <select
              value={timelineConfig.groupBy}
              onChange={(e) =>
                setTimelineConfig((prev) => ({
                  ...prev,
                  groupBy: e.target.value as TimelineConfig["groupBy"],
                }))
              }
              className="px-3 py-1 text-sm rounded border bg-transparent"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value="hour">Group by Hour</option>
              <option value="day">Group by Day</option>
              <option value="week">Group by Week</option>
              <option value="month">Group by Month</option>
            </select>

            {enableReplay && (
              <div className="flex items-center gap-2">
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.muted }}
                >
                  Speed:
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.5"
                  value={replaySpeed}
                  onChange={(e) => setReplaySpeed(Number(e.target.value))}
                  className="w-16"
                />
                <span
                  className="text-sm w-8"
                  style={{ color: themeConfig.colors.muted }}
                >
                  {replaySpeed}x
                </span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-opacity-20 transition-colors"
              style={{ color: themeConfig.colors.muted }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Main Timeline */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands, categories, or contexts..."
                className="w-full px-4 py-3 rounded border bg-transparent focus:outline-none focus:ring-2"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                  backgroundColor: `${themeConfig.colors.accent}05`,
                }}
              />
            </div>

            {/* Timeline Entries */}
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`group p-4 rounded-lg border cursor-pointer transition-all duration-200 ${entry.expanded ? "ring-2" : ""
                    }`}
                  style={{
                    backgroundColor: entry.expanded
                      ? `${themeConfig.colors.accent}10`
                      : `${themeConfig.colors.accent}03`,
                    borderColor: entry.expanded
                      ? themeConfig.colors.accent
                      : themeConfig.colors.border,
                  }}
                  onClick={() => handleEntryClick(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleEntryClick(entry);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={entry.expanded}
                  aria-label={`Command: ${entry.command}, ${formatRelativeTime(entry.timestamp)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status indicator */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: entry.success
                              ? themeConfig.colors.success
                              : themeConfig.colors.error,
                          }}
                        />

                        {/* Command */}
                        <code
                          className="font-mono text-sm font-medium truncate"
                          style={{ color: themeConfig.colors.text }}
                        >
                          {entry.command}
                        </code>

                        {/* Category badge */}
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{
                            backgroundColor: `${getCategoryColor(entry.category)}20`,
                            color: getCategoryColor(entry.category),
                          }}
                        >
                          {entry.category}
                        </span>

                        {/* Favorite indicator */}
                        {entry.favorite && (
                          <span style={{ color: themeConfig.colors.warning }}>
                            ⭐
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm opacity-75">
                        <span style={{ color: themeConfig.colors.muted }}>
                          {formatRelativeTime(entry.timestamp)}
                        </span>

                        {entry.executionTime && (
                          <span style={{ color: themeConfig.colors.muted }}>
                            {entry.executionTime}ms
                          </span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {entry.expanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span
                                className="font-medium"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Executed:
                              </span>
                              <span
                                className="ml-2"
                                style={{ color: themeConfig.colors.muted }}
                              >
                                {entry.timestamp.toLocaleString()}
                              </span>
                            </div>

                            <div>
                              <span
                                className="font-medium"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Status:
                              </span>
                              <span
                                className="ml-2"
                                style={{
                                  color: entry.success
                                    ? themeConfig.colors.success
                                    : themeConfig.colors.error,
                                }}
                              >
                                {entry.success ? "Success" : "Failed"}
                              </span>
                            </div>
                          </div>

                          {entry.context && (
                            <div>
                              <span
                                className="font-medium text-sm"
                                style={{ color: themeConfig.colors.text }}
                              >
                                Context:
                              </span>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: themeConfig.colors.muted }}
                              >
                                {entry.context}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCommandSelect(entry.command);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.accent,
                                color: themeConfig.colors.accent,
                              }}
                            >
                              Re-run
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(entry.id);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.warning,
                                color: themeConfig.colors.warning,
                              }}
                            >
                              {entry.favorite ? "Unfavorite" : "Favorite"}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCommand(entry.id);
                              }}
                              className="px-3 py-1 text-xs rounded border transition-colors hover:bg-opacity-20"
                              style={{
                                borderColor: themeConfig.colors.error,
                                color: themeConfig.colors.error,
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline connector */}
                    {index < entries.length - 1 && (
                      <div
                        className="w-px h-8 mt-6 ml-4"
                        style={{ backgroundColor: themeConfig.colors.border }}
                      />
                    )}
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="text-center py-12">
                  <div
                    className="text-6xl mb-4 opacity-50"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    📜
                  </div>
                  <p
                    className="text-lg mb-2"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    No command history found
                  </p>
                  <p
                    className="text-sm opacity-75"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    Start executing commands to build your history
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Patterns & Analytics */}
          {showPatterns && patterns.length > 0 && (
            <div
              className="w-80 border-l overflow-y-auto p-6"
              style={{
                backgroundColor: `${themeConfig.colors.accent}05`,
                borderColor: themeConfig.colors.border,
              }}
            >
              <h4
                className="text-lg font-bold mb-4"
                style={{ color: themeConfig.colors.text }}
              >
                🔄 Command Patterns
              </h4>

              <div className="space-y-3">
                {patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border cursor-pointer transition-all duration-200 ${selectedPattern === pattern.sequence.join(" → ")
                      ? "ring-2"
                      : ""
                      }`}
                    style={{
                      backgroundColor:
                        selectedPattern === pattern.sequence.join(" → ")
                          ? `${themeConfig.colors.accent}15`
                          : `${themeConfig.colors.accent}05`,
                      borderColor: themeConfig.colors.border,
                    }}
                    onClick={() => handlePatternSelect(pattern)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handlePatternSelect(pattern);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Command pattern: ${pattern.sequence.join(" → ")}`}
                  >
                    <div className="mb-2">
                      {pattern.sequence.map((cmd, cmdIndex) => (
                        <span key={cmdIndex}>
                          <code
                            className="text-xs"
                            style={{ color: themeConfig.colors.text }}
                          >
                            {cmd}
                          </code>
                          {cmdIndex < pattern.sequence.length - 1 && (
                            <span
                              className="mx-1 text-xs"
                              style={{ color: themeConfig.colors.muted }}
                            >
                              →
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: themeConfig.colors.muted }}>
                        Used {pattern.frequency}x
                      </span>
                      <span style={{ color: themeConfig.colors.success }}>
                        {Math.round(pattern.successRate)}% success
                      </span>
                    </div>

                    {enableReplay && (
                      <div className="mt-2">
                        <button
                          className="text-xs px-2 py-1 rounded border"
                          style={{
                            borderColor: themeConfig.colors.accent,
                            color: themeConfig.colors.accent,
                          }}
                        >
                          🔄 Replay Pattern
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t">
                <h5
                  className="font-medium mb-3"
                  style={{ color: themeConfig.colors.text }}
                >
                  📈 Quick Stats
                </h5>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Total Commands:
                    </span>
                    <span style={{ color: themeConfig.colors.text }}>
                      {analytics?.totalCommands || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Success Rate:
                    </span>
                    <span style={{ color: themeConfig.colors.success }}>
                      {Math.round(analytics?.successRate || 0)}%
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span style={{ color: themeConfig.colors.muted }}>
                      Unique Commands:
                    </span>
                    <span style={{ color: themeConfig.colors.text }}>
                      {analytics?.uniqueCommands || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t text-sm"
          style={{
            backgroundColor: `${themeConfig.colors.muted}05`,
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>📊 Interactive History</span>
              {enableRealTime && <span>🔄 Real-time updates</span>}
              {showPatterns && <span>🧠 Pattern recognition</span>}
              {enableReplay && <span>▶️ Command replay</span>}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span>Ctrl+R: Toggle replay</span>
              <span>•</span>
              <span>Ctrl+E: Export</span>
              <span>•</span>
              <span>Esc: Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
