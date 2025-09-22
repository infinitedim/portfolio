/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useMemo, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";
import { useTerminal } from "@portfolio/frontend/src/hooks/useTerminal";
import { useAccessibility } from "@portfolio/frontend/src/components/accessibility/AccessibilityProvider";
import { CommandInput } from "./CommandInput";
import { TerminalHistory } from "./TerminalHistory";
import { ASCIIBanner } from "@portfolio/frontend/src/components/ui/ASCIIBanner";
import { InteractiveWelcome } from "@portfolio/frontend/src/components/ui/InteractiveWelcome";
import { MobileTerminal } from "@portfolio/frontend/src/components/mobile/MobileTerminal";
import { AccessibilityMenu } from "@portfolio/frontend/src/components/accessibility/AccessibilityMenu";
import { NotificationToast } from "@portfolio/frontend/src/components/ui/NotificationToast";
import { DevelopmentBanner } from "@portfolio/frontend/src/components/ui/DevelopmentBanner";
import { useFont } from "@portfolio/frontend/src/hooks/useFont";
import { CustomizationService } from "@portfolio/frontend/src/lib/services/customizationService";
import { CustomizationButton } from "../customization/CustomizationButton";
import { CustomizationManager } from "../customization/CustomizationManager";
import { SkipLinks } from "@portfolio/frontend/src/components/accessibility/SkipToContent";
import { TerminalLoadingProgress } from "../ui";
import { SpotifyAuth } from "../ui/SpotifyAuth";
import { NowPlayingWidget } from "../ui/NowPlayingWidget";

interface TerminalProps {
  onThemeChange?: (theme: string) => void;
  onFontChange?: (font: string) => void;
}

/**
 * The main terminal component that integrates all parts of the terminal application.
 * @param {TerminalProps} props - The properties for the Terminal component.
 * @param {(theme: string) => void} [props.onThemeChange] - A callback executed when the theme changes.
 * @param {(font: string) => void} [props.onFontChange] - A callback executed when the font changes.
 * @returns {JSX.Element | null} - The complete terminal interface component.
 */
