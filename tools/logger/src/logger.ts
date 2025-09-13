import winston from "winston";
import type { Logger as WinstonLogger, LoggerOptions } from "winston";

export type LogLevel = "error" | "warn" | "info" | "debug" | "http";

interface LogEntry {
  ts?: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

export interface LoggerConfig {
  level?: LogLevel;
  enableConsole?: boolean;
  enableFile?: boolean;
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  maskSensitiveData?: boolean;
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
  service?: string;
  environment?: string;
}

const SENSITIVE_KEYS = [
  "password",
  "token",
  "access_token",
  "refresh_token",
  "client_secret",
  "authorization",
  "apiKey",
  "secret",
  "key",
  "auth",
];

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Add colors to winston
winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});

/**
 * Masks sensitive values in data
 * @param {unknown} value - The value to mask
 * @returns {unknown} The masked value
 */
function maskValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 8
      ? `${value.slice(0, 2)}***${value.slice(-2)}`
      : "***";
  }
  return "***";
}

/**
 * Recursively masks sensitive fields in metadata
 * @param {Record<string, unknown>} meta - The metadata to mask
 * @returns {Record<string, unknown>} The masked metadata
 */
function maskSensitiveData(
  meta: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitive) =>
      key.toLowerCase().includes(sensitive.toLowerCase()),
    );

    if (isSensitive) {
      out[key] = maskValue(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      out[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }

  return out;
}

/**
 * Creates Winston logger configuration
 * @param {LoggerConfig} config - Logger configuration
 * @returns {LoggerOptions} Winston logger options
 */
function createWinstonConfig(config: LoggerConfig): LoggerOptions {
  const {
    level = "info",
    enableConsole = true,
    enableFile = false,
    logDir = "logs",
    service = "portfolio",
    environment = process.env.NODE_ENV || "development",
  } = config;

  // Define transports
  const transports: winston.transport[] = [];

  // Console transport
  if (enableConsole) {
    transports.push(
      new winston.transports.Console({
        level: process.env.NODE_ENV === "production" ? "warn" : "debug",
        format: winston.format.combine(
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
          winston.format.errors({ stack: true }),
          winston.format.colorize({ all: true }),
          winston.format.printf((info) => {
            const { timestamp, level, message, stack, ...meta } = info;
            const metaStr =
              Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : "";
            return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ""}${metaStr ? `\n${metaStr}` : ""}`;
          }),
        ),
      }),
    );
  }

  // File transports for production
  if (enableFile) {
    // Error log file
    transports.push(
      new winston.transports.File({
        filename: `${logDir}/error.log`,
        level: "error",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: `${logDir}/combined.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );

    // HTTP log file
    transports.push(
      new winston.transports.File({
        filename: `${logDir}/http.log`,
        level: "http",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return {
    level,
    levels: LOG_LEVELS,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.metadata({
        fillExcept: ["message", "level", "timestamp"],
      }),
    ),
    defaultMeta: {
      service,
      environment,
    },
    transports,
    exitOnError: false,
  };
}

/**
 * Enhanced logger class with Winston integration
 */
class Logger {
  private config: Required<LoggerConfig>;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private winstonLogger: WinstonLogger;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: config.level || (process.env.LOG_LEVEL as LogLevel) || "info",
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? false,
      logDir: config.logDir || "logs",
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      maskSensitiveData: config.maskSensitiveData ?? true,
      includeTimestamp: config.includeTimestamp ?? true,
      includeMetadata: config.includeMetadata ?? true,
      service: config.service || "portfolio",
      environment: config.environment || process.env.NODE_ENV || "development",
    };

    // Create Winston logger
    this.winstonLogger = winston.createLogger(createWinstonConfig(this.config));

    // Handle uncaught exceptions and unhandled rejections in production
    if (this.config.environment === "production") {
      this.winstonLogger.exceptions.handle(
        new winston.transports.File({
          filename: `${this.config.logDir}/exceptions.log`,
        }),
      );

      this.winstonLogger.rejections.handle(
        new winston.transports.File({
          filename: `${this.config.logDir}/rejections.log`,
        }),
      );
    }
  }

  /**
   * Logs a message with the specified level
   * @param {LogLevel} level - The log level
   * @param {string} message - The message to log
   * @param {Record<string, unknown>} meta - Optional metadata
   */
  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    // Process metadata
    const processedMeta =
      meta && this.config.maskSensitiveData ? maskSensitiveData(meta) : meta;

    // Add to buffer
    const entry: LogEntry = {
      level,
      message,
      ...(this.config.includeTimestamp && { ts: new Date().toISOString() }),
      ...(processedMeta && this.config.includeMetadata && processedMeta),
    };

    this.addToBuffer(entry);

    // Log to Winston
    this.winstonLogger.log(level, message, processedMeta);
  }

  /**
   * Adds log entry to buffer
   * @param {LogEntry} entry - The log entry to add
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  // Public logging methods
  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.log("http", message, meta);
  }

  // Utility methods
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
    this.winstonLogger.level = level;
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Winston-specific methods
  getWinstonLogger(): WinstonLogger {
    return this.winstonLogger;
  }

  // Profile method for performance monitoring
  profile(id: string, meta?: Record<string, unknown>): void {
    this.winstonLogger.profile(id, meta);
  }

  // Start timer for performance monitoring
  startTimer(): { done: (meta?: Record<string, unknown>) => void } {
    return this.winstonLogger.startTimer();
  }
}

// Create default logger instance
const defaultLogger = new Logger();

// Export the main log function for backward compatibility
/**
 * Main logging function for backward compatibility
 * @param {LogLevel} level - The log level
 * @param {string} message - The message to log
 * @param {Record<string, unknown>} meta - Optional metadata
 */
export function log(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  defaultLogger[level](message, meta);
}

// Export the Logger class for advanced usage
export { Logger };

// Export utility functions for specialized logging
export const logSecurity = (
  event: string,
  details: Record<string, unknown>,
): void => {
  defaultLogger.warn(`SECURITY: ${event}`, { event: "SECURITY", ...details });
};

export const logPerformance = (
  metric: string,
  value: number,
  details?: Record<string, unknown>,
): void => {
  defaultLogger.info(`PERFORMANCE: ${metric}`, {
    metric,
    value,
    ...details,
  });
};

export const logAPICall = (
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string,
): void => {
  defaultLogger.http("API Call", {
    method,
    path,
    statusCode,
    responseTime,
    userId,
  });
};

// Export the default logger instance
export { defaultLogger as logger };
