"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { CustomizationService } from "@/lib/services/customization-service";
import { ThemeEditor } from "./theme-editor";
import type { CustomTheme } from "@/types/customization";
import { ThemeName } from "@/types/theme";

interface ThemeManagerProps {
  themes: CustomTheme[];
  onUpdate: () => void;
  currentTheme?: ThemeName;
  onApplyTheme?: (themeId: string) => void;
}

/**
 * Manages the themes for the terminal.
 * Allows users to view, select, create, edit, duplicate, and delete themes.
 * @param {ThemeManagerProps} props - The properties for the ThemeManager component.
 * @param {CustomTheme[]} props.themes - The list of available themes.
 * @param {() => void} props.onUpdate - Callback function to be called when theme data is updated.
 * @returns {JSX.Element} - The theme management interface.
 */
export function ThemeManager({
  themes,
  onUpdate,
  onApplyTheme,
  currentTheme,
}: ThemeManagerProps): JSX.Element {
  const { themeConfig, changeTheme, isThemeActive } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<CustomTheme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<
    "all" | "built-in" | "custom" | "imported"
  >("all");
  const [sortBy, setSortBy] = useState<"name" | "created" | "modified">("name");

  const customizationService = CustomizationService.getInstance();

  const filteredThemes = themes
    .filter((theme) => {
      const matchesSearch =
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterSource === "all" || theme.source === filterSource;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "modified": {
          const aModified = a.modifiedAt || a.createdAt;
          const bModified = b.modifiedAt || b.createdAt;
          return bModified.getTime() - aModified.getTime();
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const handleApplyTheme = (themeId: string) => {
    console.log(`🎨 ThemeManager: Applying theme ${themeId}`);

    try {
      // Check if it's a custom theme
      const customTheme = customizationService.getCustomThemes().find(
        (t) => t.id === themeId,
      );

      if (customTheme) {
        // Apply custom theme directly
        const root = document.documentElement;
        const body = document.body;

        if (!root || !body) {
          console.error("❌ DOM elements not available");
          return;
        }

        // Convert CustomTheme colors to ThemeConfig format
        const themeConfig = {
          name: customTheme.name,
          colors: {
            bg: customTheme.colors.bg,
            text: customTheme.colors.text,
            accent: customTheme.colors.accent,
            muted: customTheme.colors.muted || customTheme.colors.border || customTheme.colors.text,
            border: customTheme.colors.border,
            success: customTheme.colors.success || customTheme.colors.accent,
            error: customTheme.colors.error || "#ff4444",
            warning: customTheme.colors.warning || "#ffaa00",
            info: customTheme.colors.info || "#00aaff",
            prompt: customTheme.colors.prompt || customTheme.colors.accent,
          },
        };

        // Generate CSS variables
        const hexToHsl = (hex: string): string => {
          if (!hex?.match(/^#[0-9A-Fa-f]{6}$/)) return "0 0% 0%";
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0;
          let s = 0;
          const l = (max + min) / 2;
          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h =
              max === r
                ? (g - b) / d + (g < b ? 6 : 0)
                : max === g
                  ? (b - r) / d + 2
                  : (r - g) / d + 4;
            h /= 6;
          }
          return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };

        const cssVars = {
          "--terminal-bg": themeConfig.colors.bg,
          "--terminal-text": themeConfig.colors.text,
          "--terminal-accent": themeConfig.colors.accent,
          "--terminal-muted": themeConfig.colors.muted,
          "--terminal-border": themeConfig.colors.border,
          "--terminal-success": themeConfig.colors.success,
          "--terminal-error": themeConfig.colors.error,
          "--terminal-warning": themeConfig.colors.warning,
          "--terminal-info": themeConfig.colors.info,
          "--terminal-prompt": themeConfig.colors.prompt,
          "--background": hexToHsl(themeConfig.colors.bg),
          "--foreground": hexToHsl(themeConfig.colors.text),
          "--primary": hexToHsl(themeConfig.colors.accent),
          "--primary-foreground": hexToHsl(themeConfig.colors.bg),
          "--muted": hexToHsl(themeConfig.colors.muted),
          "--muted-foreground": hexToHsl(themeConfig.colors.text),
          "--border": hexToHsl(themeConfig.colors.border),
          "--input": hexToHsl(themeConfig.colors.border),
          "--ring": hexToHsl(themeConfig.colors.accent),
          "--secondary": hexToHsl(themeConfig.colors.muted),
          "--secondary-foreground": hexToHsl(themeConfig.colors.text),
          "--accent": hexToHsl(themeConfig.colors.accent),
          "--accent-foreground": hexToHsl(themeConfig.colors.bg),
          "--destructive": hexToHsl(themeConfig.colors.error),
          "--destructive-foreground": hexToHsl(themeConfig.colors.bg),
          "--card": hexToHsl(themeConfig.colors.bg),
          "--card-foreground": hexToHsl(themeConfig.colors.text),
          "--popover": hexToHsl(themeConfig.colors.bg),
          "--popover-foreground": hexToHsl(themeConfig.colors.text),
        };

        // Apply CSS variables
        Object.entries(cssVars).forEach(([property, value]) => {
          root.style.setProperty(property, value);
        });

        // Update body class
        const themeClasses = body.className
          .split(" ")
          .filter((cls) => !cls.startsWith("theme-"));
        themeClasses.push(`theme-custom-${customTheme.id}`);
        body.className = themeClasses.join(" ");

        // Save to localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("terminal-theme", themeId);
        }

        console.log(`✅ Successfully applied custom theme: ${themeId}`);

        if (onApplyTheme) {
          onApplyTheme(themeId);
        }
      } else {
        // Try as built-in theme
        const success = changeTheme(themeId as ThemeName);

        if (success) {
          console.log(`✅ Successfully applied theme: ${themeId}`);

          if (onApplyTheme) {
            onApplyTheme(themeId);
          }
        } else {
          console.error(`❌ Failed to apply theme: ${themeId}`);
        }
      }
    } catch (error) {
      console.error("Error in handleApplyTheme:", error);
    }
  };

  const handleDeleteTheme = (themeId: string) => {
    if (window.confirm("Are you sure you want to delete this theme?")) {
      if (customizationService.deleteCustomTheme(themeId)) {
        onUpdate();
        if (selectedTheme?.id === themeId) {
          setSelectedTheme(null);
          setIsEditing(false);
        }
      }
    }
  };

  const handleDuplicateTheme = (themeId: string) => {
    const duplicated = customizationService.duplicateTheme(themeId);
    if (duplicated) {
      onUpdate();
      setSelectedTheme(duplicated);
      setIsEditing(true);
    }
  };

  const handleCreateTheme = () => {
    setSelectedTheme(null);
    setIsEditing(true);
  };

  const handleEditTheme = (theme: CustomTheme) => {
    setSelectedTheme(theme);
    setIsEditing(true);
  };

  const handleSaveTheme = (
    themeData: Omit<CustomTheme, "id" | "createdAt">,
  ) => {
    if (selectedTheme) {
      customizationService.updateCustomTheme(selectedTheme.id, themeData);
    } else {
      customizationService.saveCustomTheme(themeData);
    }

    setIsEditing(false);
    setSelectedTheme(null);
    onUpdate();
  };

  if (isEditing) {
    const defaultTheme: CustomTheme = {
      id: "",
      name: "New Theme",
      description: "A custom theme",
      author: "User",
      colors: {
        bg: "#1a1a1a",
        text: "#ffffff",
        prompt: "#00ff00",
        success: "#00ff00",
        error: "#ff0000",
        accent: "#0080ff",
        border: "#333333",
      },
      source: "custom",
      createdAt: new Date(),
    };

    return (
      <ThemeEditor
        theme={selectedTheme || defaultTheme}
        onSave={handleSaveTheme}
        onCancel={() => {
          setIsEditing(false);
          setSelectedTheme(null);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      { }
      <div
        className="p-4 border-b"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3
              className="text-lg font-semibold"
              style={{ color: themeConfig.colors.accent }}
            >
              Theme Manager
            </h3>
            <p className="text-sm opacity-75">
              {filteredThemes.length} of {themes.length} themes
              {currentTheme && ` • Active: ${currentTheme}`}
            </p>
          </div>
          <button
            onClick={handleCreateTheme}
            className="px-4 py-2 rounded text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: themeConfig.colors.accent,
              color: themeConfig.colors?.bg || "#000000",
            }}
          >
            + Create Theme
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded border text-sm transition-colors"
            style={{
              backgroundColor: `${themeConfig.colors.muted}20`,
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text,
            }}
          />
          <div className="flex gap-2">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as "all" | "built-in" | "custom" | "imported")}
              className="px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: `${themeConfig.colors.muted}20`,
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value="all">All Sources</option>
              <option value="built-in">Built-in</option>
              <option value="custom">Custom</option>
              <option value="imported">Imported</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "created" | "modified")}
              className="px-3 py-2 rounded border text-sm"
              style={{
                backgroundColor: `${themeConfig.colors.muted}20`,
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created</option>
              <option value="modified">Sort by Modified</option>
            </select>
          </div>
        </div>
      </div>

      { }
      <div className="flex-1 overflow-auto p-4">
        {filteredThemes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎨</div>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: themeConfig.colors.accent }}
            >
              No themes found
            </h3>
            <p
              className="text-sm opacity-75"
              style={{ color: themeConfig.colors.text }}
            >
              {searchQuery || filterSource !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first custom theme"}
            </p>
            {!searchQuery && filterSource === "all" && (
              <button
                onClick={handleCreateTheme}
                className="mt-4 px-4 py-2 rounded text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: `${themeConfig.colors.accent}20`,
                  color: themeConfig.colors.accent,
                  border: `1px solid ${themeConfig.colors.accent}`,
                }}
              >
                Create Theme
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => {
              const isActive = isThemeActive(theme.id as ThemeName);

              const isActiveStyle = {
                backgroundColor: isActive
                  ? `${themeConfig.colors.success || themeConfig.colors.accent}30`
                  : themeConfig.colors.accent,
                color: isActive
                  ? themeConfig.colors.success || themeConfig.colors.accent
                  : themeConfig.colors.bg,
              };

              return (
                <div
                  key={theme.id}
                  className="border rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    borderColor: isActive
                      ? themeConfig.colors.accent
                      : themeConfig.colors.border,
                    backgroundColor: isActive
                      ? `${themeConfig.colors.accent}10`
                      : "transparent",
                    boxShadow: isActive
                      ? `0 0 0 1px ${themeConfig.colors.accent}`
                      : "none",
                  }}
                >
                  { }
                  <div className="mb-3">
                    <div className="flex gap-1 mb-2">
                      {Object.entries(theme.colors)
                        .slice(0, 5)
                        .map(([key, color]) => (
                          <div
                            key={key}
                            className="w-6 h-6 rounded border"
                            style={{
                              backgroundColor: color,
                              borderColor: themeConfig.colors.border,
                            }}
                            title={`${key}: ${color}`}
                          />
                        ))}
                    </div>
                  </div>

                  { }
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className="font-medium truncate"
                        style={{ color: themeConfig.colors.text }}
                      >
                        {theme.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span
                            className="text-xs px-1 py-0.5 rounded"
                            style={{ color: themeConfig.colors.accent }}
                          >
                            ✓
                          </span>
                        )}
                        <span
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${themeConfig.colors.muted}30`,
                            color: themeConfig.colors.muted,
                          }}
                        >
                          {theme.source}
                        </span>
                      </div>
                    </div>

                    {theme.description && (
                      <p
                        className="text-sm opacity-75 line-clamp-2"
                        style={{ color: themeConfig.colors.text }}
                      >
                        {theme.description}
                      </p>
                    )}

                    {(theme.createdAt || theme.modifiedAt) && (
                      <p
                        className="text-xs opacity-50 mt-1"
                        style={{ color: themeConfig.colors.text }}
                      >
                        {theme.modifiedAt
                          ? `Modified ${theme.modifiedAt.toLocaleDateString()}`
                          : `Created ${theme.createdAt.toLocaleDateString()}`}
                      </p>
                    )}
                  </div>

                  { }
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApplyTheme(theme.id)}
                      className="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all duration-200 hover:scale-105"
                      style={isActiveStyle}
                      disabled={isActive}
                    >
                      {isActive ? "✓ Active" : "Apply"}
                    </button>

                    <button
                      onClick={() => handleDuplicateTheme(theme.id)}
                      className="px-3 py-1.5 rounded text-sm transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: `${themeConfig.colors.muted}30`,
                        color: themeConfig.colors.text,
                      }}
                      title="Duplicate theme"
                    >
                      📋
                    </button>

                    {theme.source === "custom" && (
                      <>
                        <button
                          onClick={() => handleEditTheme(theme)}
                          className="px-3 py-1.5 rounded text-sm transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: `${themeConfig.colors.muted}30`,
                            color: themeConfig.colors.text,
                          }}
                          title="Edit theme"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => handleDeleteTheme(theme.id)}
                          className="px-3 py-1.5 rounded text-sm transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: `${themeConfig.colors.error || "#ef4444"}30`,
                            color: themeConfig.colors.error || "#ef4444",
                          }}
                          title="Delete theme"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
