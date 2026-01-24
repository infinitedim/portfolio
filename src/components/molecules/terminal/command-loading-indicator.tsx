"use client";

import { useState, useEffect, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";

/**
 * Props for the CommandLoadingIndicator component
 * @interface CommandLoadingIndicatorProps
 * @property {string} [command] - The command being processed
 * @property {boolean} [visible] - Whether indicator is visible
 * @property {string[]} [messages] - Custom loading messages
 */
interface CommandLoadingIndicatorProps {
  command?: string;
  visible?: boolean;
  messages?: string[];
}

const DEFAULT_MESSAGES = [
  "Processing command...",
  "Analyzing request...",
  "Gathering information...",
  "Compiling response...",
  "Almost done...",
];

/**
 * Loading indicator for command processing
 * Shows animated spinner and cycling messages while commands execute
 * @param {CommandLoadingIndicatorProps} props - Component props
 * @param {string} [props.command] - Command being processed
 * @param {boolean} [props.visible=false] - Visibility state
 * @param {string[]} [props.messages] - Custom messages (defaults to DEFAULT_MESSAGES)
 * @returns {JSX.Element | null} The loading indicator or null
 * @example
 * ```tsx
 * <CommandLoadingIndicator
 *   command="help"
 *   visible={isLoading}
 *   messages={['Processing...', 'Almost done...']}
 * />
 * ```
 */
export function CommandLoadingIndicator({
  command,
  visible = false,
  messages = DEFAULT_MESSAGES,
}: CommandLoadingIndicatorProps): JSX.Element | null {
  const { themeConfig } = useTheme();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!visible) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);

    return () => clearInterval(messageInterval);
  }, [visible, messages.length]);

  useEffect(() => {
    if (!visible) return;

    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(dotInterval);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setCurrentMessageIndex(0);
      setDots("");
    }
  }, [visible]);

  if (!visible || !themeConfig?.colors) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg bg-opacity-10 border border-opacity-20"
      style={{
        backgroundColor: `${themeConfig.colors.accent}10`,
        borderColor: `${themeConfig.colors.accent}20`,
        color: themeConfig.colors.text,
      }}
    >
      { }
      <div
        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `${themeConfig.colors.accent} transparent` }}
      />

      { }
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {command && (
            <span
              className="font-bold text-sm"
              style={{ color: themeConfig.colors.accent }}
            >
              {command}
            </span>
          )}
          <span className="text-sm">{messages[currentMessageIndex]}</span>
          <span
            className="w-6 text-left font-mono"
            style={{ color: themeConfig.colors.accent }}
          >
            {dots}
          </span>
        </div>
      </div>

      { }
      <div className="flex gap-1">
        {[0, 1, 2].map((bar) => (
          <div
            key={bar}
            className="w-1 h-4 rounded-full animate-pulse"
            style={{
              backgroundColor: themeConfig.colors.accent,
              animationDelay: `${bar * 0.2}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default CommandLoadingIndicator;
