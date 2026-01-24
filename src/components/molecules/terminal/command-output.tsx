"use client";

import { useTheme } from "@/hooks/use-theme";
import { useAccessibility } from "@/components/organisms/accessibility/accessibility-provider";
import type { CommandOutput as CommandOutputType } from "@/types/terminal";
import type { JSX } from "react";

/**
 * Props for the CommandOutput component
 * @interface CommandOutputProps
 * @property {CommandOutputType} output - The command output object to render
 */
interface CommandOutputProps {
  output: CommandOutputType;
}

/**
 * Renders command output with appropriate styling and formatting
 * Displays command results with color-coded types (success, error, warning, info)
 * @param {CommandOutputProps} props - Component props
 * @param {CommandOutputType} props.output - The command output object containing type and content
 * @returns {JSX.Element} The formatted command output component
 * @example
 * ```tsx
 * <CommandOutput output={{
 *   type: 'success',
 *   content: 'Operation completed successfully'
 * }} />
 * ```
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
              className="shrink-0 mt-0.5"
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
