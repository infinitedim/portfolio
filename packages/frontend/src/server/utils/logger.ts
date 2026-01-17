import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const logFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    if (stack) {
      msg += `\n${stack}`;
    }

    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  },
);

// Create logger
const logLevel = process.env.LOG_LEVEL || "info";

export const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        logFormat,
      ),
    }),
  ],
});

// Specialized loggers (mirrors backend)
export const securityLogger = logger.child({ context: "Security" });
export const authLogger = logger.child({ context: "Auth" });
export const dbLogger = logger.child({ context: "Database" });
export const apiLogger = logger.child({ context: "API" });
export const cacheLogger = logger.child({ context: "Cache" });

// Simple log functions for serverless
export const serverlessLog = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : "");
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : "");
  },
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, context ? JSON.stringify(context) : "");
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        `[DEBUG] ${message}`,
        context ? JSON.stringify(context) : "",
      );
    }
  },
};

