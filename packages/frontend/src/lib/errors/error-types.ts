/**
 * Enhanced Error Types and Utilities
 * Provides comprehensive error categorization, recovery strategies, and utilities
 */

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum ErrorCategory {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  DATABASE = "DATABASE",
  API = "API",
  UI = "UI",
  PERFORMANCE = "PERFORMANCE",
  SECURITY = "SECURITY",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  CONFIGURATION = "CONFIGURATION",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorRecoveryStrategy {
  RETRY = "RETRY",
  FALLBACK = "FALLBACK",
  IGNORE = "IGNORE",
  USER_ACTION = "USER_ACTION",
  REDIRECT = "REDIRECT",
  REFRESH = "REFRESH",
  LOGOUT = "LOGOUT",
  ESCALATE = "ESCALATE",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  additionalData?: Record<string, unknown>;
}

export interface ErrorMetadata {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
  maxRetries: number;
  retryDelay: number;
  recoveryStrategy: ErrorRecoveryStrategy;
  context: ErrorContext;
  suggestions: string[];
}

/**
 * Base enhanced error class with rich metadata
 */
export class EnhancedError extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isRetryable: boolean;
  public readonly maxRetries: number;
  public readonly retryDelay: number;
  public readonly recoveryStrategy: ErrorRecoveryStrategy;
  public readonly context: ErrorContext;
  public readonly suggestions: string[];
  public readonly timestamp: Date;
  public readonly cause?: Error;
  public retryCount: number = 0;

  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message);
    this.name = this.constructor.name;

    // Generate unique error ID
    this.id =
      options.id ||
      `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Set metadata with defaults
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.isRetryable = options.isRetryable ?? false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.recoveryStrategy =
      options.recoveryStrategy || ErrorRecoveryStrategy.USER_ACTION;
    this.suggestions = options.suggestions || [];
    this.timestamp = new Date();

    // Set context with defaults
    this.context = {
      timestamp: this.timestamp,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      ...options.context,
    };

    // Set cause for error chaining
    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to plain object for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      isRetryable: this.isRetryable,
      maxRetries: this.maxRetries,
      retryCount: this.retryCount,
      retryDelay: this.retryDelay,
      recoveryStrategy: this.recoveryStrategy,
      context: this.context,
      suggestions: this.suggestions,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause:
        this.cause instanceof Error
          ? {
              name: this.cause.name,
              message: this.cause.message,
              stack: this.cause.stack,
            }
          : this.cause,
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends EnhancedError {
  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
      maxRetries: 3,
      retryDelay: 2000,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      suggestions: [
        "Check your internet connection",
        "Try again in a few moments",
        "Contact support if the problem persists",
      ],
      ...options,
    });
  }
}

/**
 * API-related errors
 */
export class APIError extends EnhancedError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.API,
      severity:
        statusCode && statusCode >= 500
          ? ErrorSeverity.HIGH
          : ErrorSeverity.MEDIUM,
      isRetryable: statusCode ? statusCode >= 500 || statusCode === 429 : false,
      maxRetries: 3,
      retryDelay: statusCode === 429 ? 5000 : 2000,
      recoveryStrategy: ErrorRecoveryStrategy.RETRY,
      suggestions: [
        statusCode === 401 ? "Please log in again" : "Try refreshing the page",
        statusCode === 429
          ? "Please wait a moment before trying again"
          : "Contact support if the issue persists",
      ],
      ...options,
    });

    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Validation errors
 */
export class ValidationError extends EnhancedError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.USER_ACTION,
      suggestions: [
        "Please check your input and try again",
        "Make sure all required fields are filled",
        "Verify the format of your data",
      ],
      ...options,
    });

    this.field = field;
    this.value = value;
  }
}

/**
 * Authentication errors
 */
export class AuthenticationError extends EnhancedError {
  constructor(
    message: string,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.REDIRECT,
      suggestions: [
        "Please log in again",
        "Check your credentials",
        "Contact support if you continue to have issues",
      ],
      ...options,
    });
  }
}

/**
 * Performance-related errors
 */
export class PerformanceError extends EnhancedError {
  public readonly metric?: string;
  public readonly threshold?: number;
  public readonly actual?: number;

  constructor(
    message: string,
    metric?: string,
    threshold?: number,
    actual?: number,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.PERFORMANCE,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
      maxRetries: 2,
      recoveryStrategy: ErrorRecoveryStrategy.FALLBACK,
      suggestions: [
        "Try reducing the amount of data being processed",
        "Close other browser tabs to free up memory",
        "Refresh the page to clear temporary data",
      ],
      ...options,
    });

    this.metric = metric;
    this.threshold = threshold;
    this.actual = actual;
  }
}

/**
 * UI/Component errors
 */
export class UIError extends EnhancedError {
  public readonly componentName?: string;
  public readonly props?: Record<string, unknown>;

  constructor(
    message: string,
    componentName?: string,
    props?: Record<string, unknown>,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.UI,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
      maxRetries: 2,
      recoveryStrategy: ErrorRecoveryStrategy.FALLBACK,
      suggestions: [
        "Try refreshing the page",
        "Clear browser cache and data",
        "Update your browser to the latest version",
      ],
      ...options,
    });

    this.componentName = componentName;
    this.props = props;
  }
}

/**
 * Business logic errors
 */
export class BusinessLogicError extends EnhancedError {
  public readonly rule?: string;
  public readonly businessContext?: Record<string, unknown>;

  constructor(
    message: string,
    rule?: string,
    businessContext?: Record<string, unknown>,
    options: Partial<ErrorMetadata> & { cause?: Error } = {},
  ) {
    super(message, {
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      recoveryStrategy: ErrorRecoveryStrategy.USER_ACTION,
      suggestions: [
        "Please review the operation and try again",
        "Check that all business requirements are met",
        "Contact support for assistance with this process",
      ],
      ...options,
    });

    this.rule = rule;
    this.businessContext = businessContext;
  }
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Wrap a standard Error into an EnhancedError
   */
  static enhance(
    error: Error,
    options: Partial<ErrorMetadata> = {},
  ): EnhancedError {
    if (error instanceof EnhancedError) {
      return error;
    }

    return new EnhancedError(error.message, {
      cause: error,
      ...options,
    });
  }

  /**
   * Determine if an error is retryable
   */
  static isRetryable(error: Error): boolean {
    if (error instanceof EnhancedError) {
      return error.isRetryable && error.retryCount < error.maxRetries;
    }

    // Default heuristics for standard errors
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /500/i,
      /502/i,
      /503/i,
      /504/i,
      /connection/i,
      /fetch/i,
    ];

    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }

  /**
   * Get error severity
   */
  static getSeverity(error: Error): ErrorSeverity {
    if (error instanceof EnhancedError) {
      return error.severity;
    }

    // Default heuristics
    if (error.message.toLowerCase().includes("critical")) {
      return ErrorSeverity.CRITICAL;
    }
    if (error.message.toLowerCase().includes("fatal")) {
      return ErrorSeverity.HIGH;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Get error category
   */
  static getCategory(error: Error): ErrorCategory {
    if (error instanceof EnhancedError) {
      return error.category;
    }

    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes("auth") || message.includes("permission")) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes("performance") || message.includes("timeout")) {
      return ErrorCategory.PERFORMANCE;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Get appropriate suggestions for an error
   */
  static getSuggestions(error: Error): string[] {
    if (error instanceof EnhancedError) {
      return error.suggestions;
    }

    const category = ErrorUtils.getCategory(error);

    switch (category) {
      case ErrorCategory.NETWORK:
        return [
          "Check your internet connection",
          "Try again in a few moments",
          "Contact support if the problem persists",
        ];
      case ErrorCategory.VALIDATION:
        return [
          "Please check your input and try again",
          "Make sure all required fields are filled",
          "Verify the format of your data",
        ];
      case ErrorCategory.AUTHENTICATION:
        return [
          "Please log in again",
          "Check your credentials",
          "Contact support if you continue to have issues",
        ];
      default:
        return [
          "Try refreshing the page",
          "Clear browser cache and data",
          "Contact support if the problem persists",
        ];
    }
  }
}
