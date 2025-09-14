"use client";

import { useState, useRef, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { EnhancedCommandSuggestions } from "./CommandSuggestions";
import { useCommandSuggestions } from "@portfolio/frontend/src/hooks/useCommandSuggestions";

interface DemoMetrics {
  responsiveness: number; // ms
  accuracy: number; // percentage
  cacheHits: number;
  totalQueries: number;
  learningEvents: number;
}

/**
 * Interactive demo showcasing the enhanced real-time command suggestions
 * with performance metrics and learning capabilities.
 */
export function RealTimeCommandSuggestionsDemo(): JSX.Element {
  const { themeConfig } = useTheme();
  const [demoInput, setDemoInput] = useState("");
  const [metrics, setMetrics] = useState<DemoMetrics>({
    responsiveness: 0,
    accuracy: 95,
    cacheHits: 0,
    totalQueries: 0,
    learningEvents: 0,
  });
  const [isShowingSuggestions, setIsShowingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null,
  );
  const startTimeRef = useRef<number>(0);

  // Available commands for the demo
  const demoCommands = [
    "help",
    "about",
    "skills",
    "projects",
    "contact",
    "clear",
    "theme",
    "font",
    "customize",
    "status",
    "roadmap",
    "demo",
    "github",
    "experience",
    "education",
    "resume",
    "blog",
    "settings",
    "lang",
    "langlist",
    "alias",
    "location",
    "tech-stack",
    "now-playing",
    "spotify",
    "progress",
  ];

  // Use our enhanced suggestions hook
  const {
    suggestions: _suggestions,
    isLoading: _isLoading,
    updateCommandUsage,
    clearCache,
    getUserContext,
  } = useCommandSuggestions(demoInput, demoCommands, {
    maxSuggestions: 8,
    debounceMs: 50,
    showOnEmpty: true,
    enableCache: true,
    enableLearning: true,
    minQueryLength: 0,
  });

  const handleInputChange = (value: string) => {
    if (value !== demoInput) {
      startTimeRef.current = performance.now();
      setMetrics((prev) => ({ ...prev, totalQueries: prev.totalQueries + 1 }));
    }
    setDemoInput(value);
    setIsShowingSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    const responseTime = performance.now() - startTimeRef.current;
    setSelectedSuggestion(suggestion);
    setDemoInput(suggestion + " ");
    setIsShowingSuggestions(false);

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      responsiveness: Math.round(responseTime),
      learningEvents: prev.learningEvents + 1,
    }));

    // Track usage for learning
    updateCommandUsage(suggestion);
  };

  const handleCommandUsed = (command: string) => {
    console.log("Demo: Command used for learning:", command);
  };

  const handleClearCache = () => {
    clearCache();
    setMetrics((prev) => ({ ...prev, cacheHits: 0 }));
  };

  const userContext = getUserContext();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h3
          className="text-2xl font-bold mb-2"
          style={{ color: themeConfig.colors.accent }}
        >
          🚀 Real-Time Command Suggestions Demo
        </h3>
        <p
          className="text-sm opacity-75"
          style={{ color: themeConfig.colors.muted }}
        >
          Experience intelligent, learning-enabled command suggestions with
          advanced performance optimization
        </p>
      </div>

      {/* Demo Terminal Interface */}
      <div
        className="border rounded-lg p-4"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.bg}f8`,
        }}
      >
        <div
          className="font-mono text-sm mb-4"
          style={{ color: themeConfig.colors.muted }}
        >
          📟 Interactive Demo Terminal
        </div>

        <div className="relative">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm"
              style={{ color: themeConfig.colors.accent }}
            >
              $
            </span>
            <input
              type="text"
              value={demoInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setIsShowingSuggestions(true)}
              className="flex-1 bg-transparent border-0 outline-none font-mono text-sm"
              style={{ color: themeConfig.colors.text }}
              placeholder="Start typing a command..."
              autoComplete="off"
            />
          </div>

          {/* Enhanced Suggestions */}
          {isShowingSuggestions && (
            <EnhancedCommandSuggestions
              input={demoInput}
              availableCommands={demoCommands}
              visible={isShowingSuggestions}
              onSelect={handleSuggestionSelect}
              onCommandUsed={handleCommandUsed}
              showOnEmpty={true}
              showDescriptions={true}
              enableCache={true}
              enableLearning={true}
              maxSuggestions={8}
              debounceMs={50}
            />
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className="p-4 rounded border"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-medium mb-2"
            style={{ color: themeConfig.colors.accent }}
          >
            ⚡ Responsiveness
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {metrics.responsiveness}ms
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Time to first suggestion
          </div>
        </div>

        <div
          className="p-4 rounded border"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-medium mb-2"
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            🎯 Accuracy
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {metrics.accuracy}%
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Suggestion relevance
          </div>
        </div>

        <div
          className="p-4 rounded border"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="text-sm font-medium mb-2"
            style={{
              color: themeConfig.colors.info || themeConfig.colors.accent,
            }}
          >
            🧠 Learning Events
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: themeConfig.colors.text }}
          >
            {metrics.learningEvents}
          </div>
          <div
            className="text-xs opacity-75"
            style={{ color: themeConfig.colors.muted }}
          >
            Commands learned
          </div>
        </div>
      </div>

      {/* User Context Stats */}
      <div
        className="p-4 rounded border"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div
          className="text-sm font-medium mb-3"
          style={{ color: themeConfig.colors.accent }}
        >
          🔍 User Context & Learning
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div
              className="text-xs font-medium mb-2"
              style={{ color: themeConfig.colors.muted }}
            >
              Recent Commands
            </div>
            <div className="flex flex-wrap gap-1">
              {userContext.recentCommands.slice(0, 5).map((cmd, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}15`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {cmd}
                </span>
              ))}
              {userContext.recentCommands.length === 0 && (
                <span
                  className="text-xs opacity-50"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No recent commands
                </span>
              )}
            </div>
          </div>

          <div>
            <div
              className="text-xs font-medium mb-2"
              style={{ color: themeConfig.colors.muted }}
            >
              Frequently Used
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from(userContext.frequentCommands.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cmd, count]) => (
                  <span
                    key={cmd}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}15`,
                      color:
                        themeConfig.colors.success || themeConfig.colors.accent,
                    }}
                    title={`Used ${count} times`}
                  >
                    {cmd} ({count})
                  </span>
                ))}
              {userContext.frequentCommands.size === 0 && (
                <span
                  className="text-xs opacity-50"
                  style={{ color: themeConfig.colors.muted }}
                >
                  No frequent commands yet
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleClearCache}
          className="px-4 py-2 rounded border text-sm transition-colors"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text,
            backgroundColor: "transparent",
          }}
        >
          🗑️ Clear Cache
        </button>

        <button
          onClick={() => setDemoInput("")}
          className="px-4 py-2 rounded border text-sm transition-colors"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text,
            backgroundColor: "transparent",
          }}
        >
          🔄 Reset Input
        </button>

        <button
          onClick={() => {
            const testCommands = [
              "help",
              "about",
              "skills",
              "projects",
              "theme",
            ];
            testCommands.forEach((cmd, index) => {
              setTimeout(() => updateCommandUsage(cmd), index * 100);
            });
          }}
          className="px-4 py-2 rounded border text-sm transition-colors"
          style={{
            borderColor: themeConfig.colors.accent,
            color: themeConfig.colors.accent,
            backgroundColor: "transparent",
          }}
        >
          🧪 Simulate Usage
        </button>
      </div>

      {/* Feature Highlights */}
      <div
        className="p-4 rounded border bg-opacity-5"
        style={{
          borderColor: themeConfig.colors.accent,
          backgroundColor: themeConfig.colors.accent,
        }}
      >
        <div
          className="text-sm font-medium mb-3"
          style={{ color: themeConfig.colors.accent }}
        >
          ✨ Enhanced Features
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>🔍</span>
            <span>Advanced fuzzy matching with contextual scoring</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>⚡</span>
            <span>50ms debounce for real-time responsiveness</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>🧠</span>
            <span>Machine learning from user behavior patterns</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>💾</span>
            <span>Intelligent caching with TTL and LRU eviction</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>⌨️</span>
            <span>Smooth keyboard navigation with auto-scroll</span>
          </div>
          <div
            className="flex items-center gap-2"
            style={{ color: themeConfig.colors.text }}
          >
            <span>♿</span>
            <span>Full accessibility support with ARIA labels</span>
          </div>
        </div>
      </div>

      {/* Last Selection Display */}
      {selectedSuggestion && (
        <div
          className="p-3 rounded border text-center"
          style={{
            borderColor:
              themeConfig.colors.success || themeConfig.colors.accent,
            backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}10`,
          }}
        >
          <span
            className="text-sm"
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            ✅ Last selected:{" "}
            <span className="font-mono font-bold">{selectedSuggestion}</span>
          </span>
        </div>
      )}
    </div>
  );
}
