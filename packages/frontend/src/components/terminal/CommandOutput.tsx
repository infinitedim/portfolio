"use client";

import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useAccessibility } from "@portfolio/frontend/src/components/accessibility/AccessibilityProvider";
import type { CommandOutput as CommandOutputType } from "@portfolio/frontend/src/types/terminal";
import type { JSX } from "react";

interface CommandOutputProps {
  output: CommandOutputType;
}

/**
 * Renders the output of a command, with appropriate coloring and formatting.
 * @param {CommandOutputProps} props - The properties for the CommandOutput component.
 * @param {CommandOutputType} props.output - The command output object to be rendered.
 * @returns {JSX.Element} - A component that displays the command output.
 */
export function CommandOutput({ output }: CommandOutputProps): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const { isReducedMotion } = useAccessibility();

  const getOutputColor = () => {
    switch (output.type) {
      case "success":
        return themeConfig.colors.success || themeConfig.colors.accent;
      case "error":
        return themeConfig.colors.error || "#ff4444";
      case "warning":
        return themeConfig.colors.warning || "#ffaa00";
      case "info":
        return themeConfig.colors.info || themeConfig.colors.accent;
      default:
        return themeConfig.colors.text;
    }
  };

  const formatContent = (content: CommandOutputType["content"]): string => {
    if (typeof content === "string") {
      return content;
    } else if (Array.isArray(content)) {
      return content.join("\n");
    } else {
      return "";
    }
  };

  const getErrorIcon = () => {
    return "❌";
  };

  const getSuccessIcon = () => {
    return "✅";
  };

  const getWarningIcon = () => {
    return "⚠️";
  };

  const getInfoIcon = () => {
    return "ℹ️";
  };

  const getIcon = () => {
    switch (output.type) {
      case "error":
        return getErrorIcon();
      case "success":
        return getSuccessIcon();
      case "warning":
        return getWarningIcon();
      case "info":
        return getInfoIcon();
      default:
        return "";
    }
  };

  const isError = output.type === "error";
  const icon = getIcon();

  return (
    <div
      key={`command-output-${theme}`}
      className={`font-mono whitespace-pre-wrap ${!isReducedMotion ? "transition-colors duration-300" : ""}`}
      style={{
        color: getOutputColor(),
      }}
      role="log"
      aria-live={isError ? "assertive" : "polite"}
      aria-label={isError ? "Error output" : "Command output"}
    >
      {typeof output.content === "string" || Array.isArray(output.content) ? (
        <div className="flex items-start gap-2">
          {icon && (
            <span
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="flex-1">
            {formatContent(output.content)}
            {isError && (
              <div className="mt-2 text-sm opacity-75">
                💡 Try typing 'help' to see available commands or 'clear' to
                reset the terminal.
              </div>
            )}
          </div>
        </div>
      ) : (
        <output.content />
      )}
    </div>
  );
}
