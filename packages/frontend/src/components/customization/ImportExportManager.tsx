"use client";

import type React from "react";

import { useState, useRef, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";

interface ImportExportManagerProps {
  onUpdate: () => void;
}

/**
 * Manages the import and export of terminal customizations, including themes, fonts, and settings.
 * @param {ImportExportManagerProps} props - The properties for the ImportExportManager component.
 * @param {() => void} props.onUpdate - Callback function to be called when data is updated after an import.
 * @returns {JSX.Element} - The import/export management interface.
 */
export function ImportExportManager({
  onUpdate,
}: ImportExportManagerProps): JSX.Element {
  const { themeConfig } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customizationService = CustomizationService.getInstance();

  const handleExportThemes = async () => {
    setIsExporting(true);
    try {
      const exportData = customizationService.exportThemes();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `terminal-themes-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export themes. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportThemes = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const result = await customizationService.importThemes(file);
      setImportResult(result);
      onUpdate();
    } catch (error) {
      console.error("Import failed:", error);
      setImportResult({
        success: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportSettings = () => {
    const settings = customizationService.getSettings();
    const themes = customizationService.getCustomThemes();
    const fonts = customizationService.getCustomFonts();

    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      settings,
      themes,
      fonts,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-customization-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const customThemes = customizationService.getCustomThemes();
  const customFonts = customizationService.getCustomFonts();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="max-w-2xl space-y-6">
        {/* Export Section */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            📤 Export
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.success}10`,
                borderColor: `${themeConfig.colors.success}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.success }}
              >
                Export Custom Themes
              </h4>
              <p className="text-sm opacity-75 mb-3">
                Export your custom themes to share with others or backup your
                work.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span>{customThemes.length} custom themes available</span>
                </div>
                <button
                  onClick={handleExportThemes}
                  disabled={isExporting || customThemes.length === 0}
                  className="px-4 py-2 rounded border hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: `${themeConfig.colors.success}20`,
                    borderColor: themeConfig.colors.success,
                    color: themeConfig.colors.success,
                  }}
                >
                  {isExporting ? "⏳ Exporting..." : "📤 Export Themes"}
                </button>
              </div>
            </div>

            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.accent}10`,
                borderColor: `${themeConfig.colors.accent}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                Export Complete Backup
              </h4>
              <p className="text-sm opacity-75 mb-3">
                Export all customizations including themes, fonts, and settings.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-sm space-y-1">
                  <div>{customThemes.length} custom themes</div>
                  <div>{customFonts.length} custom fonts</div>
                  <div>Settings and preferences</div>
                </div>
                <button
                  onClick={handleExportSettings}
                  className="px-4 py-2 rounded border hover:opacity-80"
                  style={{
                    backgroundColor: `${themeConfig.colors.accent}20`,
                    borderColor: themeConfig.colors.accent,
                    color: themeConfig.colors.accent,
                  }}
                >
                  📦 Export All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            📥 Import
          </h3>
          <div className="space-y-4">
            <div
              className="p-4 rounded border"
              style={{
                backgroundColor: `${themeConfig.colors.prompt}10`,
                borderColor: `${themeConfig.colors.prompt}40`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.colors.prompt }}
              >
                Import Themes
              </h4>
              <p className="text-sm opacity-75 mb-3">
                Import theme files from other users or restore from backup.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-4 py-2 rounded border hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: `${themeConfig.colors.prompt}20`,
                    borderColor: themeConfig.colors.prompt,
                    color: themeConfig.colors.prompt,
                  }}
                >
                  {isImporting ? "⏳ Importing..." : "📁 Choose File"}
                </button>
                <span className="text-sm opacity-75">
                  Supports .json theme files
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportThemes}
                className="hidden"
              />

              {importResult && (
                <div
                  className="mt-4 p-3 rounded border"
                  style={{
                    backgroundColor:
                      importResult.errors.length > 0
                        ? `${themeConfig.colors.error}10`
                        : `${themeConfig.colors.success}10`,
                    borderColor:
                      importResult.errors.length > 0
                        ? `${themeConfig.colors.error}40`
                        : `${themeConfig.colors.success}40`,
                  }}
                >
                  <div className="text-sm space-y-1">
                    <div
                      style={{
                        color:
                          importResult.errors.length > 0
                            ? themeConfig.colors.error
                            : themeConfig.colors.success,
                      }}
                    >
                      {importResult.success > 0 &&
                        `✅ Successfully imported ${importResult.success} themes`}
                      {importResult.errors.length > 0 &&
                        `❌ ${importResult.errors.length} errors occurred`}
                    </div>
                    {importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs opacity-75">
                          Show errors
                        </summary>
                        <div className="mt-1 text-xs space-y-1">
                          {importResult.errors.map((error, index) => (
                            <div
                              key={index}
                              className="opacity-75"
                            >
                              • {error}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3
            className="text-lg font-bold mb-4"
            style={{ color: themeConfig.colors.accent }}
          >
            🚀 Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                if (
                  confirm(
                    "This will reset all customizations to defaults. Continue?",
                  )
                ) {
                  customizationService.resetToDefaults();
                  onUpdate();
                }
              }}
              className="p-4 rounded border text-left hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.error}10`,
                borderColor: `${themeConfig.colors.error}40`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                className="font-medium mb-1"
                style={{ color: themeConfig.colors.error }}
              >
                🔄 Reset All
              </div>
              <div className="text-sm opacity-75">
                Reset all themes, fonts, and settings to defaults
              </div>
            </button>

            <button
              onClick={() => {
                const data = {
                  themes: customThemes.length,
                  fonts: customFonts.length,
                  storageUsed: JSON.stringify({
                    themes: customThemes,
                    fonts: customFonts,
                    settings: customizationService.getSettings(),
                  }).length,
                };
                alert(
                  `Storage Info:\n• ${data.themes} custom themes\n• ${data.fonts} custom fonts\n• ~${Math.round(data.storageUsed / 1024)}KB used`,
                );
              }}
              className="p-4 rounded border text-left hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.accent}10`,
                borderColor: `${themeConfig.colors.accent}40`,
                color: themeConfig.colors.text,
              }}
            >
              <div
                className="font-medium mb-1"
                style={{ color: themeConfig.colors.accent }}
              >
                📊 Storage Info
              </div>
              <div className="text-sm opacity-75">
                View storage usage and customization statistics
              </div>
            </button>
          </div>
        </div>

        {/* Tips */}
        <div
          className="p-4 rounded border"
          style={{
            backgroundColor: `${themeConfig.colors.accent}10`,
            borderColor: `${themeConfig.colors.accent}40`,
          }}
        >
          <h4
            className="font-medium mb-2"
            style={{ color: themeConfig.colors.accent }}
          >
            💡 Tips & Best Practices
          </h4>
          <div className="text-sm space-y-2 opacity-75">
            <div>
              • Export your customizations regularly to avoid losing your work
            </div>
            <div>
              • Share theme files with others to spread your creative designs
            </div>
            <div>
              • Custom fonts should be optimized for web use (WOFF/WOFF2
              preferred)
            </div>
            <div>
              • Test themes in different lighting conditions for accessibility
            </div>
            <div>
              • Use meaningful names and descriptions for your custom themes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
