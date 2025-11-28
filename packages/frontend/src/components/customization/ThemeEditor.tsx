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
  const [colorRule, setColorRule] = useState<
    "70-20-5-1-1-1-2" | "50-25-10-5-5-3-2" | "40-20-15-10-5-5-5"
  >("70-20-5-1-1-1-2");

  useEffect(() => {
    setEditedTheme(theme);
  }, [theme]);

  const handleColorChange = (colorKey: string, value: string) => {
    setEditedTheme((prev) => ({
      ...prev,
      colors: {
        ...(prev.colors || {}),
        [colorKey]: value,
      },
    }));
  };

  const handleMetadataChange = (
    field: keyof CustomTheme,
    value: CustomTheme[keyof CustomTheme],
  ) => {
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
      Object.entries(editedTheme.colors || {}).forEach(([key, value]) => {
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

  const generateRandomTheme = () => {
    // Parse color rule percentages
    const rulePercentages = colorRule.split("-").map(Number);
    const [
      _bgPercent,
      _primaryPercent,
      _secondaryPercent,
      accentPercent,
      successPercent,
      errorPercent,
      neutralPercent,
    ] = rulePercentages;

    // Generate base hue and theme type
    const baseHue = Math.floor(Math.random() * 360);
    const isLightTheme = Math.random() > 0.5;

    // Helper function to generate color
    const generateColor = (
      hue: number,
      saturation: number,
      lightness: number,
    ) => {
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const colors = {
      bg: isLightTheme
        ? generateColor(baseHue, 10, 95)
        : generateColor(baseHue, 15, 8),
      text: isLightTheme
        ? generateColor(baseHue, 20, 15)
        : generateColor(baseHue, 20, 85),
      prompt: generateColor((baseHue + 30) % 360, 60, isLightTheme ? 45 : 65),
      success: generateColor(120, 50 + successPercent, isLightTheme ? 40 : 55),
      error: generateColor(0, 60 + errorPercent, isLightTheme ? 45 : 60),
      accent: generateColor(
        baseHue,
        70 + accentPercent,
        isLightTheme ? 50 : 60,
      ),
      border: isLightTheme
        ? generateColor(baseHue, 15 + neutralPercent, 75)
        : generateColor(baseHue, 20 + neutralPercent, 25),
    };

    const themeNames = [
      "Cosmic",
      "Neon",
      "Ocean",
      "Forest",
      "Sunset",
      "Aurora",
      "Midnight",
      "Ruby",
      "Emerald",
      "Sapphire",
      "Violet",
      "Golden",
      "Silver",
      "Copper",
      "Arctic",
      "Desert",
      "Jungle",
      "Volcanic",
      "Crystal",
      "Shadow",
    ];

    const adjectives = [
      "Dark",
      "Light",
      "Bright",
      "Soft",
      "Bold",
      "Vivid",
      "Muted",
      "Electric",
      "Pastel",
      "Deep",
      "Cool",
      "Warm",
      "Retro",
      "Modern",
      "Classic",
    ];

    const randomName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${themeNames[Math.floor(Math.random() * themeNames.length)]}`;

    setEditedTheme((prev) => ({
      ...prev,
      name: randomName,
      description: `Randomly generated ${isLightTheme ? "light" : "dark"} theme`,
      author: "Random Generator",
      colors,
    }));
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

        {/* Generate Random Theme Section - Only show for new themes */}
        {!theme.id && (
          <div
            className="mt-3 p-3 rounded border"
            style={{
              backgroundColor: `${themeConfig.colors.accent}05`,
              borderColor: `${themeConfig.colors.accent}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label
                  htmlFor="colorRule"
                  className="block text-sm font-medium mb-1"
                >
                  Color Rule
                </label>
                <select
                  id="colorRule"
                  value={colorRule}
                  onChange={(e) =>
                    setColorRule(e.target.value as typeof colorRule)
                  }
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{
                    backgroundColor: `${themeConfig.colors.muted}10`,
                    borderColor: themeConfig.colors.border,
                    color: themeConfig.colors.text,
                  }}
                >
                  <option value="70-20-5-1-1-1-2">
                    70-20-5-1-1-1-2 (Balanced)
                  </option>
                  <option value="50-25-10-5-5-3-2">
                    50-25-10-5-5-3-2 (Even)
                  </option>
                  <option value="40-20-15-10-5-5-5">
                    40-20-15-10-5-5-5 (Distributed)
                  </option>
                </select>
              </div>
              <div className="flex-shrink-0">
                <div className="block text-sm font-medium mb-1 opacity-0">
                  Action
                </div>
                <button
                  onClick={generateRandomTheme}
                  className="px-4 py-2 rounded text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: themeConfig.colors.accent,
                    color: themeConfig.colors.bg,
                  }}
                >
                  Generate Random Theme
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
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
                      backgroundColor: editedTheme.colors?.[key] || "#000000",
                      borderColor: themeConfig.colors.border,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editedTheme.colors?.[key] || "#000000"}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                    style={{ borderColor: themeConfig.colors.border }}
                  />
                  <input
                    type="text"
                    value={editedTheme.colors?.[key] || "#000000"}
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
