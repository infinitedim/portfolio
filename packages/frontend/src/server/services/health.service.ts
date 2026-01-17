import { prisma, testDatabaseConnection, getDatabaseInfo } from "../db";
import { redisService } from "../redis";

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  lastChecked: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
  };
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const result = await testDatabaseConnection();
    const info = result.connected ? await getDatabaseInfo() : null;

    return {
      status: result.connected ? "healthy" : "unhealthy",
      responseTime: result.latency,
      lastChecked: new Date().toISOString(),
      details: info ?? undefined,
      error: result.error,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const result = await redisService.testConnection();

    return {
      status: result.status === "connected" ? "healthy" : "unhealthy",
      responseTime: result.responseTime,
      lastChecked: new Date().toISOString(),
      error: result.error,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheck {
  const start = Date.now();
  const memUsage = process.memoryUsage();
  const usedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  let status: HealthCheck["status"] = "healthy";
  if (usedPercent > 90) status = "unhealthy";
  else if (usedPercent > 75) status = "degraded";

  return {
    status,
    responseTime: Date.now() - start,
    lastChecked: new Date().toISOString(),
    details: {
      heapUsed: formatBytes(memUsage.heapUsed),
      heapTotal: formatBytes(memUsage.heapTotal),
      rss: formatBytes(memUsage.rss),
      usagePercent: Math.round(usedPercent * 100) / 100,
    },
  };
}

function formatBytes(bytes: number): string {
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Perform comprehensive health check
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const [database, redis] = await Promise.all([
    checkDatabase(),
    checkRedis(),
  ]);
  const memory = checkMemory();

  const checks = { database, redis, memory };
  const checkValues = Object.values(checks);

  let status: HealthCheckResult["status"] = "healthy";
  if (checkValues.some((c) => c.status === "unhealthy")) {
    status = "unhealthy";
  } else if (checkValues.some((c) => c.status === "degraded")) {
    status = "degraded";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checks,
  };
}

/**
 * Simple ping check
 */
export async function ping(): Promise<{ message: string; timestamp: string }> {
  return {
    message: "pong",
    timestamp: new Date().toISOString(),
  };
}

export const healthService = {
  checkHealth,
  ping,
  checkDatabase,
  checkRedis,
  checkMemory,
};

export type HealthService = typeof healthService;

