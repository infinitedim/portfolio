/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState, useMemo, JSX } from "react";
import type { TerminalHistory } from "@/types/terminal";
import { CommandOutput } from "@/components/molecules/terminal/command-output";
import { useTheme } from "@/hooks/use-theme";

/**
 * Props for the VirtualizedHistory component
 * @interface VirtualizedHistoryProps
 * @property {TerminalHistory[]} history - Array of history entries
 * @property {string} [prompt] - Command prompt string
 * @property {number} [maxVisibleItems] - Maximum items to render
 */
interface VirtualizedHistoryProps {
  history: TerminalHistory[];
  prompt?: string;
  maxVisibleItems?: number;
}

/**
 * Virtualized terminal history component for performance optimization
 * Renders only visible history items to handle large command histories efficiently
 * @param {VirtualizedHistoryProps} props - Component props
 * @param {TerminalHistory[]} props.history - History entries
 * @param {string} [props.prompt="$"] - Command prompt
 * @param {number} [props.maxVisibleItems=50] - Max visible items
 * @returns {JSX.Element} The virtualized history display
 * @example
 * ```tsx
 * <VirtualizedHistory
 *   history={commandHistory}
 *   prompt=">"
 *   maxVisibleItems={100}
 * />
 * ```
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

  const visibleHistory = useMemo(() => {
    if (history.length <= maxVisibleItems) return history;

    const start = Math.max(0, history.length - maxVisibleItems);
    return history.slice(start);
  }, [history, maxVisibleItems]);

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
          { }
          <div className="flex items-center gap-2 font-mono">
            <span style={{ color: themeConfig.colors.prompt }}>{prompt}</span>
            <span style={{ color: themeConfig.colors.text }}>
              {entry.input}
            </span>
          </div>

          { }
          <div className="ml-4">
            <CommandOutput output={entry.output} />
          </div>
        </div>
      ))}
    </div>
  );
}
