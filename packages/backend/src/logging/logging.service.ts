import { Injectable, Inject } from "@nestjs/common";
import { PortfolioLoggerService } from "@portfolio/logger";
import type { Logger } from "winston";

/**
 * Logging Service that demonstrates Winston integration with NestJS
 * This service shows how to use the centralized logger with dependency injection
 */
@Injectable()
export class LoggingService {
  constructor(
    @Inject("LOGGER") private readonly logger: PortfolioLoggerService,
    @Inject("SECURITY_LOGGER")
    private readonly securityLogger: PortfolioLoggerService,
    @Inject("PERFORMANCE_LOGGER")
    private readonly performanceLogger: PortfolioLoggerService,
  ) {}

  /**
   * Log a general message
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  logInfo(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log an error
   * @param {string} message - The message to log
   * @param {Error} error - The error to log
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  logError(
    message: string,
    error?: Error,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    });
  }

  /**
   * Log a warning
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  logWarn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log debug information
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  logDebug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log HTTP requests
   * @param {string} method - The HTTP method
   * @param {string} path - The HTTP path
   * @param {number} statusCode - The HTTP status code
   * @param {number} responseTime - The HTTP response time
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  logHttp(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.http("HTTP Request", {
      method,
      path,
      statusCode,
      responseTime,
      ...meta,
    });
  }

  /**
   * Log security events
   * @param {string} event - The security event
   * @param {Record<string, unknown>} details - The details to log
   */
  logSecurity(event: string, details: Record<string, unknown>): void {
    this.securityLogger.warn(`SECURITY: ${event}`, {
      event: "SECURITY",
      ...details,
    });
  }

  /**
   * Log performance metrics
   * @param {string} metric - The performance metric
   * @param {number} value - The performance value
   * @param {Record<string, unknown>} details - The details to log
   */
  logPerformance(
    metric: string,
    value: number,
    details?: Record<string, unknown>,
  ): void {
    this.performanceLogger.info(`Performance: ${metric}`, {
      metric,
      value,
      ...details,
    });
  }

  /**
   * Start a performance timer
   * @returns {object} The timer object
   */
  startTimer(): { done: (meta?: Record<string, unknown>) => void } {
    return this.logger.startTimer();
  }

  /**
   * Profile a specific operation
   * @param {string} id - The ID of the operation
   * @param {Record<string, unknown>} meta - The metadata to log
   */
  profile(id: string, meta?: Record<string, unknown>): void {
    this.logger.profile(id, meta);
  }

  /**
   * Get the underlying Winston logger instance
   * @returns {WinstonLogger} The underlying Winston logger instance
   */
  getWinstonLogger(): Logger {
    return this.logger.getWinstonLogger();
  }
}