export function Terminal({
  onThemeChange,
  onFontChange,
}: TerminalProps): JSX.Element | null {
  // MODIFICATION: Add hook safety guards before destructuring
  const themeHookResult = useTheme();
  const fontHookResult = useFont();
  const { announceMessage, isReducedMotion } = useAccessibility();

  // Add minimum loading time to ensure progress bar animation runs
  const [hasMinimumLoadingTime, setHasMinimumLoadingTime] = useState(false);

  // Create theme performance interface for useTerminal
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
    undefined, // onOpenDemo
    () => setShowNowPlaying(true), // onOpenNowPlaying
    () => setShowSpotifyAuth(true), // onOpenAuth
    themePerformance, // theme performance metrics
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

  // Ensure minimum loading time for progress bar animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMinimumLoadingTime(true);
    }, 2000); // 2 second minimum loading time

    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (bottomRef.current && !isReducedMotion) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (bottomRef.current) {
      bottomRef.current.scrollIntoView();
    }
  }, [history, isReducedMotion]);

  // Enhanced global keyboard listener that respects tab navigation
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();

      // Don't interfere with inputs, textareas, or when modifiers are pressed
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target.contentEditable === "true" ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        e.key === "Tab" || // IMPORTANT: Don't interfere with Tab navigation
        e.key === "Escape" ||
        e.key === "Enter" ||
        e.key === "ArrowUp" || // Don't interfere with arrow navigation
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        showCustomizationManager // Don't interfere when customization manager is open
      ) {
        return;
      }

      // Additional check: Don't interfere if user is navigating with focus
      if (document.activeElement && document.activeElement !== document.body) {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement.tagName.toLowerCase() !== "body" &&
          activeElement !== commandInputRef.current
        ) {
          return; // User is focused on another element, don't interfere
        }
      }

      // Only handle printable characters for command input
      if (
        commandInputRef.current &&
        e.key.length === 1 &&
        /^[a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]$/.test(e.key)
      ) {
        commandInputRef.current.focus();
        // Add the typed character to current input
        setCurrentInput((prev) => prev + e.key);
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [showCustomizationManager, setCurrentInput]);

  // Focus terminal on click
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

  // Hide welcome after first command
  useEffect(() => {
    if (history.length > 0) {
      setShowWelcome(false);
    }
  }, [history.length]);

  // Early return if hooks are not properly initialized
  if (!themeHookResult || !fontHookResult) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <TerminalLoadingProgress />
      </div>
    );
  }

  // Safe destructuring after validation
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
      // Handle customization manager command
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

      // Handle theme change commands with enhanced feedback
      if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_THEME:")
      ) {
        const themeName = output.content.split(":")[1];
        console.log(`🎨 Terminal: Attempting to change theme to ${themeName}`);

        // MODIFICATION: Add function existence check before calling
        if (typeof changeTheme === "function") {
          const success = changeTheme(themeName as any);

          if (success) {
            onThemeChange?.(themeName);
            showNotification(`Theme changed to "${themeName}"`, "success");
            announceMessage(`Theme changed to ${themeName}`, "polite");

            // Add success message to history without clearing
            addToHistory(command, {
              ...output,
              content: [
                `✅ Theme changed to "${themeName}"`,
                "💾 Theme preference saved automatically.",
                "🎨 Theme applied instantly!",
              ].join("\n"),
              type: "success",
            });

            // Theme change is handled by useTheme hook automatically
            // No need to reload the page or clear history
          } else {
            // MODIFICATION: Use the `themeError` state from the hook for a more precise error message.
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
      // Handle font change commands
      else if (
        typeof output.content === "string" &&
        output.content.startsWith("CHANGE_FONT:")
      ) {
        const fontName = output.content.split(":")[1];

        // MODIFICATION: Add function existence check before calling
        if (typeof changeFont === "function") {
          changeFont(fontName as any);
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
      // Handle status command with enhanced info
      else if (
        typeof output.content === "string" &&
        output.content === "SHOW_STATUS"
      ) {
        const uptime = new Date().toLocaleString();
        const customThemes = customizationService.getCustomThemes().length;
        const customFonts = customizationService.getCustomFonts().length;

        // Enhanced status with command analytics and performance metrics
        const analytics = commandAnalytics || {
          totalCommands: 0,
          uniqueCommands: 0,
          successRate: 100,
          topCommands: [],
        };

        // Get performance metrics
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

  // MODIFICATION: Use mounted state to prevent hydration issues and ensure minimum loading time
  if (!mounted || !themeConfig || !fontConfig || !hasMinimumLoadingTime) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-white">
        <TerminalLoadingProgress
          duration={2500}
          files={[
            "src/components/terminal/Terminal.tsx",
            "src/hooks/useTheme.ts",
            "src/hooks/useFont.ts",
            "src/lib/themes/themeConfig.ts",
            "src/lib/fonts/fontConfig.ts",
            "src/components/ui/TerminalLoadingProgress.tsx",
            "package.json",
            "next.config.js",
          ]}
          completionText="🚀 Terminal ready!"
          autoStart={true}
        />
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

        <div
          ref={terminalRef}
          id="main-content"
          // MODIFICATION: Removed `appliedTheme` from the key. `theme` is the correct state to use.
          key={`terminal-${theme}`}
          className={`min-h-screen w-full pt-16 p-4 sm:p-6 lg:p-8 cursor-text terminal-container ${!isReducedMotion ? "transition-all duration-300" : ""}`}
          style={{
            // MODIFICATION: Add deep property guards with fallbacks
            backgroundColor: themeConfig?.colors?.bg || "#000000",
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
          <div className="max-w-4xl mx-auto space-y-8 mt-10">
            <div className="mb-8">
              <ASCIIBanner />
            </div>

            {/* Interactive Welcome */}
            {showWelcome && history.length === 0 && (
              <InteractiveWelcome
                onCommandSelect={handleWelcomeCommandSelect}
                onDismiss={() => setShowWelcome(false)}
              />
            )}

            {/* Terminal History */}
            <TerminalHistory history={history} />
            <div
              id="command-input"
              className="sticky bottom-0 py-2"
              style={{ backgroundColor: themeConfig?.colors?.bg || "#000000" }}
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
                  "theme",
                  "font",
                ]}
                inputRef={commandInputRef}
                getCommandSuggestions={getCommandSuggestions}
                getFrequentCommands={getFrequentCommands}
                showOnEmpty={true}
              />
            </div>

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Customization Button */}
        <div
          id="customization"
          tabIndex={-1}
        >
          <CustomizationButton />
        </div>

        {/* Customization Manager */}
        <CustomizationManager
          isOpen={showCustomizationManager}
          onClose={() => setShowCustomizationManager(false)}
        />

        {/* Spotify Auth Modal */}
        {showSpotifyAuth && (
          <SpotifyAuth
            onClose={() => setShowSpotifyAuth(false)}
            onAuthenticated={() => {
              setShowSpotifyAuth(false);
              showNotification("Spotify connected successfully!", "success");
            }}
          />
        )}

        {/* Now Playing Widget */}
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

        {/* Notification Toast */}
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
