/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type JSX,
} from "react";
// Correctly use your custom theme hook
import { useTheme } from "@/hooks/useTheme";
import { TabCompletion } from "./TabCompletion";
import { CommandSuggestions } from "./CommandSuggestions";
import { useSecurity } from "@/hooks/useSecurity";

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (command: string) => void;
  onHistoryNavigate: (direction: "up" | "down") => string;
  isProcessing: boolean;
  availableCommands?: string[];
  prompt?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onClearError?: () => void;
  showOnEmpty?: boolean;
  getCommandSuggestions?: (input: string, limit?: number) => string[];
  getFrequentCommands?: () => string[];
}

/**
 * CommandInput component for entering terminal commands.
 * Provides an input field with tab completion and history navigation.
 * @param {CommandInputProps} props - The props for the component.
 * @returns {JSX.Element} - The command input component.
 */
export function CommandInput({
  value,
  onChange,
  onSubmit,
  onHistoryNavigate,
  isProcessing,
  availableCommands = [],
  prompt = "$",
  inputRef: externalInputRef,
  onClearError,
  showOnEmpty = false,
  getCommandSuggestions,
  getFrequentCommands,
}: CommandInputProps): JSX.Element {
  // MODIFICATION: Correctly destructure the theme hook.
  // Removed `appliedTheme` and `subscribeToThemeChanges` as they are not provided by the hook.
  const { themeConfig, theme } = useTheme();

  // Security integration
  const { validateInput, threatAlerts, isSecure } = useSecurity();

  const inputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = externalInputRef || inputRef;
  const measureRef = useRef<HTMLSpanElement>(null);
  const [showCursor, setShowCursor] = useState(true);
  const [showTabCompletion, setShowTabCompletion] = useState(false);
  const [tabCompletionIndex, setTabCompletionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(showOnEmpty);
  const [suggestionTrigger, setSuggestionTrigger] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorIndex, setCursorIndex] = useState(0);

  // MODIFICATION: Removed the two `useEffect` hooks that tried to force re-renders.
  // The component will automatically re-render when `theme` or `themeConfig` changes.

  // Cursor blinking effect - optimized for performance
  useEffect(() => {
    if (isProcessing) return; // Don't blink when processing

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Calculate cursor position based on text width and cursor index
  useEffect(() => {
    if (measureRef.current) {
      const text = value.substring(0, cursorIndex);
      measureRef.current.textContent = text;
      const rect = measureRef.current.getBoundingClientRect();
      setCursorPosition(rect.width);
    }
  }, [value, cursorIndex]);

  // Focus management
  useEffect(() => {
    if (actualInputRef.current && !isProcessing) {
      actualInputRef.current.focus();
    }
  }, [isProcessing, actualInputRef]);

  // Show suggestions on mount if showOnEmpty is true
  useEffect(() => {
    console.log("CommandInput suggestions effect:", {
      showOnEmpty,
      valueLength: value.length,
      getCommandSuggestions: !!getCommandSuggestions,
    });

    if (showOnEmpty && value.length === 0) {
      setShowSuggestions(true);
      setSuggestionTrigger((prev) => !prev);
    }
  }, [showOnEmpty, value.length, getCommandSuggestions]);

  // Update cursor index when input changes - debounced for performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (actualInputRef.current) {
        const selectionStart = actualInputRef.current.selectionStart || 0;
        setCursorIndex(selectionStart);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [value, actualInputRef]);

  // Show suggestions on input change - simplified and more reliable
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Suggestion effect triggered:", {
        value,
        valueLength: value.length,
        showOnEmpty,
        isProcessing,
        showTabCompletion,
      });

      const shouldShowSuggestions =
        !isProcessing &&
        !showTabCompletion &&
        (value.length > 0 || showOnEmpty);

      console.log("Should show suggestions:", shouldShowSuggestions);
      setShowSuggestions(shouldShowSuggestions);

      // Trigger suggestion updates for better responsiveness
      if (shouldShowSuggestions) {
        setSuggestionTrigger((prev) => !prev);
      }
    }, 50); // Reduced debounce for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [value, isProcessing, showTabCompletion, showOnEmpty]);

  // Security warning management
  useEffect(() => {
    if (threatAlerts.length > 0) {
      const latestAlert = threatAlerts[threatAlerts.length - 1];
      setSecurityWarning(latestAlert.message);

      // Clear warning after 5 seconds
      const timeout = setTimeout(() => {
        setSecurityWarning(null);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [threatAlerts]);

  // Tab completion logic with enhanced suggestions
  const getTabCompletions = (input: string) => {
    const parts = input.split(" ");
    const lastPart = parts[parts.length - 1].toLowerCase();

    if (lastPart === "") return [];

    // Try smart suggestions first if available
    if (getCommandSuggestions && input.trim()) {
      const smartSuggestions = getCommandSuggestions(input, 10);
      if (smartSuggestions.length > 0) {
        return smartSuggestions.filter((cmd) =>
          cmd.toLowerCase().startsWith(lastPart),
        );
      }
    }

    // Fallback to basic command matching
    const basicMatches = availableCommands.filter((cmd) =>
      cmd.toLowerCase().startsWith(lastPart),
    );

    // Add frequent commands if available and no input yet
    if (!input.trim() && getFrequentCommands) {
      const frequentCommands = getFrequentCommands().slice(0, 5);
      return [...new Set([...frequentCommands, ...basicMatches])];
    }

    return basicMatches;
  };

  const handleTabCompletion = () => {
    const completions = getTabCompletions(value);

    if (completions.length === 1) {
      // Single match - complete immediately
      handleTabComplete(completions[0]);
    } else if (completions.length > 1) {
      // Multiple matches - show completion menu
      setShowTabCompletion(true);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (value.trim() && !isProcessing) {
          // Clear error when submitting new command
          onClearError?.();

          // MODIFICATION: Security validation consistently on both server and client
          // Use try-catch to handle any runtime errors gracefully
          try {
            const validation = await validateInput(value);

            if (!validation.shouldProceed) {
              setSecurityWarning(
                validation.error || "Security validation failed",
              );
              return;
            }

            onSubmit(validation.sanitizedInput);
          } catch (error) {
            // Fallback to original value if validation fails
            console.warn("Security validation error:", error);
            onSubmit(value.trim());
          }
          setShowTabCompletion(false);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (showTabCompletion) {
          // Navigate tab completions
          const completions = getTabCompletions(value);
          setTabCompletionIndex((prev) =>
            prev > 0 ? prev - 1 : completions.length - 1,
          );
        } else {
          // Navigate command history
          const historyCommand = onHistoryNavigate("up");
          onChange(historyCommand);
        }
        // Update cursor index after navigation
        requestAnimationFrame(() => {
          if (actualInputRef.current) {
            setCursorIndex(actualInputRef.current.selectionStart || 0);
          }
        });
        break;

      case "ArrowDown":
        e.preventDefault();
        if (showTabCompletion) {
          // Navigate tab completions
          const completions = getTabCompletions(value);
          setTabCompletionIndex((prev) =>
            prev < completions.length - 1 ? prev + 1 : 0,
          );
        } else {
          // Navigate command history
          const historyCommand = onHistoryNavigate("down");
          onChange(historyCommand);
        }
        // Update cursor index after navigation
        requestAnimationFrame(() => {
          if (actualInputRef.current) {
            setCursorIndex(actualInputRef.current.selectionStart || 0);
          }
        });
        break;

      case "Tab":
        e.preventDefault(); // Always prevent default tab behavior in terminal

        if (showSuggestions) {
          // If suggestions are visible, let CommandSuggestions handle it
          return;
        }

        // If no suggestions are showing, trigger tab completion or show suggestions
        if (value.trim()) {
          handleTabCompletion();
        } else {
          // Show suggestions when tab is pressed on empty input
          setShowSuggestions(true);
          setSuggestionTrigger((prev) => !prev);
        }
        break;

      case "ArrowLeft":
      case "ArrowRight":
        // Let browser handle cursor movement, then update our cursor index
        requestAnimationFrame(() => {
          if (actualInputRef.current) {
            setCursorIndex(actualInputRef.current.selectionStart || 0);
          }
        });
        break;

      case "Escape":
        e.preventDefault();
        setShowTabCompletion(false);
        setShowSuggestions(false);
        setSecurityWarning(null);
        // Clear error when pressing Escape
        onClearError?.();
        break;

      case "l":
        if (e.ctrlKey) {
          e.preventDefault();
          onClearError?.();
          onSubmit("clear");
        }
        break;

      case "r":
        if (e.ctrlKey) {
          e.preventDefault();
          // Show command history search (can be implemented later)
          setShowSuggestions(true);
          // If we have frequent commands, show them
          if (getFrequentCommands && !value.trim()) {
            setSuggestionTrigger((prev) => !prev);
          }
        }
        break;

      default:
        setShowTabCompletion(false);
        break;
    }
  };

  const handleTabComplete = (completion: string) => {
    const parts = value.split(" ");
    parts[parts.length - 1] = completion;
    onChange(parts.join(" ") + " ");
    setShowTabCompletion(false);

    // Focus back to input after completion for better UX
    setTimeout(() => {
      if (actualInputRef.current) {
        actualInputRef.current.focus();
      }
    }, 50);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    const parts = value.split(" ");
    parts[parts.length - 1] = suggestion;
    onChange(parts.join(" ") + " ");
    setShowSuggestions(false);

    // Focus back to input after selection for better UX
    setTimeout(() => {
      if (actualInputRef.current) {
        actualInputRef.current.focus();
      }
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Input changed:", { oldValue: value, newValue, showOnEmpty });

    onChange(newValue);

    // Update cursor index immediately for responsive feel
    const selectionStart = e.target.selectionStart || 0;
    setCursorIndex(selectionStart);

    // Clear error when user starts typing
    if (newValue !== value) {
      onClearError?.();
    }

    // Show suggestions when user types or when showOnEmpty is true
    const shouldShow = newValue.length > 0 || showOnEmpty;
    console.log("Should show suggestions:", shouldShow, {
      inputLength: newValue.length,
      showOnEmpty,
    });

    setShowSuggestions(shouldShow);

    // Always trigger suggestion update when input changes
    setSuggestionTrigger((prev) => !prev);
  };

  const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
  };

  const handleInputFocus = () => {
    // Show suggestions when input gains focus, especially if showOnEmpty is true
    if (showOnEmpty || value.length > 0) {
      setShowSuggestions(true);
      setSuggestionTrigger((prev) => !prev);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
    // Also trigger focus behavior on click
    handleInputFocus();
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
  };

  // Global escape key handler
  useEffect(() => {
    const handleGlobalEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        // Clear error when Escape is pressed anywhere
        onClearError?.();
      }
    };

    document.addEventListener("keydown", handleGlobalEscape);
    return () => document.removeEventListener("keydown", handleGlobalEscape);
  }, [onClearError]);

  return (
    <div className="flex items-center gap-2 w-full">
      <span
        className="font-mono text-sm shrink-0"
        style={{ color: themeConfig.colors.accent }}
      >
        {prompt}
      </span>

      <div className="flex-1 relative min-w-0 flex items-center">
        <div className="w-full relative">
          <input
            ref={actualInputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onSelect={handleInputSelect}
            onFocus={handleInputFocus}
            onClick={handleInputClick}
            onKeyUp={handleInputKeyUp}
            className="w-full bg-transparent border-0 outline-none font-mono text-sm p-0 m-0 resize-none"
            style={{
              color: themeConfig.colors.text,
              caretColor: "transparent", // Hide native cursor
              boxShadow: "none",
              border: "0px solid transparent",
              fontSize: "inherit",
              lineHeight: "inherit",
              fontFamily: "inherit",
              background: "transparent",
              borderRadius: "0",
              padding: "0",
              margin: "0",
            }}
            placeholder="Type a command or press Tab for suggestions..."
            disabled={isProcessing}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Terminal command input"
            enterKeyHint="send"
          />

          {/* Hidden span to measure text width for accurate cursor positioning */}
          <span
            ref={measureRef}
            className="absolute top-0 left-0 font-mono text-sm invisible whitespace-pre pointer-events-none"
            style={{
              color: themeConfig.colors.text,
              fontSize: "inherit",
              lineHeight: "inherit",
              fontFamily: "inherit",
              padding: "0",
              margin: "0",
              border: "0px solid transparent",
            }}
          />

          {/* Custom Cursor */}
          {showCursor && !isProcessing && (
            <span
              className="absolute top-0 font-mono text-sm pointer-events-none select-none"
              style={{
                color: themeConfig.colors.accent,
                left: `${cursorPosition}px`,
                animation: "blink 1s infinite",
                fontSize: "inherit",
                lineHeight: "inherit",
                fontFamily: "inherit",
                padding: "0",
                margin: "0",
                border: "0px solid transparent",
              }}
            >
              ▋
            </span>
          )}

          {/* Security Warning */}
          {securityWarning && (
            <div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs px-2 py-1 rounded text-center"
              style={{
                backgroundColor: `${themeConfig.colors.error}20`,
                color: themeConfig.colors.error,
                border: `1px solid ${themeConfig.colors.error}40`,
                minWidth: "max-content",
                zIndex: 10,
              }}
            >
              ⚠️ {securityWarning}
            </div>
          )}
        </div>
      </div>

      {/* Tab Completion */}
      {showTabCompletion && (
        <TabCompletion
          input={value.split(" ").pop() || ""}
          availableCommands={availableCommands}
          onComplete={handleTabComplete}
          visible={showTabCompletion}
        />
      )}

      {/* Enhanced Command Suggestions */}
      {showSuggestions && (
        <CommandSuggestions
          input={value}
          availableCommands={availableCommands}
          onSelect={handleSuggestionSelect}
          onCommandUsed={(command) => {
            // Track command usage for analytics if needed
            console.debug("Command used:", command);
          }}
          visible={showSuggestions}
          showOnEmpty={true}
          showDescriptions={true}
          enableCache={true}
          enableLearning={true}
          maxSuggestions={8}
          debounceMs={50}
          minQueryLength={0}
        />
      )}

      {/* Custom cursor animation styles */}
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }

        input {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        input:focus {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }

        input::placeholder {
          color: transparent;
        }

        /* Custom scrollbar for suggestions */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
