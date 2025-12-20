/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export interface HistoryItem {
  command: string;
  timestamp: Date;
  success: boolean;
  category?: string;
  favorite?: boolean;
  executionTime?: number;
}

interface UseHistoryOptions {
  maxHistorySize?: number;
  persistKey?: string;
  categorizeCommands?: boolean;
}

interface SerializedHistoryItem {
  command: string;
  timestamp: string;
  success: boolean;
  category?: string;
  favorite?: boolean;
  executionTime?: number;
}

/**
 * Command history management hook with search, favorites, and categorization
 *
 * Provides a simpler alternative to useCommandHistory with essential features:
 * - Command history storage with localStorage persistence
 * - Search and filtering capabilities
 * - Favorite commands management
 * - Automatic command categorization
 * - Sort by recent, frequency, or alphabetical
 * - Import/export functionality
 *
 * @param {UseHistoryOptions} [options] - Configuration options
 * @param {number} [options.maxHistorySize=200] - Maximum number of history items to store
 * @param {string} [options.persistKey="-terminal-history"] - localStorage key for persistence
 * @param {boolean} [options.categorizeCommands=true] - Whether to auto-categorize commands
 *
 * @returns {object} History state and management functions
 * @property {HistoryItem[]} history - Filtered and sorted history items
 * @property {HistoryItem[]} favorites - Favorite commands (max 10)
 * @property {Array<{command: string, count: number}>} frequentCommands - Top 10 most frequent commands
 * @property {string[]} categories - Available categories including 'all'
 * @property {Record<string, number>} commandFrequency - Map of command to usage count
 * @property {string} searchQuery - Current search query
 * @property {Function} setSearchQuery - Update search query
 * @property {string} selectedCategory - Currently selected category filter
 * @property {Function} setSelectedCategory - Update category filter
 * @property {"recent" | "frequency" | "alphabetical"} sortBy - Current sort mode
 * @property {Function} setSortBy - Update sort mode
 * @property {Function} addToHistory - Add a command to history
 * @property {Function} toggleFavorite - Toggle favorite status
 * @property {Function} clearHistory - Clear all history
 * @property {Function} exportHistory - Export as JSON file
 * @property {Function} importHistory - Import from JSON file
 * @property {Function} getSuggestions - Get command suggestions
 * @property {number} totalCommands - Total commands in history
 * @property {number} successRate - Percentage of successful commands
 *
 * @example
 * ```tsx
 * const {
 *   history,
 *   addToHistory,
 *   favorites,
 *   toggleFavorite,
 *   searchQuery,
 *   setSearchQuery
 * } = useHistory({ maxHistorySize: 200 });
 *
 * // Add a command
 * addToHistory("help", true, 45);
 *
 * // Search history
 * setSearchQuery("theme");
 *
 * // Toggle favorite
 * toggleFavorite("help");
 * ```
 */
export function useHistory({
  maxHistorySize = 200,
  persistKey = "-terminal-history",
  categorizeCommands = true,
}: UseHistoryOptions = {}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "frequency" | "alphabetical">(
    "recent",
  );

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(persistKey);

      const data: unknown = JSON.parse(savedHistory || "[]");

      if (
        typeof data === "object" &&
        data !== null &&
        typeof (data as SerializedHistoryItem[])[0].command === "string" &&
        typeof (data as SerializedHistoryItem[])[0].timestamp === "string" &&
        typeof (data as SerializedHistoryItem[])[0].success === "boolean" &&
        typeof (data as SerializedHistoryItem[])[0].category === "string" &&
        typeof (data as SerializedHistoryItem[])[0].favorite === "boolean" &&
        typeof (data as SerializedHistoryItem[])[0].executionTime === "number"
      ) {
        const parsed = (data as SerializedHistoryItem[]).map(
          (item: SerializedHistoryItem) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }),
        );

        setHistory(parsed as HistoryItem[]);
      }
    } catch (error) {
      console.warn("Failed to load command history:", error);
    }
  }, [persistKey]);

  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [history, persistKey]);

  const categorizeCommand = (command: string): string => {
    if (!categorizeCommands) return "general";

    const cmd = command.toLowerCase().split(" ")[0];

    if (["theme", "font", "customize"].includes(cmd)) return "customization";
    if (
      ["skills", "projects", "about", "experience", "education"].includes(cmd)
    )
      return "portfolio";
    if (["help", "clear", "status", "alias"].includes(cmd)) return "system";
    if (["roadmap", "progress"].includes(cmd)) return "development";

    return "general";
  };

  const addToHistory = (
    command: string,
    success: boolean = true,
    executionTime?: number,
  ) => {
    const newItem: HistoryItem = {
      command: command.trim(),
      timestamp: new Date(),
      success,
      category: categorizeCommand(command),
      executionTime,
    };

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.command !== newItem.command);
      const updated = [newItem, ...filtered];

      return updated.slice(0, maxHistorySize);
    });
  };

  const toggleFavorite = (command: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.command === command ? { ...item, favorite: !item.favorite } : item,
      ),
    );
  };

  const getCommandFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};
    history.forEach((item) => {
      frequency[item.command] = (frequency[item.command] || 0) + 1;
    });
    return frequency;
  }, [history]);

  const categories = useMemo(() => {
    const cats = new Set(history.map((item) => item.category || "general"));
    return ["all", ...Array.from(cats)].sort();
  }, [history]);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.command.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    switch (sortBy) {
      case "frequency":
        filtered = filtered.sort(
          (a, b) =>
            (getCommandFrequency[b.command] || 0) -
            (getCommandFrequency[a.command] || 0),
        );
        break;
      case "alphabetical":
        filtered = filtered.sort((a, b) => a.command.localeCompare(b.command));
        break;
      case "recent":
      default:
        filtered = filtered.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
        break;
    }

    return filtered;
  }, [
    history,
    debouncedSearchQuery,
    selectedCategory,
    sortBy,
    getCommandFrequency,
  ]);

  const favorites = useMemo(
    () => history.filter((item) => item.favorite).slice(0, 10),
    [history],
  );

  const frequentCommands = useMemo(() => {
    return Object.entries(getCommandFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));
  }, [getCommandFrequency]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(persistKey);
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terminal-history-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importHistory = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);

        if (typeof imported === "object" && imported !== null) {
          const validHistory = (imported as any)
            .filter(
              (item: SerializedHistoryItem) => item.command && item.timestamp,
            )
            .map((item: SerializedHistoryItem) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            }));
          setHistory(validHistory);
        }
      } catch (error) {
        console.error("Failed to import history:", error);
      }
    };
    reader.readAsText(file);
  };

  const getSuggestions = (partialCommand: string, limit: number = 5) => {
    return history
      .filter((item) =>
        item.command.toLowerCase().startsWith(partialCommand.toLowerCase()),
      )
      .slice(0, limit)
      .map((item) => item.command);
  };

  return {
    history: filteredHistory,
    favorites,
    frequentCommands,
    categories,
    commandFrequency: getCommandFrequency,

    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    addToHistory,
    toggleFavorite,
    clearHistory,
    exportHistory,
    importHistory,
    getSuggestions,

    totalCommands: history.length,
    successRate:
      history.length > 0
        ? (history.filter((item) => item.success).length / history.length) * 100
        : 100,
  };
}
