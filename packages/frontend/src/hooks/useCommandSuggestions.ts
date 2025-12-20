"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

/**
 * Represents a single command suggestion with scoring and metadata
 * @interface SuggestionItem
 * @property {string} command - The suggested command
 * @property {number} score - Relevance score (0-100+)
 * @property {"exact" | "prefix" | "fuzzy" | "contextual" | "recent" | "popular"} type - Type of match
 * @property {string} [description] - Command description
 * @property {string} [usage] - Usage syntax
 * @property {string} [category] - Command category
 * @property {number} [frequency] - Usage frequency count
 * @property {Date} [lastUsed] - Last usage timestamp
 * @property {"start" | "middle" | "end" | "any"} [matchType] - Where the match occurred
 */
export interface SuggestionItem {
  command: string;
  score: number;
  type: "exact" | "prefix" | "fuzzy" | "contextual" | "recent" | "popular";
  description?: string;
  usage?: string;
  category?: string;
  frequency?: number;
  lastUsed?: Date;
  matchType?: "start" | "middle" | "end" | "any";
}

interface CommandMetadata {
  description: string;
  category: string;
  usage?: string;
  examples?: string[];
  frequency: number;
  lastUsed?: Date;
  aliases?: string[];
  parameters?: string[];
  tags?: string[];
}

interface UserContext {
  recentCommands: string[];
  frequentCommands: Map<string, number>;
  commandSequences: Map<string, string[]>;
  sessionStartTime: Date;
  totalCommands: number;
}

const COMMAND_METADATA: Record<string, CommandMetadata> = {
  help: {
    description: "Show all available commands and usage information",
    category: "system",
    usage: "help [command]",
    examples: ["help", "help theme", "help skills"],
    frequency: 0,
    tags: ["documentation", "assistance", "guide"],
  },
  clear: {
    description: "Clear the terminal screen and history",
    category: "system",
    usage: "clear",
    examples: ["clear", "cls"],
    frequency: 0,
    aliases: ["cls", "clr", "clean"],
    tags: ["cleanup", "reset", "screen"],
  },
  about: {
    description: "Display personal and professional information",
    category: "info",
    usage: "about",
    examples: ["about", "whoami"],
    frequency: 0,
    aliases: ["whoami", "info", "me"],
    tags: ["personal", "bio", "introduction"],
  },
  skills: {
    description: "Show technical skills and expertise levels",
    category: "info",
    usage: "skills [action] [category]",
    examples: ["skills", "skills overview", "skills list frontend"],
    frequency: 0,
    parameters: ["overview", "list", "update", "sync"],
    tags: ["expertise", "abilities", "roadmap"],
  },
  projects: {
    description: "Display portfolio projects and work samples",
    category: "info",
    usage: "projects [filter]",
    examples: ["projects", "projects web", "projects featured"],
    frequency: 0,
    aliases: ["portfolio", "work", "proj"],
    tags: ["portfolio", "work", "showcase"],
  },
  contact: {
    description: "Get contact information and social links",
    category: "info",
    usage: "contact",
    examples: ["contact", "reach", "connect"],
    frequency: 0,
    aliases: ["reach", "connect", "email"],
    tags: ["communication", "social", "networking"],
  },
  theme: {
    description: "Change terminal appearance and color scheme",
    category: "customization",
    usage: "theme [options] [name]",
    examples: ["theme -l", "theme dracula", "theme --preview matrix"],
    frequency: 0,
    parameters: ["-l", "--list", "-p", "--preview", "-c", "--current"],
    tags: ["appearance", "colors", "style"],
  },
  font: {
    description: "Change terminal font family and settings",
    category: "customization",
    usage: "font [options] [name]",
    examples: ["font -l", "font fira-code", "font --current"],
    frequency: 0,
    parameters: ["-l", "--list", "-c", "--current"],
    tags: ["typography", "appearance", "readability"],
  },
  customize: {
    description: "Open the terminal customization panel",
    category: "customization",
    usage: "customize",
    examples: ["customize"],
    frequency: 0,
    tags: ["settings", "preferences", "configuration"],
  },
  roadmap: {
    description: "Display learning progress and skill roadmap",
    category: "info",
    usage: "roadmap [section]",
    examples: ["roadmap", "roadmap frontend", "roadmap backend"],
    frequency: 0,
    tags: ["learning", "progress", "development"],
  },
  status: {
    description: "Show system status and information",
    category: "system",
    usage: "status",
    examples: ["status", "info", "sys"],
    frequency: 0,
    aliases: ["info", "sys", "system"],
    tags: ["system", "information", "diagnostics"],
  },
};

class FuzzyMatcher {
  private static readonly WEIGHTS = {
    EXACT_MATCH: 100,
    PREFIX_MATCH: 85,
    WORD_BOUNDARY: 75,
    SEQUENTIAL_MATCH: 65,
    SCATTERED_MATCH: 45,
    POSITION_BONUS: 10,
    LENGTH_PENALTY: 5,
  };

