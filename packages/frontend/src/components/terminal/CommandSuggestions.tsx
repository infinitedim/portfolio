"use client";

import { useState, useEffect, useMemo, useRef, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { TypoTolerance } from "@portfolio/frontend/src/lib/commands/typoTolerance";
import { useDebouncedValue } from "@portfolio/frontend/src/hooks/useDebouncedValue";

interface CommandSuggestionsProps {
  /** Current input value */
  input: string;
  /** Available commands to suggest from */
  availableCommands: string[];
  /** Whether to show suggestions */
  visible: boolean;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: string) => void;
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Whether to show suggestions for empty input */
  showOnEmpty?: boolean;
  /** Whether to show command descriptions */
  showDescriptions?: boolean;
}

interface SuggestionItem {
  command: string;
  score: number;
  type: "exact" | "prefix" | "fuzzy" | "typo" | "popular" | "recent";
  description?: string;
  usage?: string;
  category?: string;
}

// Command descriptions for better UX
const COMMAND_DESCRIPTIONS: Record<
  string,
  { description: string; category: string; usage?: string }
> = {
  help: { description: "Show available commands and help", category: "system" },
  clear: { description: "Clear terminal history", category: "system" },
  about: { description: "Show information about me", category: "info" },
  skills: {
    description: "Display technical skills and expertise",
    category: "info",
  },
  projects: { description: "Show portfolio projects", category: "info" },
  contact: { description: "Display contact information", category: "info" },
  experience: { description: "Show work experience", category: "info" },
  education: {
    description: "Display educational background",
    category: "info",
  },
  roadmap: { description: "Show learning roadmap progress", category: "info" },
  theme: {
    description: "Change terminal theme",
    category: "customization",
    usage: "theme [name]",
  },
  fonts: {
    description: "Change terminal font",
    category: "customization",
    usage: "fonts [name]",
  },
  customize: {
    description: "Open customization panel",
    category: "customization",
  },
  status: { description: "Show system status", category: "system" },
  alias: {
    description: "Manage command aliases",
    category: "system",
    usage: "alias [command] [alias]",
  },
};

/**
 * Displays a live list of command suggestions as the user types,
 * with typo tolerance, fuzzy matching, and enhanced UX features.
 * @param root0
 * @param root0.input
 * @param root0.availableCommands
 * @param root0.visible
 * @param root0.onSelect
 * @param root0.maxSuggestions
 * @param root0.showOnEmpty
 * @param root0.showDescriptions
 */
