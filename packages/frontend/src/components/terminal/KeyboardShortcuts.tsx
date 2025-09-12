"use client";

import { useEffect } from "react";

interface KeyboardShortcutsProps {
  onClear: () => void;
  onHelp: () => void;
  onThemeToggle: () => void;
}

/**
 * Handles global keyboard shortcuts for the terminal application.
 * @param {KeyboardShortcutsProps} props - The properties for the KeyboardShortcuts component.
 * @param {() => void} props.onClear - The function to call when the 'clear' shortcut (Ctrl+L) is triggered.
 * @param {() => void} props.onHelp - The function to call when the 'help' shortcut (Ctrl+H or F1) is triggered.
 * @param {() => void} props.onThemeToggle - The function to call when the 'theme toggle' shortcut (Ctrl+T) is triggered.
 * @returns {null} - This component does not render anything, it only handles events.
 */
export function KeyboardShortcuts({
  onClear,
  onHelp,
  onThemeToggle,
}: KeyboardShortcutsProps): null {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in input
      if (e.target instanceof HTMLInputElement) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "l":
            e.preventDefault();
            onClear();
            break;
          case "h":
            e.preventDefault();
            onHelp();
            break;
          case "t":
            e.preventDefault();
            onThemeToggle();
            break;
        }
      }

      // Function keys
      switch (e.key) {
        case "F1":
          e.preventDefault();
          onHelp();
          break;
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onClear, onHelp, onThemeToggle]);

  return null; // This component only handles events
}
