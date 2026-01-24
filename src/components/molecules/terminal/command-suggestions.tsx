"use client";

import { useState, useEffect, useRef, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
  useCommandSuggestions,
  type SuggestionItem,
} from "@/hooks/use-command-suggestions";

/**
 * Props for the CommandSuggestions component
 * @interface CommandSuggestionsProps
 * @property {string} input - Current input value for matching suggestions
 * @property {string[]} availableCommands - List of available commands
 * @property {boolean} visible - Whether suggestions should be visible
 * @property {(suggestion: string) => void} onSelect - Callback when suggestion is selected
 * @property {(command: string) => void} [onCommandUsed] - Callback when command is used
 * @property {number} [maxSuggestions] - Maximum number of suggestions to show
 * @property {boolean} [showOnEmpty] - Show suggestions when input is empty
 * @property {boolean} [showDescriptions] - Show command descriptions
 * @property {boolean} [enableLearning] - Enable learning from user behavior
 * @property {boolean} [enableCache] - Enable suggestion caching
 * @property {number} [minQueryLength] - Minimum query length to show suggestions
 * @property {number} [debounceMs] - Debounce delay in milliseconds
 */
interface CommandSuggestionsProps {
  input: string;
  availableCommands: string[];
  visible: boolean;
  onSelect: (suggestion: string) => void;
  onCommandUsed?: (command: string) => void;
  maxSuggestions?: number;
  showOnEmpty?: boolean;
  showDescriptions?: boolean;
  enableLearning?: boolean;
  enableCache?: boolean;
  minQueryLength?: number;
  debounceMs?: number;
}

/**
 * Advanced command suggestions component with fuzzy matching and learning
 * Provides intelligent command suggestions with caching, personalization, and keyboard navigation
 *
 * Features:
 * - Advanced fuzzy matching with contextual scoring
 * - Real-time suggestions with optimized debouncing
 * - User behavior learning and personalization
 * - Intelligent caching for performance
 * - Keyboard navigation with smooth scrolling
 * - Visual feedback and loading states
 * - Accessibility support
 *
 * @param {CommandSuggestionsProps} props - Component props
 * @param {string} props.input - Current input for matching
 * @param {string[]} props.availableCommands - Available commands
 * @param {boolean} props.visible - Visibility state
 * @param {(suggestion: string) => void} props.onSelect - Selection callback
 * @param {number} [props.maxSuggestions=8] - Max suggestions to display
 * @param {boolean} [props.showOnEmpty=true] - Show when input is empty
 * @param {boolean} [props.enableCache=true] - Enable caching
 * @param {boolean} [props.enableLearning=true] - Enable learning
 * @returns {JSX.Element | null} The suggestions component or null
 * @example
 * ```tsx
 * <CommandSuggestions
 *   input={input}
 *   availableCommands={commands}
 *   visible={true}
 *   onSelect={handleSelect}
 *   maxSuggestions={5}
 * />
 * ```
 */
