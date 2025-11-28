"use client";

import { JSX } from "react";
import { useTheme } from "@/hooks/useTheme";

interface TabCompletionProps {
  input: string;
  availableCommands: string[];
  onComplete: (completion: string) => void;
  visible: boolean;
}

/**
 * Displays tab completion suggestions for a command input with enhanced UX.
 * @param root0
 * @param root0.input
 * @param root0.availableCommands
 * @param root0.onComplete
 * @param root0.visible
 */
export function TabCompletion({
  input,
  availableCommands,
  onComplete,
  visible,
}: TabCompletionProps): JSX.Element | null {
  const { themeConfig, theme } = useTheme();

  if (!visible) return null;

  const completions = availableCommands.filter((cmd) =>
    cmd.toLowerCase().startsWith(input.toLowerCase()),
  );

  if (completions.length === 0) return null;

  return (
    <div
      key={`tab-completion-${theme}`}
      className="absolute top-full left-0 mt-1 rounded border shadow-lg z-10 min-w-[250px] overflow-hidden transition-all duration-200 ease-out animate-in slide-in-from-top"
      style={{
        backgroundColor: themeConfig.colors.bg,
        borderColor: themeConfig.colors.border,
        boxShadow: `0 8px 25px -5px ${themeConfig.colors.accent}30, 0 4px 10px -2px ${themeConfig.colors.accent}20`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 text-xs font-mono border-b flex items-center justify-between"
        style={{
          backgroundColor: `${themeConfig.colors.accent}10`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center gap-2">
          <span>⚡ Tab completion</span>
          <span className="opacity-60">
            • {completions.length} option{completions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-60">
          <span>Tab</span>
          <span>Enter</span>
        </div>
      </div>

      {/* Completions list */}
      <div className="max-h-48 overflow-y-auto scrollbar-thin">
        {completions.map((completion) => (
          <button
            key={completion}
            onClick={() => onComplete(completion)}
            className="w-full text-left px-3 py-2.5 cursor-pointer transition-all duration-150 focus:outline-none hover:opacity-100 opacity-90 group"
            style={{
              backgroundColor: "transparent",
              borderLeft: "3px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${themeConfig.colors.accent}15`;
              e.currentTarget.style.borderLeftColor = themeConfig.colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderLeftColor = "transparent";
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm"
                style={{ color: themeConfig.colors.accent }}
              >
                ⚡
              </span>
              <div className="flex-1">
                <span
                  className="font-mono font-medium"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {completion.substring(0, input.length)}
                </span>
                <span
                  className="font-mono"
                  style={{ color: themeConfig.colors.text }}
                >
                  {completion.substring(input.length)}
                </span>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}15`,
                  color: themeConfig.colors.accent,
                }}
              >
                Tab
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-2 text-xs text-center border-t"
        style={{
          backgroundColor: `${themeConfig.colors.muted}05`,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.muted,
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <span>⚡ Press Tab to complete</span>
          <span>•</span>
          <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
}
