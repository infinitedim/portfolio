"use client";

import { useState, useEffect, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import type { CustomTheme } from "@portfolio/frontend/src/types/customization";

interface ThemeEditorProps {
  theme: CustomTheme;
  onSave: (theme: CustomTheme) => void;
  onCancel: () => void;
}

/**
 * A component for creating and editing terminal themes.
 * Provides a UI for changing colors and metadata of a theme.
 * @param {ThemeEditorProps} props - The properties for the ThemeEditor component.
 * @param {CustomTheme} props.theme - The theme object to be edited.
 * @param {(theme: CustomTheme) => void} props.onSave - Callback function when the save button is clicked.
 * @param {() => void} props.onCancel - Callback function to cancel the editing.
 * @returns {JSX.Element} - The theme editor interface.
 */
export function ThemeEditor({
  theme,
  onSave,
  onCancel,
}: ThemeEditorProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [editedTheme, setEditedTheme] = useState<CustomTheme>(theme);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    setEditedTheme(theme);
  }, [theme]);

  const handleColorChange = (colorKey: string, value: string) => {
    setEditedTheme((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value,
      },
    }));
  };

  const handleMetadataChange = (field: keyof CustomTheme, value) => {
    setEditedTheme((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(editedTheme);
  };

  const togglePreview = () => {
    if (!previewMode) {
      // Apply preview
      const root = document.documentElement;
      Object.entries(editedTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--terminal-${key}`, value);
      });
    } else {
      // Restore original
      const root = document.documentElement;
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--terminal-${key}`, value);
      });
    }
    setPreviewMode(!previewMode);
  };

  const colorFields = [
    { key: "bg", label: "Background", description: "Main background color" },
    { key: "text", label: "Text", description: "Primary text color" },
    { key: "prompt", label: "Prompt", description: "Command prompt color" },
    { key: "success", label: "Success", description: "Success message color" },
    { key: "error", label: "Error", description: "Error message color" },
    {
      key: "accent",
      label: "Accent",
      description: "Accent and highlight color",
    },
    {
      key: "border",
      label: "Border",
      description: "Border and separator color",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-lg font-bold"
            style={{ color: themeConfig.colors.accent }}
          >
            {theme.id ? "Edit Theme" : "Create New Theme"}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={togglePreview}
              className={`px-3 py-1 text-sm rounded border ${previewMode ? "ring-2" : ""}`}
              style={{
                backgroundColor: previewMode
                  ? `${themeConfig.colors.accent}20`
                  : "transparent",
                borderColor: themeConfig.colors.accent,
                color: themeConfig.colors.accent,
              }}
            >
              {previewMode ? "👁️ Previewing" : "👁️ Preview"}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              <span className="sr-only">Edited theme name</span>
              <input
                type="text"
                value={editedTheme.name}
                onChange={(e) => handleMetadataChange("name", e.target.value)}
                className="w-full px-3 py-2 rounded border bg-transparent"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="Enter theme name"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <span className="sr-only">Description (Optional)</span>
              <input
                type="text"
                value={editedTheme.description || ""}
                onChange={(e) =>
                  handleMetadataChange("description", e.target.value)
                }
                className="w-full px-3 py-2 rounded border bg-transparent"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                placeholder="Describe your theme"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Color Editor */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <h4
            className="font-medium"
            style={{ color: themeConfig.colors.text }}
          >
            Color Palette
          </h4>

          <div className="grid gap-4">
            {colorFields.map(({ key, label, description }) => (
              <div
                key={key}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">{label}</label>
                    <p className="text-xs opacity-75">{description}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded border"
                    style={{
                      backgroundColor: editedTheme.colors[key],
                      borderColor: themeConfig.colors.border,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editedTheme.colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                    style={{ borderColor: themeConfig.colors.border }}
                  />
                  <input
                    type="text"
                    value={editedTheme.colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="flex-1 px-3 py-1 rounded border bg-transparent font-mono text-sm"
                    style={{
                      borderColor: themeConfig.colors.border,
                      color: themeConfig.colors.text,
                    }}
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Color Harmony Tools */}
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
              Color Harmony Tools
            </h5>
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => {
                  // Generate complementary colors
                  const baseColor = editedTheme.colors.accent;
                  // Simple complementary color logic (this could be more sophisticated)
                  const complementary = baseColor.replace("#", "#ff");
                  handleColorChange("success", complementary);
                }}
                className="px-2 py-1 rounded border hover:opacity-80"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              >
                Generate Complementary
              </button>
              <button
                onClick={() => {
                  // Generate monochromatic palette
                  const base = editedTheme.colors.bg;
                  // Simple monochromatic variations
                  handleColorChange("border", base + "40");
                }}
                className="px-2 py-1 rounded border hover:opacity-80"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              >
                Monochromatic
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="p-4 border-t flex justify-end gap-2"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded border hover:opacity-80"
          style={{
            borderColor: themeConfig.colors.border,
            color: themeConfig.colors.text,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded border hover:opacity-80"
          style={{
            backgroundColor: `${themeConfig.colors.success}20`,
            borderColor: themeConfig.colors.success,
            color: themeConfig.colors.success,
          }}
          disabled={!editedTheme.name.trim()}
        >
          Save Theme
        </button>
      </div>
    </div>
  );
}
