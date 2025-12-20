"use client";

import { useState, useEffect, useCallback } from "react";
import { useCommandHistory } from "./useCommandHistory";
import type { KeyboardShortcut } from "../components/terminal/KeyboardShortcuts";

interface UseTerminalShortcutsOptions {
  onClear?: () => void;
  onHelp?: () => void;
  onThemeToggle?: () => void;
  onHistoryOpen?: () => void;
  onShortcutsOpen?: () => void;
  onCommandExecute?: (command: string) => void;
}

/**
 * Enhanced terminal shortcuts management hook with customization and persistence
 *
 * Provides comprehensive keyboard shortcut functionality:
 * - Pre-defined terminal shortcuts (clear, help, history, etc.)
 * - Customizable shortcut keys
 * - Import/export shortcut configurations
 * - Search and suggestion features
 * - localStorage persistence
 * - Global keyboard event handling
 *
 * @param {UseTerminalShortcutsOptions} [options] - Configuration callbacks
 * @param {Function} [options.onClear] - Callback for clear shortcut
 * @param {Function} [options.onHelp] - Callback for help shortcut
 * @param {Function} [options.onThemeToggle] - Callback for theme toggle
 * @param {Function} [options.onHistoryOpen] - Callback for history panel
 * @param {Function} [options.onShortcutsOpen] - Callback for shortcuts panel
 * @param {Function} [options.onCommandExecute] - Callback to execute commands
 *
 * @returns {object} Shortcuts state and management functions
 * @property {KeyboardShortcut[]} shortcuts - Array of all shortcut definitions
 * @property {Function} updateShortcutKeys - Update keys for a specific shortcut
 * @property {Function} getShortcutSuggestions - Search shortcuts by query
 * @property {Function} resetToDefaults - Reset all shortcuts to defaults
 * @property {Function} exportShortcuts - Export config as JSON file
 * @property {Function} importShortcuts - Import config from JSON file
 * @property {Record<string, string[]>} customShortcuts - Current custom key mappings
 *
 * @example
 * ```tsx
 * const {
 *   shortcuts,
 *   updateShortcutKeys,
 *   exportShortcuts,
 *   resetToDefaults
 * } = useTerminalShortcuts({
 *   onClear: () => terminal.clear(),
 *   onHelp: () => terminal.execute('help'),
 *   onCommandExecute: (cmd) => terminal.execute(cmd)
 * });
 *
 * // Customize a shortcut
 * updateShortcutKeys('clear-terminal', ['Ctrl', 'K']);
 *
 * // Export configuration
 * exportShortcuts();
 *
 * // Reset to defaults
 * resetToDefaults();
 * ```
 */
