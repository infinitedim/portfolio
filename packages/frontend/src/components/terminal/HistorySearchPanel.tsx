/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import {
  useEnhancedHistory,
  type HistoryItem,
} from "@portfolio/frontend/src/hooks/useEnhancedHistory";

interface HistorySearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (command: string) => void;
}

/**
 * Searchable command history panel with advanced filtering
 * @param {object} props - The properties for the HistorySearchPanel component.
 * @param {boolean} props.isOpen - Whether the panel is open.
 * @param {() => void} props.onClose - Callback function when the panel is closed.
 * @param {(command: string) => void} props.onSelectCommand - Callback function when a command is selected.
 * @returns {JSX.Element|null} The HistorySearchPanel component, or null if not open.
 */
export function HistorySearchPanel({
  isOpen,
  onClose,
  onSelectCommand,
}: HistorySearchPanelProps): JSX.Element | null {
  const { themeConfig } = useTheme();
  const {
    history,
    favorites,
    frequentCommands,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    toggleFavorite,
    clearHistory,
    exportHistory,
    totalCommands,
    successRate,
  } = useEnhancedHistory();

  const [activeTab, setActiveTab] = useState<
    "history" | "favorites" | "frequent"
  >("history");

  if (!isOpen || !themeConfig?.colors) {
    return null;
  }

  const handleCommandSelect = (command: string) => {
    onSelectCommand(command);
    onClose();
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      "day",
    );
  };

  const renderHistoryItem = (item: HistoryItem, index: number) => (
    <button
      key={`${item.command}-${index}`}
      type="button"
      className="group flex items-center justify-between p-3 rounded border transition-all duration-200 hover:opacity-80 cursor-pointer w-full text-left"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: `${themeConfig.colors.bg}40`,
      }}
      onClick={() => handleCommandSelect(item.command)}
      tabIndex={0}
      aria-label={`Command: ${item.command}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleCommandSelect(item.command);
        }
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code
            className="text-sm font-mono font-bold"
            style={{ color: themeConfig.colors.accent }}
          >
            {item.command}
          </code>
          {item.favorite && <span className="text-xs">⭐</span>}
          {item.category && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: `${themeConfig.colors.muted}20`,
                color: themeConfig.colors.muted,
              }}
            >
              {item.category}
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-3 text-xs"
          style={{ color: themeConfig.colors.muted }}
        >
          <span>{formatDate(item.timestamp)}</span>
          <span
            className={`w-2 h-2 rounded-full ${item.success ? "bg-green-500" : "bg-red-500"}`}
          />
          {item.executionTime && <span>{item.executionTime.toFixed(0)}ms</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(item.command);
          }}
          className="p-1 rounded hover:bg-opacity-20"
          style={{ backgroundColor: `${themeConfig.colors.accent}10` }}
        >
          {item.favorite ? "⭐" : "☆"}
        </button>
      </div>
    </button>
  );

  const renderFrequentItem = (item: { command: string; count: number }) => (
    <button
      key={item.command}
      type="button"
      className="flex items-center justify-between p-3 rounded border transition-all duration-200 hover:opacity-80 cursor-pointer w-full text-left"
      style={{
        borderColor: themeConfig.colors.border,
        backgroundColor: `${themeConfig.colors.bg}40`,
      }}
      onClick={() => handleCommandSelect(item.command)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCommandSelect(item.command);
        }
      }}
    >
      <code
        className="text-sm font-mono"
        style={{ color: themeConfig.colors.accent }}
      >
        {item.command}
      </code>
      <span
        className="text-xs px-2 py-1 rounded"
        style={{
          backgroundColor: `${themeConfig.colors.accent}20`,
          color: themeConfig.colors.accent,
        }}
      >
        {item.count}x
      </span>
    </button>
  );

  // Accessibility and lint fix:
  // - Remove duplicate tabIndex and onKeyDown
  // - Remove role/button from non-interactive div
  // - Move close logic to overlay, not modal content
  // - Only handle Escape on overlay for closing

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: `${themeConfig.colors.bg}80` }}
      aria-modal="true"
      aria-label="Close history search panel"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      onClick={onClose}
      role="dialog"
    >
      <div
        className="w-full max-w-4xl max-h-[80vh] rounded-lg border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
        }}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <div
          className="p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              📚 Command History
            </h2>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-60 transition-opacity"
              style={{ color: themeConfig.colors.text }}
            >
              ✕
            </button>
          </div>

          {/* Search and filters */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded border bg-transparent font-mono"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            />

            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-1 rounded border bg-transparent text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              >
                {categories.map((cat) => (
                  <option
                    key={cat}
                    value={cat}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as "recent" | "frequency" | "alphabetical",
                  )
                }
                className="px-2 py-1 rounded border bg-transparent text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              >
                <option value="recent">Recent</option>
                <option value="frequency">Frequency</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div
            className="flex gap-4 mt-3 text-sm"
            style={{ color: themeConfig.colors.muted }}
          >
            <span>📊 {totalCommands} commands</span>
            <span>✅ {successRate.toFixed(1)}% success rate</span>
            <span>⭐ {favorites.length} favorites</span>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          {[
            { id: "history", label: "📝 Recent", count: history.length },
            { id: "favorites", label: "⭐ Favorites", count: favorites.length },
            {
              id: "frequent",
              label: "🔥 Frequent",
              count: frequentCommands.length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 font-mono text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                color:
                  activeTab === tab.id
                    ? themeConfig.colors.accent
                    : themeConfig.colors.text,
                borderBottom:
                  activeTab === tab.id
                    ? `2px solid ${themeConfig.colors.accent}`
                    : "2px solid transparent",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-96">
          {activeTab === "history" && (
            <div className="space-y-2">
              {history.length === 0 ? (
                <p
                  className="text-center py-8"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No commands in history
                </p>
              ) : (
                history.map(renderHistoryItem)
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="space-y-2">
              {favorites.length === 0 ? (
                <p
                  className="text-center py-8"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No favorite commands yet
                </p>
              ) : (
                favorites.map(renderHistoryItem)
              )}
            </div>
          )}

          {activeTab === "frequent" && (
            <div className="space-y-2">
              {frequentCommands.length === 0 ? (
                <p
                  className="text-center py-8"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No frequent commands yet
                </p>
              ) : (
                frequentCommands.map(renderFrequentItem)
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t flex justify-between"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex gap-2">
            <button
              onClick={exportHistory}
              className="px-3 py-1 rounded border text-sm hover:opacity-80 transition-opacity"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              📤 Export
            </button>
            <button
              onClick={() => {
                if (confirm("Clear all command history?")) {
                  clearHistory();
                }
              }}
              className="px-3 py-1 rounded border text-sm hover:opacity-80 transition-opacity"
              style={{
                borderColor:
                  themeConfig.colors.error || themeConfig.colors.border,
                color: themeConfig.colors.error || themeConfig.colors.text,
              }}
            >
              🗑️ Clear
            </button>
          </div>
          <div
            className="text-xs"
            style={{ color: themeConfig.colors.muted }}
          >
            Use Ctrl+H to open this panel
          </div>
        </div>
      </div>
    </div>
  );
}