export function CommandSuggestions({
  input,
  availableCommands,
  visible,
  onSelect,
  maxSuggestions = 8,
  showOnEmpty = false,
  showDescriptions = true,
}: CommandSuggestionsProps): JSX.Element | null {
  const { themeConfig, theme } = useTheme();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Debounce input for better performance with reduced delay
  const debouncedInput = useDebouncedValue(input, 100);

  // Smooth visibility transitions
  useEffect(() => {
    if (visible && suggestions.length > 0) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150);
      return () => clearTimeout(timer);
    }
  }, [visible, suggestions.length]);

  // Memoize suggestions generation for performance
  const generatedSuggestions = useMemo(() => {
    if (!input.trim() && !showOnEmpty) {
      return [];
    }

    const currentCommand = input.split(" ")[0].toLowerCase();
    if (!currentCommand && !showOnEmpty) {
      return [];
    }

    const newSuggestions: SuggestionItem[] = [];

    // Get unique commands (remove aliases duplicates)
    const uniqueCommands = Array.from(new Set(availableCommands));

    for (const command of uniqueCommands) {
      const lowerCommand = command.toLowerCase();
      const lowerInput = currentCommand.toLowerCase();
      const commandInfo = COMMAND_DESCRIPTIONS[command];

      let suggestionItem: SuggestionItem | null = null;

      // 1. Exact match (highest priority)
      if (lowerCommand === lowerInput && debouncedInput.trim()) {
        suggestionItem = {
          command,
          score: 100,
          type: "exact",
          description: commandInfo?.description,
          category: commandInfo?.category,
          usage: commandInfo?.usage,
        };
      }
      // 2. Prefix match (high priority)
      else if (lowerCommand.startsWith(lowerInput) && debouncedInput.trim()) {
        suggestionItem = {
          command,
          score: 85 + (lowerInput.length / lowerCommand.length) * 10,
          type: "prefix",
          description: commandInfo?.description,
          category: commandInfo?.category,
          usage: commandInfo?.usage,
        };
      }
      // 3. Fuzzy match (medium priority)
      else if (lowerCommand.includes(lowerInput) && debouncedInput.trim()) {
        const position = lowerCommand.indexOf(lowerInput);
        const score =
          65 - position * 2 + (lowerInput.length / lowerCommand.length) * 10;
        suggestionItem = {
          command,
          score: Math.max(score, 35),
          type: "fuzzy",
          description: commandInfo?.description,
          category: commandInfo?.category,
          usage: commandInfo?.usage,
        };
      }
      // 4. Typo tolerance (lower priority)
      else if (debouncedInput.trim()) {
        const distance = TypoTolerance.levenshteinDistance(
          lowerInput,
          lowerCommand,
        );
        const maxDistance = Math.max(2, Math.floor(lowerCommand.length * 0.4));

        if (distance <= maxDistance && distance > 0) {
          const score = Math.max(55 - distance * 8, 15);
          suggestionItem = {
            command,
            score,
            type: "typo",
            description: commandInfo?.description,
            category: commandInfo?.category,
            usage: commandInfo?.usage,
          };
        }
      }
      // 5. Show popular commands when empty (if enabled)
      else if (!debouncedInput.trim() && showOnEmpty) {
        const isPopular = [
          "help",
          "about",
          "skills",
          "projects",
          "contact",
        ].includes(command);
        suggestionItem = {
          command,
          score: isPopular ? 70 : 50,
          type: isPopular ? "popular" : "recent",
          description: commandInfo?.description,
          category: commandInfo?.category,
          usage: commandInfo?.usage,
        };
      }

      if (suggestionItem) {
        newSuggestions.push(suggestionItem);
      }
    }

    // Sort by score (highest first) and limit results
    return newSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }, [input, showOnEmpty, availableCommands, maxSuggestions, debouncedInput]);

  // Update suggestions when generated suggestions change
  useEffect(() => {
    setSuggestions(generatedSuggestions);
    setSelectedIndex(0);
  }, [generatedSuggestions]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation with improved UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1,
          );
          break;
        case "Enter":
        case "Tab":
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            onSelect(suggestions[selectedIndex].command);
          }
          break;
        case "Escape":
          e.preventDefault();
          setSuggestions([]);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, suggestions, selectedIndex, onSelect]);

  if (!isVisible || suggestions.length === 0 || !themeConfig?.colors) {
    return null;
  }

  const getTypeIcon = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "exact":
        return "⚡";
      case "prefix":
        return "🔍";
      case "fuzzy":
        return "📝";
      case "typo":
        return "🔧";
      case "popular":
        return "⭐";
      case "recent":
        return "🕒";
      default:
        return "💡";
    }
  };

  const getTypeColor = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "exact":
        return themeConfig.colors.success || themeConfig.colors.accent;
      case "prefix":
        return themeConfig.colors.accent;
      case "fuzzy":
        return themeConfig.colors.warning || themeConfig.colors.text;
      case "typo":
        return themeConfig.colors.error || themeConfig.colors.muted;
      case "popular":
        return themeConfig.colors.success || themeConfig.colors.accent;
      case "recent":
        return themeConfig.colors.info || themeConfig.colors.muted;
      default:
        return themeConfig.colors.text;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "system":
        return themeConfig.colors.error || themeConfig.colors.accent;
      case "info":
        return themeConfig.colors.info || themeConfig.colors.accent;
      case "customization":
        return themeConfig.colors.warning || themeConfig.colors.accent;
      default:
        return themeConfig.colors.muted;
    }
  };

  return (
    <div
      ref={containerRef}
      key={`command-suggestions-${theme}`}
      className={`absolute top-full left-0 right-0 z-50 mt-1 rounded border shadow-lg overflow-hidden transition-all duration-200 ease-out ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        boxShadow: `0 8px 25px -5px ${themeConfig.colors.accent}30, 0 4px 10px -2px ${themeConfig.colors.accent}20`,
      }}
    >
      {/* Enhanced Header */}
      <div
        className="px-3 py-2 text-xs font-mono border-b flex items-center justify-between"
        style={{
          backgroundColor: `${themeConfig.colors.accent}10`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center gap-2">
          <span>
            💡 {suggestions.length} suggestion
            {suggestions.length !== 1 ? "s" : ""}
          </span>
          {suggestions[selectedIndex] && (
            <span className="opacity-60">
              • {suggestions[selectedIndex].type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs opacity-60">
          <span>↑↓</span>
          <span>Enter/Tab</span>
          <span>Esc</span>
        </div>
      </div>

      {/* Enhanced Suggestions list */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.command}-${index}`}
            ref={index === selectedIndex ? selectedItemRef : null}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            tabIndex={0}
            className={`w-full text-left px-3 py-3 cursor-pointer transition-all duration-150 focus:outline-none group ${
              index === selectedIndex
                ? "opacity-100"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                index === selectedIndex
                  ? `${themeConfig.colors.accent}15`
                  : "transparent",
              borderLeft:
                index === selectedIndex
                  ? `3px solid ${themeConfig.colors.accent}`
                  : "3px solid transparent",
            }}
            onClick={() => onSelect(suggestion.command)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Tab") {
                e.preventDefault();
                onSelect(suggestion.command);
              }
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className="flex-shrink-0"
                  style={{ color: getTypeColor(suggestion.type) }}
                >
                  {getTypeIcon(suggestion.type)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono font-medium truncate"
                      style={{
                        color:
                          index === selectedIndex
                            ? themeConfig.colors.accent
                            : themeConfig.colors.text,
                      }}
                    >
                      {suggestion.command}
                    </span>

                    {suggestion.category && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: `${getCategoryColor(suggestion.category)}20`,
                          color: getCategoryColor(suggestion.category),
                        }}
                      >
                        {suggestion.category}
                      </span>
                    )}
                  </div>

                  {showDescriptions && suggestion.description && (
                    <div
                      className="text-xs mt-1 truncate opacity-70"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {suggestion.description}
                    </div>
                  )}

                  {suggestion.usage && (
                    <div
                      className="text-xs mt-1 font-mono opacity-60"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      Usage: {suggestion.usage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {suggestion.type === "typo" && (
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${themeConfig.colors.warning || themeConfig.colors.accent}20`,
                      color:
                        themeConfig.colors.warning || themeConfig.colors.accent,
                    }}
                  >
                    fix
                  </span>
                )}
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}15`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {Math.round(suggestion.score)}%
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Enhanced Footer */}
      <div
        className="px-3 py-2 text-xs text-center border-t"
        style={{
          backgroundColor: `${themeConfig.colors.muted}05`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <span>💡 Type 'help' for all commands</span>
          <span>•</span>
          <span>🔧 Smart suggestions enabled</span>
        </div>
      </div>
    </div>
  );
}
