"use client";

import { useState, useEffect, useRef, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

interface TerminalLoadingProgressProps {
  duration?: number;
  files?: string[];
  completionText?: string;
  onComplete?: () => void;
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
  "src/components/ui/badge.tsx",
  "src/components/ui/avatar.tsx",
  "src/components/ui/dialog.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/popover.tsx",
  "src/components/ui/tooltip.tsx",
  "src/components/ui/sheet.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/textarea.tsx",
  "src/components/ui/label.tsx",
  "src/components/ui/separator.tsx",
  "src/components/ui/progress.tsx",
  "src/components/terminal/Terminal.tsx",
  "src/components/terminal/CommandInput.tsx",
  "src/components/terminal/CommandHistory.tsx",
  "src/components/terminal/TerminalOutput.tsx",
  "src/components/projects/ProjectCard.tsx",
  "src/components/projects/ProjectsGrid.tsx",
  "src/components/projects/ProjectsFilter.tsx",
  "src/components/layout/Header.tsx",
  "src/components/layout/Footer.tsx",
  "src/components/layout/Navigation.tsx",
  "src/hooks/useTheme.ts",
  "src/hooks/useTerminal.ts",
  "src/hooks/useLocalStorage.ts",
  "src/hooks/useDebounce.ts",
  "src/lib/commands/commandRegistry.ts",
  "src/lib/themes/themeConfig.ts",
  "src/lib/utils/validation.ts",
  "src/lib/utils/formatting.ts",
  "src/types/terminal.ts",
  "src/types/theme.ts",
  "src/types/project.ts",
  "src/types/api.ts",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/projects/page.tsx",
  "src/app/globals.css",
  "package.json",
  "tailwind.config.ts",
  "next.config.js",
  "tsconfig.json",
  ".env.local",
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

      setCurrentFileIndex(currentIndex);
      setLoadingFiles((prev) =>
        prev.map((file, index) => {
          if (index === currentIndex) {
            return { ...file, status: "loading" as const };
          }
          return file;
        }),
      );

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

  // Auto-scroll to keep current file visible
  useEffect(() => {
    if (currentFileIndex >= 0 && scrollContainerRef.current) {
      const currentElement = scrollContainerRef.current.querySelector(
        `[data-file-index="${currentFileIndex}"]`,
      );
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentFileIndex]);

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
      ref={scrollContainerRef}
      className="font-mono text-sm space-y-1 max-h-[28rem] overflow-y-auto"
      role="status"
      aria-label="Loading files"
    >
      <div
        className="text-center border-b pb-2 mb-3"
        style={{
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.accent,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="animate-pulse">📦</span>
          <span>Loading application files...</span>
          <span
            className="text-xs"
            style={{ color: themeConfig.colors.muted }}
          >
            ({loadingFiles.filter((f) => f.status === "complete").length}/
            {files.length})
          </span>
        </div>
      </div>
      <div className="space-y-1">
        {loadingFiles.map((file, index) => {
          const isCurrentFile = index === currentFileIndex;
          // Show more files: current file, up to 5 ahead, and all completed files
          const shouldShow =
            file.status === "complete" ||
            file.status === "loading" ||
            index <= currentFileIndex + 5;

          if (!shouldShow) return null;

          return (
            <div
              key={file.path}
              data-file-index={index}
              // eslint-disable-next-line prettier/prettier
              className={`flex items-center gap-3 py-1 px-2 rounded transition-all duration-200 ${isCurrentFile ? "bg-opacity-20" : ""
                // eslint-disable-next-line prettier/prettier
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
