"use client";

import {
  Logger,
  logSecurity,
  logPerformance,
  logAPICall,
} from "@portfolio/logger";

const clientLogger = new Logger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  enableConsole: true,
  enableFile: false, // No file logging in browser
  maskSensitiveData: true,
  includeTimestamp: true,
  includeMetadata: true,
});

export const logger = clientLogger;

export { logSecurity, logPerformance, logAPICall };

export const logSecurityEvent = (
  event: string,
  details: Record<string, unknown>,
) => {
  clientLogger.warn(`SECURITY: ${event}`, { event: "SECURITY", ...details });
};

export const logPerformanceMetric = (
  metric: string,
  value: number,
  details?: Record<string, unknown>,
) => {
  clientLogger.info(`PERFORMANCE: ${metric}`, {
    metric,
    value,
    ...details,
  });
};

export const logAPICallEvent = (
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string,
) => {
  clientLogger.http("API Call", {
    method,
    path,
    statusCode,
    responseTime,
    userId,
  });
};
