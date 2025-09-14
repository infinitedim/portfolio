"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

// Enhanced suggestion types with better context
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

// Command metadata with enhanced information
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

// User behavior tracking for personalized suggestions
interface UserContext {
  recentCommands: string[];
  frequentCommands: Map<string, number>;
  commandSequences: Map<string, string[]>;
  sessionStartTime: Date;
  totalCommands: number;
}

// Enhanced command database with better categorization
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

// Advanced fuzzy matching with better scoring
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

    // Exact match
    if (lowerQuery === lowerTarget) {
      return this.WEIGHTS.EXACT_MATCH;
    }

    // Prefix match
    if (lowerTarget.startsWith(lowerQuery)) {
      const lengthRatio = lowerQuery.length / lowerTarget.length;
      return (
        this.WEIGHTS.PREFIX_MATCH + lengthRatio * this.WEIGHTS.POSITION_BONUS
      );
    }

    // Word boundary match
    const words = lowerTarget.split(/[-_\s]+/);
    for (const word of words) {
      if (word.startsWith(lowerQuery)) {
        return this.WEIGHTS.WORD_BOUNDARY;
      }
    }

    // Sequential character match
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

// Enhanced suggestion cache with TTL and smart invalidation
class SuggestionCache {
  private cache = new Map<
    string,
    { suggestions: SuggestionItem[]; timestamp: number; hits: number }
  >();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 100;

  set(key: string, suggestions: SuggestionItem[]): void {
    // Cleanup old entries if cache is full
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

    // Check TTL
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count for LRU-like behavior
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
 * Enhanced command suggestions hook with real-time performance optimization,
 * fuzzy matching, user context awareness, and intelligent caching.
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
    debounceMs = 50, // Reduced for more responsive feel
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

  // Refs for persistent data
  const cacheRef = useRef(new SuggestionCache());
  const commandMetadataRef = useRef(new Map(Object.entries(COMMAND_METADATA)));
  const lastQueryRef = useRef("");

  // Debounced input for performance
  const debouncedInput = useDebouncedValue(input.trim(), debounceMs);

  // Update command metadata with usage frequency
  const updateCommandUsage = useCallback(
    (command: string) => {
      if (!enableLearning) return;

      setUserContext((prev) => {
        const newContext = { ...prev };

        // Update recent commands
        newContext.recentCommands = [
          command,
          ...prev.recentCommands.filter((c) => c !== command),
        ].slice(0, 10);

        // Update frequency
        const currentFreq = prev.frequentCommands.get(command) || 0;
        newContext.frequentCommands.set(command, currentFreq + 1);

        // Update total commands
        newContext.totalCommands++;

        return newContext;
      });

      // Update metadata
      const metadata = commandMetadataRef.current.get(command);
      if (metadata) {
        metadata.frequency++;
        metadata.lastUsed = new Date();
      }
    },
    [enableLearning],
  );

  // Generate contextual suggestions based on user behavior
  const generateContextualSuggestions = useCallback(
    (query: string): SuggestionItem[] => {
      const results: SuggestionItem[] = [];

      // If query is empty, show popular/recent commands
      if (!query && showOnEmpty) {
        // Recent commands
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

        // Popular commands
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

      // Generate suggestions for non-empty query
      const uniqueCommands = Array.from(new Set(availableCommands));

      for (const command of uniqueCommands) {
        const score = FuzzyMatcher.calculateScore(query, command);

        if (score > 0) {
          const metadata = commandMetadataRef.current.get(command);
          const isRecent = userContext.recentCommands.includes(command);
          const frequency = userContext.frequentCommands.get(command) || 0;

          // Apply context-based scoring bonuses
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

      // Sort by score and return top results
      return results.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
    },
    [availableCommands, userContext, showOnEmpty, maxSuggestions],
  );

  // Memoized suggestion generation with caching
  const generateSuggestions = useMemo(() => {
    return (query: string): SuggestionItem[] => {
      // Check cache first
      if (enableCache) {
        const cached = cacheRef.current.get(query);
        if (cached) {
          return cached;
        }
      }

      setIsLoading(true);
      const suggestions = generateContextualSuggestions(query);

      // Cache the results
      if (enableCache) {
        cacheRef.current.set(query, suggestions);
      }

      setIsLoading(false);
      return suggestions;
    };
  }, [generateContextualSuggestions, enableCache]);

  // Update suggestions when debounced input changes
  useEffect(() => {
    if (debouncedInput.length < minQueryLength && !showOnEmpty) {
      setSuggestions([]);
      return;
    }

    const newSuggestions = generateSuggestions(debouncedInput);
    setSuggestions(newSuggestions);
    lastQueryRef.current = debouncedInput;
  }, [debouncedInput, generateSuggestions, minQueryLength, showOnEmpty]);

  // Public API
  return {
    suggestions,
    isLoading,
    updateCommandUsage,
    clearCache: () => cacheRef.current.clear(),
    getUserContext: () => userContext,
    setUserContext,
  };
}
