/**
 * Enhanced Error Boundary System
 * Provides comprehensive error boundaries with recovery strategies,
 * contextual error handling, and integration with our error types
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  EnhancedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorRecoveryStrategy,
  ErrorUtils,
} from "./error-types";

export interface ErrorBoundaryState {
  hasError: boolean;
  error: EnhancedError | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export interface ErrorBoundaryConfig {
  fallback?: (
    error: EnhancedError,
    errorInfo: ErrorInfo,
    retry: () => void,
    reset: () => void,
  ) => ReactNode;
  onError?: (error: EnhancedError, errorInfo: ErrorInfo) => void;
  onRetry?: (error: EnhancedError, attempt: number) => void;
  maxRetries?: number;
  isolateErrors?: boolean;
  enableRecovery?: boolean;
  category?: ErrorCategory;
  reportErrors?: boolean;
}

/**
 * Enhanced Error Boundary with comprehensive error handling
 */
export class EnhancedErrorBoundary extends Component<
  ErrorBoundaryConfig & { children: ReactNode },
  ErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private readonly maxRetries: number;

  constructor(props: ErrorBoundaryConfig & { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    };
    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enhancedError = ErrorUtils.enhance(error);

    return {
      hasError: true,
      error: enhancedError,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedError = ErrorUtils.enhance(error, {
      category: this.props.category,
      context: {
        timestamp: new Date(),
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
        },
      },
    });

    this.setState({
      error: enhancedError,
      errorInfo,
    });

    // Report error
    if (this.props.reportErrors !== false) {
      this.reportError(enhancedError, errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(enhancedError, errorInfo);

    // Auto-retry for retryable errors
    if (this.props.enableRecovery && enhancedError.isRetryable) {
      this.scheduleRetry();
    }
  }

  private reportError = (error: EnhancedError, errorInfo: ErrorInfo) => {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.group(`🚨 Error Boundary: ${error.category}`);
        console.error("Error:", error);
        console.error("Component Stack:", errorInfo.componentStack);
        console.error("Error Info:", errorInfo);
        console.groupEnd();
      }

      // Store error for potential reporting
      const errorReport = {
        id: error.id,
        message: error.message,
        category: error.category,
        severity: error.severity,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Store in session storage for debugging
      try {
        const existingReports = JSON.parse(
          sessionStorage.getItem("errorReports") || "[]",
        );
        existingReports.push(errorReport);
        // Keep only last 10 reports
        if (existingReports.length > 10) {
          existingReports.splice(0, existingReports.length - 10);
        }
        sessionStorage.setItem("errorReports", JSON.stringify(existingReports));
      } catch (storageError) {
        console.warn("Failed to store error report:", storageError);
      }
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError);
    }
  };

  private scheduleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    const timeout = setTimeout(() => {
      this.retry();
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private retry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      ...prevState,
      retryCount: prevState.retryCount + 1,
    }));

    this.props.onRetry?.(this.state.error!, this.state.retryCount + 1);

    // Reset error state to retry
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: "",
        retryCount: this.state.retryCount,
      });
    }, 100);
  };

  private reset = () => {
    // Clear any pending retries
    this.retryTimeouts.forEach(clearTimeout);
    this.retryTimeouts = [];

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      retryCount: 0,
    });
  };

  componentWillUnmount() {
    // Clear any pending retries
    this.retryTimeouts.forEach(clearTimeout);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.state.errorInfo!,
          this.retry,
          this.reset,
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          onRetry={this.retry}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 */
interface DefaultErrorFallbackProps {
  error: EnhancedError;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
}: DefaultErrorFallbackProps) {
  const canRetry = error.isRetryable && retryCount < maxRetries;

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return "text-red-600 bg-red-50 border-red-200";
      case ErrorSeverity.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case ErrorSeverity.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case ErrorSeverity.LOW:
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRecoveryActions = (strategy: ErrorRecoveryStrategy) => {
    switch (strategy) {
      case ErrorRecoveryStrategy.RETRY:
        return canRetry ? (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry ({maxRetries - retryCount} attempts left)
          </button>
        ) : null;

      case ErrorRecoveryStrategy.REFRESH:
        return (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Refresh Page
          </button>
        );

      case ErrorRecoveryStrategy.REDIRECT:
        return (
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Go to Home
          </button>
        );

      default:
        return (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Header */}
        <div
          className={`p-4 rounded-lg border ${getSeverityColor(error.severity)}`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <h1 className="text-lg font-semibold">{error.category} Error</h1>
              <p className="text-sm opacity-75">Severity: {error.severity}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Error Details</h3>
          <p className="text-sm text-gray-600 mb-3">{error.message}</p>

          {retryCount > 0 && (
            <p className="text-xs text-gray-500">
              Retry attempt: {retryCount}/{maxRetries}
            </p>
          )}
        </div>

        {/* Suggestions */}
        {error.suggestions.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">💡 Suggestions</h3>
            <ul className="space-y-1">
              {error.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 flex items-start"
                >
                  <span className="text-gray-400 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col space-y-2">
          {getRecoveryActions(error.recoveryStrategy)}

          {canRetry && (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === "development" && errorInfo && (
          <details className="bg-gray-100 p-3 rounded text-xs">
            <summary className="cursor-pointer font-medium">
              Debug Information
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>Error ID:</strong> {error.id}
              </div>
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
              </div>
              <div>
                <strong>Component Stack:</strong>
                <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                  {errorInfo.componentStack}
                </pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  config: ErrorBoundaryConfig = {},
) {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...config}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for error boundary context
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    setError(errorObj);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    captureError,
    resetError,
  };
}
