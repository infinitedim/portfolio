"use client";

import { useTheme } from "@/hooks/use-theme";
import type { CustomTheme } from "@/types/customization";
import { JSX } from "react";

interface ThemePreviewProps {
  theme: CustomTheme;
  onEdit: () => void;
  onApply: () => void;
}

/**
 * Displays a preview of a selected theme, including its color palette and a sample terminal output.
 * @param {ThemePreviewProps} props - The properties for the ThemePreview component.
 * @param {CustomTheme} props.theme - The theme to preview.
 * @param {() => void} props.onEdit - Callback function to enter edit mode for the theme.
 * @param {() => void} props.onApply - Callback function to apply the theme.
 * @returns {JSX.Element} - The theme preview interface.
 */
export function ThemePreview({
  theme,
  onEdit,
  onApply,
}: ThemePreviewProps): JSX.Element {
  const { themeConfig } = useTheme();

  const previewElements = [
    { type: "background", label: "Background", color: theme.colors.bg },
    { type: "text", label: "Text", color: theme.colors.text },
    { type: "prompt", label: "Prompt", color: theme.colors.prompt },
    { type: "success", label: "Success", color: theme.colors.success },
    { type: "error", label: "Error", color: theme.colors.error },
    { type: "accent", label: "Accent", color: theme.colors.accent },
    { type: "border", label: "Border", color: theme.colors.border },
  ];

  return (
    <div className="h-full flex flex-col">
      {}
      <div
        className="p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              {theme.name}
            </h3>
            {theme.description && (
              <p className="text-sm opacity-75">{theme.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {theme.source !== "built-in" && (
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm rounded border hover:opacity-80"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}20`,
                  borderColor: themeConfig.colors.accent,
                  color: themeConfig.colors.accent,
                }}
              >
                ✏️ Edit
              </button>
            )}
            <button
              onClick={onApply}
              className="px-3 py-1 text-sm rounded border hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.success}20`,
                borderColor: themeConfig.colors.success,
                color: themeConfig.colors.success,
              }}
            >
              ✅ Apply
            </button>
          </div>
        </div>

        {}
        <div className="flex gap-4 text-xs opacity-75">
          <span>Source: {theme.source}</span>
          <span>Created: {theme.createdAt.toLocaleDateString()}</span>
          {theme.modifiedAt && (
            <span>Modified: {theme.modifiedAt.toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {}
          <div>
            <h4
              className="font-medium mb-3"
              style={{ color: themeConfig.colors.text }}
            >
              Color Palette
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {previewElements.map(({ type, label, color }) => (
                <div
                  key={type}
                  className="p-3 rounded border"
                  style={{
                    borderColor: themeConfig.colors.border,
                    backgroundColor:
                      type === "background" ? color : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{label}</span>
                    <div
                      className="w-6 h-6 rounded border"
                      style={{
                        backgroundColor: color,
                        borderColor: themeConfig.colors.border,
                      }}
                    />
                  </div>
                  <code className="text-xs font-mono opacity-75">{color}</code>
                </div>
              ))}
            </div>
          </div>

          {}
          <div>
            <h4
              className="font-medium mb-3"
              style={{ color: themeConfig.colors.text }}
            >
              Terminal Preview
            </h4>
            <div
              className="p-4 rounded border font-mono text-sm"
              style={{
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: theme.colors.prompt }}>$</span>
                  <span>help</span>
                </div>
                <div style={{ color: theme.colors.success }}>
                  ✅ Available commands: about, projects, contact
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: theme.colors.prompt }}>$</span>
                  <span>
                    theme {theme.name.toLowerCase().replace(/\s+/g, "-")}
                  </span>
                </div>
                <div style={{ color: theme.colors.success }}>
                  Theme changed to "{theme.name}"
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: theme.colors.prompt }}>$</span>
                  <span>invalid-command</span>
                </div>
                <div style={{ color: theme.colors.error }}>
                  ❌ Command not found. Type 'help' for available commands.
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: theme.colors.prompt }}>$</span>
                  <span style={{ color: theme.colors.accent }}>
                    skills overview
                  </span>
                </div>
                <div>
                  <span style={{ color: theme.colors.accent }}>
                    🗺️ Skills Progress Overview
                  </span>
                </div>
              </div>
            </div>
          </div>

          {}
          <div
            className="p-3 rounded border"
            style={{
              backgroundColor: `${themeConfig.colors.accent}10`,
              borderColor: `${themeConfig.colors.accent}40`,
            }}
          >
            <h5
              className="font-medium mb-2"
              style={{ color: themeConfig.colors.accent }}
            >
              Accessibility Notes
            </h5>
            <div className="text-sm space-y-1">
              <div>
                Contrast Ratio (Text/Background):
                <span className="ml-2 font-mono">
                  {}
                  Good ✅
                </span>
              </div>
              <div>
                Color Blind Friendly:
                <span className="ml-2">
                  {}
                  Checking... 🔍
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
