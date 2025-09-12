"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CommandParser } from "@portfolio/frontend/src/lib/commands/commandParser";
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
} from "@portfolio/frontend/src/lib/commands/commandRegistry";
import {
  languageCommand,
  languageListCommand,
  languageInfoCommand,
} from "@portfolio/frontend/src/lib/commands/languageCommands";

// Lazy load commands that depend on RoadmapService to avoid SSR issues
const getSkillsCommand = async () => {
  if (typeof window === "undefined") return null;
  try {
    const { skillsCommand } = await import(
      "@portfolio/frontend/src/lib/commands/skillsCommands"
    );
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
    const { roadmapCommand, progressCommand } = await import(
      "@portfolio/frontend/src/lib/commands/roadmapCommands"
    );
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
} from "@portfolio/frontend/src/lib/commands/customizationCommands";
import {
  demoCommand,
  setDemoCallback,
} from "@portfolio/frontend/src/lib/commands/demoCommands";
import { githubCommand } from "@portfolio/frontend/src/lib/commands/githubCommands";
import { techStackCommand } from "@portfolio/frontend/src/lib/commands/techStackCommands";
import { createNowPlayingCommand } from "@portfolio/frontend/src/lib/commands/nowPlayingCommands";
import { createLocationCommand } from "@portfolio/frontend/src/lib/commands/locationCommands";
import type {
  CommandOutput,
  TerminalHistory,
} from "@portfolio/frontend/src/types/terminal";

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
) {
  const [isClient, setIsClient] = useState(false);
  const [history, setHistory] = useState<TerminalHistory[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastError, setLastError] = useState<string | null>(null);

  const parserRef = useRef<CommandParser | null>(null);
  const isMountedRef = useRef(true);

  // Set client flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize command parser
  useEffect(() => {
    if (!isMountedRef.current) return;

    const initializeParser = async () => {
      const parser = new CommandParser();

      // Register basic commands first
      parser.register(aboutCommand);
      parser.register(projectsCommand);
      parser.register(contactCommand);
      parser.register(clearCommand);
      parser.register(themeCommand);
      parser.register(fontCommand);
      parser.register(statusCommand);
      parser.register(aliasCommand);

      // Register skills and roadmap commands (lazy loaded to avoid SSR issues)
      const skillsCmd = await getSkillsCommand();
      const { roadmapCommand, progressCommand } = await getRoadmapCommands();

      if (skillsCmd) parser.register(skillsCmd);
      if (roadmapCommand) parser.register(roadmapCommand);
      if (progressCommand) parser.register(progressCommand);

      parser.register(customizeCommand);
      parser.register(themesCommand);
      parser.register(fontsCommand);

      // Register language commands
      parser.register(languageCommand);
      parser.register(languageListCommand);
      parser.register(languageInfoCommand);

      // Register interactive commands
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

      // Register help command LAST so it can see all other commands
      parser.register(createHelpCommand(() => parser.getCommands()));

      parserRef.current = parser;
    };

    initializeParser().catch((error) => {
      console.error("Failed to initialize command parser:", error);
    });

    // Cleanup function
    return () => {
      parserRef.current = null;
    };
  }, [onOpenAuth, onOpenDemo, onOpenNowPlaying]);

  // Load command history from localStorage
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

  // Save command history to localStorage
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
      // Clear any previous error when executing new command
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

      try {
        const output = await parserRef.current.parse(input);

        // Add to command history if not empty and not duplicate
        if (
          input.trim() &&
          (commandHistory.length === 0 ||
            commandHistory[commandHistory.length - 1] !== input.trim())
        ) {
          setCommandHistory((prev) => [...prev, input.trim()]);
        }

        // Handle special commands
        if (output.content === SPECIAL_COMMANDS.CLEAR) {
          setHistory([]);
          setLastError(null); // Clear error state when clearing
          return null;
        }

        // Theme change handling is done in Terminal.tsx, pass through unchanged
        if (
          typeof output.content === "string" &&
          output.content.startsWith(SPECIAL_COMMANDS.THEME_PREFIX)
        ) {
          return output; // Pass through unchanged for Terminal.tsx to handle
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

        // Store error state if output is an error, otherwise clear it
        if (output.type === "error") {
          const errorMsg =
            typeof output.content === "string"
              ? output.content
              : "Unknown error occurred";
          setLastError(errorMsg);
        } else {
          // Clear error state for successful commands
          setLastError(null);
        }

        return output;
      } catch (error) {
        const errorMsg = `Command execution failed: ${error instanceof Error ? error.message : "Unknown error"}`;
        setLastError(errorMsg);
        console.error("Command execution error:", error);
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
    [commandHistory],
  );

  const addToHistory = useCallback(
    (input: string, output: CommandOutput) => {
      if (!isMountedRef.current) return;

      const newEntry: TerminalHistory = {
        input,
        output,
        // Use consistent timestamp for SSR vs client hydration
        timestamp:
          isClient && typeof window !== "undefined" ? new Date() : new Date(0),
      };
      setHistory((prev) => [...prev, newEntry]);
    },
    [isClient],
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
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
    },
    [commandHistory, historyIndex],
  );

  const clearHistory = useCallback(() => {
    if (!isMountedRef.current) return;

    setHistory([]);
    setCommandHistory([]);
    setHistoryIndex(-1);
    setLastError(null); // Clear error state when clearing history

    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEYS.COMMAND_HISTORY);
    } catch (error) {
      console.warn("Failed to clear command history from localStorage:", error);
    }
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

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
  };
}
