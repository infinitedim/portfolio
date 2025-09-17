/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import {
  useCommandSuggestions,
  type SuggestionItem,
} from "@portfolio/frontend/src/hooks/useCommandSuggestions";

// Real-time performance metrics
interface RealTimeMetrics {
  responseTime: number;
  cacheHitRate: number;
  suggestionAccuracy: number;
  typingSpeed: number; // chars per second
  queriesPerSecond: number;
  memoryUsage: number;
  renderTime: number;
  streamingLatency: number;
}

// Live typing indicators
interface TypingIndicator {
  isTyping: boolean;
  speed: number;
  rhythm: number[];
  confidence: number;
}

// Streaming suggestion state
interface StreamingState {
  isStreaming: boolean;
  buffer: SuggestionItem[];
  streamedCount: number;
  totalExpected: number;
  progress: number;
}

interface RealTimeCommandSuggestionsProps {
  /** Current input value */
  input: string;
  /** Available commands to suggest from */
  availableCommands: string[];
  /** Whether to show suggestions */
  visible: boolean;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: string) => void;
  /** Callback when command is used (for learning) */
  onCommandUsed?: (command: string) => void;
  /** Maximum number of suggestions to show */
  maxSuggestions?: number;
  /** Whether to show suggestions for empty input */
  showOnEmpty?: boolean;
  /** Whether to show command descriptions */
  showDescriptions?: boolean;
  /** Whether to enable intelligent caching */
  enableCache?: boolean;
  /** Whether to enable user behavior learning */
  enableLearning?: boolean;
  /** Minimum query length before showing suggestions */
  minQueryLength?: number;
  /** Custom debounce delay in milliseconds */
  debounceMs?: number;
  /** Enable real-time performance monitoring */
  enableRealTimeMetrics?: boolean;
  /** Enable streaming suggestions */
  enableStreaming?: boolean;
  /** Enable live typing indicators */
  enableTypingIndicators?: boolean;
  /** Callback for performance metrics */
  onMetricsUpdate?: (metrics: RealTimeMetrics) => void;
}

/**
 * Enhanced real-time command suggestions with streaming, performance monitoring,
 * and live typing indicators for an optimal user experience.
 */
