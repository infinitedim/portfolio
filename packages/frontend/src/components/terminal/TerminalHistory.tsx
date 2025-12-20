"use client";

import { useTheme } from "@/hooks/useTheme";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { CommandOutput } from "./CommandOutput";
import type { TerminalHistory as TerminalHistoryType } from "@/types/terminal";
import { type JSX } from "react";

/**
 * Props for the TerminalHistory component
 * @interface TerminalHistoryProps
 * @property {TerminalHistoryType[]} history - Array of terminal history entries
 */
interface TerminalHistoryProps {
  history: TerminalHistoryType[];
}

/**
 * Renders the command history with outputs in the terminal
 * Displays all executed commands and their results with proper formatting
 * @param {TerminalHistoryProps} props - Component props
 * @param {TerminalHistoryType[]} props.history - Array of history entries
 * @returns {JSX.Element | null} The history display or null if empty
 * @example
 * ```tsx
 * <TerminalHistory history={[
 *   { input: 'help', output: { type: 'info', content: 'Available commands...' }}
 * ]} />
 * ```
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
          { }
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

          { }
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
