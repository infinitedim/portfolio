/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, JSX, useCallback } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";
import { ThemeManager } from "./ThemeManager";
import { FontManager } from "./FontManager";
import { SettingsManager } from "./SettingsManager";
import { ImportExportManager } from "./ImportExportManager";
import { TerminalLoadingProgress } from "@portfolio/frontend/src/components/ui/TerminalLoadingProgress";
import type {
  CustomTheme,
  CustomFont,
} from "@portfolio/frontend/src/types/customization";

interface CustomizationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A modal component that serves as the main hub for all customization options.
 * It contains tabs for managing themes, fonts, settings, and import/export functionality.
 * @param {CustomizationManagerProps} props - The properties for the CustomizationManager component.
 * @param {boolean} props.isOpen - Whether the manager modal is open.
 * @param {() => void} props.onClose - Callback function to close the modal.
 * @returns {JSX.Element | null} - The customization manager modal or null if closed.
 */
export function CustomizationManager({
  isOpen,
  onClose,
}: CustomizationManagerProps): JSX.Element | null {
  const { themeConfig, changeTheme, theme: currentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "themes" | "fonts" | "settings" | "import-export"
  >("themes");
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const customizationService = CustomizationService.getInstance();

  const showNotification = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
    [],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const themes = customizationService.getAllThemes();
      const fonts = customizationService.getAllFonts();

      setCustomThemes(themes);
      setCustomFonts(fonts);

      console.log(
        `📊 Loaded ${themes.length} themes and ${fonts.length} fonts`,
      );
    } catch (error) {
      console.error("Failed to load customization data:", error);
      showNotification("Failed to load customization data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [customizationService, showNotification]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleThemeUpdate = useCallback(() => {
    const themes = customizationService.getAllThemes();
    setCustomThemes(themes);
    console.log(`🔄 Updated themes list: ${themes.length} themes`);
  }, [customizationService]);

  const handleFontUpdate = useCallback(() => {
    const fonts = customizationService.getAllFonts();
    setCustomFonts(fonts);
    console.log(`🔄 Updated fonts list: ${fonts.length} fonts`);
  }, [customizationService]);

  const handleThemeApply = useCallback(
    (themeId: string) => {
      console.log(`🎨 CustomizationManager: Applying theme ${themeId}`);

      try {
        // For built-in themes, use the theme ID directly
        const success = changeTheme(themeId as any);

        if (success) {
          console.log(`✅ Successfully applied theme: ${themeId}`);
          showNotification(
            `Theme "${themeId}" applied successfully!`,
            "success",
          );

          // Close the customization manager popup
          onClose();

          // Force page reload for proper theme application
          setTimeout(() => {
            window.location.reload();
          }, 200);
        } else {
          console.error(`❌ Failed to apply theme: ${themeId}`);
          showNotification(`Failed to apply theme "${themeId}"`, "error");
        }
      } catch (error) {
        console.error("Error applying theme:", error);
        showNotification(`Error applying theme: ${error}`, "error");
      }
    },
    [changeTheme, showNotification, onClose],
  );

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    {
      id: "themes" as const,
      label: "🎨 Themes",
      count: customThemes.filter((t) => t.source === "custom").length,
      description: "Manage color themes",
    },
    {
      id: "fonts" as const,
      label: "🔤 Fonts",
      count: customFonts.filter((f) => f.source === "custom").length,
      description: "Manage fonts and typography",
    },
    {
      id: "settings" as const,
      label: "⚙️ Settings",
      description: "General preferences",
    },
    {
      id: "import-export" as const,
      label: "📦 Import/Export",
      description: "Backup and restore",
    },
  ];

  if (!currentTheme) return <div />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className="w-full max-w-6xl h-[90vh] rounded-lg border shadow-2xl flex flex-col animate-in fade-in duration-200"
        style={{
          backgroundColor: themeConfig.colors.bg,
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.text,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div>
            <h2
              className="text-xl font-bold"
              style={{ color: themeConfig.colors.accent }}
            >
              🎨 Customization Manager
            </h2>
            <p className="text-sm opacity-75">
              Manage themes, fonts, and appearance settings
              {currentTheme && ` • Current theme: ${currentTheme}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:opacity-80 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `${themeConfig.colors.error || themeConfig.colors.accent}20`,
              color: themeConfig.colors.error || themeConfig.colors.accent,
            }}
            aria-label="Close customization manager"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b overflow-x-auto"
          style={{ borderColor: themeConfig.colors.border }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id ? "border-b-2" : "hover:opacity-80"}`}
              style={{
                color:
                  activeTab === tab.id
                    ? themeConfig.colors.accent
                    : themeConfig.colors.text,
                borderBottomColor:
                  activeTab === tab.id
                    ? themeConfig.colors.accent
                    : "transparent",
                backgroundColor:
                  activeTab === tab.id
                    ? `${themeConfig.colors.accent}10`
                    : "transparent",
              }}
              title={tab.description}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="ml-2 px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    color: themeConfig.colors.accent,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="w-full max-w-md">
                <TerminalLoadingProgress
                  duration={2500}
                  files={[
                    "src/lib/services/customizationService.ts",
                    "src/components/customization/ThemeManager.tsx",
                    "src/components/customization/FontManager.tsx",
                    "src/components/customization/SettingsManager.tsx",
                    "src/lib/themes/themeConfig.ts",
                    "src/types/customization.ts",
                    "localStorage/custom-themes.json",
                    "localStorage/custom-fonts.json",
                    "localStorage/settings.json",
                  ]}
                  completionText="🎨 Customization data loaded!"
                />
              </div>
            </div>
          ) : (
            <>
              {activeTab === "themes" && (
                <ThemeManager
                  themes={customThemes}
                  onUpdate={handleThemeUpdate}
                  onApplyTheme={handleThemeApply}
                  currentTheme={currentTheme}
                />
              )}
              {activeTab === "fonts" && (
                <FontManager
                  fonts={customFonts}
                  onUpdate={handleFontUpdate}
                  onClose={onClose}
                />
              )}
              {activeTab === "settings" && <SettingsManager />}
              {activeTab === "import-export" && (
                <ImportExportManager
                  onUpdate={() => {
                    handleThemeUpdate();
                    handleFontUpdate();
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <div
            className="absolute bottom-4 right-4 p-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300"
            style={{
              backgroundColor:
                notification.type === "success"
                  ? `${themeConfig.colors.success || themeConfig.colors.accent}20`
                  : notification.type === "error"
                    ? `${themeConfig.colors.error || "#ff4444"}20`
                    : `${themeConfig.colors.info || themeConfig.colors.accent}20`,
              borderColor:
                notification.type === "success"
                  ? themeConfig.colors.success || themeConfig.colors.accent
                  : notification.type === "error"
                    ? themeConfig.colors.error || "#ff4444"
                    : themeConfig.colors.info || themeConfig.colors.accent,
              color:
                notification.type === "success"
                  ? themeConfig.colors.success || themeConfig.colors.accent
                  : notification.type === "error"
                    ? themeConfig.colors.error || "#ff4444"
                    : themeConfig.colors.info || themeConfig.colors.accent,
            }}
          >
            <div className="flex items-center gap-2">
              <span>
                {notification.type === "success"
                  ? "✅"
                  : notification.type === "error"
                    ? "❌"
                    : "ℹ️"}
              </span>
              <span className="text-sm">{notification.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