export function RealTimeCommandSuggestions({
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
  enableRealTimeMetrics = true,
  enableStreaming = true,
  enableTypingIndicators = true,
  onMetricsUpdate,
}: RealTimeCommandSuggestionsProps) {
  const { themeConfig } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    responseTime: 0,
    cacheHitRate: 0,
    suggestionAccuracy: 0,
    typingSpeed: 0,
    queriesPerSecond: 0,
    memoryUsage: 0,
    renderTime: 0,
    streamingLatency: 0,
  });
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator>({
    isTyping: false,
    speed: 0,
    rhythm: [],
    confidence: 0,
  });
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    buffer: [],
    streamedCount: 0,
    totalExpected: 0,
    progress: 0,
  });

  // Refs for performance tracking
  const queryStartTime = useRef<number>(0);
  const lastInputTime = useRef<number>(0);
  const inputTimings = useRef<number[]>([]);
  const renderStartTime = useRef<number>(0);
  const cacheHits = useRef<number>(0);
  const totalQueries = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Use the enhanced suggestions hook
  const {
    suggestions: baseSuggestions,
    updateCommandUsage,
  } = useCommandSuggestions(input, availableCommands, {
    maxSuggestions,
    debounceMs,
    showOnEmpty,
    enableCache,
    enableLearning,
    minQueryLength,
  });

  // Real-time performance monitoring
  const trackMetrics = useCallback((startTime: number, type: 'query' | 'render' | 'stream') => {
    if (!enableRealTimeMetrics) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    setMetrics(prev => {
      const newMetrics = { ...prev };

      switch (type) {
        case 'query':
          newMetrics.responseTime = duration;
          newMetrics.cacheHitRate = totalQueries.current > 0 ?
            (cacheHits.current / totalQueries.current) * 100 : 0;
          break;
        case 'render':
          newMetrics.renderTime = duration;
          break;
        case 'stream':
          newMetrics.streamingLatency = duration;
          break;
      }

      // Calculate typing speed
      if (inputTimings.current.length > 1) {
        const recentTimings = inputTimings.current.slice(-10);
        const avgInterval = recentTimings.reduce((sum, time, i) => {
          if (i === 0) return sum;
          return sum + (time - recentTimings[i - 1]);
        }, 0) / (recentTimings.length - 1);

        newMetrics.typingSpeed = avgInterval > 0 ? 1000 / avgInterval : 0;
      }

      // Calculate queries per second
      const now = Date.now();
      const recentQueries = inputTimings.current.filter(time => now - time < 1000);
      newMetrics.queriesPerSecond = recentQueries.length;

      return newMetrics;
    });
  }, [enableRealTimeMetrics]);

  // Typing indicator tracking
  const trackTyping = useCallback((inputValue: string) => {
    if (!enableTypingIndicators) return;

    const now = performance.now();
    lastInputTime.current = now;
    inputTimings.current = [...inputTimings.current.slice(-20), now];

    setTypingIndicator(_prev => {
      const isTyping = inputValue.length > 0;
      const recentTimings = inputTimings.current.slice(-5);

      let speed = 0;
      let rhythm: number[] = [];
      let confidence = 0;

      if (recentTimings.length > 1) {
        const intervals = recentTimings.slice(1).map((time, i) =>
          time - recentTimings[i]
        );

        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        speed = avgInterval > 0 ? 1000 / avgInterval : 0;
        rhythm = intervals;

        // Calculate confidence based on consistency
        const variance = intervals.reduce((sum, interval) =>
          sum + Math.pow(interval - avgInterval, 2), 0
        ) / intervals.length;
        confidence = Math.max(0, 100 - (variance / 100));
      }

      return {
        isTyping,
        speed,
        rhythm,
        confidence: Math.min(100, confidence),
      };
    });

    // Auto-clear typing indicator
    setTimeout(() => {
      if (performance.now() - lastInputTime.current >= 500) {
        setTypingIndicator(prev => ({ ...prev, isTyping: false }));
      }
    }, 500);
  }, [enableTypingIndicators]);

  // Streaming suggestions simulation
  const streamSuggestions = useCallback(async (suggestions: SuggestionItem[]) => {
    if (!enableStreaming || suggestions.length <= 3) {
      return suggestions; // Don't stream for small result sets
    }

    const streamStart = performance.now();
    setStreamingState({
      isStreaming: true,
      buffer: [],
      streamedCount: 0,
      totalExpected: suggestions.length,
      progress: 0,
    });

    const streamedSuggestions: SuggestionItem[] = [];

    for (let i = 0; i < suggestions.length; i++) {
      // Simulate progressive loading with realistic timing
      const delay = Math.max(10, 50 - (i * 5)); // Faster as we go
      await new Promise(resolve => setTimeout(resolve, delay));

      streamedSuggestions.push(suggestions[i]);

      setStreamingState(prev => ({
        ...prev,
        buffer: [...streamedSuggestions],
        streamedCount: i + 1,
        progress: ((i + 1) / suggestions.length) * 100,
      }));
    }

    setStreamingState(prev => ({ ...prev, isStreaming: false }));
    trackMetrics(streamStart, 'stream');

    return streamedSuggestions;
  }, [enableStreaming, trackMetrics]);

  // Enhanced suggestions with streaming
  const [displayedSuggestions, setDisplayedSuggestions] = useState<SuggestionItem[]>([]);

  useEffect(() => {
    if (!baseSuggestions.length) {
      setDisplayedSuggestions([]);
      return;
    }

    queryStartTime.current = performance.now();
    totalQueries.current++;

    if (enableStreaming) {
      streamSuggestions(baseSuggestions)
        .then(streamed => {
          setDisplayedSuggestions(streamed);
          trackMetrics(queryStartTime.current, 'query');
          return streamed;
        })
        .catch(error => {
          console.warn('Streaming suggestions failed:', error);
          setDisplayedSuggestions(baseSuggestions);
        });
    } else {
      setDisplayedSuggestions(baseSuggestions);
      trackMetrics(queryStartTime.current, 'query');
    }
  }, [baseSuggestions, enableStreaming, streamSuggestions, trackMetrics]);

  // Track input changes
  useEffect(() => {
    trackTyping(input);
  }, [input, trackTyping]);

  // Smooth visibility transitions
  useEffect(() => {
    if (visible && displayedSuggestions.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [visible, displayedSuggestions.length]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [displayedSuggestions]);

  // Auto-scroll selected item
  useEffect(() => {
    if (selectedItemRef.current && isVisible) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex, isVisible]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible || !isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayedSuggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < displayedSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : displayedSuggestions.length - 1
          );
          break;
        case "Enter":
        case "Tab":
          if (displayedSuggestions[selectedIndex]) {
            e.preventDefault();
            const selectedCommand = displayedSuggestions[selectedIndex].command;
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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    visible,
    isVisible,
    displayedSuggestions,
    selectedIndex,
    onSelect,
    updateCommandUsage,
    onCommandUsed,
    enableLearning,
  ]);

  // Performance metrics callback
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Render performance tracking
  useEffect(() => {
    renderStartTime.current = performance.now();

    const observer = new MutationObserver(() => {
      trackMetrics(renderStartTime.current, 'render');
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => observer.disconnect();
  }, [trackMetrics]);

  if (!isVisible || displayedSuggestions.length === 0 || !themeConfig?.colors) {
    return null;
  }

  const handleSuggestionClick = (suggestion: SuggestionItem, index: number) => {
    setSelectedIndex(index);
    onSelect(suggestion.command);

    if (enableLearning) {
      updateCommandUsage(suggestion.command);
      onCommandUsed?.(suggestion.command);
    }
  };

  const getTypeIcon = (type: SuggestionItem["type"]) => {
    switch (type) {
      case "exact": return "⚡";
      case "prefix": return "🔍";
      case "fuzzy": return "📝";
      case "contextual": return "🧠";
      case "recent": return "🕒";
      case "popular": return "⭐";
      default: return "💡";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border shadow-xl overflow-hidden transition-all duration-300 ease-out transform-gpu ${isVisible
          ? "opacity-100 scale-100 translate-y-0"
          : "opacity-0 scale-95 -translate-y-2"
        }`}
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        boxShadow: `0 10px 30px -8px ${themeConfig.colors.accent}25`,
      }}
    >
      {/* Enhanced Header with Real-time Metrics */}
      <div
        className="px-4 py-3 text-xs font-mono border-b"
        style={{
          backgroundColor: `${themeConfig.colors.accent}08`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              💡 <span className="font-medium">{displayedSuggestions.length} suggestions</span>
            </span>

            {/* Streaming Progress */}
            {streamingState.isStreaming && (
              <span className="flex items-center gap-1">
                <span className="animate-pulse">📡</span>
                Streaming... {Math.round(streamingState.progress)}%
              </span>
            )}

            {/* Typing Indicator */}
            {enableTypingIndicators && typingIndicator.isTyping && (
              <span className="flex items-center gap-1 text-green-400">
                <span className="animate-bounce">⌨️</span>
                {Math.round(typingIndicator.speed)} cps
              </span>
            )}

            {/* Performance Metrics */}
            {enableRealTimeMetrics && (
              <span className="flex items-center gap-2 opacity-75">
                <span>⚡ {Math.round(metrics.responseTime)}ms</span>
                <span>📊 {Math.round(metrics.cacheHitRate)}% cached</span>
                <span>🎯 {Math.round(metrics.suggestionAccuracy)}% accuracy</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs opacity-60">
            <span>↑↓ Navigate • Enter/Tab Select • Esc Close</span>
          </div>
        </div>
      </div>

      {/* Suggestions List with Streaming Animation */}
      <div className="max-h-72 overflow-y-auto">
        {displayedSuggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.command}-${index}-rt`}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={`w-full text-left px-4 py-3 cursor-pointer transition-all duration-200 ease-out focus:outline-none group relative ${index === selectedIndex
                ? "opacity-100 transform scale-[1.02]"
                : "opacity-85 hover:opacity-100"
              } ${streamingState.isStreaming && index >= streamingState.streamedCount
                ? "animate-pulse"
                : ""
              }`}
            style={{
              backgroundColor: index === selectedIndex
                ? `${themeConfig.colors.accent}12`
                : "transparent",
              borderLeft: index === selectedIndex
                ? `3px solid ${themeConfig.colors.accent}`
                : "3px solid transparent",
            }}
            onClick={() => handleSuggestionClick(suggestion, index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span
                  className="flex-shrink-0 text-sm transition-transform duration-200 group-hover:scale-110"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {getTypeIcon(suggestion.type)}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono font-semibold truncate"
                      style={{
                        color: index === selectedIndex
                          ? themeConfig.colors.accent
                          : themeConfig.colors.text,
                      }}
                    >
                      {suggestion.command}
                    </span>

                    {suggestion.category && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${themeConfig.colors.accent}15`,
                          color: themeConfig.colors.accent,
                        }}
                      >
                        {suggestion.category}
                      </span>
                    )}
                  </div>

                  {showDescriptions && suggestion.description && (
                    <div
                      className="text-sm opacity-75"
                      style={{ color: themeConfig.colors.muted }}
                    >
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Real-time Footer */}
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
            <span>🚀 Real-time suggestions</span>
            {enableStreaming && <span>📡 Streaming enabled</span>}
            {enableRealTimeMetrics && (
              <span>📊 Performance monitoring active</span>
            )}
          </div>
          <div className="text-xs opacity-60">
            {Math.round(metrics.renderTime)}ms render time
          </div>
        </div>
      </div>
    </div>
  );
}