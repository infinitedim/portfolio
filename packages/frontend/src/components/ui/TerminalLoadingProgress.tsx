"use client";

import { useState, useEffect, useRef, type JSX } from "react";
import { useTheme } from "@/hooks/useTheme";

interface TerminalLoadingProgressProps {
  duration?: number;
  files?: Array<string | { path: string; size?: string }>;
  completionText?: string;
  onComplete?: () => void;
  autoStart?: boolean;
  showSystemInfo?: boolean;
  showProgressBar?: boolean;
  enableTypewriter?: boolean;
}

interface LoadingFile {
  path: string;
  status: "pending" | "loading" | "complete" | "error";
  progress?: number;
  size?: string;
  loadTime?: number;
}

const DEFAULT_FILES = [
  { path: "src/components/ui/button.tsx", size: "4.2 KB" },
  { path: "src/components/ui/card.tsx", size: "3.1 KB" },
  { path: "src/components/ui/input.tsx", size: "2.8 KB" },
  { path: "src/components/ui/badge.tsx", size: "1.9 KB" },
  { path: "src/components/ui/avatar.tsx", size: "3.5 KB" },
  { path: "src/components/ui/dialog.tsx", size: "5.2 KB" },
  { path: "src/components/ui/dropdown-menu.tsx", size: "6.8 KB" },
  { path: "src/components/ui/popover.tsx", size: "4.1 KB" },
  { path: "src/components/ui/tooltip.tsx", size: "2.7 KB" },
  { path: "src/components/ui/sheet.tsx", size: "4.9 KB" },
  { path: "src/components/terminal/Terminal.tsx", size: "18.2 KB" },
  { path: "src/components/terminal/CommandInput.tsx", size: "12.4 KB" },
  { path: "src/components/terminal/CommandHistory.tsx", size: "8.1 KB" },
  { path: "src/components/terminal/TerminalOutput.tsx", size: "6.3 KB" },
  { path: "src/hooks/useTheme.ts", size: "7.9 KB" },
  { path: "src/hooks/useTerminal.ts", size: "15.6 KB" },
  { path: "src/hooks/useLocalStorage.ts", size: "3.2 KB" },
  { path: "src/lib/commands/commandRegistry.ts", size: "22.1 KB" },
  { path: "src/lib/themes/themeConfig.ts", size: "9.8 KB" },
  { path: "src/lib/utils/validation.ts", size: "4.5 KB" },
  { path: "src/types/terminal.ts", size: "2.9 KB" },
  { path: "src/types/theme.ts", size: "1.8 KB" },
  { path: "package.json", size: "3.4 KB" },
  { path: "tailwind.config.ts", size: "2.1 KB" },
  { path: "next.config.js", size: "1.6 KB" },
  { path: "tsconfig.json", size: "1.2 KB" },
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
  showSystemInfo = true,
}: TerminalLoadingProgressProps): JSX.Element {
  const { themeConfig, theme, mounted } = useTheme();
  const [loadingFiles, setLoadingFiles] = useState<LoadingFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [globalProgress, setGlobalProgress] = useState(0);
  const [systemInfo, setSystemInfo] = useState("");
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize files
  useEffect(() => {
    if (!mounted) return;

    const initialFiles: LoadingFile[] = files.map((file) => {
      const fileData = typeof file === "string" ? { path: file } : file;
      return {
        path: fileData.path,
        status: "pending" as const,
        size: fileData.size,
        loadTime: 0,
      };
    });
    setLoadingFiles(initialFiles);

    if (autoStart) {
      setStartTime(Date.now());
      if (showSystemInfo) {
        setSystemInfo("🔧 Initializing terminal environment...");
      }
    }
  }, [files, autoStart, showSystemInfo, mounted]);

  // Enhanced loading effect with realistic timing
  useEffect(() => {
    if (!startTime || isComplete) return;

    const fileLoadDuration = duration / files.length;
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex >= files.length) {
        setIsComplete(true);
        setGlobalProgress(100);
        setCompletionTime(Date.now());
        if (showSystemInfo) {
          setSystemInfo("🎉 Terminal initialization complete!");
        }
        onComplete?.();
        clearInterval(interval);
        return;
      }

      setCurrentFileIndex(currentIndex);
      const fileStartTime = Date.now();

      // Update system info based on current file
      if (showSystemInfo) {
        const currentFile =
          typeof files[currentIndex] === "string"
            ? (files[currentIndex] as string)
            : (files[currentIndex] as { path: string }).path;

        if (currentFile.includes("theme")) {
          setSystemInfo("🎨 Loading theme configurations...");
        } else if (currentFile.includes("terminal")) {
          setSystemInfo("💻 Initializing terminal components...");
        } else if (currentFile.includes("hook")) {
          setSystemInfo("🔗 Setting up React hooks...");
        } else if (currentFile.includes("command")) {
          setSystemInfo("⚡ Loading command registry...");
        } else {
          setSystemInfo(`📦 Loading ${currentFile.split("/").pop()}...`);
        }
      }

      setLoadingFiles((prev) =>
        prev.map((file, index) => {
          if (index === currentIndex) {
            return { ...file, status: "loading" as const };
          }
          return file;
        }),
      );

      // Update global progress
      setGlobalProgress(Math.round((currentIndex / files.length) * 100));

      // Complete the file after a realistic delay
      setTimeout(() => {
        const loadTime = Date.now() - fileStartTime;
        setLoadingFiles((prev) =>
          prev.map((file, index) => {
            if (index === currentIndex) {
              return { ...file, status: "complete" as const, loadTime };
            }
            return file;
          }),
        );
      }, fileLoadDuration * 0.7);

      currentIndex++;
    }, fileLoadDuration);

    return () => clearInterval(interval);
  }, [startTime, duration, files, isComplete, onComplete, showSystemInfo]);

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

  const getStatusIcon = (status: LoadingFile["status"], loadTime?: number) => {
    switch (status) {
      case "pending":
        return <span style={{ color: themeConfig.colors.muted }}>⏳</span>;
      case "loading":
        return (
          <span
            className="animate-spin"
            style={{ color: themeConfig.colors.accent }}
          >
            ⟳
          </span>
        );
      case "complete": {
        const icon = loadTime && loadTime < 100 ? "⚡" : "✓";
        return (
          <span
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            {icon}
          </span>
        );
      }
      case "error":
        return (
          <span style={{ color: themeConfig.colors.error || "#ef4444" }}>
            ✗
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
      className="font-mono text-sm space-y-1 max-h-[32rem] overflow-y-auto"
      role="status"
      aria-label="Loading files"
      suppressHydrationWarning={true}
    >
      {/* Header with animated logo and progress */}
      <div
        className="text-center border-b pb-3 mb-4"
        style={{
          borderColor: themeConfig.colors.border,
          color: themeConfig.colors.accent,
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className={isComplete ? "" : "animate-pulse"}>
            {isComplete ? "�" : "�📦"}
          </span>
          <span className="text-lg font-bold">Terminal Portfolio</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
          <div
            className="h-2 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${globalProgress}%`,
              backgroundColor: themeConfig.colors.accent,
              boxShadow: `0 0 8px ${themeConfig.colors.accent}40`,
            }}
          />
        </div>

        {/* Status info */}
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: themeConfig.colors.muted }}>
            {systemInfo || "Initializing..."}
          </span>
          <span style={{ color: themeConfig.colors.muted }}>
            {loadingFiles.filter((f) => f.status === "complete").length}/
            {files.length} ({globalProgress}%)
          </span>
        </div>
      </div>

      {/* File loading list */}
      <div className="space-y-1">
        {loadingFiles.map((file, index) => {
          const isCurrentFile = index === currentFileIndex;
          const shouldShow =
            file.status === "complete" ||
            file.status === "loading" ||
            index <= currentFileIndex + 3;

          if (!shouldShow) return null;

          return (
            <div
              key={file.path}
              data-file-index={index}
              className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${isCurrentFile ? "bg-opacity-20 scale-[1.02]" : ""}`}
              style={{
                backgroundColor: isCurrentFile
                  ? `${themeConfig.colors.accent}20`
                  : "transparent",
                color:
                  file.status === "complete"
                    ? themeConfig.colors.success || themeConfig.colors.accent
                    : themeConfig.colors.text,
                transform: isCurrentFile ? "translateX(4px)" : "translateX(0)",
              }}
            >
              <div className="w-5 flex justify-center">
                {getStatusIcon(file.status, file.loadTime)}
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={`truncate ${file.status === "loading" ? "animate-pulse" : ""}`}
                >
                  {getFileDisplayName(file.path)}
                </div>
                {file.size && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: themeConfig.colors.muted }}
                  >
                    {file.size}
                    {file.loadTime && file.status === "complete" && (
                      <span className="ml-2">({file.loadTime}ms)</span>
                    )}
                  </div>
                )}
              </div>

              {file.status === "loading" && (
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <div
                      key={dot}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        backgroundColor: themeConfig.colors.accent,
                        animationDelay: `${dot * 0.15}s`,
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
          className="mt-6 pt-4 border-t"
          style={{ borderColor: themeConfig.colors.border }}
        >
          <div
            className="flex items-center gap-3 font-bold text-lg mb-2"
            style={{
              color: themeConfig.colors.success || themeConfig.colors.accent,
            }}
          >
            <span className="animate-bounce">🎉</span>
            <span>{completionText}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div
              className="bg-gray-800 rounded-lg p-3"
              style={{ backgroundColor: `${themeConfig.colors.accent}10` }}
            >
              <div style={{ color: themeConfig.colors.muted }}>
                Files Loaded
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                {files.length}
              </div>
            </div>

            <div
              className="bg-gray-800 rounded-lg p-3"
              style={{ backgroundColor: `${themeConfig.colors.accent}10` }}
            >
              <div style={{ color: themeConfig.colors.muted }}>Load Time</div>
              <div
                className="text-lg font-bold"
                style={{ color: themeConfig.colors.accent }}
              >
                {completionTime && startTime
                  ? ((completionTime - startTime) / 1000).toFixed(1)
                  : "0.0"}
                s
              </div>
            </div>
          </div>

          <div
            className="text-center text-xs mt-4 animate-pulse"
            style={{ color: themeConfig.colors.muted }}
          >
            🎯 Ready to explore? Press any key to continue...
          </div>
        </div>
      )}
    </div>
  );
}
