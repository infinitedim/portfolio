"use client";

import { useTheme } from "@/hooks/useTheme";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { CommandOutput } from "./CommandOutput";
import type { TerminalHistory as TerminalHistoryType } from "@/types/terminal";
import { type JSX } from "react";

interface TerminalHistoryProps {
  history: TerminalHistoryType[];
}

/**
 * Renders the history of commands and their outputs in the terminal.
 * @param {TerminalHistoryProps} props - The properties for the TerminalHistory component.
 * @param {TerminalHistoryType[]} props.history - An array of terminal history objects.
 * @returns {JSX.Element | null} A component displaying the history, or null if history is empty.
 */
export function TerminalHistory({
  history,
}: TerminalHistoryProps): JSX.Element | null {
  const { theme, themeConfig } = useTheme();
  const { isReducedMotion } = useAccessibility();

  if (history.length === 0) {
    return null;
  }

  return (
    <div
      key={`terminal-history-${theme}`}
      className="space-y-4 terminal-history"
      role="log"
      aria-label="Command history"
    >
      {history.map((entry, index) => (
        <div
          key={`${index}-${theme}`}
          className={`${!isReducedMotion ? "fade-in" : ""}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Command Input Display */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-bold"
              style={{ color: themeConfig.colors.prompt }}
              aria-hidden="true"
            >
              $
            </span>
            <span
              className="font-mono"
              style={{ color: themeConfig.colors.text }}
            >
              {entry.input}
            </span>
          </div>

          {/* Command Output */}
          {entry.output && (
            <div className="ml-4 mb-4">
              <CommandOutput output={entry.output} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
