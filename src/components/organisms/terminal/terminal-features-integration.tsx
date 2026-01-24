"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useCommandHistory } from "@/hooks/use-command-history";
import { useTerminalShortcuts } from "@/hooks/use-terminal-shortcuts";
import { HistorySearchPanel } from "@/components/molecules/terminal/history-search-panel";
import { KeyboardShortcut } from "@/components/molecules/terminal/keyboard-shortcuts";

interface AdvancedTerminalFeaturesIntegrationProps {
  onCommandExecute?: (command: string) => void;
  onClear?: () => void;
  onHelp?: () => void;
  onThemeToggle?: () => void;
  className?: string;
}

/**
 * Comprehensive integration of advanced terminal features:
 * - Enhanced command history with search and analytics
 * - Customizable keyboard shortcuts
 * - Real-time performance monitoring
 */
export function AdvancedTerminalFeaturesIntegration({
  onCommandExecute,
  onClear,
  onHelp,
  onThemeToggle,
  className = "",
}: AdvancedTerminalFeaturesIntegrationProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const [demoCommands] = useState([
    "help",
    "about",
    "skills",
    "projects",
    "experience",
    "education",
    "contact",
    "theme",
    "clear",
    "demo",
    "github",
    "linkedin",
  ]);

  const {
    addCommand,
    analytics,
    clearHistory: _clearHistory,
    exportHistory,
    totalCommands,
  } = useCommandHistory();

  const { shortcuts, updateShortcutKeys, exportShortcuts, resetToDefaults } =
    useTerminalShortcuts({
      onClear,
      onHelp,
      onThemeToggle,
      onHistoryOpen: () => setShowHistoryPanel(true),
      onShortcutsOpen: () => setShowShortcutsPanel(true),
      onCommandExecute,
    });

  const handleCommandExecuted = (
    command: string,
    success = true,
    executionTime?: number,
  ) => {
    addCommand(command, success, executionTime);
    onCommandExecute?.(command);
  };

  const simulateCommandUsage = () => {
    const testCommands = [
      { cmd: "help", time: 45 },
      { cmd: "about", time: 120 },
      { cmd: "skills", time: 89 },
      { cmd: "projects", time: 156 },
      { cmd: "clear", time: 12 },
      { cmd: "theme", time: 67 },
      { cmd: "github", time: 234 },
      { cmd: "experience", time: 178 },
    ];

    testCommands.forEach(({ cmd, time }, index) => {
      setTimeout(() => {
        addCommand(cmd, Math.random() > 0.1, time + Math.random() * 50);
      }, index * 200);
    });
  };

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {}
      <div className="text-center">
        <h2
          className="text-3xl font-bold mb-2"
          style={{ color: themeConfig.colors.accent }}
        >
          🚀 Advanced Terminal Features
        </h2>
        <p
          className="text-sm opacity-75"
          style={{ color: themeConfig.colors.muted }}
        >
          Enhanced command history, search, analytics, and customizable keyboard
          shortcuts
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {totalCommands}
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Total Commands
          </div>
        </div>

        <div
          className="p-4 rounded border text-center"
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
          className="p-4 rounded border text-center"
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

        <div
          className="p-4 rounded border text-center"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {shortcuts.filter((s) => s.enabled).length}
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Active Shortcuts
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {}
        <div
          className="p-6 rounded border"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.text }}
            >
              🔍 Command History & Search
            </h3>
            <button
              type="button"
              onClick={() => setShowHistoryPanel(true)}
              className="px-3 py-1.5 rounded border text-sm transition-colors hover:opacity-80"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
                backgroundColor: "transparent",
              }}
            >
              Open Panel
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: themeConfig.colors.muted }}>
                Recent Commands
              </span>
              <span style={{ color: themeConfig.colors.accent }}>
                {analytics.topCommands.length} tracked
              </span>
            </div>

            <div className="space-y-2">
              {analytics.topCommands.slice(0, 3).map((item: { command: string; count: number }, index: number) => (
                <div
                  key={item.command}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ backgroundColor: `${themeConfig.colors.bg}40` }}
                >
                  <span
                    className="font-mono text-sm"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {index + 1}. {item.command}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: themeConfig.colors.muted }}>
                      {item.count}x
                    </span>
                    <span style={{ color: themeConfig.colors.muted }}>
                      {item.count} times
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={simulateCommandUsage}
                className="px-3 py-1.5 rounded border text-xs transition-colors"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.muted,
                  backgroundColor: "transparent",
                }}
              >
                📊 Simulate Usage
              </button>
              <button
                type="button"
                onClick={exportHistory}
                className="px-3 py-1.5 rounded border text-xs transition-colors"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.muted,
                  backgroundColor: "transparent",
                }}
              >
                💾 Export
              </button>
            </div>
          </div>
        </div>

        {}
        <div
          className="p-6 rounded border"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.text }}
            >
              ⌨️ Keyboard Shortcuts
            </h3>
            <button
              type="button"
              onClick={() => setShowShortcutsPanel(true)}
              className="px-3 py-1.5 rounded border text-sm transition-colors hover:opacity-80"
              style={{
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
                backgroundColor: "transparent",
              }}
            >
              Customize
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: themeConfig.colors.muted }}>
                Available Shortcuts
              </span>
              <span style={{ color: themeConfig.colors.accent }}>
                {shortcuts.filter((s) => s.enabled).length} active
              </span>
            </div>

            <div className="space-y-2">
              {shortcuts
                .filter((s) => s.category !== "help")
                .slice(0, 4)
                .map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ backgroundColor: `${themeConfig.colors.bg}40` }}
                  >
                    <span
                      className="text-sm"
                      style={{ color: themeConfig.colors.text }}
                    >
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key: string, index: number) => (
                        <span key={`${key}-${index}`}>
                          <kbd
                            className="px-1.5 py-0.5 text-xs font-mono rounded border"
                            style={{
                              backgroundColor: `${themeConfig.colors.muted}20`,
                              borderColor: themeConfig.colors.border,
                              color: themeConfig.colors.text,
                            }}
                          >
                            {key}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
                            <span
                              className="mx-1 text-xs"
                              style={{ color: themeConfig.colors.muted }}
                            >
                              +
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportShortcuts}
                className="px-3 py-1.5 rounded border text-xs transition-colors"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.muted,
                  backgroundColor: "transparent",
                }}
              >
                💾 Export
              </button>
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-1.5 rounded border text-xs transition-colors"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.muted,
                  backgroundColor: "transparent",
                }}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div
        className="p-6 rounded border"
        style={{ borderColor: themeConfig.colors.accent }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: themeConfig.colors.accent }}
        >
          🧪 Interactive Demo
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4
              className="font-medium"
              style={{ color: themeConfig.colors.text }}
            >
              Try These Commands:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {demoCommands.slice(0, 8).map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() =>
                    handleCommandExecuted(cmd, true, Math.random() * 200 + 50)
                  }
                  className="px-3 py-2 rounded border text-sm font-mono transition-colors hover:opacity-80"
                  style={{
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                    backgroundColor: `${themeConfig.colors.bg}40`,
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4
              className="font-medium"
              style={{ color: themeConfig.colors.text }}
            >
              Test Keyboard Shortcuts:
            </h4>
            <div className="text-sm space-y-2">
              <div
                className="flex items-center justify-between"
                style={{ color: themeConfig.colors.muted }}
              >
                <span>Open History</span>
                <kbd
                  className="px-2 py-1 rounded border font-mono"
                  style={{
                    backgroundColor: `${themeConfig.colors.muted}20`,
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  Ctrl+R
                </kbd>
              </div>
              <div
                className="flex items-center justify-between"
                style={{ color: themeConfig.colors.muted }}
              >
                <span>Show Shortcuts</span>
                <kbd
                  className="px-2 py-1 rounded border font-mono"
                  style={{
                    backgroundColor: `${themeConfig.colors.muted}20`,
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  Ctrl+?
                </kbd>
              </div>
              <div
                className="flex items-center justify-between"
                style={{ color: themeConfig.colors.muted }}
              >
                <span>Clear Terminal</span>
                <kbd
                  className="px-2 py-1 rounded border font-mono"
                  style={{
                    backgroundColor: `${themeConfig.colors.muted}20`,
                    borderColor: themeConfig.colors.border,
                  }}
                >
                  Ctrl+L
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div
        className="p-4 rounded border bg-opacity-5"
        style={{
          borderColor: themeConfig.colors.accent,
          backgroundColor: themeConfig.colors.accent,
        }}
      >
        <h4
          className="font-medium mb-3"
          style={{ color: themeConfig.colors.accent }}
        >
          ✨ Enhanced Features
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>🔍</span>
            <span>Advanced fuzzy search with filtering</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>📊</span>
            <span>Real-time usage analytics and insights</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>⭐</span>
            <span>Favorite commands for quick access</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>⌨️</span>
            <span>Fully customizable keyboard shortcuts</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>💾</span>
            <span>Export/import configurations</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>🚀</span>
            <span>High-performance with smart caching</span>
          </div>
        </div>
      </div>

      {}
      <HistorySearchPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onSelectCommand={handleCommandExecuted}
      />

      <KeyboardShortcut
        isOpen={showShortcutsPanel}
        onClose={() => setShowShortcutsPanel(false)}
        shortcuts={shortcuts}
        onShortcutChange={updateShortcutKeys}
      />
    </div>
  );
}