export function useTerminalShortcuts({
  onClear,
  onHelp,
  onThemeToggle,
  onHistoryOpen,
  onShortcutsOpen,
  onCommandExecute,
}: UseTerminalShortcutsOptions = {}) {
  const { getSuggestions: _getSuggestions } = useCommandHistory();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [customShortcuts, setCustomShortcuts] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("terminal-custom-shortcuts");
      if (saved) {
        setCustomShortcuts(JSON.parse(saved));
      }
    } catch (error) {
      console.warn("Failed to load custom shortcuts:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "terminal-custom-shortcuts",
        JSON.stringify(customShortcuts),
      );
    } catch (error) {
      console.warn("Failed to save custom shortcuts:", error);
    }
  }, [customShortcuts]);

  useEffect(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      {
        id: "clear-terminal",
        keys: customShortcuts["clear-terminal"] || ["Ctrl", "L"],
        description: "Clear terminal output",
        category: "navigation",
        action: () => onClear?.(),
        enabled: true,
        customizable: true,
      },
      {
        id: "show-help",
        keys: customShortcuts["show-help"] || ["Ctrl", "H"],
        description: "Show help information",
        category: "navigation",
        action: () => onHelp?.(),
        enabled: true,
        customizable: true,
      },
      {
        id: "show-help-f1",
        keys: customShortcuts["show-help-f1"] || ["F1"],
        description: "Show help (alternative)",
        category: "navigation",
        action: () => onHelp?.(),
        enabled: true,
        customizable: true,
      },

      {
        id: "open-history",
        keys: customShortcuts["open-history"] || ["Ctrl", "R"],
        description: "Open command history search",
        category: "terminal",
        action: () => onHistoryOpen?.(),
        enabled: true,
        customizable: true,
      },
      {
        id: "open-shortcuts",
        keys: customShortcuts["open-shortcuts"] || ["Ctrl", "?"],
        description: "Show keyboard shortcuts",
        category: "terminal",
        action: () => onShortcutsOpen?.(),
        enabled: true,
        customizable: true,
      },
      {
        id: "quick-command-help",
        keys: customShortcuts["quick-command-help"] || ["Ctrl", "Shift", "H"],
        description: "Quick help command",
        category: "terminal",
        action: () => onCommandExecute?.("help"),
        enabled: true,
        customizable: true,
      },
      {
        id: "quick-command-clear",
        keys: customShortcuts["quick-command-clear"] || ["Ctrl", "Shift", "C"],
        description: "Quick clear command",
        category: "terminal",
        action: () => onCommandExecute?.("clear"),
        enabled: true,
        customizable: true,
      },

      {
        id: "toggle-theme",
        keys: customShortcuts["toggle-theme"] || ["Ctrl", "T"],
        description: "Toggle theme",
        category: "customization",
        action: () => onThemeToggle?.(),
        enabled: true,
        customizable: true,
      },

      {
        id: "quick-about",
        keys: customShortcuts["quick-about"] || ["Ctrl", "I"],
        description: "Show about information",
        category: "system",
        action: () => onCommandExecute?.("about"),
        enabled: true,
        customizable: true,
      },
      {
        id: "quick-skills",
        keys: customShortcuts["quick-skills"] || ["Ctrl", "S"],
        description: "Show skills",
        category: "system",
        action: () => onCommandExecute?.("skills"),
        enabled: true,
        customizable: true,
      },
      {
        id: "quick-projects",
        keys: customShortcuts["quick-projects"] || ["Ctrl", "P"],
        description: "Show projects",
        category: "system",
        action: () => onCommandExecute?.("projects"),
        enabled: true,
        customizable: true,
      },

      {
        id: "escape-close",
        keys: ["Escape"],
        description: "Close panels/cancel operations",
        category: "help",
        action: () => {},
        enabled: true,
        customizable: false,
      },
      {
        id: "arrow-navigation",
        keys: ["↑", "↓"],
        description: "Navigate through lists",
        category: "help",
        action: () => {},
        enabled: true,
        customizable: false,
      },
      {
        id: "enter-select",
        keys: ["Enter"],
        description: "Select/execute highlighted item",
        category: "help",
        action: () => {},
        enabled: true,
        customizable: false,
      },
    ];

    setShortcuts(defaultShortcuts);
  }, [
    customShortcuts,
    onClear,
    onHelp,
    onThemeToggle,
    onHistoryOpen,
    onShortcutsOpen,
    onCommandExecute,
  ]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const pressedKeys: string[] = [];

      if (e.ctrlKey) pressedKeys.push("Ctrl");
      if (e.altKey) pressedKeys.push("Alt");
      if (e.shiftKey) pressedKeys.push("Shift");
      if (e.metaKey) pressedKeys.push("Meta");

      let mainKey = e.key;
      if (mainKey === " ") mainKey = "Space";
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      pressedKeys.push(mainKey);

      const matchingShortcut = shortcuts.find((shortcut) => {
        if (!shortcut.enabled) return false;

        const shortcutKeys = shortcut.keys.map((k) =>
          k === " " ? "Space" : k,
        );

        return (
          shortcutKeys.length === pressedKeys.length &&
          shortcutKeys.every((key, index) => key === pressedKeys[index])
        );
      });

      if (matchingShortcut) {
        e.preventDefault();
        e.stopPropagation();
        matchingShortcut.action();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [shortcuts]);

  const updateShortcutKeys = useCallback(
    (shortcutId: string, newKeys: string[]) => {
      setCustomShortcuts((prev) => ({
        ...prev,
        [shortcutId]: newKeys,
      }));
    },
    [],
  );

  const getShortcutSuggestions = useCallback(
    (query: string) => {
      return shortcuts
        .filter(
          (shortcut) =>
            shortcut.description.toLowerCase().includes(query.toLowerCase()) ||
            shortcut.keys.some((key) =>
              key.toLowerCase().includes(query.toLowerCase()),
            ),
        )
        .slice(0, 5)
        .map((shortcut) => ({
          command: shortcut.description,
          keys: shortcut.keys.join("+"),
          action: shortcut.action,
        }));
    },
    [shortcuts],
  );

  const resetToDefaults = useCallback(() => {
    setCustomShortcuts({});
    localStorage.removeItem("terminal-custom-shortcuts");
  }, []);

  const exportShortcuts = useCallback(() => {
    const config = {
      shortcuts: customShortcuts,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terminal-shortcuts-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [customShortcuts]);

  const importShortcuts = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);

        if (imported.shortcuts && typeof imported.shortcuts === "object") {
          setCustomShortcuts(imported.shortcuts);
        }
      } catch (error) {
        console.error("Failed to import shortcuts:", error);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    shortcuts,
    updateShortcutKeys,
    getShortcutSuggestions,
    resetToDefaults,
    exportShortcuts,
    importShortcuts,
    customShortcuts,
  };
}