  static calculateScore(query: string, target: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (lowerQuery === lowerTarget) {
      return this.WEIGHTS.EXACT_MATCH;
    }

    if (lowerTarget.startsWith(lowerQuery)) {
      const lengthRatio = lowerQuery.length / lowerTarget.length;
      return (
        this.WEIGHTS.PREFIX_MATCH + lengthRatio * this.WEIGHTS.POSITION_BONUS
      );
    }

    const words = lowerTarget.split(/[-_\s]+/);
    for (const word of words) {
      if (word.startsWith(lowerQuery)) {
        return this.WEIGHTS.WORD_BOUNDARY;
      }
    }

    let queryIndex = 0;
    let targetIndex = 0;
    let consecutiveMatches = 0;
    let totalMatches = 0;

    while (queryIndex < lowerQuery.length && targetIndex < lowerTarget.length) {
      if (lowerQuery[queryIndex] === lowerTarget[targetIndex]) {
        queryIndex++;
        totalMatches++;
        consecutiveMatches++;
      } else {
        consecutiveMatches = 0;
      }
      targetIndex++;
    }

    if (queryIndex === lowerQuery.length) {
      const matchRatio = totalMatches / lowerQuery.length;
      const consecutiveBonus = consecutiveMatches > 1 ? 10 : 0;
      const positionPenalty =
        ((targetIndex - totalMatches) / lowerTarget.length) *
        this.WEIGHTS.LENGTH_PENALTY;

      return Math.max(
        this.WEIGHTS.SCATTERED_MATCH * matchRatio +
          consecutiveBonus -
          positionPenalty,
        0,
      );
    }

    return 0;
  }

  static highlightMatches(query: string, target: string): string {
    if (!query) return target;

    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();
    let result = "";
    let queryIndex = 0;

    for (let i = 0; i < target.length; i++) {
      if (
        queryIndex < lowerQuery.length &&
        lowerTarget[i] === lowerQuery[queryIndex]
      ) {
        result += `<mark>${target[i]}</mark>`;
        queryIndex++;
      } else {
        result += target[i];
      }
    }

    return result;
  }
}

class SuggestionCache {
  private cache = new Map<
    string,
    { suggestions: SuggestionItem[]; timestamp: number; hits: number }
  >();
  private readonly TTL = 5 * 60 * 1000;
  private readonly MAX_SIZE = 100;

  set(key: string, suggestions: SuggestionItem[]): void {
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      suggestions,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  get(key: string): SuggestionItem[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.suggestions;
  }

  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime || entry.hits < lowestHits) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = entry.hits;
      }
    }

    return oldestKey;
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Enhanced command suggestions hook with fuzzy matching, caching, and user context awareness
 *
 * Provides intelligent command suggestions based on:
 * - Fuzzy string matching with scoring
 * - User command history and frequency
 * - Recent command usage
 * - Contextual command sequences
 * - Performance-optimized caching
 *
 * @param {string} input - Current user input to generate suggestions for
 * @param {string[]} availableCommands - List of all available commands
 * @param {object} options - Configuration options
 * @param {number} [options.maxSuggestions=8] - Maximum number of suggestions to return
 * @param {number} [options.debounceMs=50] - Debounce delay for input processing
 * @param {boolean} [options.showOnEmpty=true] - Show suggestions when input is empty
 * @param {boolean} [options.enableCache=true] - Enable suggestion caching
 * @param {boolean} [options.enableLearning=true] - Enable learning from user behavior
 * @param {number} [options.minQueryLength=1] - Minimum query length to show suggestions
 *
 * @returns {object} Suggestion state and methods
 * @property {SuggestionItem[]} suggestions - Array of suggestion items with scores
 * @property {boolean} isLoading - Whether suggestions are being generated
 * @property {Function} updateCommandUsage - Record a command usage for learning
 * @property {Function} clearCache - Clear the suggestion cache
 * @property {Function} getUserContext - Get current user context data
 * @property {Function} setUserContext - Update user context data
 *
 * @example
 * ```tsx
 * const {
 *   suggestions,
 *   isLoading,
 *   updateCommandUsage
 * } = useCommandSuggestions(
 *   input,
 *   ["help", "about", "skills", "projects"],
 *   { maxSuggestions: 5, enableLearning: true }
 * );
 *
 * // When user executes a command
 * updateCommandUsage("help");
 * ```
 */
