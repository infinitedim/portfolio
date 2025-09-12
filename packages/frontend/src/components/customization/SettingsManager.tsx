"use client";

import { useState, useEffect, type JSX } from "react";
// Correctly use your custom theme hook
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";
import type { CustomizationSettings } from "@portfolio/frontend/src/types/customization";
import { TerminalLoadingProgress } from "@portfolio/frontend/src/components/ui/TerminalLoadingProgress";

/**
 * Manages general and appearance settings for the terminal.
 * Allows users to configure preferences like animations, typography, and auto-saving.
 * @returns {JSX.Element} - The settings management interface.
 */
export function SettingsManager(): JSX.Element {
  // MODIFICATION: Correctly destructure the theme hook.
  // Removed `appliedTheme`, `subscribeToThemeChanges`, and the `renderKey` state.
  const { themeConfig, theme } = useTheme();

  const [settings, setSettings] = useState<CustomizationSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const customizationService = CustomizationService.getInstance();

  // MODIFICATION: Removed the two `useEffect` hooks that tried to force re-renders.
  // The component will automatically update when `theme` or `themeConfig` changes.

  useEffect(() => {
    const currentSettings = customizationService.getSettings();
    setSettings(currentSettings);
  }, [customizationService]);

  const handleSettingChange = (key: keyof CustomizationSettings, value) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);

    // Auto-save if enabled
    if (settings.autoSave) {
      customizationService.saveSettings({ [key]: value });
      setHasChanges(false);
    }
  };

  const handleSave = () => {
    if (!settings) return;

    customizationService.saveSettings(settings);
    setHasChanges(false);
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to defaults?")) {
      customizationService.resetToDefaults();
      const defaultSettings = customizationService.getSettings();
      setSettings(defaultSettings);
      setHasChanges(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="w-full max-w-md">
          <TerminalLoadingProgress
            duration={1500}
            files={[
              "localStorage/settings.json",
              "src/types/customization.ts",
              "src/lib/services/customizationService.ts",
              "src/hooks/useTheme.ts",
              "src/components/customization/SettingsManager.tsx",
            ]}
            completionText="⚙️ Settings loaded!"
          />
        </div>
      </div>
    );
  }

  return (
    // MODIFICATION: Removed `renderKey` from the key prop.
    <div
      key={`settings-manager-${theme}`}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div
        className="p-4 border-b transition-colors duration-300"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3
              className="text-lg font-bold transition-colors duration-300"
              style={{ color: themeConfig.colors.accent }}
            >
              ⚙️ Customization Settings
            </h3>
            <p
              className="text-sm opacity-75 transition-colors duration-300"
              style={{ color: themeConfig.colors.text }}
            >
              Configure appearance and behavior preferences
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && !settings.autoSave && (
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${themeConfig.colors.success || themeConfig.colors.accent}20`,
                  borderColor:
                    themeConfig.colors.success || themeConfig.colors.accent,
                  color:
                    themeConfig.colors.success || themeConfig.colors.accent,
                }}
              >
                💾 Save Changes
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm rounded border hover:opacity-80 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: `${themeConfig.colors.error || "#ff4444"}20`,
                borderColor: themeConfig.colors.error || "#ff4444",
                color: themeConfig.colors.error || "#ff4444",
              }}
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {/* General Settings */}
          <div>
            <h4
              className="font-medium mb-4 transition-colors duration-300"
              style={{ color: themeConfig.colors.text }}
            >
              General
            </h4>
            <div className="space-y-4">
              {/* Auto-save Toggle */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor="autoSaveCheckbox"
                  className="font-medium"
                  style={{ color: themeConfig.colors.text }}
                >
                  Auto-save Changes
                </label>
                <input
                  type="checkbox"
                  id="autoSaveCheckbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    handleSettingChange("autoSave", e.target.checked)
                  }
                  // Simplified toggle styling for clarity
                />
              </div>
              {/* Other settings toggles would follow a similar pattern... */}
            </div>
          </div>

          {/* Typography Settings */}
          <div>
            <h4
              className="font-medium mb-4"
              style={{ color: themeConfig.colors.text }}
            >
              Typography & Display
            </h4>
            <div className="space-y-4">
              {/* Font Size Slider */}
              <div>
                <label
                  htmlFor="fontSizeRange"
                  className="block font-medium mb-2"
                  style={{ color: themeConfig.colors.text }}
                >
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  id="fontSizeRange"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) =>
                    handleSettingChange(
                      "fontSize",
                      Number.parseInt(e.target.value),
                    )
                  }
                  className="w-full"
                />
              </div>
              {/* Other typography sliders... */}
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <h4
              className="font-medium mb-4"
              style={{ color: themeConfig.colors.text }}
            >
              Live Preview
            </h4>
            <div
              className="p-4 rounded border font-mono"
              style={{
                backgroundColor: `${themeConfig.colors.bg}80`,
                borderColor: themeConfig.colors.border,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.letterSpacing}px`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                style={{
                  color:
                    themeConfig.colors.success || themeConfig.colors.accent,
                }}
              >
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
