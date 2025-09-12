"use client";

import { useState, useEffect, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

interface TerminalLoadingProgressProps {
  /** Total duration of the loading simulation in milliseconds */
  duration?: number;
  /** Custom list of files to show as loading */
  files?: string[];
  /** Text to show when loading is complete */
  completionText?: string;
  /** Callback when loading is complete */
  onComplete?: () => void;
  /** Whether to auto-start the loading animation */
  autoStart?: boolean;
}

interface LoadingFile {
  path: string;
  status: "pending" | "loading" | "complete";
  progress?: number;
}

const DEFAULT_FILES = [
  "src/components/ui/button.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/input.tsx",
  "src/components/terminal/Terminal.tsx",
  "src/components/terminal/CommandInput.tsx",
  "src/hooks/useTheme.ts",
  "src/hooks/useTerminal.ts",
  "src/lib/commands/commandRegistry.ts",
  "src/lib/themes/themeConfig.ts",
  "src/types/terminal.ts",
  "src/types/theme.ts",
  "package.json",
  "tailwind.config.ts",
  "next.config.js",
];

/**
 * A React component that renders a terminal-style loading animation.
 * This component simulates the loading or processing progress of a list of files one by one,
 * similar to what you might see during package installations (`npm install`) or system updates (`apt update`).
 * @param {object} props - The props for the TerminalLoadingProgress component.
 * @param {string[]} props.files - An array of strings containing the names of files or items to simulate loading.
 * @param {number} [props.duration] - The total duration in milliseconds for the entire loading animation to complete. Defaults to 5000.
 * @param {string} [props.completionText] - The text to display after all files have finished processing. Defaults to "Complete!".
 * @param {() => void} [props.onComplete] - An optional callback function to execute when the loading animation is finished.
 * @param {boolean} [props.autoStart] - If `true`, the animation starts automatically when the component is first rendered. Defaults to `true`.
 * @returns {JSX.Element} The rendered terminal loading progress component.
 * @example
 * ```jsx
 * <TerminalLoadingProgress
 *   files={['package.json', 'index.js', 'styles.css', 'README.md']}
 *   duration={3000}
 *   completionText="All files loaded successfully."
 *   onComplete={() => console.log('Loading complete!')}
 * />
 * ```
 */
export function TerminalLoadingProgress({
  duration = 3000,
  files = DEFAULT_FILES,
  completionText = "✅ All files loaded successfully!",
  onComplete,
  autoStart = true,
}: TerminalLoadingProgressProps): JSX.Element {
  const { themeConfig, theme, mounted } = useTheme();
  const [loadingFiles, setLoadingFiles] = useState<LoadingFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Initialize files
  useEffect(() => {
    const initialFiles: LoadingFile[] = files.map((path) => ({
      path,
      status: "pending",
    }));
    setLoadingFiles(initialFiles);

    if (autoStart) {
      setStartTime(Date.now());
    }
  }, [files, autoStart]);

  // Handle loading animation
  useEffect(() => {
    if (!startTime || isComplete) return;

    const fileLoadDuration = duration / files.length;
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= files.length) {
        setIsComplete(true);
        onComplete?.();
        clearInterval(interval);
        return;
      }

      // Start loading current file
      setCurrentFileIndex(currentIndex);
      setLoadingFiles((prev) =>
        prev.map((file, index) => {
          if (index === currentIndex) {
            return { ...file, status: "loading" as const };
          }
          return file;
        }),
      );

      // Complete current file after a short delay
      setTimeout(() => {
        setLoadingFiles((prev) =>
          prev.map((file, index) => {
            if (index === currentIndex) {
              return { ...file, status: "complete" as const };
            }
            return file;
          }),
        );
      }, fileLoadDuration * 0.7);

      currentIndex++;
    }, fileLoadDuration);

    return () => clearInterval(interval);
  }, [startTime, duration, files.length, isComplete, onComplete]);

  // Remove unused isCurrentFile parameter to fix lint error
  const getStatusIcon = (status: LoadingFile["status"]) => {
    switch (status) {
      case "pending":
        return <span style={{ color: themeConfig.colors.muted }}>⏳</span>;
      case "loading":
        return (
          <span
            className="animate-spin"
            style={{ color: themeConfig.colors.accent }}
          >
            ◐
          </span>
        );
      case "complete":
        return (
          <span
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            ✓
          </span>
        );
      default:
        return <span>⏳</span>;
    }
  };

  const getFileDisplayName = (path: string) => {
    // Show only filename for long paths to keep it clean
    if (path.length > 40) {
      const parts = path.split("/");
      return `.../${parts[parts.length - 1]}`;
    }
    return path;
  };

  if (!mounted || !themeConfig?.colors) {
    return <div />;
  }

  return (
    <div
      key={`terminal-loading-${theme}`}
      className="font-mono text-sm space-y-1 max-h-80 overflow-y-auto"
      role="status"
      aria-label="Loading files"
    >
      {/* Header */}
      <div
        // className="text-center"
        className="text-center border-b pb-2 mb-3"
        style={{
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.accent,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="animate-pulse">📦</span>
          <span>Loading application files...</span>
        </div>
      </div>

      {/* File list */}
      <div className="space-y-1">
        {loadingFiles.map((file, index) => {
          const isCurrentFile = index === currentFileIndex;
          const shouldShow = index <= currentFileIndex + 2; // Show current + next 2 files

          if (!shouldShow && file.status === "pending") return null;

          return (
            <div
              key={file.path}
              className={`flex items-center gap-3 py-1 px-2 rounded transition-all duration-200 ${
                isCurrentFile ? "bg-opacity-20" : ""
              }`}
              style={{
                backgroundColor: isCurrentFile
                  ? `${themeConfig.colors.accent}20`
                  : "transparent",
                color:
                  file.status === "complete"
                    ? themeConfig.colors.success || themeConfig.colors.accent
                    : themeConfig.colors.text,
              }}
            >
              <div className="w-4 flex justify-center">
                {getStatusIcon(file.status)}
              </div>

              <div className="flex-1">
                <span
                  className={file.status === "loading" ? "animate-pulse" : ""}
                >
                  {getFileDisplayName(file.path)}
                </span>
              </div>

              {file.status === "loading" && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <div
                      key={dot}
                      className="w-1 h-1 rounded-full animate-bounce"
                      style={{
                        backgroundColor: themeConfig.colors.accent,
                        animationDelay: `${dot * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {isComplete && (
        <div
          className="mt-4 pt-3 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="flex items-center gap-2 font-bold"
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            <span>🎉</span>
            <span>{completionText}</span>
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: themeConfig.colors.muted }}
          >
            Loaded {files.length} files in{" "}
            {((Date.now() - (startTime || 0)) / 1000).toFixed(1)}s
          </div>
        </div>
      )}
    </div>
  );
}
