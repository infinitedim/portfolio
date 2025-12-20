import {Injectable, Logger} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import {RedisService} from "../redis/redis.service";
import {DatabaseConnectionManager} from "../prisma/database-connection-manager.service";

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
    disk: HealthCheck;
    system: HealthCheck;
  };
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  lastChecked: string;
  details?: Record<string, unknown>;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly databaseConnectionManager: DatabaseConnectionManager,
  ) {}

  /**
   * Perform comprehensive health check
   * @returns {Promise<HealthCheckResult>} - The health check result
   */
  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();

    // Run all health checks in parallel
    const [databaseCheck, redisCheck, memoryCheck, diskCheck, systemCheck] =
      await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkMemory(),
        this.checkDisk(),
        this.checkSystem(),
      ]);

    const checks = {
      database: this.getCheckResult(databaseCheck),
      redis: this.getCheckResult(redisCheck),
      memory: this.getCheckResult(memoryCheck),
      disk: this.getCheckResult(diskCheck),
      system: this.getCheckResult(systemCheck),
    };

    // Calculate summary
    const summary = this.calculateSummary(checks);

    // Determine overall status
    const status = this.determineOverallStatus(summary);

    return {
      status,
      timestamp,
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks,
      summary,
    };
  }

  /**
   * Check database connectivity and performance
   * @returns {Promise<HealthCheck>} - The database health check result
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Test a simple query
      const result = await this.prisma.$queryRaw<
        Array<{
          version: string;
          database: string;
          user: string;
          timestamp: Date;
        }>
      >`
        SELECT
          version() as version,
          current_database() as database,
          current_user as user,
          now() as timestamp
      `;

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          version: result?.[0]?.version ?? "unknown",
          database: result?.[0]?.database ?? "unknown",
          user: result?.[0]?.user ?? "unknown",
          connectionPool: "active",
        },
      };
    } catch (error) {
      this.logger.error("Database health check failed", error);
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }
  }

  /**
   * Check Redis connectivity and performance
   * @returns {Promise<HealthCheck>} - The Redis health check result
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test Redis connection
      const testKey = `health:test:${Date.now()}`;
      const testValue = "health_check";

      // Set a test value
      await this.redis.set(testKey, testValue, 60);

      // Get the test value
      const retrievedValue = await this.redis.get<string>(testKey);

      // Delete the test value
      await this.redis.del(testKey);

      if (retrievedValue !== testValue) {
        throw new Error("Redis data integrity check failed");
      }

      // Get Redis info
      const info = await this.redis.info();
      const memoryInfo = await this.redis.memory("USAGE");

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          version: info.redis_version,
          memory: memoryInfo,
          connectedClients: info.connected_clients,
          usedMemory: info.used_memory_human,
          uptime: info.uptime_in_seconds,
        },
      };
    } catch (error) {
      this.logger.error("Redis health check failed", error);
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown Redis error",
      };
    }
  }

  /**
   * Check memory usage
   * @returns {Promise<HealthCheck>} - The memory health check result
   */
  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const externalMemory = memUsage.external;
      const rssMemory = memUsage.rss;

      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // Determine status based on memory usage
      let status: "healthy" | "unhealthy" | "degraded" = "healthy";
      if (memoryUsagePercent > 90) {
        status = "unhealthy";
      } else if (memoryUsagePercent > 75) {
        status = "degraded";
      }

      const responseTime = Date.now() - startTime;

      return {
        status,
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          heapUsed: this.formatBytes(usedMemory),
          heapTotal: this.formatBytes(totalMemory),
          external: this.formatBytes(externalMemory),
          rss: this.formatBytes(rssMemory),
          usagePercent: Math.round(memoryUsagePercent * 100) / 100,
        },
      };
    } catch (error) {
      this.logger.error("Memory health check failed", error);
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown memory error",
      };
    }
  }

  /**
   * Check disk usage (if available)
   * @returns {Promise<HealthCheck>} - The disk health check result
   */
  private async checkDisk(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // This is a simplified disk check
      // In production, you might want to use a library like 'diskusage'
      const diskInfo = {
        available: "N/A",
        total: "N/A",
        used: "N/A",
        usagePercent: 0,
      };

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: diskInfo,
      };
    } catch (error) {
      this.logger.error("Disk health check failed", error);
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown disk error",
      };
    }
  }

  /**
   * Check system information
   * @returns {Promise<HealthCheck>} - The system health check result
   */
  private async checkSystem(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        title: process.title,
        cwd: process.cwd(),
      };

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: systemInfo,
      };
    } catch (error) {
      this.logger.error("System health check failed", error);
      return {
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown system error",
      };
    }
  }

  /**
   * Get check result from Promise.allSettled
   * @param {PromiseSettledResult<HealthCheck>} promiseResult - The result of the health check
   * @returns {HealthCheck} - The result of the health check
   */
  private getCheckResult(
    promiseResult: PromiseSettledResult<HealthCheck>,
  ): HealthCheck {
    if (promiseResult.status === "fulfilled") {
      return promiseResult.value;
    } else {
      return {
        status: "unhealthy",
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: promiseResult.reason?.message || "Check failed",
      };
    }
  }

  /**
   * Calculate summary statistics
   * @param {HealthCheckResult["checks"]} checks - The checks to calculate the summary for
   * @returns {HealthCheckResult["summary"]} - The summary of the health checks
   */
  private calculateSummary(
    checks: HealthCheckResult["checks"],
  ): HealthCheckResult["summary"] {
    const checkValues = Object.values(checks);
    const total = checkValues.length;
    const healthy = checkValues.filter((c) => c.status === "healthy").length;
    const unhealthy = checkValues.filter(
      (c) => c.status === "unhealthy",
    ).length;
    const degraded = checkValues.filter((c) => c.status === "degraded").length;

    return {total, healthy, unhealthy, degraded};
  }

  /**
   * Determine overall health status
   * @param {HealthCheckResult["summary"]} summary - The summary of the health checks
   * @returns {HealthCheckResult["status"]} - The overall health status
   */
  private determineOverallStatus(
    summary: HealthCheckResult["summary"],
  ): "healthy" | "unhealthy" | "degraded" {
    if (summary.unhealthy > 0) {
      return "unhealthy";
    }
    if (summary.degraded > 0) {
      return "degraded";
    }
    return "healthy";
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes - The number of bytes to format
   * @returns {string} - The formatted bytes
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Simple ping check
   * @returns {Promise<{ message: string; timestamp: string }>} - The ping result
   */
  async ping(): Promise<{message: string; timestamp: string}> {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed health information
   * @returns {Promise<HealthCheckResult>} - The detailed health information
   */
  async getDetailedHealth(): Promise<HealthCheckResult> {
    return this.checkHealth();
  }

  /**
   * Get database connection pool status and statistics
   * @returns {Promise<object>} - The database connection pool status
   */
  async getDatabasePoolStatus(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    pool: {
      active: number;
      idle: number;
      total: number;
      max: number;
      waiting: number;
    };
    performance: {
      lastOperationTime: number;
      latency?: number;
    };
    health: {
      isHealthy: boolean;
      lastError?: string;
      uptime: number;
    };
  }> {
    try {
      const stats = await this.databaseConnectionManager.getPoolStats();
      const healthStatus =
        await this.databaseConnectionManager.checkDatabaseHealth();
      const startTime = Date.now();

      // Test a quick database operation to check health
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Determine pool health status
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";

      if (!healthStatus.isHealthy) {
        status = "unhealthy";
      } else if (
        (healthStatus.latency && healthStatus.latency > 1000) ||
        responseTime > 1000
      ) {
        status = "degraded";
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        pool: {
          active: stats.activeConnections,
          idle: stats.idleConnections,
          total: stats.totalConnections,
          max: stats.maxConnections,
          waiting: stats.waitingClients,
        },
        performance: {
          lastOperationTime: responseTime,
          latency: healthStatus.latency,
        },
        health: {
          isHealthy: healthStatus.isHealthy,
          lastError: healthStatus.error,
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      this.logger.error("Failed to get database pool status", error);

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        pool: {
          active: 0,
          idle: 0,
          total: 0,
          max: 0,
          waiting: 0,
        },
        performance: {
          lastOperationTime: 0,
        },
        health: {
          isHealthy: false,
          lastError: error instanceof Error ? error.message : "Unknown error",
          uptime: process.uptime(),
        },
      };
    }
  }
}
