"use client";

import { useState, useEffect, JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import type { CustomTheme } from "@/types/customization";

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
  const [isColorRuleOpen, setIsColorRuleOpen] = useState(false);

  useEffect(() => {
    setEditedTheme(theme);
  }, [theme]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isColorRuleOpen) {
        setIsColorRuleOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isColorRuleOpen]);

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
      const root = document.documentElement;
      Object.entries(editedTheme.colors || {}).forEach(([key, value]) => {
        root.style.setProperty(`--terminal-${key}`, value);
      });
    } else {
      const root = document.documentElement;
      Object.entries(themeConfig.colors).forEach(([key, value]) => {
        root.style.setProperty(`--terminal-${key}`, value);
      });
    }
    setPreviewMode(!previewMode);
  };

  // Update preview in real-time when colors change
  useEffect(() => {
    if (previewMode) {
      const root = document.documentElement;
      Object.entries(editedTheme.colors || {}).forEach(([key, value]) => {
        root.style.setProperty(`--terminal-${key}`, value);
      });
    }
  }, [editedTheme.colors, previewMode]);

  const generateRandomTheme = () => {
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

    const baseHue = Math.floor(Math.random() * 360);
    const isLightTheme = Math.random() > 0.5;

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
      { }
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
              className={`px-3 py-1.5 text-sm rounded border transition-all ${previewMode ? "ring-2 ring-offset-1" : ""}`}
              style={{
                backgroundColor: previewMode
                  ? `${themeConfig.colors.accent}20`
                  : "transparent",
                borderColor: previewMode
                  ? themeConfig.colors.accent
                  : themeConfig.colors.border,
                color: previewMode
                  ? themeConfig.colors.accent
                  : themeConfig.colors.text,
              }}
              title={previewMode ? "Click to disable live preview in terminal" : "Click to preview theme in terminal"}
            >
              {previewMode ? "👁️ Live Preview ON" : "👁️ Preview in Terminal"}
            </button>
          </div>
        </div>

        { }
        {!theme.id && (
          <div
            className="mt-3 p-3 rounded border"
            style={{
              backgroundColor: `${themeConfig.colors.accent}05`,
              borderColor: `${themeConfig.colors.accent}30`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <label
                  htmlFor="colorRule"
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: themeConfig.colors.text }}
                >
                  Color Rule
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColorRuleOpen(!isColorRuleOpen)}
                    className="w-full px-3 py-2.5 rounded border text-sm text-left flex items-center justify-between transition-all hover:opacity-90"
                    style={{
                      backgroundColor: themeConfig.colors.bg,
                      borderColor: isColorRuleOpen
                        ? themeConfig.colors.accent
                        : themeConfig.colors.border,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <span>
                      {colorRule === "70-20-5-1-1-1-2" && "70-20-5-1-1-1-2 (Balanced)"}
                      {colorRule === "50-25-10-5-5-3-2" && "50-25-10-5-5-3-2 (Even)"}
                      {colorRule === "40-20-15-10-5-5-5" && "40-20-15-10-5-5-5 (Distributed)"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${isColorRuleOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: themeConfig.colors.text }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isColorRuleOpen && (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 bg-transparent border-0 p-0 cursor-default"
                        onClick={() => setIsColorRuleOpen(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setIsColorRuleOpen(false);
                          }
                        }}
                        aria-label="Close dropdown"
                      />
                      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                      <div
                        className="absolute z-50 w-full mt-1 rounded border shadow-lg overflow-hidden"
                        style={{
                          backgroundColor: themeConfig.colors.bg,
                          borderColor: themeConfig.colors.border,
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {[
                          { value: "70-20-5-1-1-1-2", label: "70-20-5-1-1-1-2 (Balanced)", desc: "Balanced color distribution" },
                          { value: "50-25-10-5-5-3-2", label: "50-25-10-5-5-3-2 (Even)", desc: "Even color distribution" },
                          { value: "40-20-15-10-5-5-5", label: "40-20-15-10-5-5-5 (Distributed)", desc: "Distributed color spread" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorRule(option.value as typeof colorRule);
                              setIsColorRuleOpen(false);
                            }}
                            className="w-full px-3 py-2.5 text-sm text-left transition-all hover:opacity-90 border-b last:border-b-0"
                            style={{
                              backgroundColor:
                                colorRule === option.value
                                  ? `${themeConfig.colors.accent}15`
                                  : "transparent",
                              borderColor: themeConfig.colors.border,
                              color:
                                colorRule === option.value
                                  ? themeConfig.colors.accent
                                  : themeConfig.colors.text,
                            }}
                          >
                            <div className="font-medium">{option.label}</div>
                            <div
                              className="text-xs mt-0.5"
                              style={{
                                color: themeConfig.colors.text,
                                opacity: 0.7,
                              }}
                            >
                              {option.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
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
      <div className="flex-1 overflow-auto p-4">
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
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {/* Live Preview Panel */}
          <div className="mb-3">
            <h4
              className="font-medium mb-2"
              style={{ color: themeConfig.colors.text }}
            >
              Live Preview
            </h4>
            <div
              className="p-4 rounded border font-mono text-sm"
              style={{
                backgroundColor: editedTheme.colors?.bg || "#000000",
                borderColor: editedTheme.colors?.border || "#333333",
                color: editedTheme.colors?.text || "#ffffff",
                minHeight: "200px",
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span style={{ color: editedTheme.colors?.prompt || "#00ff00" }}>
                    $
                  </span>
                  <span>help</span>
                </div>
                <div style={{ color: editedTheme.colors?.success || "#00ff00" }}>
                  ✅ Available commands: about, projects, contact
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: editedTheme.colors?.prompt || "#00ff00" }}>
                    $
                  </span>
                  <span>theme {editedTheme.name.toLowerCase().replace(/\s+/g, "-")}</span>
                </div>
                <div style={{ color: editedTheme.colors?.success || "#00ff00" }}>
                  Theme changed to "{editedTheme.name}"
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: editedTheme.colors?.prompt || "#00ff00" }}>
                    $
                  </span>
                  <span>invalid-command</span>
                </div>
                <div style={{ color: editedTheme.colors?.error || "#ff0000" }}>
                  ❌ Command not found. Type 'help' for available commands.
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: editedTheme.colors?.prompt || "#00ff00" }}>
                    $
                  </span>
                  <span style={{ color: editedTheme.colors?.accent || "#0066cc" }}>
                    skills overview
                  </span>
                </div>
                <div>
                  <span style={{ color: editedTheme.colors?.accent || "#0066cc" }}>
                    🗺️ Skills Progress Overview
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor: editedTheme.colors?.border || "#333333" }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: editedTheme.colors?.prompt || "#00ff00" }}>
                      $
                    </span>
                    <span className="animate-pulse">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h4
            className="font-medium mb-2"
            style={{ color: themeConfig.colors.text }}
          >
            Color Palette
          </h4>

          <div className="grid gap-2.5">
            {colorFields.map(({ key, label, description }) => (
              <div
                key={key}
                className="space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium leading-tight">{label}</label>
                    <p className="text-xs opacity-75 leading-tight mt-0.5">{description}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded border shrink-0"
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
