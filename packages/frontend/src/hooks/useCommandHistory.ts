/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";

interface UseCommandHistoryOptions {
  maxHistorySize?: number;
  persistKey?: string;
  enableCompression?: boolean;
}

interface SerializedCommandEntry {
  command: string;
  timestamp: string;
  success: boolean;
}

/**
 * A custom React hook for managing command history with persistence.
 *
 * This hook provides state and functions for adding, navigating, searching,
 * and clearing a list of commands. It also persists the history to
 * `localStorage` to maintain it across sessions.
 * @param {UseCommandHistoryOptions} [options] - Configuration options for the hook.
 * @param {number} [options.maxHistorySize] - The maximum number of commands to store in history.
 * @param {string} [options.persistKey] - The key to use for storing history in `localStorage`.
 * @param {boolean} [options.enableCompression] - Whether to compress history data.
 * @returns {object} An object containing the history state and management functions.
 * @property {string[]} history The array of command strings.
 * @property {number} currentIndex The current index in the history for navigation (-1 means not navigating).
 * @property {(command: string) => void} addCommand Adds a new command to the history.
 * @property {(direction: "up" | "down") => string} navigate Moves the history pointer up or down and returns the command at the new position.
 * @property {(query: string) => string[]} searchHistory Searches the history for commands matching a query.
 * @property {() => void} clearHistory Clears all commands from the history and `localStorage`.
 * @property {number} size The current number of commands in the history.
 */
export function useCommandHistory({
  maxHistorySize = 100,
  persistKey = "terminal-command-history",
}: UseCommandHistoryOptions = {}) {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(persistKey);
      if (!stored) return [];

      const parsed = JSON.parse(stored);

      // Handle both old format (string[]) and new format (CommandEntry[])
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          // Old format - array of strings
          return parsed.slice(-maxHistorySize);
        } else if (parsed.length > 0 && typeof parsed[0] === "object") {
          // New format - array of CommandEntry objects
          return parsed
            .filter(
              (entry: any) =>
                entry.command &&
                entry.timestamp &&
                typeof entry.success === "boolean",
            )
            .map((entry: any) => entry.command)
            .slice(-maxHistorySize);
        }
      }

      return [];
    } catch (error) {
      console.warn("Failed to load command history:", error);
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(-1);

  const addCommand = useCallback(
    (command: string) => {
      if (!command.trim()) return;

      setHistory((prev) => {
        const newHistory = [
          ...prev.filter((cmd) => cmd !== command),
          command,
        ].slice(-maxHistorySize);

        // Persist to localStorage with new format
        try {
          const entries: SerializedCommandEntry[] = newHistory.map((cmd) => ({
            command: cmd,
            timestamp: new Date().toISOString(),
            success: true, // Default to true for backward compatibility
          }));

          localStorage.setItem(persistKey, JSON.stringify(entries));
        } catch (error) {
          console.warn("Failed to persist command history:", error);
        }

        return newHistory;
      });

      setCurrentIndex(-1);
    },
    [maxHistorySize, persistKey],
  );

  const navigate = useCallback(
    (direction: "up" | "down") => {
      if (history.length === 0) return "";

      let newIndex: number;

      if (direction === "up") {
        newIndex =
          currentIndex === -1
            ? history.length - 1
            : Math.max(0, currentIndex - 1);
      } else {
        newIndex =
          currentIndex === -1
            ? -1
            : Math.min(history.length - 1, currentIndex + 1);
        if (newIndex === history.length - 1) newIndex = -1;
      }

      setCurrentIndex(newIndex);
      return newIndex === -1 ? "" : history[newIndex];
    },
    [history, currentIndex],
  );

  const searchHistory = useCallback(
    (query: string, limit: number = 10) => {
      if (!query.trim()) return [];

      return history
        .filter((cmd) => cmd.toLowerCase().includes(query.toLowerCase()))
        .reverse()
        .slice(0, limit);
    },
    [history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    try {
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn("Failed to clear command history:", error);
    }
  }, [persistKey]);

  const getHistoryStats = useCallback(() => {
    return {
      totalCommands: history.length,
      uniqueCommands: new Set(history).size,
      mostUsedCommand: history.reduce(
        (acc, cmd) => {
          acc[cmd] = (acc[cmd] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }, [history]);

  return {
    history,
    currentIndex,
    addCommand,
    navigate,
    searchHistory,
    clearHistory,
    getHistoryStats,
    size: history.length,
  };
}
