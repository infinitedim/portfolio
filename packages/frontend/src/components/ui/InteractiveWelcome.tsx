"use client";

import { useState, memo, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

interface InteractiveWelcomeProps {
  onCommandSelect: (command: string) => void;
  onDismiss: () => void;
}

/**
 * Interactive welcome component with enhanced styling for the new terminal layout
 */
export const InteractiveWelcome = memo(function InteractiveWelcome({
  onCommandSelect,
  onDismiss,
}: InteractiveWelcomeProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);

  const quickCommands = [
    { command: "help", description: "View all available commands", icon: "❓" },
    { command: "about", description: "Learn about me", icon: "👨‍💻" },
    { command: "skills", description: "View my technical skills", icon: "🛠️" },
    { command: "projects", description: "Explore my projects", icon: "📁" },
    { command: "themes", description: "Customize the terminal", icon: "🎨" },
    { command: "contact", description: "Get in touch", icon: "📧" },
  ];

  const handleCommandClick = (command: string) => {
    setSelectedCommand(command);
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
      {/* Welcome Header */}
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

      {/* Quick Commands Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {quickCommands.map((cmd) => (
          <button
            key={cmd.command}
            onClick={() => handleCommandClick(cmd.command)}
            className={`p-3 rounded-lg border transition-all duration-200 text-left hover:scale-105 ${
              selectedCommand === cmd.command ? "animate-pulse" : ""
            }`}
            style={{
              borderColor: themeConfig.colors.border,
              backgroundColor:
                selectedCommand === cmd.command
                  ? `${themeConfig.colors.accent}20`
                  : `${themeConfig.colors.bg}20`,
              color: themeConfig.colors.text,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{cmd.icon}</span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                {cmd.command}
              </span>
            </div>
            <div
              className="text-xs opacity-75"
              style={{ color: themeConfig.colors.muted }}
            >
              {cmd.description}
            </div>
          </button>
        ))}
      </div>

      {/* Dismiss Options */}
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
