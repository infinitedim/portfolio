/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState, useMemo, JSX } from "react";
import type { TerminalHistory } from "@portfolio/frontend/src/types/terminal";
import { CommandOutput } from "./CommandOutput";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

interface VirtualizedHistoryProps {
  history: TerminalHistory[];
  prompt?: string;
  maxVisibleItems?: number;
}

/**
 * Renders the terminal command history using virtualization for improved performance.
 * @param {VirtualizedHistoryProps} props - The properties for the VirtualizedHistory component.
 * @param {TerminalHistory[]} props.history - The list of terminal history entries.
 * @param {string} [props.prompt] - The prompt to display next to each command.
 * @param {number} [props.maxVisibleItems] - The maximum number of history items to render at once.
 * @returns {JSX.Element} - A component that renders the terminal history.
 */
export function VirtualizedHistory({
  history,
  prompt = "$",
  maxVisibleItems = 50,
}: VirtualizedHistoryProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: maxVisibleItems,
  });

  // Only show recent items for performance
  const visibleHistory = useMemo(() => {
    if (history.length <= maxVisibleItems) return history;

    const start = Math.max(0, history.length - maxVisibleItems);
    return history.slice(start);
  }, [history, maxVisibleItems]);

  // Auto-scroll optimization
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const shouldScroll =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 100;

      if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [visibleHistory]);

  return (
    <div
      key={`virtualized-history-${theme}`}
      ref={containerRef}
      className="space-y-4 max-h-[70vh] overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: `${themeConfig.colors.border} transparent`,
      }}
    >
      {visibleHistory.length > maxVisibleItems && (
        <div
          className="text-xs opacity-60 text-center py-2 border-b"
          style={{
            color: themeConfig.colors.text,
            borderColor: themeConfig.colors.border,
          }}
        >
          ... {history.length - maxVisibleItems} earlier commands hidden for
          performance
        </div>
      )}

      {visibleHistory.map((entry, index) => (
        <div
          key={`${entry.timestamp.getTime()}-${index}`}
          className="space-y-2"
        >
          {/* Command input display */}
          <div className="flex items-center gap-2 font-mono">
            <span style={{ color: themeConfig.colors.prompt }}>{prompt}</span>
            <span style={{ color: themeConfig.colors.text }}>
              {entry.input}
            </span>
          </div>

          {/* Command output */}
          <div className="ml-4">
            <CommandOutput output={entry.output} />
          </div>
        </div>
      ))}
    </div>
  );
}
