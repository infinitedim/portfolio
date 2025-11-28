"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CommandParser } from "@/lib/commands/commandParser";
import {
  createHelpCommand,
  aboutCommand,
  projectsCommand,
  contactCommand,
  clearCommand,
  themeCommand,
  fontCommand,
  statusCommand,
  aliasCommand,
  pwaCommand,
} from "@/lib/commands/commandRegistry";
import {
  languageCommand,
  languageListCommand,
  languageInfoCommand,
} from "@/lib/commands/languageCommands";
import { useCommandHistory } from "./useCommandHistory";
import { generateId } from "@/lib/utils/utils";

// Lazy load commands that depend on RoadmapService to avoid SSR issues
const getSkillsCommand = async () => {
  if (typeof window === "undefined") return null;
  try {
    const { skillsCommand } =
      await import("@portfolio/frontend/src/lib/commands/skillsCommands");
    return skillsCommand;
  } catch (error) {
    console.error("Failed to load skills command:", error);
    return null;
  }
};

const getRoadmapCommands = async () => {
  if (typeof window === "undefined")
    return { roadmapCommand: null, progressCommand: null };
  try {
    const { roadmapCommand, progressCommand } =
      await import("@portfolio/frontend/src/lib/commands/roadmapCommands");
    return { roadmapCommand, progressCommand };
  } catch (error) {
    console.error("Failed to load roadmap commands:", error);
    return { roadmapCommand: null, progressCommand: null };
  }
};

import {
  customizeCommand,
  themesCommand,
  fontsCommand,
} from "@/lib/commands/customizationCommands";
import {
  demoCommand,
  setDemoCallback,
} from "@/lib/commands/demoCommands";
import { githubCommand } from "@/lib/commands/githubCommands";
import { techStackCommand } from "@/lib/commands/techStackCommands";
import { createNowPlayingCommand } from "@/lib/commands/nowPlayingCommands";
import { createLocationCommand } from "@/lib/commands/locationCommands";
import {
  resumeCommand,
  socialCommand,
  shortcutsCommand,
  enhancedContactCommand,
  easterEggsCommand,
} from "@/lib/commands/commands";
import type {
  CommandOutput,
  TerminalHistory,
} from "@/types/terminal";

const STORAGE_KEYS = {
  COMMAND_HISTORY: "terminal-command-history",
} as const;

const SPECIAL_COMMANDS = {
  CLEAR: "CLEAR",
  THEME_PREFIX: "CHANGE_THEME:",
  FONT_PREFIX: "CHANGE_FONT:",
} as const;

/**
 * A custom React hook to manage the state and logic of the terminal interface.
 *
 * This hook encapsulates the entire terminal functionality, including:
 * - Managing command history (both for display and for navigation).
 * - Parsing and executing commands.
 * - Handling the input state and processing status.
 * @param {Function} onOpenDemo - The function to open a demo.
 * @param {Function} onOpenNowPlaying - The function to open the now playing.
 * @param {Function} onOpenAuth - The function to open the auth.
 * @returns {object} An object containing the terminal's state and functions to interact with it.
 * @property {TerminalHistory[]} history The list of past commands and their outputs.
 * @property {string} currentInput The current value of the terminal input field.
 * @property {Dispatch<SetStateAction<string>>} setCurrentInput Function to update the current input value.
 * @property {boolean} isProcessing A boolean flag indicating if a command is currently being executed.
 * @property {(input: string) => Promise<CommandOutput | null>} executeCommand Function to parse and execute a command string.
 * @property {(input: string, output: CommandOutput) => void} addToHistory Function to add a new entry to the visible terminal history.
 * @property {(direction: "up" | "down") => string} navigateHistory Function to navigate through the command history for the input field.
 * @property {() => void} clearHistory Function to clear all entries from the visible terminal history.
 * @property {string[]} commandHistory The list of previously executed command strings.
 */
