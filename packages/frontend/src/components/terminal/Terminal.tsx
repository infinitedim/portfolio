/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect, useMemo, type JSX } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useTerminal } from "@/hooks/useTerminal";
import { useI18n } from "@/hooks/useI18n";
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider";
import { CommandInput } from "./CommandInput";
import { TerminalHistory } from "./TerminalHistory";
import { ASCIIBanner } from "@/components/ui/ASCIIBanner";
import { InteractiveWelcome } from "@/components/ui/InteractiveWelcome";
import { MobileTerminal } from "@/components/mobile/MobileTerminal";
import { AccessibilityMenu } from "@/components/accessibility/AccessibilityMenu";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { DevelopmentBanner } from "@/components/ui/DevelopmentBanner";
import { useFont } from "@/hooks/useFont";
import { CustomizationService } from "@/lib/services/customizationService";
import { CustomizationButton } from "../customization/CustomizationButton";
import { CustomizationManager } from "../customization/CustomizationManager";
import { SkipLinks } from "@/components/accessibility/SkipToContent";
import { TerminalLoadingProgress, CommandLoadingIndicator } from "../ui";
import { SpotifyAuth } from "../ui/SpotifyAuth";
import { NowPlayingWidget } from "../ui/NowPlayingWidget";
import { LetterGlitch } from "../ui/LetterGlitch";
import { isThemeName } from "@/types/theme";
import { isFontName } from "@/types/font";

/**
 * Props for the Terminal component
 * @interface TerminalProps
 * @property {(theme: string) => void} [onThemeChange] - Callback when theme changes
 * @property {(font: string) => void} [onFontChange] - Callback when font changes
 */
interface TerminalProps {
  onThemeChange?: (theme: string) => void;
  onFontChange?: (font: string) => void;
}

/**
 * Main terminal component that integrates all terminal features
 * Provides a complete terminal interface with command execution, history, and customization
 * @param {TerminalProps} props - Component props
 * @param {(theme: string) => void} [props.onThemeChange] - Theme change callback
 * @param {(font: string) => void} [props.onFontChange] - Font change callback
 * @returns {JSX.Element | null} The complete terminal interface or null during initialization
 * @example
 * ```tsx
 * <Terminal
 *   onThemeChange={handleThemeChange}
 *   onFontChange={handleFontChange}
 * />
 * ```
 */
