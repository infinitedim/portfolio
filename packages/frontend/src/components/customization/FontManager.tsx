/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useState, useRef, JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useFont } from "@portfolio/frontend/src/hooks/useFont";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";
import type { CustomFont } from "@portfolio/frontend/src/types/customization";

interface FontManagerProps {
  fonts: CustomFont[];
  onUpdate: () => void;
}

/**
 * Manages custom and system fonts for the terminal.
 * Allows users to upload, preview, apply, and delete fonts.
 * @param {FontManagerProps} props - The properties for the FontManager component.
 * @param {CustomFont[]} props.fonts - The list of available fonts.
 * @param {() => void} props.onUpdate - Callback function to be called when font data is updated.
 * @returns {JSX.Element} - The font management interface.
 */
export function FontManager({
  fonts,
  onUpdate,
}: FontManagerProps): JSX.Element {
  const { themeConfig } = useTheme();
  const { changeFont } = useFont();
  const [selectedFont, setSelectedFont] = useState<CustomFont | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<
    "all" | "system" | "google" | "custom"
  >("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customizationService = CustomizationService.getInstance();

  const filteredFonts = fonts
    .filter((font) => {
      const matchesSearch =
        !searchQuery ||
        font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        font.family.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterSource === "all" || font.source === filterSource;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (
          !file.type.includes("font") &&
          !file.name.match(/\.(woff|woff2|ttf|otf)$/i)
        ) {
          alert(`${file.name} is not a valid font file`);
          continue;
        }

        await customizationService.saveCustomFont(file, {
          ligatures:
            file.name.toLowerCase().includes("liga") ||
            file.name.toLowerCase().includes("code") ||
            file.name.toLowerCase().includes("fira"),
        });
      }

      onUpdate();
    } catch (error) {
      console.error("Font upload failed:", error);
      alert("Failed to upload font. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyFont = (font: CustomFont) => {
    if (font.source === "system") {
      changeFont(font.id as any);
    } else {
      // Apply custom font
      const root = document.documentElement;
      root.style.setProperty("--terminal-font-family", font.family);
      root.style.setProperty("--terminal-font-weight", font.weight);
      root.style.setProperty(
        "--terminal-font-ligatures",
        font.ligatures ? "normal" : "none",
      );

      // Save to settings
      customizationService.saveSettings({ currentFont: font.id });
    }
  };

  const handleDeleteFont = (font: CustomFont) => {
    if (font.source !== "custom") return;

    if (confirm(`Are you sure you want to delete "${font.name}"?`)) {
      customizationService.deleteCustomFont(font.id);
      onUpdate();
      if (selectedFont?.id === font.id) {
        setSelectedFont(null);
      }
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  };

  return (
    <div className="h-full flex">
      {/* Font List */}
      <div
        className="w-1/2 border-r"
        style={{ borderColor: themeConfig.colors.border }}
      >
        <div className="p-4 space-y-4">
          {/* Controls */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 rounded border bg-transparent"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded border hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: `${themeConfig.colors.success}20`,
                  borderColor: themeConfig.colors.success,
                  color: themeConfig.colors.success,
                }}
              >
                {isUploading ? "⏳ Uploading..." : "📁 Upload"}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".woff,.woff2,.ttf,.otf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="w-full px-2 py-1 rounded border bg-transparent"
              style={{
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <option value="all">All Sources</option>
              <option value="system">System</option>
              <option value="google">Google Fonts</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Font List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredFonts.map((font) => (
              <div
                key={font.id}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  selectedFont?.id === font.id ? "ring-2" : ""
                }`}
                style={{
                  borderColor: themeConfig.colors.border,
                  backgroundColor:
                    selectedFont?.id === font.id
                      ? `${themeConfig.colors.accent}10`
                      : "transparent",
                  boxShadow:
                    selectedFont?.id === font.id
                      ? `0 0 0 2px ${themeConfig.colors.accent}`
                      : "none",
                }}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedFont(font);
                }}
                tabIndex={0} // Make the div focusable
                onClick={() => setSelectedFont(font)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="font-medium"
                    style={{
                      color: themeConfig.colors.text,
                      fontFamily:
                        font.source === "custom" ? font.family : undefined,
                    }}
                  >
                    {font.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    {font.ligatures && (
                      <span
                        className="px-1 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${themeConfig.colors.accent}20`,
                          color: themeConfig.colors.accent,
                        }}
                        title="Supports ligatures"
                      >
                        ≡
                      </span>
                    )}
                    <span
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor:
                          font.source === "system"
                            ? `${themeConfig.colors.prompt}20`
                            : font.source === "custom"
                              ? `${themeConfig.colors.accent}20`
                              : `${themeConfig.colors.success}20`,
                        color:
                          font.source === "system"
                            ? themeConfig.colors.prompt
                            : font.source === "custom"
                              ? themeConfig.colors.accent
                              : themeConfig.colors.success,
                      }}
                    >
                      {font.source}
                    </span>
                  </div>
                </div>

                {/* Font Preview */}
                <div
                  className="text-sm mb-2 font-mono"
                  style={{
                    fontFamily:
                      font.source === "custom" ? font.family : undefined,
                    color: themeConfig.colors.text,
                    opacity: 0.8,
                  }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>

                {font.source === "custom" && font.size && (
                  <div className="text-xs opacity-60 mb-2">
                    Size: {formatFileSize(font.size)}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyFont(font);
                    }}
                    className="px-2 py-1 text-xs rounded border hover:opacity-80"
                    style={{
                      backgroundColor: `${themeConfig.colors.success}20`,
                      borderColor: themeConfig.colors.success,
                      color: themeConfig.colors.success,
                    }}
                  >
                    Apply
                  </button>

                  {font.source === "custom" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFont(font);
                      }}
                      className="px-2 py-1 text-xs rounded border hover:opacity-80"
                      style={{
                        backgroundColor: `${themeConfig.colors.error}20`,
                        borderColor: themeConfig.colors.error,
                        color: themeConfig.colors.error,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Font Preview */}
      <div className="w-1/2">
        {selectedFont ? (
          <div className="h-full flex flex-col">
            {/* Header */}
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
                    {selectedFont.name}
                  </h3>
                  <p
                    className="text-sm opacity-75 font-mono"
                    // Add role and tabIndex for non-native interactive elements if needed
                    // For a <p> tag, it's usually not interactive, but if it were,
                    // you'd add role="text" or similar, and handle focus/click events.
                  >
                    {selectedFont.family}
                  </p>
                </div>
                <button
                  onClick={() => handleApplyFont(selectedFont)}
                  className="px-3 py-1 text-sm rounded border hover:opacity-80"
                  style={{
                    backgroundColor: `${themeConfig.colors.success}20`,
                    borderColor: themeConfig.colors.success,
                    color: themeConfig.colors.success,
                  }}
                >
                  ✅ Apply Font
                </button>
              </div>

              {/* Font Metadata */}
              <div className="flex gap-4 text-xs opacity-75">
                <span>Source: {selectedFont.source}</span>
                <span>Weight: {selectedFont.weight}</span>
                <span>Ligatures: {selectedFont.ligatures ? "Yes" : "No"}</span>
                {selectedFont.size && (
                  <span>Size: {formatFileSize(selectedFont.size)}</span>
                )}
                <span>
                  Added: {selectedFont.createdAt.toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Font Preview Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-6">
                {/* Sample Text */}
                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    Font Preview
                  </h4>
                  <div className="space-y-4">
                    {/* Different sizes */}
                    {[12, 14, 16, 18, 20].map((size) => (
                      <div
                        key={size}
                        className="space-y-2"
                      >
                        <div className="text-xs opacity-75">{size}px</div>
                        <div
                          className="font-mono"
                          style={{
                            fontFamily:
                              selectedFont.source === "custom"
                                ? selectedFont.family
                                : undefined,
                            fontSize: `${size}px`,
                            color: themeConfig.colors.text,
                          }}
                        >
                          The quick brown fox jumps over the lazy dog 0123456789
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Sample */}
                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    Code Sample
                  </h4>
                  <div
                    className="p-4 rounded border font-mono text-sm"
                    style={{
                      backgroundColor: `${themeConfig.colors.bg}80`,
                      borderColor: themeConfig.colors.border,
                      fontFamily:
                        selectedFont.source === "custom"
                          ? selectedFont.family
                          : undefined,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <div className="space-y-1">
                      <div>
                        <span style={{ color: themeConfig.colors.accent }}>
                          const
                        </span>{" "}
                        greeting ={" "}
                        <span style={{ color: themeConfig.colors.success }}>
                          "Hello World!"
                        </span>
                      </div>
                      <div>
                        <span style={{ color: themeConfig.colors.accent }}>
                          function
                        </span>{" "}
                        <span style={{ color: themeConfig.colors.prompt }}>
                          sayHello
                        </span>
                        () {"{"}
                      </div>
                      <div> return x &gt; x * 2</div>
                      <div>{"}"}</div>
                      <div></div>
                      <div>{"// Ligature test: != === => <= >= && ||"}</div>
                      <div>{"if (x !== y && a >= b) {"}</div>
                      <div> return x &gt; x * 2</div>
                      <div>{"}"}</div>
                    </div>
                  </div>
                </div>

                {/* Terminal Sample */}
                <div>
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.colors.text }}
                  >
                    Terminal Sample
                  </h4>
                  <div
                    className="p-4 rounded border font-mono text-sm"
                    style={{
                      backgroundColor: themeConfig.colors.bg,
                      borderColor: themeConfig.colors.border,
                      fontFamily:
                        selectedFont.source === "custom"
                          ? selectedFont.family
                          : undefined,
                      color: themeConfig.colors.text,
                    }}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span style={{ color: themeConfig.colors.prompt }}>
                          $
                        </span>
                        <span>npm install --save-dev typescript</span>
                      </div>
                      <div style={{ color: themeConfig.colors.success }}>
                        ✅ Package installed successfully
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: themeConfig.colors.prompt }}>
                          $
                        </span>
                        <span>git commit -m "Add TypeScript support"</span>
                      </div>
                      <div style={{ color: themeConfig.colors.accent }}>
                        [main 1a2b3c4] Add TypeScript support
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ligatures Test */}
                {selectedFont.ligatures && (
                  <div>
                    <h4
                      className="font-medium mb-3"
                      style={{ color: themeConfig.colors.text }}
                    >
                      Ligatures Test
                    </h4>
                    <div
                      className="p-4 rounded border font-mono text-sm"
                      style={{
                        backgroundColor: `${themeConfig.colors.accent}10`,
                        borderColor: `${themeConfig.colors.accent}40`,
                        fontFamily:
                          selectedFont.source === "custom"
                            ? selectedFont.family
                            : undefined,
                        color: themeConfig.colors.text,
                      }}
                    >
                      <div className="space-y-1">
                        <div>{"!= !== == === => <= >= => -> <- <->"}</div>
                        <div>{"&& || ?? ?. ??: ?:"}</div>
                        <div>{"++ -- += -= *= /= %= **="}</div>
                        <div>{"/* */ // <!-- -->"}</div>
                        <div>{"|> <| <> <$ $> <* *> <+ +>"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4">🔤</div>
              <h3
                className="text-lg font-medium mb-2"
                style={{ color: themeConfig.colors.accent }}
              >
                Select a Font
              </h3>
              <p className="text-sm opacity-75">
                Choose a font from the list to preview it
              </p>
              <div className="mt-4 text-xs opacity-60">
                <p>Supported formats: .woff, .woff2, .ttf, .otf</p>
                <p>Upload custom fonts to personalize your terminal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
