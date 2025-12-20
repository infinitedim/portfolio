/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type JSX,
} from "react";
import { useTheme } from "@/hooks/useTheme";
import { TabCompletion } from "./TabCompletion";
import { CommandSuggestions } from "./CommandSuggestions";
import { useSecurity } from "@/hooks/useSecurity";

/**
 * Props for the CommandInput component
 * @interface CommandInputProps
 * @property {string} value - Current input value
 * @property {(value: string) => void} onChange - Callback when input changes
 * @property {(command: string) => void} onSubmit - Callback when command is submitted
 * @property {(direction: "up" | "down") => string} onHistoryNavigate - Navigate command history
 * @property {boolean} isProcessing - Whether a command is currently processing
 * @property {string[]} [availableCommands] - List of available commands for autocompletion
 * @property {string} [prompt] - Custom prompt string (default: "$")
 * @property {React.RefObject<HTMLInputElement | null>} [inputRef] - Ref to the input element
 * @property {() => void} [onClearError] - Callback to clear errors
 * @property {boolean} [showOnEmpty] - Show suggestions when input is empty
 * @property {(input: string, limit?: number) => string[]} [getCommandSuggestions] - Get command suggestions
 * @property {() => string[]} [getFrequentCommands] - Get frequently used commands
 */
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
 * Terminal command input component with tab completion and history navigation
 * Provides an interactive input field with autocompletion, security validation, and visual feedback
 * @param {CommandInputProps} props - Component props
 * @param {string} props.value - Current input value
 * @param {(value: string) => void} props.onChange - Input change callback
 * @param {(command: string) => void} props.onSubmit - Command submission callback
 * @param {(direction: "up" | "down") => string} props.onHistoryNavigate - History navigation callback
 * @param {boolean} props.isProcessing - Processing state
 * @param {string[]} [props.availableCommands] - Available commands for completion
 * @param {string} [props.prompt] - Prompt string (default: "$")
 * @returns {JSX.Element} The command input component
 * @example
 * ```tsx
 * <CommandInput
 *   value={input}
 *   onChange={setInput}
 *   onSubmit={handleSubmit}
 *   onHistoryNavigate={navigateHistory}
 *   isProcessing={false}
 *   availableCommands={['help', 'about', 'projects']}
 * />
 * ```
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
  const { themeConfig, theme } = useTheme();

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

  useEffect(() => {
    if (isProcessing) return;

    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (measureRef.current) {
      const text = value.substring(0, cursorIndex);
      measureRef.current.textContent = text;
      const rect = measureRef.current.getBoundingClientRect();
      setCursorPosition(rect.width);
    }
  }, [value, cursorIndex]);

  useEffect(() => {
    if (actualInputRef.current && !isProcessing) {
      actualInputRef.current.focus();
    }
  }, [isProcessing, actualInputRef]);

  useEffect(() => {
    if (showOnEmpty && value.length === 0) {
      setShowSuggestions(true);
      setSuggestionTrigger((prev) => !prev);
    }
  }, [showOnEmpty, value.length, getCommandSuggestions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (actualInputRef.current) {
        const selectionStart = actualInputRef.current.selectionStart || 0;
        setCursorIndex(selectionStart);
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [value, actualInputRef]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const shouldShowSuggestions =
        !isProcessing &&
        !showTabCompletion &&
        (value.length > 0 || showOnEmpty);

      setShowSuggestions(shouldShowSuggestions);

      if (shouldShowSuggestions) {
        setSuggestionTrigger((prev) => !prev);
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [value, isProcessing, showTabCompletion, showOnEmpty]);

  useEffect(() => {
    if (threatAlerts.length > 0) {
      const latestAlert = threatAlerts[threatAlerts.length - 1];
      setSecurityWarning(latestAlert.message);

      const timeout = setTimeout(() => {
        setSecurityWarning(null);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [threatAlerts]);

  const getTabCompletions = (input: string) => {
    const parts = input.split(" ");
    const lastPart = parts[parts.length - 1].toLowerCase();

    if (lastPart === "") return [];

    if (getCommandSuggestions && input.trim()) {
      const smartSuggestions = getCommandSuggestions(input, 10);
      if (smartSuggestions.length > 0) {
        return smartSuggestions.filter((cmd) =>
          cmd.toLowerCase().startsWith(lastPart),
        );
      }
    }

    const basicMatches = availableCommands.filter((cmd) =>
      cmd.toLowerCase().startsWith(lastPart),
    );

    if (!input.trim() && getFrequentCommands) {
      const frequentCommands = getFrequentCommands().slice(0, 5);
      return [...new Set([...frequentCommands, ...basicMatches])];
    }

    return basicMatches;
  };

  const handleTabCompletion = () => {
    const completions = getTabCompletions(value);

    if (completions.length === 1) {
      handleTabComplete(completions[0]);
    } else if (completions.length > 1) {
      setShowTabCompletion(true);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (value.trim() && !isProcessing) {
          onClearError?.();

          try {
            const validation = await validateInput(value);

            if (!validation.shouldProceed) {
              setSecurityWarning(
                validation.error || "Security validation failed",
              );
              return;
            }

            onSubmit(validation.sanitizedInput);
          } catch {
            onSubmit(value.trim());
          }
          setShowTabCompletion(false);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (showTabCompletion) {
          const completions = getTabCompletions(value);
          setTabCompletionIndex((prev) =>
            prev > 0 ? prev - 1 : completions.length - 1,
          );
        } else {
          const historyCommand = onHistoryNavigate("up");
          onChange(historyCommand);
        }
        requestAnimationFrame(() => {
          if (actualInputRef.current) {
            setCursorIndex(actualInputRef.current.selectionStart || 0);
          }
        });
        break;

      case "ArrowDown":
        e.preventDefault();
        if (showTabCompletion) {
          const completions = getTabCompletions(value);
          setTabCompletionIndex((prev) =>
            prev < completions.length - 1 ? prev + 1 : 0,
          );
        } else {
          const historyCommand = onHistoryNavigate("down");
          onChange(historyCommand);
        }
        requestAnimationFrame(() => {
          if (actualInputRef.current) {
            setCursorIndex(actualInputRef.current.selectionStart || 0);
          }
        });
        break;

      case "Tab":
        e.preventDefault();

        if (showSuggestions) {
          return;
        }

        if (value.trim()) {
          handleTabCompletion();
        } else {
          setShowSuggestions(true);
          setSuggestionTrigger((prev) => !prev);
        }
        break;

      case "ArrowLeft":
      case "ArrowRight":
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
          setShowSuggestions(true);
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

    setTimeout(() => {
      if (actualInputRef.current) {
        actualInputRef.current.focus();
      }
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    onChange(newValue);

    const selectionStart = e.target.selectionStart || 0;
    setCursorIndex(selectionStart);

    if (newValue !== value) {
      onClearError?.();
    }

    const shouldShow = newValue.length > 0 || showOnEmpty;

    setShowSuggestions(shouldShow);

    setSuggestionTrigger((prev) => !prev);
  };

  const handleInputSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
  };

  const handleInputFocus = () => {
    if (showOnEmpty || value.length > 0) {
      setShowSuggestions(true);
      setSuggestionTrigger((prev) => !prev);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
    handleInputFocus();
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorIndex(target.selectionStart || 0);
  };

  useEffect(() => {
    const handleGlobalEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
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
              caretColor: "transparent",
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

          { }
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

          { }
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

          { }
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

      { }
      {showTabCompletion && (
        <TabCompletion
          input={value.split(" ").pop() || ""}
          availableCommands={availableCommands}
          onComplete={handleTabComplete}
          visible={showTabCompletion}
        />
      )}

      { }
      {showSuggestions && (
        <CommandSuggestions
          input={value}
          availableCommands={availableCommands}
          onSelect={handleSuggestionSelect}
          onCommandUsed={() => {
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

      { }
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
