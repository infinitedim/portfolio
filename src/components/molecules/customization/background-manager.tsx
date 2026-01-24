"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import { useTheme } from "@/hooks/use-theme";
import { CustomizationService } from "@/lib/services/customization-service";
import type { BackgroundSettings } from "@/types/customization";

interface BackgroundManagerProps {
  onUpdate?: () => void;
  onClose?: () => void;
}

/**
 * Background customization manager
 * Allows users to customize background effects like Letter Glitch
 * @param {BackgroundManagerProps} props - Component props
 * @returns {JSX.Element} The background manager component
 */
export function BackgroundManager({
  onUpdate,
  onClose,
}: BackgroundManagerProps): JSX.Element {
  const { themeConfig } = useTheme();
  const customizationService = CustomizationService.getInstance();
  const [backgroundType, setBackgroundType] = useState<
    "letter-glitch" | "none"
  >("letter-glitch");
  const [letterGlitchSettings, setLetterGlitchSettings] = useState({
    glitchColors: ["#2b4539", "#61dca3", "#61b3dc"],
    glitchSpeed: 50,
    centerVignette: false,
    outerVignette: true,
    smooth: true,
    characters:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ",
  });

  useEffect(() => {
    const settings = customizationService.getBackgroundSettings();
    setBackgroundType(settings.type);
    if (settings.letterGlitch) {
      setLetterGlitchSettings(settings.letterGlitch);
    }
  }, [customizationService]);

  const handleSave = useCallback(() => {
    const settings: BackgroundSettings = {
      type: backgroundType,
      letterGlitch:
        backgroundType === "letter-glitch" ? letterGlitchSettings : undefined,
    };

    customizationService.saveBackgroundSettings(settings);
    onUpdate?.();

    // Trigger a custom event to notify Terminal component
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("background-settings-updated", { detail: settings }),
      );
    }
  }, [backgroundType, letterGlitchSettings, customizationService, onUpdate]);

  const handleAddColor = useCallback(() => {
    setLetterGlitchSettings((prev) => ({
      ...prev,
      glitchColors: [...prev.glitchColors, "#00ff00"],
    }));
  }, []);

  const handleRemoveColor = useCallback(
    (index: number) => {
      setLetterGlitchSettings((prev) => ({
        ...prev,
        glitchColors: prev.glitchColors.filter((_, i) => i !== index),
      }));
    },
    [],
  );

  const handleColorChange = useCallback(
    (index: number, color: string) => {
      setLetterGlitchSettings((prev) => ({
        ...prev,
        glitchColors: prev.glitchColors.map((c, i) => (i === index ? color : c)),
      }));
    },
    [],
  );

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: themeConfig.colors.text }}
          >
            Background Type
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setBackgroundType("letter-glitch")}
              className={`px-4 py-2 rounded border transition-all ${
                backgroundType === "letter-glitch"
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  backgroundType === "letter-glitch"
                    ? `${themeConfig.colors.accent}20`
                    : "transparent",
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              Letter Glitch
            </button>
            <button
              onClick={() => setBackgroundType("none")}
              className={`px-4 py-2 rounded border transition-all ${
                backgroundType === "none"
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  backgroundType === "none"
                    ? `${themeConfig.colors.accent}20`
                    : "transparent",
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              None
            </button>
          </div>
        </div>

        {backgroundType === "letter-glitch" && (
          <div className="space-y-4">
            <div>
              <h4
                className="text-sm font-medium mb-2"
                style={{ color: themeConfig.colors.text }}
              >
                Glitch Colors
              </h4>
              <div className="space-y-2">
                {letterGlitchSettings.glitchColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                      style={{
                        borderColor: themeConfig.colors.border,
                        backgroundColor: color,
                      }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 rounded border bg-transparent"
                      style={{
                        borderColor: themeConfig.colors.border,
                        color: themeConfig.colors.text,
                      }}
                    />
                    {letterGlitchSettings.glitchColors.length > 1 && (
                      <button
                        onClick={() => handleRemoveColor(index)}
                        className="px-3 py-2 rounded border hover:opacity-80 transition-all"
                        style={{
                          backgroundColor: `${themeConfig.colors.error}20`,
                          borderColor: themeConfig.colors.error,
                          color: themeConfig.colors.error,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddColor}
                  className="w-full px-4 py-2 rounded border hover:opacity-80 transition-all"
                  style={{
                    backgroundColor: `${themeConfig.colors.success}20`,
                    borderColor: themeConfig.colors.success,
                    color: themeConfig.colors.success,
                  }}
                >
                  + Add Color
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="glitch-speed"
                className="block text-sm font-medium mb-2"
                style={{ color: themeConfig.colors.text }}
              >
                Glitch Speed: {letterGlitchSettings.glitchSpeed}ms
              </label>
              <input
                id="glitch-speed"
                type="range"
                min="10"
                max="200"
                value={letterGlitchSettings.glitchSpeed}
                onChange={(e) =>
                  setLetterGlitchSettings((prev) => ({
                    ...prev,
                    glitchSpeed: Number.parseInt(e.target.value, 10),
                  }))
                }
                className="w-full"
                style={{
                  accentColor: themeConfig.colors.accent,
                }}
              />
              <div className="flex justify-between text-xs opacity-70 mt-1">
                <span style={{ color: themeConfig.colors.text }}>Fast</span>
                <span style={{ color: themeConfig.colors.text }}>Slow</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterGlitchSettings.centerVignette}
                  onChange={(e) =>
                    setLetterGlitchSettings((prev) => ({
                      ...prev,
                      centerVignette: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border cursor-pointer"
                  style={{
                    borderColor: themeConfig.colors.border,
                    accentColor: themeConfig.colors.accent,
                  }}
                />
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.text }}
                >
                  Center Vignette
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterGlitchSettings.outerVignette}
                  onChange={(e) =>
                    setLetterGlitchSettings((prev) => ({
                      ...prev,
                      outerVignette: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border cursor-pointer"
                  style={{
                    borderColor: themeConfig.colors.border,
                    accentColor: themeConfig.colors.accent,
                  }}
                />
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.text }}
                >
                  Outer Vignette
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterGlitchSettings.smooth}
                  onChange={(e) =>
                    setLetterGlitchSettings((prev) => ({
                      ...prev,
                      smooth: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 rounded border cursor-pointer"
                  style={{
                    borderColor: themeConfig.colors.border,
                    accentColor: themeConfig.colors.accent,
                  }}
                />
                <span
                  className="text-sm"
                  style={{ color: themeConfig.colors.text }}
                >
                  Smooth Animation
                </span>
              </label>
            </div>

            <div>
              <label
                htmlFor="characters-input"
                className="block text-sm font-medium mb-2"
                style={{ color: themeConfig.colors.text }}
              >
                Characters
              </label>
              <textarea
                id="characters-input"
                value={letterGlitchSettings.characters}
                onChange={(e) =>
                  setLetterGlitchSettings((prev) => ({
                    ...prev,
                    characters: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded border bg-transparent font-mono text-sm"
                style={{
                  borderColor: themeConfig.colors.border,
                  color: themeConfig.colors.text,
                }}
                rows={3}
                placeholder="Enter characters to display..."
              />
              <p
                className="text-xs opacity-70 mt-1"
                style={{ color: themeConfig.colors.text }}
              >
                Characters that will appear in the background animation
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t" style={{ borderColor: themeConfig.colors.border }}>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 rounded border font-medium transition-all hover:opacity-80"
          style={{
            backgroundColor: themeConfig.colors.accent,
            borderColor: themeConfig.colors.accent,
            color: themeConfig.colors.bg,
          }}
        >
          Save Background Settings
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border transition-all hover:opacity-80"
            style={{
              backgroundColor: "transparent",
              borderColor: themeConfig.colors.border,
              color: themeConfig.colors.text,
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
