"use client";

import { Component, type ErrorInfo, type ReactNode, type JSX } from "react";
import { useTheme } from "@portfolio/frontend/src/hooks/useTheme";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: Error,
    errorInfo: ErrorInfo,
    retry: () => void,
  ) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Enhanced error boundary with recovery suggestions and actions
 */
export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error("Enhanced Error Boundary caught an error:", error, errorInfo);

    // Report to external service if configured
    this.reportError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, you might want to send this to a logging service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    // Store locally for debugging
    try {
      const errors = JSON.parse(
        localStorage.getItem("terminal-errors") || "[]",
      );

      if (typeof errors === "object" && errors !== null) {
        (errors as unknown[]).push(errorReport);
      }

      localStorage.setItem(
        "terminal-errors",
        JSON.stringify((errors as unknown[]).slice(-10)),
      );
    } catch (e) {
      console.warn("Failed to store error report:", e);
    }
  }

  private retry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
      });
    }
  };

  private reset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  private getErrorSuggestions(error: Error): string[] {
    const suggestions: string[] = [];
    const message = error.message.toLowerCase();

    if (message.includes("chunk")) {
      suggestions.push("Try refreshing the page to reload application chunks");
      suggestions.push("Clear browser cache and reload");
    }

    if (message.includes("network") || message.includes("fetch")) {
      suggestions.push("Check your internet connection");
      suggestions.push("Try again in a few moments");
    }

    if (message.includes("theme") || message.includes("config")) {
      suggestions.push("Reset theme settings to defaults");
      suggestions.push("Clear application data and restart");
    }

    if (message.includes("command") || message.includes("terminal")) {
      suggestions.push("Try clearing terminal history");
      suggestions.push("Reset terminal settings");
    }

    if (suggestions.length === 0) {
      suggestions.push("Try refreshing the page");
      suggestions.push("Clear browser cache and data");
      suggestions.push("Contact support if the problem persists");
    }

    return suggestions;
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.retry,
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          retryCount={this.retryCount}
          maxRetries={this.maxRetries}
          suggestions={this.getErrorSuggestions(this.state.error)}
          onRetry={this.retry}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
  maxRetries: number;
  suggestions: string[];
  onRetry: () => void;
  onReset: () => void;
}