export function useCommandSuggestions(
  input: string,
  availableCommands: string[],
  options: {
    maxSuggestions?: number;
    debounceMs?: number;
    showOnEmpty?: boolean;
    enableCache?: boolean;
    enableLearning?: boolean;
    minQueryLength?: number;
  } = {},
) {
  const {
    maxSuggestions = 8,
    debounceMs = 50,
    showOnEmpty = true,
    enableCache = true,
    enableLearning = true,
    minQueryLength = 1,
  } = options;

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>(() => ({
    recentCommands: [],
    frequentCommands: new Map(),
    commandSequences: new Map(),
    sessionStartTime: new Date(),
    totalCommands: 0,
  }));

  const cacheRef = useRef(new SuggestionCache());
  const commandMetadataRef = useRef(new Map(Object.entries(COMMAND_METADATA)));
  const lastQueryRef = useRef("");

  const debouncedInput = useDebouncedValue(input.trim(), debounceMs);

  const updateCommandUsage = useCallback(
    (command: string) => {
      if (!enableLearning) return;

      setUserContext((prev) => {
        const newContext = { ...prev };

        newContext.recentCommands = [
          command,
          ...prev.recentCommands.filter((c) => c !== command),
        ].slice(0, 10);

        const currentFreq = prev.frequentCommands.get(command) || 0;
        newContext.frequentCommands.set(command, currentFreq + 1);

        newContext.totalCommands++;

        return newContext;
      });

      const metadata = commandMetadataRef.current.get(command);
      if (metadata) {
        metadata.frequency++;
        metadata.lastUsed = new Date();
      }
    },
    [enableLearning],
  );

  const generateContextualSuggestions = useCallback(
    (query: string): SuggestionItem[] => {
      console.log("generateContextualSuggestions called:", {
        query,
        showOnEmpty,
        availableCommandsCount: availableCommands.length,
        recentCommandsCount: userContext.recentCommands.length,
      });

      const results: SuggestionItem[] = [];

      if (!query && showOnEmpty) {
        console.log("Generating empty query suggestions...");

        userContext.recentCommands.forEach((cmd, index) => {
          if (availableCommands.includes(cmd)) {
            const metadata = commandMetadataRef.current.get(cmd);
            results.push({
              command: cmd,
              score: 90 - index * 5,
              type: "recent",
              description: metadata?.description,
              category: metadata?.category,
              frequency: metadata?.frequency || 0,
              lastUsed: metadata?.lastUsed,
            });
          }
        });

        const popularCommands = [
          "help",
          "about",
          "skills",
          "projects",
          "contact",
        ].filter(
          (cmd) =>
            availableCommands.includes(cmd) &&
            !userContext.recentCommands.includes(cmd),
        );

        popularCommands.forEach((cmd, index) => {
          const metadata = commandMetadataRef.current.get(cmd);
          results.push({
            command: cmd,
            score: 80 - index * 3,
            type: "popular",
            description: metadata?.description,
            category: metadata?.category,
            frequency: metadata?.frequency || 0,
          });
        });

        return results.slice(0, maxSuggestions);
      }

      const uniqueCommands = Array.from(new Set(availableCommands));

      for (const command of uniqueCommands) {
        const score = FuzzyMatcher.calculateScore(query, command);

        if (score > 0) {
          const metadata = commandMetadataRef.current.get(command);
          const isRecent = userContext.recentCommands.includes(command);
          const frequency = userContext.frequentCommands.get(command) || 0;

          let adjustedScore = score;
          if (isRecent) adjustedScore += 15;
          if (frequency > 0) adjustedScore += Math.min(frequency * 2, 20);
          if (metadata?.lastUsed) {
            const daysSinceUsed =
              (Date.now() - metadata.lastUsed.getTime()) /
              (1000 * 60 * 60 * 24);
            if (daysSinceUsed < 1) adjustedScore += 10;
          }

          let type: SuggestionItem["type"] = "fuzzy";
          if (score >= 100) type = "exact";
          else if (score >= 85) type = "prefix";
          else if (isRecent && frequency > 0) type = "contextual";

          results.push({
            command,
            score: adjustedScore,
            type,
            description: metadata?.description,
            category: metadata?.category,
            usage: metadata?.usage,
            frequency: frequency,
            lastUsed: metadata?.lastUsed,
          });
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
    },
    [availableCommands, userContext, showOnEmpty, maxSuggestions],
  );

  const generateSuggestions = useMemo(() => {
    return (query: string): SuggestionItem[] => {
      if (enableCache) {
        const cached = cacheRef.current.get(query);
        if (cached) {
          return cached;
        }
      }

      setIsLoading(true);
      const suggestions = generateContextualSuggestions(query);

      if (enableCache) {
        cacheRef.current.set(query, suggestions);
      }

      setIsLoading(false);
      return suggestions;
    };
  }, [generateContextualSuggestions, enableCache]);

  useEffect(() => {
    console.log("useCommandSuggestions effect:", {
      debouncedInput,
      debouncedInputLength: debouncedInput.length,
      minQueryLength,
      showOnEmpty,
      availableCommands: availableCommands.length,
    });

    if (debouncedInput.length < minQueryLength && !showOnEmpty) {
      console.log("Clearing suggestions due to length check");
      setSuggestions([]);
      return;
    }

    console.log("Generating suggestions...");
    const newSuggestions = generateSuggestions(debouncedInput);
    console.log("Generated suggestions:", newSuggestions);
    setSuggestions(newSuggestions);
    lastQueryRef.current = debouncedInput;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, generateSuggestions, minQueryLength, showOnEmpty]);

  return {
    suggestions,
    isLoading,
    updateCommandUsage,
    clearCache: () => cacheRef.current.clear(),
    getUserContext: () => userContext,
    setUserContext,
  };
}
