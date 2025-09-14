"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdvancedCommandHistory } from "./useCommandHistory";
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
 * Enhanced terminal shortcuts hook with history integration
 */
export function useTerminalShortcuts({
  onClear,
  onHelp,
  onThemeToggle,
  onHistoryOpen,
  onShortcutsOpen,
  onCommandExecute,
}: UseTerminalShortcutsOptions = {}) {
  const { getSuggestions: _getSuggestions } = useAdvancedCommandHistory();
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [customShortcuts, setCustomShortcuts] = useState<
    Record<string, string[]>
  >({});

  // Load custom shortcuts from localStorage
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

  // Save custom shortcuts to localStorage
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

  // Initialize default shortcuts
  useEffect(() => {
    const defaultShortcuts: KeyboardShortcut[] = [
      // Navigation
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

      // Terminal
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

      // Customization
      {
        id: "toggle-theme",
        keys: customShortcuts["toggle-theme"] || ["Ctrl", "T"],
        description: "Toggle theme",
        category: "customization",
        action: () => onThemeToggle?.(),
        enabled: true,
        customizable: true,
      },

      // System
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

      // Help shortcuts
      {
        id: "escape-close",
        keys: ["Escape"],
        description: "Close panels/cancel operations",
        category: "help",
        action: () => {}, // Handled by individual components
        enabled: true,
        customizable: false,
      },
      {
        id: "arrow-navigation",
        keys: ["↑", "↓"],
        description: "Navigate through lists",
        category: "help",
        action: () => {}, // Handled by individual components
        enabled: true,
        customizable: false,
      },
      {
        id: "enter-select",
        keys: ["Enter"],
        description: "Select/execute highlighted item",
        category: "help",
        action: () => {}, // Handled by individual components
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

  // Handle global keyboard events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input fields
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

      // Add the main key
      let mainKey = e.key;
      if (mainKey === " ") mainKey = "Space";
      if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

      pressedKeys.push(mainKey);

      // Find matching shortcut
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

  // Update shortcut keys
  const updateShortcutKeys = useCallback(
    (shortcutId: string, newKeys: string[]) => {
      setCustomShortcuts((prev) => ({
        ...prev,
        [shortcutId]: newKeys,
      }));
    },
    [],
  );

  // Get shortcut suggestions based on input
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

  // Reset all shortcuts to defaults
  const resetToDefaults = useCallback(() => {
    setCustomShortcuts({});
    localStorage.removeItem("terminal-custom-shortcuts");
  }, []);

  // Export shortcuts configuration
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

  // Import shortcuts configuration
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
