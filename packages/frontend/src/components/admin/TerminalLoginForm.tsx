/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeConfig } from "@portfolio/frontend/src/types/theme";
import { useAuth } from "@portfolio/frontend/src/lib/auth/AuthContext";

interface TerminalLoginFormProps {
  onLoginSuccess?: () => void;
  themeConfig: ThemeConfig;
}

/**
 *
 * @param root0
 * @param root0.onLoginSuccess
 * @param root0.themeConfig
 */
export function TerminalLoginForm({
  onLoginSuccess,
  themeConfig,
}: TerminalLoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentField, setCurrentField] = useState<"email" | "password">(
    "email",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [buttonHover, setButtonHover] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = useRef<HTMLInputElement>(null);

  // Cursor blinking effect
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Focus management
  useEffect(() => {
    if (currentField === "email" && emailInputRef.current) {
      emailInputRef.current.focus();
    } else if (currentField === "password" && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [currentField]);

  const handleFieldChange = (field: "email" | "password", value: string) => {
    setError(null);

    if (field === "email") {
      setEmail(value);
    } else {
      setPassword(value);
    }
  };

  const handleFieldFocus = (field: "email" | "password") => {
    setCurrentField(field);
    setIsFocused(true);
    setError(null);
  };

  const handleFieldBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    field: "email" | "password",
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "email" && email.trim()) {
        setCurrentField("password");
      } else if (field === "password" && password.trim()) {
        handleSubmit();
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (field === "email") {
        setCurrentField("password");
      } else {
        setCurrentField("email");
      }
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        // Clear form
        setEmail("");
        setPassword("");
        setCurrentField("email");

        // Call success callback
        onLoginSuccess?.();
      } else {
        setError(result.error || "Login failed");
        // Focus back to password field on error
        setCurrentField("password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setCurrentField("password");
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = (
    field: "email" | "password",
    value: string,
    placeholder: string,
    ref: React.RefObject<HTMLInputElement | null>,
  ) => {
    const isActive = currentField === field;
    const isPassword = field === "password";

    return (
      <div
        className={`flex items-center gap-2 w-full transition-all duration-300 ease-out ${isFocused ? "scale-[1.02]" : "scale-100"}`}
        style={{
          filter: isFocused
            ? `drop-shadow(0 0 8px ${themeConfig.colors.accent}30)`
            : "none",
        }}
      >
        <span
          className={`font-mono text-sm flex-shrink-0 transition-all duration-300 ${isFocused ? "opacity-100" : "opacity-80"}`}
          style={{
            color: themeConfig.colors.accent,
            transform: isFocused ? "translateX(4px)" : "translateX(0)",
          }}
        >
          {field}@portfolio:~$
        </span>

        <div className="flex-1 relative min-w-0 flex items-center">
          <input
            ref={ref}
            type={isPassword && !showPassword ? "password" : "text"}
            value={value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            onFocus={() => handleFieldFocus(field)}
            onBlur={handleFieldBlur}
            onKeyDown={(e) => handleKeyDown(e, field)}
            placeholder={placeholder}
            disabled={isLoading}
            className={`w-full bg-transparent border-0 outline-none font-mono text-sm p-0 m-0 resize-none transition-all duration-200 ${isFocused ? "opacity-100" : "opacity-90"}`}
            style={{
              color: themeConfig.colors.text,
              caretColor: "transparent",
            }}
            autoComplete={isPassword ? "current-password" : "email"}
            spellCheck="false"
          />

          {/* Custom cursor */}
          {isActive && cursorVisible && !isLoading && (
            <span
              className={`absolute top-0 font-mono text-sm pointer-events-none select-none transition-all duration-150 ${isTyping ? "animate-pulse" : ""}`}
              style={{
                color: themeConfig.colors.accent,
                left: `${value.length * 8}px`, // Approximate character width
                animation: isTyping ? "pulse 1s infinite" : "none",
              }}
            >
              ▋
            </span>
          )}

          {/* Password toggle button */}
          {isPassword && value && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-0 top-0 text-xs transition-all duration-200 px-2 py-1 rounded ${showPassword ? "opacity-80" : "opacity-50"} hover:opacity-100 hover:scale-110 active:scale-95`}
              style={{
                color: themeConfig.colors.muted,
                backgroundColor: showPassword
                  ? `${themeConfig.colors.accent}10`
                  : "transparent",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          )}
        </div>

        {/* Focus line animation */}
        {isFocused && (
          <div
            className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out"
            style={{
              backgroundColor: themeConfig.colors.accent,
              width: "100%",
              transform: "scaleX(1)",
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div
          className="p-3 rounded border text-sm font-mono"
          style={{
            backgroundColor: `${themeConfig.colors.error}10`,
            borderColor: themeConfig.colors.error,
            color: themeConfig.colors.error,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Email field */}
      <div className="relative">
        {renderInputField("email", email, "Enter your email", emailInputRef)}
      </div>

      {/* Password field */}
      <div className="relative">
        {renderInputField(
          "password",
          password,
          "Enter your password",
          passwordInputRef,
        )}
      </div>

      {/* Submit button */}
      <div className="flex items-center space-x-2">
        <span
          className={`text-sm font-mono transition-all duration-300 ${buttonHover ? "opacity-100" : "opacity-80"}`}
          style={{
            color: themeConfig.colors.accent,
            transform: buttonHover ? "translateX(4px)" : "translateX(0)",
          }}
        >
          $ login
        </span>

        {(() => {
          const isDisabled = isLoading || !email || !password;
          const buttonClassName = `w-full p-3 text-left font-mono text-sm transition-all duration-300 ease-out ${isDisabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            }`;

          return (
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
              className={buttonClassName}
              style={{
                color: isDisabled
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent,
                backgroundColor: isDisabled
                  ? `${themeConfig.colors.muted}20`
                  : `${themeConfig.colors.accent}20`,
                border: `1px solid ${isDisabled
                  ? themeConfig.colors.muted
                  : themeConfig.colors.accent
                  }`,
                filter:
                  buttonHover && !isDisabled
                    ? `drop-shadow(0 0 12px ${themeConfig.colors.accent}40)`
                    : "none",
                transform:
                  buttonHover && !isDisabled
                    ? "translateY(-2px)"
                    : "translateY(0)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  Authenticate
                </span>
              )}
            </button>
          );
        })()}
      </div>

      {/* Help text */}
      <div className="text-xs opacity-60 text-center">
        <div>Press Tab to switch fields • Press Enter to submit</div>
        <div>Use Ctrl+C to cancel • Use Ctrl+L to clear</div>
      </div>
    </div>
  );
}