export function useTerminal(
  onOpenDemo?: (projectId: string) => void,
  onOpenNowPlaying?: () => void,
  onOpenAuth?: () => void,
  themePerformance?: {
    getPerformanceReport: () => {
      totalSwitches: number;
      averageTime: number;
      fastestSwitch: number;
      slowestSwitch: number;
      themeUsage: Record<string, number>;
    };
    themeMetrics: {
      switchCount: number;
      averageSwitchTime: number;
      lastSwitchTime: number;
      popularThemes: { theme: string; count: number }[];
      renderTime: number;
    };
    resetMetrics: () => void;
  },
) {
  const [isClient, setIsClient] = useState(false);
  const [history, setHistory] = useState<TerminalHistory[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Enhanced command history with advanced features
  const {
    addCommand: addToAdvancedHistory,
    analytics,
    favorites,
    clearHistory: clearAdvancedHistory,
    history: advancedHistory,
  } = useCommandHistory({
    maxHistorySize: 500,
    persistKey: "terminal-command-history-enhanced",
    enableAnalytics: true,
    autoCategories: true,
  });

  // Legacy command history for backward compatibility
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const parserRef = useRef<CommandParser | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    const initializeParser = async () => {
      const parser = new CommandParser();

      parser.register(aboutCommand);
      parser.register(projectsCommand);
      parser.register(contactCommand);
      parser.register(clearCommand);
      parser.register(themeCommand);
      parser.register(fontCommand);
      parser.register(statusCommand);
      parser.register(aliasCommand);
      parser.register(pwaCommand);

      parser.register(resumeCommand);
      parser.register(socialCommand);
      parser.register(shortcutsCommand);
      parser.register(enhancedContactCommand);
      parser.register(easterEggsCommand);

      parser.register({
        name: "history",
        description: "Show command history and analytics",
        aliases: ["hist", "analytics"],
        usage: "history [--clear] [--export] [--stats]",
        async execute(args) {
          const hasFlag = (flag: string) => args.includes(`--${flag}`);

          if (hasFlag("clear")) {
            clearAdvancedHistory();
            return {
              type: "success",
              content: "Command history cleared",
              timestamp: new Date(),
              id: generateId(),
            };
          }

          if (hasFlag("stats")) {
            const stats = analytics || {
              totalCommands: 0,
              uniqueCommands: 0,
              successRate: 100,
              topCommands: [],
              commandsByCategory: {},
            };

            const statsText = [
              "📊 Command Analytics",
              "═".repeat(40),
              "",
              `Total Commands: ${stats.totalCommands}`,
              `Unique Commands: ${stats.uniqueCommands}`,
              `Success Rate: ${stats.successRate.toFixed(1)}%`,
              "",
              "🔥 Top Commands:",
              ...stats.topCommands
                .slice(0, 5)
                .map(
                  (cmd, i) => `  ${i + 1}. ${cmd.command} (${cmd.count} times)`,
                ),
              "",
              "📂 By Category:",
              ...Object.entries(stats.commandsByCategory || {}).map(
                ([cat, count]) => `  ${cat}: ${count} commands`,
              ),
            ].join("\n");

            return {
              type: "success",
              content: statsText,
              timestamp: new Date(),
              id: generateId(),
            };
          }

          const recentHistory = advancedHistory.slice(0, 20);
          if (recentHistory.length === 0) {
            return {
              type: "info",
              content:
                "No command history found. Start typing commands to build your history!",
              timestamp: new Date(),
              id: generateId(),
            };
          }

          const historyText = [
            "📜 Recent Command History",
            "═".repeat(40),
            "",
            ...recentHistory.map((entry, index) => {
              const status = entry.success ? "✅" : "❌";
              const time = entry.timestamp.toLocaleTimeString();
              return `${String(recentHistory.length - index).padStart(3)}. ${status} ${entry.command} (${time})`;
            }),
            "",
            "💡 Tips:",
            "  history --stats    Show analytics",
            "  history --clear    Clear history",
            "  Ctrl+R            Quick search",
            "  ↑/↓ arrows        Navigate history",
          ].join("\n");

          return {
            type: "success",
            content: historyText,
            timestamp: new Date(),
            id: generateId(),
          };
        },
      });

      const skillsCmd = await getSkillsCommand();
      const { roadmapCommand, progressCommand } = await getRoadmapCommands();

      if (skillsCmd) parser.register(skillsCmd);
      if (roadmapCommand) parser.register(roadmapCommand);
      if (progressCommand) parser.register(progressCommand);

      parser.register(customizeCommand);
      parser.register(themesCommand);
      parser.register(fontsCommand);

      parser.register(languageCommand);
      parser.register(languageListCommand);
      parser.register(languageInfoCommand);

      parser.register({
        name: "perf",
        description: "Show performance metrics dashboard",
        aliases: ["performance", "metrics", "dashboard"],
        usage: "perf [--detailed] [--reset]",
        async execute(args) {
          const hasFlag = (flag: string) => args.includes(`--${flag}`);

          if (hasFlag("reset")) {
            if (themePerformance?.resetMetrics) {
              themePerformance.resetMetrics();
            }

            return {
              type: "success",
              content: "Performance metrics reset successfully",
              timestamp: new Date(),
              id: generateId(),
            };
          }

          const themeReport = themePerformance?.getPerformanceReport() || {
            totalSwitches: 0,
            averageTime: 0,
            fastestSwitch: 0,
            slowestSwitch: 0,
            themeUsage: {},
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let monitor: any;
          try {
            const { PerformanceMonitor } =
              await import("@portfolio/frontend/src/lib/performance/PerformanceMonitor");
            monitor = PerformanceMonitor.getInstance().getReport();
          } catch (error) {
            console.warn("Failed to load performance monitor:", error);
            monitor = {
              summary: {
                totalCommands: 0,
                averageCommandTime: 0,
                averageRenderTime: 0,
                memoryUsage: undefined,
                historySize: 0,
              },
              recommendations: [],
              metrics: [],
            };
          }

          if (hasFlag("detailed")) {
            const detailedText = [
              "🎯 Performance Dashboard - Detailed View",
              "═".repeat(50),
              "",
              "📊 Theme Performance:",
              `  Total Theme Switches: ${themeReport.totalSwitches}`,
              `  Average Switch Time: ${themeReport.averageTime.toFixed(2)}ms`,
              `  Fastest Switch: ${themeReport.fastestSwitch.toFixed(2)}ms`,
              `  Slowest Switch: ${themeReport.slowestSwitch.toFixed(2)}ms`,
              "",
              "🎨 Theme Usage Statistics:",
              ...Object.entries(themeReport.themeUsage)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 10)
                .map(
                  ([theme, count], i) =>
                    `  ${i + 1}. ${theme}: ${count} switches`,
                ),
              "",
              "⚡ System Performance:",
              `  Total Commands: ${monitor.summary.totalCommands}`,
              `  Average Command Time: ${monitor.summary.averageCommandTime.toFixed(2)}ms`,
              `  Average Render Time: ${monitor.summary.averageRenderTime.toFixed(2)}ms`,
              `  Memory Usage: ${
                monitor.summary.memoryUsage
                  ? `${(monitor.summary.memoryUsage / 1024 / 1024).toFixed(1)}MB`
                  : "N/A"
              }`,
              `  History Size: ${monitor.summary.historySize} items`,
              "",
              "🚀 Performance Recommendations:",
              ...monitor.recommendations.slice(0, 5),
              "",
              "💡 Commands:",
              "  perf --reset    Reset all metrics",
              "  perf            Quick overview",
            ].join("\n");

            return {
              type: "success",
              content: detailedText,
              timestamp: new Date(),
              id: generateId(),
            };
          }

          const currentMetrics = themePerformance?.themeMetrics || {
            renderTime: 0,
          };

          const quickText = [
            "🎯 Performance Dashboard",
            "═".repeat(30),
            "",
            `⚡ Theme Switches: ${themeReport.totalSwitches} (avg: ${themeReport.averageTime.toFixed(1)}ms)`,
            `📈 Commands Executed: ${monitor.summary.totalCommands}`,
            `🎨 Current Theme Render: ${currentMetrics.renderTime.toFixed(1)}ms`,
            `📊 Command Success Rate: ${
              monitor.summary.totalCommands > 0
                ? (
                    ((monitor.summary.totalCommands -
                      monitor.metrics.filter((m: { name: string }) =>
                        m.name.includes("error"),
                      ).length) /
                      monitor.summary.totalCommands) *
                    100
                  ).toFixed(1)
                : 100
            }%`,
            "",
            "💡 Use 'perf --detailed' for more info",
          ].join("\n");

          return {
            type: "success",
            content: quickText,
            timestamp: new Date(),
            id: generateId(),
          };
        },
      });

      setDemoCallback(onOpenDemo || (() => {}));
      parser.register(demoCommand);
      parser.register(githubCommand);
      parser.register(techStackCommand);
      parser.register(
        createNowPlayingCommand({
          onOpenNowPlaying: onOpenNowPlaying || (() => {}),
          onOpenAuth: onOpenAuth || (() => {}),
        }),
      );
      parser.register(createLocationCommand());

      parser.register(createHelpCommand(() => parser.getCommands()));

      parserRef.current = parser;
    };

    initializeParser().catch((error) => {
      console.error("Failed to initialize command parser:", error);
    });

    return () => {
      parserRef.current = null;
    };
  }, [
    onOpenAuth,
    onOpenDemo,
    onOpenNowPlaying,
    advancedHistory,
    analytics,
    clearAdvancedHistory,
    themePerformance,
  ]);

  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;

    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.COMMAND_HISTORY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);

        if (typeof parsed === "object" && parsed !== null) {
          setCommandHistory(parsed as string[]);
        }
      }
    } catch (error) {
      console.warn("Failed to load command history:", error);
    }
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !isMountedRef.current) return;

    try {
      localStorage.setItem(
        STORAGE_KEYS.COMMAND_HISTORY,
        JSON.stringify(commandHistory),
      );
    } catch (error) {
      console.warn("Failed to save command history:", error);
    }
  }, [commandHistory, isClient]);

  const executeCommand = useCallback(
    async (input: string): Promise<CommandOutput | null> => {
      setLastError(null);

      if (!parserRef.current || !isMountedRef.current) {
        const errorMsg = "Terminal not ready";
        setLastError(errorMsg);
        return {
          type: "error",
          content: errorMsg,
          timestamp: new Date(),
          id: "error-not-ready",
        };
      }

      setIsProcessing(true);
      const startTime = performance.now();

      try {
        const output = await parserRef.current.parse(input);
        const executionTime = performance.now() - startTime;

        if (input.trim()) {
          addToAdvancedHistory(
            input.trim(),
            output.type !== "error",
            executionTime,
          );

          if (
            commandHistory.length === 0 ||
            commandHistory[commandHistory.length - 1] !== input.trim()
          ) {
            setCommandHistory((prev) => [...prev, input.trim()]);
          }
        }

        if (output.content === SPECIAL_COMMANDS.CLEAR) {
          setHistory([]);
          setLastError(null);
          return null;
        }

        if (
          typeof output.content === "string" &&
          output.content.startsWith(SPECIAL_COMMANDS.THEME_PREFIX)
        ) {
          return output;
        }

        if (
          typeof output.content === "string" &&
          output.content.startsWith(SPECIAL_COMMANDS.FONT_PREFIX)
        ) {
          const fontName = output.content.split(":")[1];
          return {
            ...output,
            content: `Font changed to ${fontName}`,
          };
        }

        if (output.type === "error") {
          const errorMsg =
            typeof output.content === "string"
              ? output.content
              : "Unknown error occurred";
          setLastError(errorMsg);
        } else {
          setLastError(null);
        }

        return output;
      } catch (error) {
        const errorMsg = `Command execution failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        setLastError(errorMsg);
        console.error("Command execution error:", error);

        addToAdvancedHistory(
          input.trim(),
          false,
          performance.now() - startTime,
        );

        return {
          type: "error",
          content: errorMsg,
          timestamp: new Date(),
          id: "error-execution",
        };
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [commandHistory, addToAdvancedHistory],
  );

  const addToHistory = useCallback(
    (input: string, output: CommandOutput) => {
      if (!isMountedRef.current) return;

      const newEntry: TerminalHistory = {
        input,
        output,
        timestamp:
          isClient && typeof window !== "undefined" ? new Date() : new Date(0),
      };
      setHistory((prev) => [...prev, newEntry]);
    },
    [isClient],
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (advancedHistory.length === 0) {
        if (commandHistory.length === 0) return "";

        if (direction === "up") {
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          return commandHistory[newIndex] || "";
        } else {
          const newIndex =
            historyIndex === -1
              ? -1
              : Math.min(commandHistory.length - 1, historyIndex + 1);
          if (newIndex === commandHistory.length - 1) {
            setHistoryIndex(-1);
            return "";
          } else {
            setHistoryIndex(newIndex);
            return commandHistory[newIndex] || "";
          }
        }
      }

      const recentCommands = advancedHistory
        .filter((entry) => entry.success)
        .slice(0, 50)
        .map((entry) => entry.command);

      if (recentCommands.length === 0) return "";

      if (direction === "up") {
        const newIndex =
          historyIndex === -1
            ? recentCommands.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        return recentCommands[newIndex] || "";
      } else {
        const newIndex =
          historyIndex === -1
            ? -1
            : Math.min(recentCommands.length - 1, historyIndex + 1);
        if (newIndex === recentCommands.length - 1) {
          setHistoryIndex(-1);
          return "";
        } else {
          setHistoryIndex(newIndex);
          return recentCommands[newIndex] || "";
        }
      }
    },
    [commandHistory, historyIndex, advancedHistory],
  );

  const clearHistory = useCallback(() => {
    if (!isMountedRef.current) return;

    setHistory([]);
    setCommandHistory([]);
    setHistoryIndex(-1);
    setLastError(null);

    clearAdvancedHistory();

    // Clear legacy localStorage
    try {
      localStorage.removeItem(STORAGE_KEYS.COMMAND_HISTORY);
    } catch (error) {
      console.warn("Failed to clear command history from localStorage:", error);
    }
  }, [clearAdvancedHistory]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const getCommandSuggestions = useCallback(
    (input: string, limit: number = 8) => {
      if (!input.trim()) return [];

      // Get all available commands from the CommandParser
      const allCommands = [
        "help",
        "skills",
        "customize",
        "themes",
        "fonts",
        "status",
        "clear",
        "alias",
        "about",
        "contact",
        "projects",
        "experience",
        "education",
        "roadmap",
        "theme",
        "font",
        "language",
        "now-playing",
        "demo",
        "github",
        "tech-stack",
        "resume",
        "social",
        "shortcuts",
        "easter-eggs",
      ];

      const query = input.toLowerCase();
      const suggestions = allCommands
        .filter((command) => command.toLowerCase().includes(query))
        .sort((a, b) => {
          // Exact match first
          if (a.toLowerCase() === query) return -1;
          if (b.toLowerCase() === query) return 1;

          // Prefix matches
          const aStartsWith = a.toLowerCase().startsWith(query);
          const bStartsWith = b.toLowerCase().startsWith(query);
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;

          // Alphabetical order for same type matches
          return a.localeCompare(b);
        })
        .slice(0, limit);

      return suggestions;
    },
    [],
  );

  const getFrequentCommands = useCallback(() => {
    const frequency = advancedHistory.reduce(
      (acc, entry) => {
        acc[entry.command] = (acc[entry.command] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([command]) => command);
  }, [advancedHistory]);

  return {
    history,
    currentInput,
    setCurrentInput,
    isProcessing,
    executeCommand,
    addToHistory,
    navigateHistory,
    clearHistory,
    commandHistory,
    lastError,
    clearError,
    getCommandSuggestions,
    getFrequentCommands,
    commandAnalytics: analytics,
    favoriteCommands: favorites,
    enhancedHistory: advancedHistory,
  };
}