/**
 * Default error fallback component
 * @param {DefaultErrorFallbackProps} props - The props for the DefaultErrorFallback component
 * @param {Error} props.error - The error object
 * @param {ErrorInfo | null} props.errorInfo - The error info object
 * @param {string} props.errorId - The error ID
 * @param {number} props.retryCount - The retry count
 * @param {number} props.maxRetries - The maximum number of retries
 * @param {string[]} props.suggestions - The suggestions for the error
 * @param {() => void} props.onRetry - The function to retry the error
 * @param {() => void} props.onReset - The function to reset the error
 * @returns {JSX.Element} The DefaultErrorFallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  maxRetries,
  suggestions,
  onRetry,
  onReset,
}: DefaultErrorFallbackProps): JSX.Element {
  const { themeConfig } = useTheme();

  const handleCopyError = () => {
    const errorText = [
      `Error ID: ${errorId}`,
      `Message: ${error.message}`,
      `Stack: ${error.stack}`,
      errorInfo ? `Component Stack: ${errorInfo.componentStack}` : "",
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        alert("Error details copied to clipboard");
        return null;
      })
      .catch(() => {
        alert("Failed to copy error details to clipboard");
        return null;
      });

    const handleReportIssue = () => {
      const issueUrl = `https://github.com/yourusername/portfolio/issues/new?title=Error%20Report:%20${encodeURIComponent(error.message)}&body=${encodeURIComponent(`Error ID: ${errorId}\nMessage: ${error.message}\nStack: ${error.stack || "No stack trace"}`)}`;
      window.open(issueUrl, "_blank");
    };

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: themeConfig.colors.bg }}
      >
        <div
          className="max-w-2xl w-full p-8 rounded-lg border shadow-lg"
          style={{
            backgroundColor: themeConfig.colors.bg,
            borderColor: themeConfig.colors.error || themeConfig.colors.accent,
            color: themeConfig.colors.text,
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="text-2xl"
              style={{
                color: themeConfig.colors.error || themeConfig.colors.accent,
              }}
            >
              ⚠️
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{
                  color: themeConfig.colors.error || themeConfig.colors.accent,
                }}
              >
                Something went wrong
              </h1>
              <p
                className="text-sm opacity-75"
                style={{ color: themeConfig.colors.text }}
              >
                Error ID: {errorId}
              </p>
            </div>
          </div>

          {/* Error message */}
          <div className="mb-6">
            <div
              className="p-4 rounded border font-mono text-sm"
              style={{
                backgroundColor: `${themeConfig.colors.error || themeConfig.colors.accent}10`,
                borderColor:
                  themeConfig.colors.error || themeConfig.colors.accent,
                color: themeConfig.colors.text,
              }}
            >
              {error.message}
            </div>
          </div>

          {/* Suggestions */}
          <div className="mb-6">
            <h3
              className="font-semibold mb-3"
              style={{ color: themeConfig.colors.accent }}
            >
              💡 Try these solutions:
            </h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm"
                >
                  <span style={{ color: themeConfig.colors.accent }}>•</span>
                  <span style={{ color: themeConfig.colors.text }}>
                    {suggestion}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {/* Retry button */}
            {retryCount < maxRetries && (
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  backgroundColor: themeConfig.colors.accent,
                  color: themeConfig.colors.bg,
                }}
              >
                🔄 Try Again ({maxRetries - retryCount} left)
              </button>
            )}

            {/* Reset button */}
            <button
              onClick={onReset}
              className="px-4 py-2 rounded font-medium transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.accent}20`,
                color: themeConfig.colors.accent,
                border: `1px solid ${themeConfig.colors.accent}`,
              }}
            >
              🔄 Reset Application
            </button>

            {/* Reload page */}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded font-medium transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.text}10`,
                color: themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.border}`,
              }}
            >
              🔄 Reload Page
            </button>

            {/* Copy error */}
            <button
              onClick={handleCopyError}
              className="px-4 py-2 rounded font-medium transition-all duration-200 text-sm hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.text}10`,
                color: themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.border}`,
              }}
            >
              📋 Copy Error
            </button>

            {/* Report issue */}
            <button
              onClick={handleReportIssue}
              className="px-4 py-2 rounded font-medium transition-all duration-200 text-sm hover:opacity-80"
              style={{
                backgroundColor: `${themeConfig.colors.text}10`,
                color: themeConfig.colors.text,
                border: `1px solid ${themeConfig.colors.border}`,
              }}
            >
              🐛 Report Issue
            </button>
          </div>

          {/* Debug info (collapsed by default) */}
          <details className="mt-6">
            <summary
              className="cursor-pointer text-sm opacity-75 hover:opacity-100"
              style={{ color: themeConfig.colors.text }}
            >
              🔍 Debug Information
            </summary>
            <div
              className="mt-3 p-4 rounded border font-mono text-xs overflow-auto max-h-40"
              style={{
                backgroundColor: `${themeConfig.colors.text}05`,
                borderColor: themeConfig.colors.border,
                color: themeConfig.colors.text,
              }}
            >
              <div className="mb-2">
                <strong>Stack Trace:</strong>
              </div>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
              {errorInfo && (
                <>
                  <div className="mt-4 mb-2">
                    <strong>Component Stack:</strong>
                  </div>
                  <pre className="whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  };
  return handleCopyError();
}

/**
 * Error recovery service for manual error handling
 */
export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Handle command errors with suggestions
   * @param {string} command - The command that caused the error
   * @param {string} error - The error message
   * @returns {object} The error suggestions and quick fixes
   */
  handleCommandError(
    command: string,
    error: string,
  ): {
    message: string;
    suggestions: string[];
    quickFixes: Array<{ label: string; action: string }>;
  } {
    const suggestions: string[] = [];
    const quickFixes: Array<{ label: string; action: string }> = [];

    // Command not found
    if (error.includes("not found") || error.includes("unknown command")) {
      suggestions.push("Did you mean one of these commands?");
      suggestions.push("Use 'help' to see all available commands");
      suggestions.push("Use 'alias' to create shortcuts");

      quickFixes.push({ label: "Show Help", action: "help" });
      quickFixes.push({ label: "List Aliases", action: "alias" });
    }

    // Theme errors
    if (
      command.startsWith("theme") &&
      (error.includes("not found") || error.includes("invalid"))
    ) {
      suggestions.push("Use 'theme -l' to see available themes");
      suggestions.push("Theme names are case-sensitive");

      quickFixes.push({ label: "List Themes", action: "theme -l" });
      quickFixes.push({ label: "Reset Theme", action: "theme matrix" });
    }

    // Font errors
    if (
      command.startsWith("font") &&
      (error.includes("not found") || error.includes("invalid"))
    ) {
      suggestions.push("Use 'font -l' to see available fonts");
      suggestions.push("Font names are case-sensitive");

      quickFixes.push({ label: "List Fonts", action: "font -l" });
      quickFixes.push({ label: "Reset Font", action: "font JetBrains Mono" });
    }

    return {
      message: error,
      suggestions,
      quickFixes,
    };
  }

  /**
   * Get stored error reports
   * @returns {unknown[]} The error reports
   */
  getErrorReports(): [] {
    try {
      const historyData = localStorage.getItem("terminal-errors");

      if (typeof historyData === "string" && historyData !== null) {
        const parsed = JSON.parse(historyData);

        if (typeof parsed === "object" && parsed !== null) {
          return parsed as [];
        }
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Clear error reports
   */
  clearErrorReports(): void {
    localStorage.removeItem("terminal-errors");
  }
}
