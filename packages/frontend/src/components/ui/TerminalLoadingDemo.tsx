"use client";

import { useState, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { TerminalLoadingProgress } from "./TerminalLoadingProgress";

/**
 * Demo component to showcase TerminalLoadingProgress functionality
 * @returns {JSX.Element} The TerminalLoadingDemo component
 */
export function TerminalLoadingDemo(): JSX.Element {
  const { themeConfig, theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [demoType, setDemoType] = useState<"npm" | "git" | "build" | "custom">(
    "npm",
  );

  const demoConfigs = {
    npm: {
      files: [
        "package.json",
        "node_modules/react/package.json",
        "node_modules/next/package.json",
        "node_modules/typescript/package.json",
        "node_modules/tailwindcss/package.json",
        "node_modules/@types/react/package.json",
        "node_modules/@types/node/package.json",
        "node_modules/eslint/package.json",
      ],
      completionText: "📦 Dependencies installed successfully!",
      duration: 4000,
    },
    git: {
      files: [
        ".git/config",
        ".git/HEAD",
        ".git/refs/heads/main",
        "src/components/ui/TerminalLoadingProgress.tsx",
        "src/components/terminal/Terminal.tsx",
        "src/hooks/useTheme.ts",
        "README.md",
      ],
      completionText: "🔄 Git repository cloned!",
      duration: 3000,
    },
    build: {
      files: [
        "src/app/layout.tsx",
        "src/app/page.tsx",
        "src/components/terminal/Terminal.tsx",
        "src/components/ui/TerminalLoadingProgress.tsx",
        "src/hooks/useTheme.ts",
        "tailwind.config.ts",
        "next.config.js",
        ".next/static/chunks/main.js",
        ".next/static/css/app.css",
      ],
      completionText: "🏗️ Build completed successfully!",
      duration: 3500,
    },
    custom: {
      files: [
        "src/lib/services/customizationService.ts",
        "src/components/customization/ThemeManager.tsx",
        "src/components/customization/FontManager.tsx",
        "localStorage/custom-themes.json",
        "localStorage/settings.json",
      ],
      completionText: "🎨 Customization loaded!",
      duration: 2500,
    },
  };

  const startDemo = () => {
    setIsLoading(true);
  };

  const handleComplete = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1500); // Show completion message for a bit
  };

  if (!themeConfig?.colors) {
    return <div />;
  }

  return (
    <div
      key={`terminal-loading-demo-${theme}`}
      className="space-y-6"
    >
      {/* Demo Controls */}
      <div
        className="p-4 rounded border"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.bg}80`,
        }}
      >
        <h3
          className="text-lg font-bold mb-4"
          style={{ color: themeConfig.colors.accent }}
        >
          🚀 Terminal Loading Demo
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.keys(demoConfigs).map((type) => (
            <button
              key={type}
              onClick={() => setDemoType(type as keyof typeof demoConfigs)}
              className={`px-3 py-1 rounded text-sm font-mono transition-all duration-200 ${
                demoType === type
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-80"
              }`}
              style={{
                backgroundColor:
                  demoType === type
                    ? themeConfig.colors.accent
                    : `${themeConfig.colors.accent}40`,
                color:
                  demoType === type
                    ? themeConfig.colors.bg
                    : themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.accent}`,
              }}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={startDemo}
          disabled={isLoading}
          className="px-4 py-2 rounded font-mono transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor:
              themeConfig.colors.success || themeConfig.colors.accent,
            color: themeConfig.colors.bg,
            border: `1px solid ${themeConfig.colors.success || themeConfig.colors.accent}`,
          }}
        >
          {isLoading ? "⏳ Loading..." : "▶️ Start Demo"}
        </button>
      </div>

      {/* Loading Display */}
      {isLoading && (
        <div
          className="p-6 rounded border min-h-96"
          style={{
            borderColor: themeConfig.colors.border,
            backgroundColor: `${themeConfig.colors.bg}dd`,
          }}
        >
          <TerminalLoadingProgress
            {...demoConfigs[demoType]}
            onComplete={handleComplete}
            autoStart={true}
          />
        </div>
      )}

      {/* Info */}
      <div
        className="p-4 rounded border text-sm"
        style={{
          borderColor: themeConfig.colors.border,
          backgroundColor: `${themeConfig.colors.muted}10`,
          color: themeConfig.colors.muted,
        }}
      >
        <p className="font-mono">
          💡 This component simulates terminal-style loading like{" "}
          <code>npm install</code>,<code>git clone</code>, or build processes.
          Each file shows individual progress with realistic timing and
          animations.
        </p>
      </div>
    </div>
  );
}
