"use client";

import { useState, memo, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";

/**
 * Props for the InteractiveWelcome component
 * @interface InteractiveWelcomeProps
 * @property {(command: string) => void} onCommandSelect - Callback when a command is selected
 * @property {() => void} onDismiss - Callback when welcome screen is dismissed
 */
interface InteractiveWelcomeProps {
  onCommandSelect: (command: string) => void;
  onDismiss: () => void;
  onStartTour?: () => void;
}

/**
 * Interactive welcome screen with quick command buttons
 * Displays an introduction to the terminal with clickable command shortcuts
 * @param {InteractiveWelcomeProps} props - Component props
 * @param {(command: string) => void} props.onCommandSelect - Command selection callback
 * @param {() => void} props.onDismiss - Dismiss callback
 * @returns {JSX.Element} The interactive welcome component
 * @example
 * ```tsx
 * <InteractiveWelcome
 *   onCommandSelect={handleCommand}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export const InteractiveWelcome = memo(function InteractiveWelcome({
  onCommandSelect,
  onDismiss,
  onStartTour,
}: InteractiveWelcomeProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const quickCommands = [
    { command: "tour", description: "Take a guided tour", icon: "🎓", highlight: true },
    { command: "help", description: "View all available commands", icon: "❓" },
    { command: "about", description: "Learn about me", icon: "👨‍💻" },
    { command: "skills", description: "View my technical skills", icon: "🛠️" },
    { command: "projects", description: "Explore my projects", icon: "📁" },
    { command: "contact", description: "Get in touch", icon: "📧" },
  ];

  const handleCommandClick = (command: string) => {
    setSelectedCommand(command);

    // Special handling for tour command
    if (command === "tour" && onStartTour) {
      setTimeout(() => {
        onStartTour();
        onDismiss();
      }, 200);
      return;
    }

    setTimeout(() => {
      onCommandSelect(command);
      onDismiss();
    }, 200);
  };

  return (
    <div
      className="bg-black/10 backdrop-blur-sm rounded-lg border p-6 mb-6"
      style={{
        borderColor: `${themeConfig.colors.border}60`,
        backgroundColor: `${themeConfig.colors.bg}40`,
      }}
    >
      { }
      <div className="text-center mb-6">
        <div
          className="text-lg font-bold mb-2"
          style={{ color: themeConfig.colors.accent }}
        >
          🚀 Welcome to My Terminal Portfolio!
        </div>
        <div
          className="text-sm opacity-75"
          style={{ color: themeConfig.colors.muted }}
        >
          Click on any command below to get started, or type directly in the
          terminal
        </div>
      </div>

      { }
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {quickCommands.map((cmd) => {
          const isHighlighted = 'highlight' in cmd && cmd.highlight;
          return (
            <button
              key={cmd.command}
              onClick={() => handleCommandClick(cmd.command)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${selectedCommand === cmd.command ? "animate-pulse" : ""
                } ${isHighlighted ? "ring-2 ring-offset-2 ring-offset-transparent" : ""}`}
              style={{
                borderColor: isHighlighted
                  ? themeConfig.colors.accent
                  : themeConfig.colors.border,
                backgroundColor:
                  selectedCommand === cmd.command || isHighlighted
                    ? `${themeConfig.colors.accent}20`
                    : `${themeConfig.colors.bg}20`,
                color: themeConfig.colors.text,
                // Use CSS custom property for ring color (Tailwind will pick it up)
                "--tw-ring-color": isHighlighted ? themeConfig.colors.accent : undefined,
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{cmd.icon}</span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: themeConfig.colors.accent }}
                >
                  {cmd.command}
                </span>
                {isHighlighted && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: themeConfig.colors.accent,
                      color: themeConfig.colors.bg
                    }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <div
                className="text-xs opacity-75"
                style={{ color: themeConfig.colors.muted }}
              >
                {cmd.description}
              </div>
            </button>
          );
        })}
      </div>

      { }
      <div className="flex items-center justify-between text-xs">
        <div
          className="opacity-60"
          style={{ color: themeConfig.colors.muted }}
        >
          💡 Tip: Use Tab for auto-completion and ↑↓ for command history
        </div>
        <button
          onClick={onDismiss}
          className="px-3 py-1 rounded border hover:opacity-80 transition-opacity"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.muted,
          }}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
});
