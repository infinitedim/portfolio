
"use client";

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  type JSX,
} from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  useCommandHistory,
  type CommandHistoryEntry,
  type HistorySearchOptions,
} from "@/hooks/use-command-history";

interface HistorySearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: string) => void;
  className?: string;
}

/**
 * Enhanced command history search panel with  filtering, favorites, and analytics
 */
export function HistorySearchPanel({
  isOpen,
  onClose,
  onSelectCommand,
  className = "",
}: HistorySearchPanelProps): JSX.Element | null {
  const { themeConfig } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "search" | "favorites" | "analytics"
  >("search");

  const {
    history,
    categories,
    favorites,
    analytics,
    searchOptions,
    setSearchOptions,
    toggleFavorite,
    removeCommand,
    clearHistory,
    exportHistory,
    getSuggestions: _getSuggestions,
  } = useCommandHistory();

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchOptions.query, searchOptions.category, searchOptions.sortBy]);

  const handleKeyDown = (e: KeyboardEvent) => {
    const visibleEntries = activeTab === "search" ? history : favorites;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < visibleEntries.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : visibleEntries.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (visibleEntries[selectedIndex]) {
          handleCommandSelect(visibleEntries[selectedIndex].command);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      case "Delete":
        if (e.ctrlKey && visibleEntries[selectedIndex]) {
          e.preventDefault();
          removeCommand(visibleEntries[selectedIndex].id);
        }
        break;
      case "f":
        if (e.ctrlKey && visibleEntries[selectedIndex]) {
          e.preventDefault();
          toggleFavorite(visibleEntries[selectedIndex].id);
        }
        break;
    }
  };

  const handleCommandSelect = (command: string) => {
    onSelectCommand(command);
    onClose();
  };

  const handleSearchChange = (query: string) => {
    setSearchOptions((prev) => ({ ...prev, query }));
  };

  const handleFilterChange = (filters: Partial<HistorySearchOptions>) => {
    setSearchOptions((prev) => ({ ...prev, ...filters }));
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatExecutionTime = (ms?: number) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      portfolio: themeConfig.colors.accent,
      system: themeConfig.colors.success || themeConfig.colors.accent,
      development: themeConfig.colors.warning || themeConfig.colors.accent,
      customization: themeConfig.colors.info || themeConfig.colors.accent,
      social: themeConfig.colors.accent,
      entertainment: themeConfig.colors.accent,
      general: themeConfig.colors.muted,
    };
    return colors[category as keyof typeof colors] || themeConfig.colors.muted;
  };

  if (!isOpen) return null;

  const renderHistoryItem = (entry: CommandHistoryEntry, index: number) => {
    const isSelected = index === selectedIndex;

    return (
      <div
        key={entry.id}
        className={`group relative flex items-center justify-between p-3 rounded border transition-all duration-200 cursor-pointer ${isSelected ? "ring-2" : ""}`}
        style={{
          borderColor: isSelected
            ? themeConfig.colors.accent
            : themeConfig.colors.border,
          backgroundColor: isSelected
            ? `${themeConfig.colors.accent}10`
            : `${themeConfig.colors.bg}40`,
        }}
        onClick={() => handleCommandSelect(entry.command)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCommandSelect(entry.command);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Execute command: ${entry.command}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code
              className="font-mono text-sm font-medium truncate"
              style={{ color: themeConfig.colors.text }}
            >
              {entry.command}
            </code>

            {entry.favorite && (
              <span
                className="text-xs"
                style={{
                  color:
                    themeConfig.colors.warning || themeConfig.colors.accent,
                }}
                title="Favorite"
              >
                ⭐
              </span>
            )}

            <span
              className="text-xs px-2 py-0.5 rounded text-white font-medium"
              style={{
                backgroundColor: getCategoryColor(entry.category),
              }}
            >
              {entry.category}
            </span>

            {entry.frequency > 1 && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${themeConfig.colors.info || themeConfig.colors.accent}20`,
                  color: themeConfig.colors.info || themeConfig.colors.accent,
                }}
              >
                ×{entry.frequency}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs opacity-75">
            <span style={{ color: themeConfig.colors.muted }}>
              {formatTimestamp(entry.timestamp)}
            </span>

            {entry.executionTime && (
              <span style={{ color: themeConfig.colors.muted }}>
                {formatExecutionTime(entry.executionTime)}
              </span>
            )}

            <span
              className={`px-1.5 py-0.5 rounded text-xs ${entry.success
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
                }`}
            >
              {entry.success ? "✓" : "✗"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(entry.id);
            }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={
              entry.favorite ? "Remove from favorites" : "Add to favorites"
            }
            style={{ color: themeConfig.colors.muted }}
          >
            {entry.favorite ? "★" : "☆"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeCommand(entry.id);
            }}
            className="p-1 rounded hover:bg-red-500/20 transition-colors"
            title="Remove from history"
            style={{
              color: themeConfig.colors.error || themeConfig.colors.muted,
            }}
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-4">
      { }
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className="p-3 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {analytics.totalCommands}
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Total Commands
          </div>
        </div>

        <div
          className="p-3 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {analytics.uniqueCommands}
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Unique Commands
          </div>
        </div>

        <div
          className="p-3 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{
              color: themeConfig.colors.success || themeConfig.colors.text,
            }}
          >
            {analytics.successRate.toFixed(1)}%
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Success Rate
          </div>
        </div>

        <div
          className="p-3 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {analytics.averageExecutionTime.toFixed(0)}ms
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Avg. Execution
          </div>
        </div>
      </div>

      { }
      <div
        className="p-4 rounded border"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <h4
          className="font-medium mb-3"
          style={{ color: themeConfig.colors.text }}
        >
          🏆 Top Commands
        </h4>
        <div className="space-y-2">
          {analytics.topCommands.slice(0, 5).map((item, index) => (
            <div
              key={item.command}
              className="flex items-center justify-between text-sm"
            >
              <span
                className="font-mono flex-1 truncate"
                style={{ color: themeConfig.colors.text }}
              >
                {index + 1}. {item.command}
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: themeConfig.colors.muted }}>
                  {item.count}x
                </span>
                {item.avgTime > 0 && (
                  <span style={{ color: themeConfig.colors.muted }}>
                    {item.avgTime.toFixed(0)}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      { }
      <div
        className="p-4 rounded border"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <h4
          className="font-medium mb-3"
          style={{ color: themeConfig.colors.text }}
        >
          📊 Commands by Category
        </h4>
        <div className="space-y-2">
          {Object.entries(analytics.commandsByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between text-sm"
              >
                <span
                  className="capitalize"
                  style={{ color: getCategoryColor(category) }}
                >
                  {category}
                </span>
                <span style={{ color: themeConfig.colors.muted }}>
                  {count} commands
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  return (
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      style={{ backgroundColor: `${themeConfig.colors.bg}e6` }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        ref={containerRef}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg border shadow-2xl"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-labelledby="history-panel-title"
        tabIndex={-1}
      >
        { }
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center gap-4">
            <h3
              id="history-panel-title"
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.text }}
            >
              🔍 Command History
            </h3>

            { }
            <div className="flex gap-1">
              {[
                { id: "search", label: "Search", icon: "🔍" },
                { id: "favorites", label: "Favorites", icon: "⭐" },
                { id: "analytics", label: "Analytics", icon: "📊" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${activeTab === tab.id ? "font-medium" : ""
                    }`}
                  style={{
                    backgroundColor:
                      activeTab === tab.id
                        ? `${themeConfig.colors.accent}20`
                        : "transparent",
                    color:
                      activeTab === tab.id
                        ? themeConfig.colors.accent
                        : themeConfig.colors.muted,
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportHistory}
              className="px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                color: themeConfig.colors.muted,
                backgroundColor: "transparent",
              }}
              title="Export history"
            >
              📥
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all command history?")) {
                  clearHistory();
                }
              }}
              className="px-3 py-1.5 rounded text-sm transition-colors hover:bg-red-500/20"
              style={{
                color: themeConfig.colors.error || themeConfig.colors.muted,
              }}
              title="Clear history"
            >
              🗑️
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-sm transition-colors"
              style={{
                color: themeConfig.colors.muted,
                backgroundColor: "transparent",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        { }
        {activeTab === "search" && (
          <div
            className="p-4 border-b space-y-3"
            style={{ borderColor: themeConfig.colors.border }}
          >
            { }
            <input
              ref={searchInputRef}
              type="text"
              value={searchOptions.query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search commands..."
              className="w-full px-4 py-2 rounded border bg-transparent outline-none transition-colors"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            />

            { }
            <div className="flex flex-wrap gap-3">
              <select
                value={searchOptions.category || ""}
                onChange={(e) =>
                  handleFilterChange({
                    category: e.target.value || undefined,
                  })
                }
                className="px-3 py-1.5 rounded border bg-transparent text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={searchOptions.sortBy}
                onChange={(e) =>
                  handleFilterChange({
                    sortBy: e.target.value as HistorySearchOptions["sortBy"],
                  })
                }
                className="px-3 py-1.5 rounded border bg-transparent text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <option value="recent">Recent</option>
                <option value="frequency">Frequency</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="execution_time">Execution Time</option>
              </select>

              <select
                value={searchOptions.timeRange || ""}
                onChange={(e) =>
                  handleFilterChange({
                    timeRange:
                      (e.target.value as HistorySearchOptions["timeRange"]) ||
                      undefined,
                  })
                }
                className="px-3 py-1.5 rounded border bg-transparent text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                  backgroundColor: themeConfig.colors.bg,
                }}
              >
                <option value="">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
          </div>
        )}

        { }
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "search" && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <div
                  className="text-center py-8 opacity-75"
                  style={{ color: themeConfig.colors.muted }}
                >
                  {searchOptions.query
                    ? "No commands found"
                    : "No command history"}
                </div>
              ) : (
                history.map((entry, index) => renderHistoryItem(entry, index))
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <div
                  className="text-center py-8 opacity-75"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No favorite commands yet
                </div>
              ) : (
                favorites.map((entry, index) => renderHistoryItem(entry, index))
              )}
            </div>
          )}

          {activeTab === "analytics" && renderAnalytics()}
        </div>

        { }
        <div
          className="px-4 py-3 border-t text-xs flex items-center justify-between"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          <div>
            Showing {activeTab === "search" ? history.length : favorites.length}{" "}
            of {analytics.totalCommands} commands
          </div>
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Ctrl+F Favorite</span>
            <span>Ctrl+Del Remove</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
