"use client";

import { useState, useEffect, useRef, useMemo, type JSX } from "react";
import { useTheme } from "@/hooks/useTheme";
import { CommandOutput } from "./CommandOutput";
import { type TerminalHistory } from "@/types/terminal";

interface VirtualizedTerminalHistoryProps {
  history: TerminalHistory[];
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

/**
 * Virtualized terminal history component for optimal performance with large histories
 * Only renders visible items plus a small buffer
 * @param {VirtualizedTerminalHistoryProps} props - The props for the VirtualizedTerminalHistory component
 * @param {TerminalHistory[]} props.history - The history of the terminal
 * @param {number} props.itemHeight - The height of each item
 * @param {number} props.containerHeight - The height of the container
 * @param {number} props.overscan - The number of items to overscan
 * @returns {JSX.Element} The VirtualizedTerminalHistory component
 */
export function VirtualizedTerminalHistory({
  history,
  itemHeight = 120,
  containerHeight = 600,
  overscan = 5,
}: VirtualizedTerminalHistoryProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const { startIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(history.length, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      visibleItems: history.slice(start, end),
    };
  }, [history, scrollTop, itemHeight, containerHeight, overscan]);

  useEffect(() => {
    if (shouldAutoScroll && containerRef.current) {
      const scrollContainer = containerRef.current;
      const isNearBottom =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 100;

      if (isNearBottom) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history.length, shouldAutoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    const isNearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 100;
    setShouldAutoScroll(isNearBottom);
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${containerHeight}px`;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [containerHeight]);

  const totalHeight = history.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className="virtual-terminal-history relative overflow-auto"
      style={{
        height: containerHeight,
        backgroundColor: themeConfig.colors.bg,
        scrollbarWidth: "thin",
        scrollbarColor: `${themeConfig.colors.accent} ${themeConfig.colors.bg}`,
      }}
      onScroll={handleScroll}
    >
      {}
      <div style={{ height: totalHeight, position: "relative" }}>
        {}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={`${actualIndex}-${item.input}-${item.timestamp.getTime()}`}
                className="virtual-history-item"
                style={{
                  minHeight: itemHeight,
                  padding: "12px 0",
                  borderBottom: `1px solid ${themeConfig.colors.border}20`,
                }}
              >
                {}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="font-mono text-sm"
                    style={{ color: themeConfig.colors.prompt }}
                  >
                    [{actualIndex + 1}]
                  </span>
                  <span
                    className="font-mono"
                    style={{ color: themeConfig.colors.accent }}
                  >
                    $
                  </span>
                  <span
                    className="font-mono"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {item.input}
                  </span>
                  <span
                    className="text-xs opacity-50 ml-auto"
                    style={{ color: themeConfig.colors.text }}
                  >
                    {item.timestamp.toLocaleTimeString()}
                  </span>
                </div>

                {}
                {item.output && (
                  <div className="ml-6">
                    <CommandOutput output={item.output} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {}
      {history.length > 10 && (
        <div
          className="absolute bottom-4 right-4 px-2 py-1 rounded text-xs font-mono opacity-60"
          style={{
            backgroundColor: `${themeConfig.colors.bg}dd`,
            color: themeConfig.colors.text,
            border: `1px solid ${themeConfig.colors.border}`,
            backdropFilter: "blur(4px)",
          }}
        >
          {Math.floor(((scrollTop + containerHeight) / totalHeight) * 100)}%
        </div>
      )}

      {}
      {process.env.NODE_ENV === "development" && (
        <div
          className="absolute top-4 right-4 px-2 py-1 rounded text-xs font-mono opacity-40"
          style={{
            backgroundColor: `${themeConfig.colors.bg}dd`,
            color: themeConfig.colors.text,
            border: `1px solid ${themeConfig.colors.border}`,
            backdropFilter: "blur(4px)",
          }}
        >
          Rendering {visibleItems.length}/{history.length} items
        </div>
      )}
    </div>
  );
}
