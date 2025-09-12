/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger, HttpException, HttpStatus } from "@nestjs/common";
import type { Request } from "express";
import { AuditLogService, AuditEventType } from "../security/audit-log.service";

export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT = "RATE_LIMIT",
  DATABASE = "DATABASE",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  INTERNAL = "INTERNAL",
  SECURITY = "SECURITY",
}

export interface ErrorContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface StructuredError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
  meta?: {
    category: ErrorCategory;
    severity: string;
    retryable: boolean;
  };
}

@Injectable()
export class GlobalErrorHandler {
  private readonly logger = new Logger(GlobalErrorHandler.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Handle and categorize errors with proper logging and audit trails
   * @param {Error | HttpException} error - The error to handle
   * @param {Request} request - The request that caused the error
   * @param {Partial<ErrorContext>} context - The error context
   * @returns {Promise<StructuredError>} - The structured error
   */
  async handleError(
    error: Error | HttpException,
    request?: Request,
    context?: Partial<ErrorContext>,
  ): Promise<StructuredError> {
    const errorContext = this.buildErrorContext(error, request, context);
    const structuredError = this.createStructuredError(error, errorContext);

    // Log error with appropriate level
    this.logError(error, errorContext);

    // Audit log for security-related errors
    if (this.isSecurityError(errorContext.category)) {
      await this.auditLogService.logSecurityEvent(
        AuditEventType.ERROR_OCCURRED,
        {
          error: structuredError.error,
          context: errorContext,
          severity: errorContext.severity,
        },
        request,
      );
    }

    return structuredError;
  }

  /**
   * Build comprehensive error context
   * @param {Error | HttpException} error - The error to build a context for
   * @param {Request} request - The request that caused the error
   * @param {Partial<ErrorContext>} context - The error context
   * @returns {ErrorContext} - The error context
   */
  private buildErrorContext(
    error: Error | HttpException,
    request?: Request,
    context?: Partial<ErrorContext>,
  ): ErrorContext {
    const category = this.categorizeError(error);
    const severity = this.determineSeverity(error, category);

    return {
      requestId: request?.headers["x-request-id"] as string,
      userId: (request as any)?.user?.id,
      ip: request?.ip,
      userAgent: request?.headers["user-agent"],
      path: request?.path,
      method: request?.method,
      timestamp: new Date(),
      category,
      severity,
      ...context,
    };
  }

  /**
   * Categorize errors for better handling
   * @param {Error | HttpException} error - The error to categorize
   * @returns {ErrorCategory} - The error category
   */
  private categorizeError(error: Error | HttpException): ErrorCategory {
    if (error instanceof HttpException) {
      const status = error.getStatus();

      if (status === HttpStatus.UNAUTHORIZED)
        return ErrorCategory.AUTHENTICATION;
      if (status === HttpStatus.FORBIDDEN) return ErrorCategory.AUTHORIZATION;
      if (status === HttpStatus.NOT_FOUND) return ErrorCategory.NOT_FOUND;
      if (status === HttpStatus.TOO_MANY_REQUESTS)
        return ErrorCategory.RATE_LIMIT;
      if (status >= 400 && status < 500) return ErrorCategory.VALIDATION;
    }

    // Check error message for specific patterns
    const message = error.message.toLowerCase();

    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorCategory.VALIDATION;
    }
    if (
      message.includes("unauthorized") ||
      message.includes("authentication")
    ) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes("forbidden") || message.includes("permission")) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes("not found") || message.includes("does not exist")) {
      return ErrorCategory.NOT_FOUND;
    }
    if (
      message.includes("rate limit") ||
      message.includes("too many requests")
    ) {
      return ErrorCategory.RATE_LIMIT;
    }
    if (message.includes("database") || message.includes("prisma")) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes("external") || message.includes("api")) {
      return ErrorCategory.EXTERNAL_SERVICE;
    }
    if (
      message.includes("security") ||
      message.includes("csrf") ||
      message.includes("xss")
    ) {
      return ErrorCategory.SECURITY;
    }

    return ErrorCategory.INTERNAL;
  }

  /**
   * Determine error severity based on category and context
   * @param {Error | HttpException} error - The error to determine severity for
   * @param {ErrorCategory} category - The error category
   * @returns {"LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} - The error severity
   */
  private determineSeverity(
    error: Error | HttpException,
    category: ErrorCategory,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    // Security errors are always high or critical
    if (category === ErrorCategory.SECURITY) {
      return "HIGH";
    }

    // Authentication/Authorization errors are medium to high
    if (
      category === ErrorCategory.AUTHENTICATION ||
      category === ErrorCategory.AUTHORIZATION
    ) {
      return "MEDIUM";
    }

    // Rate limiting is usually low
    if (category === ErrorCategory.RATE_LIMIT) {
      return "LOW";
    }

    // Database errors are medium to high
    if (category === ErrorCategory.DATABASE) {
      return "MEDIUM";
    }

    // External service errors are medium
    if (category === ErrorCategory.EXTERNAL_SERVICE) {
      return "MEDIUM";
    }

    // Internal errors are high to critical
    if (category === ErrorCategory.INTERNAL) {
      return "HIGH";
    }

    // Validation errors are usually low
    return "LOW";
  }

  /**
   * Create structured error response
   * @param {Error | HttpException} error - The error to create a structured error for
   * @param {ErrorContext} context - The error context
   * @returns {StructuredError} - The structured error
   */
  private createStructuredError(
    error: Error | HttpException,
    context: ErrorContext,
  ): StructuredError {
    const isHttpException = error instanceof HttpException;
    const status = isHttpException ? error.getStatus() : 500;

    return {
      error: {
        code: this.generateErrorCode(context.category, status),
        message: this.getUserFriendlyMessage(error, context),
        details: this.getErrorDetails(error, context),
        timestamp: context.timestamp.toISOString(),
        requestId: context.requestId,
      },
      meta: {
        category: context.category,
        severity: context.severity,
        retryable: this.isRetryableError(context.category),
      },
    };
  }

  /**
   * Generate error codes for better error tracking
   * @param {ErrorCategory} category - The error category
   * @param {number} status - The HTTP status code
   * @returns {string} - The error code
   */
  private generateErrorCode(category: ErrorCategory, status: number): string {
    const categoryCode = category.substring(0, 3).toUpperCase();
    return `${categoryCode}-${status}`;
  }

  /**
   * Get user-friendly error messages with enhanced sanitization
   * @param {Error | HttpException} error - The error to get a user-friendly message for
   * @param {ErrorContext} context - The error context
   * @returns {string} - The user-friendly error message
   */
  private getUserFriendlyMessage(
    error: Error | HttpException,
    context: ErrorContext,
  ): string {
    // In production, use highly sanitized messages
    if (process.env.NODE_ENV === "production") {
      return this.getProductionSafeMessage(context.category, error);
    }

    // In development, allow more detailed messages for debugging
    return this.getDevelopmentMessage(error, context);
  }

  /**
   * Get production-safe error messages that don't expose internal details
   * @param {ErrorCategory} category - The error category
   * @param {Error | HttpException} error - The original error
   * @returns {string} - The sanitized error message
   */
  private getProductionSafeMessage(
    category: ErrorCategory,
    error: Error | HttpException,
  ): string {
    switch (category) {
      case ErrorCategory.VALIDATION:
        // Only allow safe validation messages, sanitize the rest
        return this.sanitizeValidationMessage(error.message);
      case ErrorCategory.AUTHENTICATION:
        return "Authentication required.";
      case ErrorCategory.AUTHORIZATION:
        return "Access denied.";
      case ErrorCategory.NOT_FOUND:
        return "The requested resource was not found.";
      case ErrorCategory.RATE_LIMIT:
        return "Too many requests. Please try again later.";
      case ErrorCategory.DATABASE:
        return "A database error occurred. Please try again.";
      case ErrorCategory.EXTERNAL_SERVICE:
        return "A service is temporarily unavailable. Please try again later.";
      case ErrorCategory.SECURITY:
        return "Access denied.";
      case ErrorCategory.INTERNAL:
      default:
        return "An unexpected error occurred. Please try again later.";
    }
  }

  /**
   * Get development error messages with more detail for debugging
   * @param {Error | HttpException} error - The error to get a message for
   * @param {ErrorContext} context - The error context
   * @returns {string} - The development error message
   */
  private getDevelopmentMessage(
    error: Error | HttpException,
    context: ErrorContext,
  ): string {
    // Don't expose security details even in development
    if (context.category === ErrorCategory.SECURITY) {
      return "Access denied.";
    }

    // Don't expose internal errors to users
    if (context.category === ErrorCategory.INTERNAL) {
      return "An unexpected error occurred. Please try again later.";
    }

    // For other categories in development, use sanitized original message
    return this.sanitizeErrorMessage(error.message);
  }

  /**
   * Sanitize validation error messages to prevent information disclosure
   * @param {string} message - The validation error message
   * @returns {string} - The sanitized message
   */
  private sanitizeValidationMessage(message: string): string {
    // Allow common validation patterns but remove sensitive paths/details
    const safePatterns = [
      /^(.+) must be a valid email$/i,
      /^(.+) must be a string$/i,
      /^(.+) must be a number$/i,
      /^(.+) must be a boolean$/i,
      /^(.+) is required$/i,
      /^(.+) must be at least \d+ characters?$/i,
      /^(.+) must be at most \d+ characters?$/i,
      /^(.+) must match the pattern .+$/i,
      /^(.+) must be one of: .+$/i,
    ];

    // Check if message matches safe patterns
    for (const pattern of safePatterns) {
      if (pattern.test(message)) {
        return message;
      }
    }

    // For other validation messages, provide a generic response
    return "Invalid input provided.";
  }

  /**
   * Sanitize error messages to remove sensitive information
   * @param {string} message - The original error message
   * @returns {string} - The sanitized message
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove file paths, IPs, internal service names, etc.
    let sanitized = message
      // Remove file paths (Windows and Unix)
      .replace(/[A-Z]:\\[\w\\.-]+/gi, "[PATH]")
      .replace(/\/[\w/.-]+/g, "[PATH]")
      // Remove IP addresses
      .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]")
      // Remove email addresses
      .replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL]",
      )
      // Remove potential API keys or tokens (sequences of alphanumeric chars)
      .replace(/\b[A-Za-z0-9]{32,}\b/g, "[TOKEN]")
      // Remove SQL-like error details
      .replace(
        /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b.*$/gi,
        "[SQL_QUERY]",
      )
      // Remove stack traces
      .replace(/\s+at\s+.*/g, "")
      // Remove common internal service references
      .replace(/\b(localhost|127\.0\.0\.1|0\.0\.0\.0)\b/gi, "[HOST]");

    // Truncate very long messages
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 197) + "...";
    }

    return sanitized || "An error occurred.";
  }

  /**
   * Get error details for debugging (only in development)
   * @param {Error | HttpException} error - The error to get details for
   * @param {ErrorContext} context - The error context
   * @returns {Record<string, any> | undefined} - The error details
   */
  private getErrorDetails(
    error: Error | HttpException,
    context: ErrorContext,
  ): Record<string, any> | undefined {
    if (process.env.NODE_ENV === "production") {
      return undefined;
    }

    return {
      originalMessage: error.message,
      stack: error.stack,
      category: context.category,
      severity: context.severity,
    };
  }

  /**
   * Determine if error is retryable
   * @param {ErrorCategory} category - The error category
   * @returns {boolean} - Whether the error is retryable
   */
  private isRetryableError(category: ErrorCategory): boolean {
    return [
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorCategory.DATABASE,
    ].includes(category);
  }

  /**
   * Check if error is security-related
   * @param {ErrorCategory} category - The error category
   * @returns {boolean} - Whether the error is security-related
   */
  private isSecurityError(category: ErrorCategory): boolean {
    return [
      ErrorCategory.SECURITY,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.AUTHORIZATION,
    ].includes(category);
  }

  /**
   * Log error with appropriate level and sanitization
   * @param {Error | HttpException} error - The error to log
   * @param {ErrorContext} context - The error context
   */
  private logError(error: Error | HttpException, context: ErrorContext): void {
    const logData = this.createSanitizedLogData(error, context);

    switch (context.severity) {
      case "CRITICAL":
        this.logger.error("Critical error occurred", logData);
        break;
      case "HIGH":
        this.logger.error("High severity error", logData);
        break;
      case "MEDIUM":
        this.logger.warn("Medium severity error", logData);
        break;
      case "LOW":
        this.logger.log("Low severity error", logData);
        break;
    }
  }

  /**
   * Create sanitized log data that's safe for production logging
   * @param {Error | HttpException} error - The error to log
   * @param {ErrorContext} context - The error context
   * @returns {Record<string, any>} - The sanitized log data
   */
  private createSanitizedLogData(
    error: Error | HttpException,
    context: ErrorContext,
  ): Record<string, any> {
    const baseLogData = {
      category: context.category,
      severity: context.severity,
      requestId: context.requestId,
      path: context.path,
      method: context.method,
      timestamp: context.timestamp.toISOString(),
    };

    // In production, sanitize sensitive data
    if (process.env.NODE_ENV === "production") {
      return {
        ...baseLogData,
        message: this.sanitizeErrorMessage(error.message),
        // Don't log stack traces in production for security errors
        stack: this.isSecurityError(context.category)
          ? undefined
          : "[REDACTED]",
        // Sanitize IP (keep first two octets for debugging)
        ip: context.ip ? this.sanitizeIpAddress(context.ip) : undefined,
        // Don't log user ID in production for security errors
        userId: this.isSecurityError(context.category)
          ? "[REDACTED]"
          : context.userId,
      };
    }

    // In development, include more details for debugging
    return {
      ...baseLogData,
      message: error.message,
      stack: error.stack,
      ip: context.ip,
      userId: context.userId,
    };
  }

  /**
   * Sanitize IP address for production logging
   * @param {string} ip - The IP address to sanitize
   * @returns {string} - The sanitized IP address
   */
  private sanitizeIpAddress(ip: string): string {
    // Keep first two octets for debugging, mask the rest
    const ipPattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipPattern);

    if (match) {
      return `${match[1]}.${match[2]}.xxx.xxx`;
    }

    // For IPv6 or other formats, just show the prefix
    if (ip.includes(":")) {
      const parts = ip.split(":");
      return parts.slice(0, 2).join(":") + ":xxxx:xxxx:xxxx:xxxx";
    }

    return "[IP]";
  }

  /**
   * Handle unhandled promise rejections with sanitization
   * @param {any} reason - The reason for the unhandled promise rejection
   * @param {Promise<any>} _promise - The promise that was rejected
   */
  handleUnhandledRejection(reason: any, _promise: Promise<any>): void {
    const sanitizedReason =
      process.env.NODE_ENV === "production"
        ? this.sanitizeErrorMessage(reason?.message || String(reason))
        : reason?.message || reason;

    const sanitizedStack =
      process.env.NODE_ENV === "production" ? "[REDACTED]" : reason?.stack;

    this.logger.error("Unhandled Promise Rejection", {
      reason: sanitizedReason,
      stack: sanitizedStack,
      promise: "[Promise]", // Don't log promise details in any environment
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle uncaught exceptions with sanitization
   * @param {Error} error - The uncaught exception
   */
  handleUncaughtException(error: Error): void {
    const sanitizedMessage =
      process.env.NODE_ENV === "production"
        ? this.sanitizeErrorMessage(error.message)
        : error.message;

    const sanitizedStack =
      process.env.NODE_ENV === "production" ? "[REDACTED]" : error.stack;

    this.logger.error("Uncaught Exception", {
      message: sanitizedMessage,
      stack: sanitizedStack,
      timestamp: new Date().toISOString(),
    });
  }
}
