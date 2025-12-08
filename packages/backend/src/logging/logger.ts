import {
  Logger,
  logSecurity,
  logPerformance,
  logAPICall,
  type LogLevel,
  PortfolioLoggerService,
  createNestWinstonConfig,
} from "@portfolio/logger";

// Create a server-specific logger instance with file logging enabled
const serverLogger = new Logger({
  level:
    (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  logDir: "logs",
  maskSensitiveData: true,
  includeTimestamp: true,
  includeMetadata: true,
  service: "portfolio-backend",
  environment: process.env.NODE_ENV || "development",
});

// Export the server logger as the main logger
export const logger = serverLogger;

// Export utility functions for specialized logging
export { logSecurity, logPerformance, logAPICall };

// Create specialized loggers for different purposes
export const securityLogger = new Logger({
  level: "info",
  enableConsole: process.env.NODE_ENV !== "production",
  enableFile: true,
  logDir: "logs",
  maskSensitiveData: true,
  service: "portfolio-security",
  environment: process.env.NODE_ENV || "development",
});

export const performanceLogger = new Logger({
  level: "info",
  enableConsole: false,
  enableFile: true,
  logDir: "logs",
  maskSensitiveData: false, // Performance data doesn't need masking
  service: "portfolio-performance",
  environment: process.env.NODE_ENV || "development",
});

// Re-export the utility functions with server-specific implementations
export const logSecurityEvent = (
  event: string,
  details: Record<string, unknown>,
) => {
  securityLogger.warn(`SECURITY: ${event}`, { event: "SECURITY", ...details });
};

export const logPerformanceMetric = (
  metric: string,
  value: number,
  details?: Record<string, unknown>,
) => {
  performanceLogger.info(`Performance metric: ${metric}`, {
    metric,
    value,
    ...details,
  });
};

export const log = {
  info: (message: string, meta?: Record<string, unknown>) => {
    serverLogger.info(message, meta);
  },
  warning: (message: string, meta?: Record<string, unknown>) => {
    serverLogger.warn(message, meta);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    serverLogger.error(message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    serverLogger.debug(message, meta);
  },
};

export const logAPICallEvent = (
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string,
) => {
  serverLogger.http("API Call", {
    method,
    path,
    statusCode,
    responseTime,
    userId,
  });
};

// Export NestJS-specific components
export { PortfolioLoggerService, createNestWinstonConfig };

// Create a NestJS logger service instance
export const nestLoggerService = new PortfolioLoggerService({
  level:
    (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  logDir: "logs",
  maskSensitiveData: true,
  includeTimestamp: true,
  includeMetadata: true,
  service: "portfolio-backend",
  environment: process.env.NODE_ENV || "development",
});
