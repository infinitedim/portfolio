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
 *  command history hook with search, favorites, and categorization
 * @param {UseHistoryOptions} options - The options for the hook
 * @param {number} options.maxHistorySize - The maximum number of history items to store
 * @param {string} options.persistKey - The key to use for localStorage
 * @param {boolean} options.categorizeCommands - Whether to categorize commands
 * @returns {object} The  history hook
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

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);

  // Load history from localStorage on mount
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

  // Save history to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [history, persistKey]);

  // Categorize command automatically
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

  // Add command to history
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
      // Remove duplicates and add new item
      const filtered = prev.filter((item) => item.command !== newItem.command);
      const updated = [newItem, ...filtered];

      // Limit history size
      return updated.slice(0, maxHistorySize);
    });
  };

  // Toggle favorite status
  const toggleFavorite = (command: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.command === command ? { ...item, favorite: !item.favorite } : item,
      ),
    );
  };

  // Get command frequency
  const getCommandFrequency = useMemo(() => {
    const frequency: Record<string, number> = {};
    history.forEach((item) => {
      frequency[item.command] = (frequency[item.command] || 0) + 1;
    });
    return frequency;
  }, [history]);

  // Get available categories
  const categories = useMemo(() => {
    const cats = new Set(history.map((item) => item.category || "general"));
    return ["all", ...Array.from(cats)].sort();
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.command.toLowerCase().includes(debouncedSearchQuery.toLowerCase()),
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Sort
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

  // Get favorites
  const favorites = useMemo(
    () => history.filter((item) => item.favorite).slice(0, 10),
    [history],
  );

  // Get most frequent commands
  const frequentCommands = useMemo(() => {
    return Object.entries(getCommandFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command, count]) => ({ command, count }));
  }, [getCommandFrequency]);

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(persistKey);
  };

  // Export history
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

  // Import history
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

  // Get suggestions based on partial input
  const getSuggestions = (partialCommand: string, limit: number = 5) => {
    return history
      .filter((item) =>
        item.command.toLowerCase().startsWith(partialCommand.toLowerCase()),
      )
      .slice(0, limit)
      .map((item) => item.command);
  };

  return {
    // Data
    history: filteredHistory,
    favorites,
    frequentCommands,
    categories,
    commandFrequency: getCommandFrequency,

    // Search & Filter
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,

    // Actions
    addToHistory,
    toggleFavorite,
    clearHistory,
    exportHistory,
    importHistory,
    getSuggestions,

    // Stats
    totalCommands: history.length,
    successRate:
      history.length > 0
        ? (history.filter((item) => item.success).length / history.length) * 100
        : 100,
  };
}