export function CommandSuggestions({
  input,
  availableCommands,
  visible,
  onSelect,
  onCommandUsed,
  maxSuggestions = 8,
  showOnEmpty = true,
  showDescriptions = true,
  enableCache = true,
  enableLearning = true,
  minQueryLength = 0,
  debounceMs = 50,
}: CommandSuggestionsProps): JSX.Element | null {
  const { themeConfig, theme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const {
    suggestions,
    isLoading,
    updateCommandUsage,
    clearCache,
    getUserContext,
  } = useCommandSuggestions(input, availableCommands, {
    maxSuggestions,
    debounceMs,
    showOnEmpty,
    enableCache,
    enableLearning,
    minQueryLength,
  });

  useEffect(() => {
    console.log("CommandSuggestions visibility effect:", { visible, suggestionsLength: suggestions.length });

    if (visible && suggestions.length > 0) {
      const timer = setTimeout(() => {
        console.log("Setting isVisible to true");
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      console.log("Setting isVisible to false");
      setIsVisible(false);
    }
  }, [visible, suggestions.length]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  useEffect(() => {
    if (selectedItemRef.current && isVisible) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectedIndex, isVisible]);

  useEffect(() => {
    if (!visible || !isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

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
            const selectedCommand = suggestions[selectedIndex].command;
            onSelect(selectedCommand);

            if (enableLearning) {
              updateCommandUsage(selectedCommand);
              onCommandUsed?.(selectedCommand);
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsVisible(false);
          break;
        case "c":
          if (e.ctrlKey) {
            e.preventDefault();
            clearCache();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    visible,
    isVisible,
    suggestions,
    selectedIndex,
    onSelect,
    updateCommandUsage,
    onCommandUsed,
    enableLearning,
    clearCache,
  ]);

  if (!isVisible || suggestions.length === 0 || !themeConfig?.colors) {
    console.log("CommandSuggestions NOT rendering:", {
      isVisible,
      suggestionsLength: suggestions.length,
      hasThemeConfig: !!themeConfig?.colors
    });
    return null;
  }

  console.log("CommandSuggestions IS rendering:", {
    isVisible,
    suggestionsLength: suggestions.length,
    suggestions: suggestions.map(s => s.command)
  });

  const getTypeIcon = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "exact":
        return "⚡";
      case "prefix":
        return "🔍";
      case "fuzzy":
        return "📝";
      case "contextual":
        return "🧠";
      case "recent":
        return "🕒";
      case "popular":
        return "⭐";
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
      case "contextual":
        return themeConfig.colors.info || themeConfig.colors.accent;
      case "recent":
        return themeConfig.colors.info || themeConfig.colors.muted;
      case "popular":
        return themeConfig.colors.success || themeConfig.colors.accent;
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

  const handleSuggestionClick = (suggestion: SuggestionItem, index: number) => {
    setSelectedIndex(index);
    onSelect(suggestion.command);

    if (enableLearning) {
      updateCommandUsage(suggestion.command);
      onCommandUsed?.(suggestion.command);
    }
  };

  const userContext = getUserContext();

  return (
    <div
      ref={containerRef}
      key={`-suggestions-${theme}`}
      className={`absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border shadow-xl overflow-hidden transition-all duration-300 ease-out transform-gpu ${isVisible
        ? "opacity-100 scale-100 translate-y-0"
        : "opacity-0 scale-95 -translate-y-2"
        }`}
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        boxShadow: `0 10px 30px -8px ${themeConfig.colors.accent}25, 0 4px 12px -4px ${themeConfig.colors.accent}15`,
        backdropFilter: "blur(8px)",
      }}
    >
      { }
      <div
        className="px-4 py-3 text-xs font-mono border-b flex items-center justify-between"
        style={{
          backgroundColor: `${themeConfig.colors.accent}08`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            💡{" "}
            <span className="font-medium">
              {suggestions.length} suggestion
              {suggestions.length !== 1 ? "s" : ""}
            </span>
          </span>
          {isLoading && (
            <span className="flex items-center gap-1 text-xs opacity-75">
              <span className="animate-spin">⟳</span>
              Loading...
            </span>
          )}
          {suggestions[selectedIndex] && (
            <span className="opacity-70 text-xs">
              • {suggestions[selectedIndex].type}
            </span>
          )}
          {enableLearning && userContext.totalCommands > 0 && (
            <span className="opacity-60 text-xs">
              • {userContext.totalCommands} commands used
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs opacity-60">
          <span>↑↓ Navigate</span>
          <span>•</span>
          <span>Enter/Tab Select</span>
          <span>•</span>
          <span>Esc Close</span>
        </div>
      </div>

      { }
      <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current scrollbar-thumb-opacity-20">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.command}-${index}-${suggestion.type}`}
            ref={index === selectedIndex ? selectedItemRef : null}
            type="button"
            role="option"
            aria-selected={index === selectedIndex}
            tabIndex={0}
            className={`w-full text-left px-4 py-3 cursor-pointer transition-all duration-200 ease-out focus:outline-none group relative ${index === selectedIndex
              ? "opacity-100 transform scale-[1.02]"
              : "opacity-85 hover:opacity-100 hover:transform hover:scale-[1.01]"
              }`}
            style={{
              backgroundColor:
                index === selectedIndex
                  ? `${themeConfig.colors.accent}12`
                  : "transparent",
              borderLeft:
                index === selectedIndex
                  ? `3px solid ${themeConfig.colors.accent}`
                  : "3px solid transparent",
            }}
            onClick={() => handleSuggestionClick(suggestion, index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSuggestionClick(suggestion, index);
              }
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center justify-between min-w-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                { }
                <span
                  className="shrink-0 text-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ color: getTypeColor(suggestion.type) }}
                  title={`Match type: ${suggestion.type}`}
                >
                  {getTypeIcon(suggestion.type)}
                </span>

                { }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono font-semibold truncate text-base"
                      style={{
                        color:
                          index === selectedIndex
                            ? themeConfig.colors.accent
                            : themeConfig.colors.text,
                      }}
                    >
                      {suggestion.command}
                    </span>

                    { }
                    {suggestion.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{
                          backgroundColor: `${getCategoryColor(suggestion.category)}15`,
                          color: getCategoryColor(suggestion.category),
                        }}
                      >
                        {suggestion.category}
                      </span>
                    )}

                    { }
                    {enableLearning &&
                      suggestion.frequency &&
                      suggestion.frequency > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: `${themeConfig.colors.success}15`,
                            color: themeConfig.colors.success,
                          }}
                          title={`Used ${suggestion.frequency} times`}
                        >
                          {suggestion.frequency}x
                        </span>
                      )}
                  </div>

                  { }
                  {showDescriptions && suggestion.description && (
                    <div
                      className="text-sm mb-1 opacity-75 leading-relaxed"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {suggestion.description}
                    </div>
                  )}

                  { }
                  {suggestion.usage && (
                    <div
                      className="text-xs font-mono opacity-60 bg-black bg-opacity-10 px-2 py-1 rounded"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      Usage: {suggestion.usage}
                    </div>
                  )}
                </div>
              </div>

              { }
              <div className="flex items-center gap-2 shrink-0 ml-3">
                { }
                {suggestion.lastUsed && (
                  <span
                    className="text-xs px-2 py-1 rounded-full opacity-60"
                    style={{
                      backgroundColor: `${themeConfig.colors.info}10`,
                      color: themeConfig.colors.info,
                    }}
                    title={`Last used: ${suggestion.lastUsed.toLocaleString()}`}
                  >
                    Recent
                  </span>
                )}

                { }
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}15`,
                    color: themeConfig.colors.accent,
                  }}
                  title="Match confidence score"
                >
                  {Math.round(suggestion.score)}%
                </span>
              </div>
            </div>

            { }
            {index === selectedIndex && (
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundColor: themeConfig.colors.accent }}
              />
            )}
          </button>
        ))}
      </div>

      { }
      <div
        className="px-4 py-3 text-xs border-t"
        style={{
          backgroundColor: `${themeConfig.colors.muted}03`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>💡 Smart suggestions enabled</span>
            {enableLearning && <span>🧠 Learning from your usage</span>}
            {enableCache && <span>⚡ Intelligent caching</span>}
          </div>
          <div className="text-xs opacity-60">Ctrl+C to clear cache</div>
        </div>
      </div>
    </div>
  );
}
