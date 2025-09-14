"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export interface CommandHistoryEntry {
  id: string;
  command: string;
  timestamp: Date;
  success: boolean;
  executionTime?: number;
  category: string;
  favorite: boolean;
  frequency: number;
  context?: string;
}

export interface HistorySearchOptions {
  query: string;
  category?: string;
  favorite?: boolean;
  timeRange?: "today" | "week" | "month" | "all";
  sortBy: "recent" | "frequency" | "alphabetical" | "execution_time";
  success?: boolean;
}

interface UseCommandHistoryOptions {
  maxHistorySize?: number;
  persistKey?: string;
  enableAnalytics?: boolean;
  autoCategories?: boolean;
}

export interface HistoryAnalytics {
  totalCommands: number;
  uniqueCommands: number;
  successRate: number;
  averageExecutionTime: number;
  topCommands: Array<{ command: string; count: number; avgTime: number }>;
  commandsByCategory: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  errorCommands: Array<{ command: string; count: number }>;
}

/**
 *  command history hook with search, analytics, and smart categorization
 */
export function useCommandHistory({
  maxHistorySize = 500,
  persistKey = "-terminal-history",
  enableAnalytics = true,
  autoCategories = true,
}: UseCommandHistoryOptions = {}) {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [searchOptions, setSearchOptions] = useState<HistorySearchOptions>({
    query: "",
    sortBy: "recent",
  });

  // Debounce search for performance
  const debouncedSearch = useDebouncedValue(searchOptions.query, 150);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validHistory = parsed
          .filter((entry: unknown) => {
            const e = entry as Record<string, unknown>;
            return e.command && e.timestamp;
          })
          .map((entry: unknown) => {
            const e = entry as Record<string, unknown>;
            return {
              ...e,
              timestamp: new Date(e.timestamp as string),
            };
          });
        setHistory(validHistory);
      }
    } catch (error) {
      console.warn("Failed to load command history:", error);
    }
  }, [persistKey]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [history, persistKey]);

  // Auto-categorize commands
  const categorizeCommand = useCallback(
    (command: string): string => {
      if (!autoCategories) return "general";

      const cmd = command.toLowerCase().trim().split(" ")[0];

      // Portfolio commands
      if (
        [
          "about",
          "skills",
          "projects",
          "experience",
          "education",
          "resume",
        ].includes(cmd)
      ) {
        return "portfolio";
      }

      // System commands
      if (
        ["help", "clear", "status", "whoami", "pwd", "ls", "cd"].includes(cmd)
      ) {
        return "system";
      }

      // Development commands
      if (
        ["build", "deploy", "test", "run", "start", "stop", "dev"].includes(cmd)
      ) {
        return "development";
      }

      // Customization commands
      if (["theme", "font", "customize", "config", "settings"].includes(cmd)) {
        return "customization";
      }

      // Social/External commands
      if (["github", "linkedin", "email", "contact", "blog"].includes(cmd)) {
        return "social";
      }

      // Entertainment commands
      if (["spotify", "now-playing", "music", "demo"].includes(cmd)) {
        return "entertainment";
      }

      return "general";
    },
    [autoCategories],
  );

  // Add command to history
  const addCommand = useCallback(
    (
      command: string,
      success: boolean = true,
      executionTime?: number,
      context?: string,
    ) => {
      if (!command.trim()) return;

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      setHistory((prev) => {
        // Check if command exists to update frequency
        const existingIndex = prev.findIndex(
          (entry) => entry.command === command,
        );

        const newEntry: CommandHistoryEntry = {
          id,
          command: command.trim(),
          timestamp: new Date(),
          success,
          executionTime,
          category: categorizeCommand(command),
          favorite: false,
          frequency: existingIndex >= 0 ? prev[existingIndex].frequency + 1 : 1,
          context,
        };

        // Remove existing entry if found
        const filtered =
          existingIndex >= 0
            ? prev.filter((_, index) => index !== existingIndex)
            : prev;

        // Add new entry at the beginning
        const updated = [newEntry, ...filtered];

        // Limit history size
        return updated.slice(0, maxHistorySize);
      });
    },
    [maxHistorySize, categorizeCommand],
  );

  // Toggle favorite status
  const toggleFavorite = useCallback((commandId: string) => {
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === commandId
          ? { ...entry, favorite: !entry.favorite }
          : entry,
      ),
    );
  }, []);

  // Remove command from history
  const removeCommand = useCallback((commandId: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== commandId));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn("Failed to clear history:", error);
    }
  }, [persistKey]);

  // Get time range filter
  const getTimeRangeFilter = useCallback((timeRange: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
      case "today":
        return (entry: CommandHistoryEntry) => entry.timestamp >= today;
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return (entry: CommandHistoryEntry) => entry.timestamp >= weekAgo;
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return (entry: CommandHistoryEntry) => entry.timestamp >= monthAgo;
      }
      case "all":
      default:
        return () => true;
    }
  }, []);

  // Filtered and sorted history
  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Apply search query
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.command.toLowerCase().includes(query) ||
          entry.category.toLowerCase().includes(query),
      );
    }

    // Apply category filter
    if (searchOptions.category) {
      filtered = filtered.filter(
        (entry) => entry.category === searchOptions.category,
      );
    }

    // Apply favorite filter
    if (searchOptions.favorite) {
      filtered = filtered.filter((entry) => entry.favorite);
    }

    // Apply time range filter
    if (searchOptions.timeRange) {
      const timeFilter = getTimeRangeFilter(searchOptions.timeRange);
      filtered = filtered.filter(timeFilter);
    }

    // Apply success filter
    if (typeof searchOptions.success === "boolean") {
      filtered = filtered.filter(
        (entry) => entry.success === searchOptions.success,
      );
    }

    // Sort results
    switch (searchOptions.sortBy) {
      case "frequency":
        return filtered.sort((a, b) => b.frequency - a.frequency);
      case "alphabetical":
        return filtered.sort((a, b) => a.command.localeCompare(b.command));
      case "execution_time":
        return filtered.sort(
          (a, b) => (b.executionTime || 0) - (a.executionTime || 0),
        );
      case "recent":
      default:
        return filtered.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );
    }
  }, [history, debouncedSearch, searchOptions, getTimeRangeFilter]);

  // Get command suggestions based on partial input
  const getSuggestions = useCallback(
    (partialCommand: string, limit: number = 8) => {
      if (!partialCommand.trim()) return [];

      const query = partialCommand.toLowerCase();

      return history
        .filter((entry) => entry.command.toLowerCase().startsWith(query))
        .sort((a, b) => {
          // Sort by frequency and recency combined
          const frequencyScore = b.frequency - a.frequency;
          const recencyScore = b.timestamp.getTime() - a.timestamp.getTime();
          return frequencyScore * 0.7 + recencyScore * 0.3;
        })
        .slice(0, limit)
        .map((entry) => entry.command);
    },
    [history],
  );

  // Get available categories
  const categories = useMemo(() => {
    const cats = new Set(history.map((entry) => entry.category));
    return Array.from(cats).sort();
  }, [history]);

  // Get favorites
  const favorites = useMemo(() => {
    return history.filter((entry) => entry.favorite);
  }, [history]);

  // Generate analytics
  const analytics = useMemo((): HistoryAnalytics => {
    if (!enableAnalytics || history.length === 0) {
      return {
        totalCommands: 0,
        uniqueCommands: 0,
        successRate: 100,
        averageExecutionTime: 0,
        topCommands: [],
        commandsByCategory: {},
        recentActivity: [],
        errorCommands: [],
      };
    }

    const uniqueCommands = new Set(history.map((entry) => entry.command)).size;
    const successfulCommands = history.filter((entry) => entry.success).length;
    const successRate = (successfulCommands / history.length) * 100;

    // Calculate average execution time
    const commandsWithTime = history.filter((entry) => entry.executionTime);
    const averageExecutionTime =
      commandsWithTime.length > 0
        ? commandsWithTime.reduce(
            (sum, entry) => sum + (entry.executionTime || 0),
            0,
          ) / commandsWithTime.length
        : 0;

    // Get top commands by frequency
    const commandFrequency: Record<
      string,
      { count: number; totalTime: number; executions: number }
    > = {};

    history.forEach((entry) => {
      if (!commandFrequency[entry.command]) {
        commandFrequency[entry.command] = {
          count: 0,
          totalTime: 0,
          executions: 0,
        };
      }
      commandFrequency[entry.command].count += 1;
      if (entry.executionTime) {
        commandFrequency[entry.command].totalTime += entry.executionTime;
        commandFrequency[entry.command].executions += 1;
      }
    });

    const topCommands = Object.entries(commandFrequency)
      .map(([command, data]) => ({
        command,
        count: data.count,
        avgTime: data.executions > 0 ? data.totalTime / data.executions : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Commands by category
    const commandsByCategory: Record<string, number> = {};
    history.forEach((entry) => {
      commandsByCategory[entry.category] =
        (commandsByCategory[entry.category] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const recentActivity: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const count = history.filter((entry) => {
        const entryDate = entry.timestamp.toISOString().split("T")[0];
        return entryDate === dateStr;
      }).length;

      recentActivity.push({ date: dateStr, count });
    }

    // Error commands
    const errorCommands = Object.entries(
      history
        .filter((entry) => !entry.success)
        .reduce(
          (acc, entry) => {
            acc[entry.command] = (acc[entry.command] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
    )
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCommands: history.length,
      uniqueCommands,
      successRate,
      averageExecutionTime,
      topCommands,
      commandsByCategory,
      recentActivity,
      errorCommands,
    };
  }, [history, enableAnalytics]);

  // Export history
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terminal-history-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [history]);

  // Import history
  const importHistory = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);

          if (Array.isArray(imported)) {
            const validHistory = imported
              .filter((entry: unknown) => {
                const e = entry as Record<string, unknown>;
                return e.command && e.timestamp;
              })
              .map((entry: unknown) => {
                const e = entry as Record<string, unknown>;
                return {
                  id:
                    (e.id as string) ||
                    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  command: e.command as string,
                  timestamp: new Date(e.timestamp as string),
                  success:
                    e.success !== undefined ? (e.success as boolean) : true,
                  executionTime: e.executionTime as number | undefined,
                  category:
                    (e.category as string) ||
                    categorizeCommand(e.command as string),
                  favorite: (e.favorite as boolean) || false,
                  frequency: (e.frequency as number) || 1,
                  context: e.context as string | undefined,
                } as CommandHistoryEntry;
              });
            setHistory(validHistory);
          }
        } catch (error) {
          console.error("Failed to import history:", error);
        }
      };
      reader.readAsText(file);
    },
    [categorizeCommand],
  );

  return {
    // Data
    history: filteredHistory,
    allHistory: history,
    categories,
    favorites,
    analytics,

    // Search & Filter
    searchOptions,
    setSearchOptions,
    updateSearchQuery: (query: string) =>
      setSearchOptions((prev) => ({ ...prev, query })),

    // Actions
    addCommand,
    toggleFavorite,
    removeCommand,
    clearHistory,
    exportHistory,
    importHistory,
    getSuggestions,

    // Stats
    totalCommands: history.length,
    uniqueCommands: new Set(history.map((entry) => entry.command)).size,
  };
}