export function Terminal({
  onThemeChange,
  onFontChange,
}: TerminalProps): JSX.Element | null {
  const themeHookResult = useTheme();
  const fontHookResult = useFont();
  const { announceMessage, isReducedMotion } = useAccessibility();
  const { t } = useI18n();

  const [hasMinimumLoadingTime, setHasMinimumLoadingTime] = useState(false);

  const themePerformance = useMemo(
    () => ({
      getPerformanceReport: themeHookResult.getPerformanceReport,
      themeMetrics: themeHookResult.themeMetrics,
      resetMetrics: themeHookResult.resetPerformanceMetrics,
    }),
    [themeHookResult],
  );

  const {
    history,
    currentInput,
    setCurrentInput,
    isProcessing,
    executeCommand,
    addToHistory,
    navigateHistory,
    clearHistory,
    getCommandSuggestions,
    getFrequentCommands,
    commandAnalytics,
    favoriteCommands,
  } = useTerminal(
    undefined,
    () => setShowNowPlaying(true),
    () => setShowSpotifyAuth(true),
    themePerformance,
  );
  const [showCustomizationManager, setShowCustomizationManager] =
    useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);

  const customizationService = CustomizationService.getInstance();

  const terminalRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const [showSpotifyAuth, setShowSpotifyAuth] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  useEffect(() => {
    customizationService.loadAllCustomFonts();
    announceMessage("Terminal portfolio loaded", "polite");
  }, [announceMessage, customizationService]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMinimumLoadingTime(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (bottomRef.current && !isReducedMotion) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [history, isReducedMotion]);

  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.contentEditable === "true" ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === "Tab" ||
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        showCustomizationManager
      ) {
        return;
      }

      if (document.activeElement && document.activeElement !== document.body) {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement.tagName.toLowerCase() !== "body" &&
          activeElement !== commandInputRef.current
        ) {
          return;
        }
      }

      if (
        commandInputRef.current &&
        e.key.length === 1 &&
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]$/.test(e.key)
      ) {
        commandInputRef.current.focus();
        setCurrentInput((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [showCustomizationManager, setCurrentInput]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.tagName === "BUTTON" ||
        target.tagName === "INPUT" ||
        target.tagName === "A"
      ) {
        return;
      }

      const input = terminalRef.current?.querySelector("input");
      if (input) {
        input.focus();
      }
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener("click", handleClick);
      return () => terminal.removeEventListener("click", handleClick);
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      setShowWelcome(false);
    }
  }, [history.length]);

  if (!themeHookResult || !fontHookResult) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-black text-white relative overflow-hidden"
        suppressHydrationWarning={true}
      >
        { }
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
          <TerminalLoadingProgress
            duration={2000}
            files={[
              { path: t("loading"), size: "" },
              { path: t("loading"), size: "" },
              { path: t("loading"), size: "" },
            ]}
            completionText={`🔧 ${t("terminalReady")}!`}
            autoStart={true}
            showSystemInfo={true}
          />
        </div>
      </div>
    );
  }

  const {
    themeConfig,
    changeTheme,
    theme,
    availableThemes,
    mounted,
    error: themeError,
  } = themeHookResult;

  const { fontConfig, changeFont, font, availableFonts } = fontHookResult;

  const showNotification = (
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    setNotification({ message, type });
  };

  const handleWelcomeCommandSelect = (command: string) => {
    setCurrentInput(command);
    handleSubmit(command);
  };

  const handleSubmit = async (command: string) => {
    const output = await executeCommand(command);

    if (output) {
      if (
        typeof output.content === "string" &&
        output.content === "OPEN_CUSTOMIZATION_MANAGER"
      ) {
        setShowCustomizationManager(true);
        addToHistory(command, {
          ...output,
          content: "🎨 Opening customization manager...",
          type: "success",
        });
        showNotification("Customization manager opened!", "success");
        return;
      }

      if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_THEME:")
      ) {
        const themeName = output.content.split(":")[1];
        console.log(`🎨 Terminal: Attempting to change theme to ${themeName}`);

        if (typeof changeTheme === "function" && isThemeName(themeName)) {
          const success = changeTheme(themeName);

          if (success) {
            onThemeChange?.(themeName);
            showNotification(`Theme changed to "${themeName}"`, "success");
            announceMessage(`Theme changed to ${themeName}`, "polite");

            addToHistory(command, {
              ...output,
              content: [
                `✅ Theme changed to "${themeName}"`,
                "💾 Theme preference saved automatically.",
                "🎨 Theme applied instantly!",
              ].join("\n"),
              type: "success",
            });

          } else {
            const errorMsg =
              themeError || `Theme "${themeName}" may not exist or be invalid.`;
            showNotification(`Failed to change theme: ${errorMsg}`, "error");
            addToHistory(command, {
              ...output,
              content: [
                `❌ Failed to change theme to "${themeName}"`,
                `🔍 Error: ${errorMsg}`,
                "💡 Use 'theme -l' to list available themes.",
              ].join("\n"),
              type: "error",
            });
          }
        } else {
          console.error("changeTheme function not available");
          showNotification("Theme change function not available", "error");
        }
      }
      else if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_FONT:")
      ) {
        const fontName = output.content.split(":")[1];

        if (typeof changeFont === "function" && isFontName(fontName)) {
          changeFont(fontName);
          onFontChange?.(fontName);

          showNotification(`Font changed to "${fontName}"`, "success");
          announceMessage(`Font changed to ${fontName}`, "polite");

          addToHistory(command, {
            ...output,
            content: [
              `✅ Font changed to "${fontName}"`,
              "",
              `🔤 Applied ${fontConfig?.name || "Unknown"} typeface`,
              `🔤 Family: ${fontConfig?.family || "Unknown"}`,

              `${fontConfig?.ligatures ? "✨ Font ligatures enabled for enhanced readability" : "📝 Standard font rendering"}`,
              "💾 Font preference saved automatically",
              "",
              "💡 Quick commands:",
              "   font -l    # List all fonts",
              "   font -c    # Show current font info",
              "   customize  # Open customization manager",
            ].join("\n"),
            type: "success",
          });
        } else {
          console.error("changeFont function not available");
          showNotification("Font change function not available", "error");
        }
      }
      else if (
        typeof output.content === "string" &&
        output.content === "SHOW_STATUS"
      ) {
        const uptime = new Date().toLocaleString();
        const customThemes = customizationService.getCustomThemes().length;
        const customFonts = customizationService.getCustomFonts().length;

        const analytics = commandAnalytics || {
          totalCommands: 0,
          uniqueCommands: 0,
          successRate: 100,
          topCommands: [],
        };

        const performanceReport = themeHookResult.getPerformanceReport();
        const currentMetrics = themeHookResult.themeMetrics;

        const statusInfo = [
          "🖥️  Terminal Portfolio System Status",
          "═".repeat(60),
          "",
          `📊 Status: ${Math.random() > 0.5 ? "🟢 Online" : "🟡 Development"}`,
          `🎨 Current Theme: ${themeConfig?.name || "Unknown"} (${theme})`,
          `🔤 Current Font: ${fontConfig?.name || "Unknown"}${fontConfig?.ligatures ? " (ligatures)" : ""}`,
          `⏰ Session Started: ${uptime}`,
          `💻 Platform: ${mounted && typeof window !== "undefined" ? window.navigator.platform : "Server"}`,
          "",
          "📈 Command Analytics:",
          `   • Total commands executed: ${analytics.totalCommands}`,
          `   • Unique commands used: ${analytics.uniqueCommands}`,
          `   • Success rate: ${analytics.successRate.toFixed(1)}%`,
          `   • Most used: ${analytics.topCommands[0]?.command || "N/A"}`,
          "",
          "⚡ Performance Metrics:",
          `   • Theme switches: ${performanceReport.totalSwitches}`,
          `   • Average switch time: ${performanceReport.averageTime.toFixed(1)}ms`,
          `   • Current theme render: ${currentMetrics.renderTime.toFixed(1)}ms`,
          `   • Fastest switch: ${performanceReport.fastestSwitch.toFixed(1)}ms`,
          `   • Most used theme: ${currentMetrics.popularThemes[0]?.theme || theme}`,
          "",
          "🎨 Theme System:",
          `   • ${availableThemes?.length || 0} built-in themes available`,
          `   • ${customThemes} custom themes created`,
          "   • Use 'theme -l' to list all themes",
          "",
          "🔤 Font System:",
          `   • ${availableFonts?.length || 0} system fonts available`,
          `   • ${customFonts} custom fonts uploaded`,
          "   • Use 'font -l' to list all fonts",
          "",
          "⌨️  Enhanced Features:",
          "   • Smart command suggestions (↑/↓ or Ctrl+R)",
          "   • Command analytics and favorites",
          "   • Tab completion with history",
          "   • Real-time performance monitoring",
          "",
          "🎯 Development Progress:",
          "   ▓▓▓▓▓▓▓▓▓░ 95% Complete",
          "",
          "💡 Performance Commands:",
          "   • 'perf' - Quick performance overview",
          "   • 'perf --detailed' - Detailed metrics",
          "   • 'perf --reset' - Reset all metrics",
        ].join("\n");

        addToHistory(command, {
          ...output,
          content: statusInfo,
          type: "success",
        });
      } else {
        addToHistory(command, output);
      }
    }

    setCurrentInput("");
  };

  if (!mounted || !themeConfig || !fontConfig || !hasMinimumLoadingTime) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-black text-white relative overflow-hidden"
        suppressHydrationWarning={true}
      >
        { }
        <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-800" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
          <TerminalLoadingProgress
            duration={3500}
            files={[
              {
                path: "src/components/terminal/Terminal.tsx",
                size: "18.2 KB",
              },
              { path: "src/hooks/useTheme.ts", size: "7.9 KB" },
              { path: "src/hooks/useFont.ts", size: "5.4 KB" },
              { path: "src/hooks/useTerminal.ts", size: "15.6 KB" },
              { path: "src/lib/themes/themeConfig.ts", size: "9.8 KB" },
              { path: "src/lib/fonts/fontConfig.ts", size: "6.2 KB" },
              { path: "src/components/ui/LetterGlitch.tsx", size: "8.1 KB" },
              { path: "src/components/ui/ASCIIBanner.tsx", size: "4.3 KB" },
              {
                path: "src/components/terminal/CommandInput.tsx",
                size: "12.4 KB",
              },
              {
                path: "src/lib/commands/commandRegistry.ts",
                size: "22.1 KB",
              },
              {
                path: "src/hooks/useCommandSuggestions.ts",
                size: "11.8 KB",
              },
              { path: "src/types/terminal.ts", size: "2.9 KB" },
              { path: "package.json", size: "3.4 KB" },
              { path: "next.config.js", size: "1.6 KB" },
            ]}
            completionText="🚀 Terminal Portfolio Ready!"
            autoStart={true}
            showSystemInfo={true}
            showProgressBar={true}
            enableTypewriter={true}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <SkipLinks
        links={[
          { id: "main-content", label: "Skip to terminal", icon: "💻" },
          { id: "command-input", label: "Skip to command input", icon: "⌨️" },
          { id: "customization", label: "Skip to customization", icon: "🎨" },
        ]}
      />

      <MobileTerminal>
        <DevelopmentBanner />
        <AccessibilityMenu />

        { }
        <LetterGlitch
          glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
          glitchSpeed={50}
          centerVignette={false}
          outerVignette={true}
          smooth={true}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ"
          className="opacity-30 fixed inset-0 z-0"
        />

        <div
          ref={terminalRef}
          id="main-content"
          key={`terminal-${theme}`}
          className={`min-h-screen w-full pt-4 px-2 pb-4 sm:pt-16 sm:px-6 lg:px-8 cursor-text terminal-container relative z-10 ${!isReducedMotion ? "transition-all duration-300" : ""}`}
          style={{
            backgroundColor: "transparent",
            color: themeConfig?.colors?.text || "#ffffff",
            fontFamily: fontConfig?.family || "monospace",
            fontWeight: fontConfig?.weight || "normal",
            fontFeatureSettings: fontConfig?.ligatures
              ? '"liga" 1, "calt" 1'
              : '"liga" 0, "calt" 0',
          }}
          suppressHydrationWarning={true}
          role="main"
          aria-label="Terminal interface"
        >
          {
            <div className="relative z-10 w-full max-w-4xl mx-auto space-y-4 sm:space-y-8 mt-2 sm:mt-10">
              <div className="mb-4 sm:mb-8">
                <ASCIIBanner />
              </div>

              { }
              {showWelcome && history.length === 0 && (
                <InteractiveWelcome
                  onCommandSelect={handleWelcomeCommandSelect}
                  onDismiss={() => setShowWelcome(false)}
                />
              )}

              { }
              <TerminalHistory history={history} />

              { }
              {isProcessing && (
                <CommandLoadingIndicator
                  command={currentInput}
                  visible={isProcessing}
                  messages={[
                    "Processing command...",
                    "Executing request...",
                    "Gathering data...",
                    "Compiling response...",
                    "Almost finished...",
                  ]}
                />
              )}

              <div
                id="command-input"
                className="sticky bottom-0 py-2 command-input-container"
                style={{
                  backgroundColor: "transparent",
                }}
                suppressHydrationWarning={true}
                tabIndex={-1}
              >
                <CommandInput
                  value={currentInput}
                  onChange={setCurrentInput}
                  onSubmit={handleSubmit}
                  onHistoryNavigate={navigateHistory}
                  isProcessing={isProcessing}
                  availableCommands={[
                    "help",
                    "skills",
                    "customize",
                    "themes",
                    "fonts",
                    "status",
                    "clear",
                    "alias",
                    "about",
                    "contact",
                    "projects",
                    "experience",
                    "education",
                    "roadmap",
                    "progress",
                    "theme",
                    "font",
                    "language",
                    "demo",
                    "github",
                    "tech-stack",
                    "now-playing",
                    "resume",
                    "social",
                    "shortcuts",
                    "easter-eggs",
                    "pwa",
                  ]}
                  inputRef={commandInputRef}
                  getCommandSuggestions={getCommandSuggestions}
                  getFrequentCommands={getFrequentCommands}
                  showOnEmpty={false}
                />
              </div>

              { }
              <div ref={bottomRef} />
            </div>
          }

          { }
          <div
            id="customization"
            tabIndex={-1}
          >
            <CustomizationButton />
          </div>
        </div>
        { }
        <CustomizationManager
          isOpen={showCustomizationManager}
          onClose={() => setShowCustomizationManager(false)}
        />

        { }
        {showSpotifyAuth && (
          <SpotifyAuth
            onClose={() => setShowSpotifyAuth(false)}
            onAuthenticated={() => {
              setShowSpotifyAuth(false);
              showNotification("Spotify connected successfully!", "success");
            }}
          />
        )}

        { }
        {showNowPlaying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-lg border border-gray-700 shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  🎵 Now Playing
                </h3>
                <button
                  onClick={() => setShowNowPlaying(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <NowPlayingWidget />
            </div>
          </div>
        )}

        { }
        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
      </MobileTerminal>
    </>
  );
}
