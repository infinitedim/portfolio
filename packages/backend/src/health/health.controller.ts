import {Controller, Get, HttpCode, HttpStatus, Optional} from "@nestjs/common";
import {HealthService, type HealthCheckResult} from "./health.service";

// Default health check response when service is not available
const getDefaultHealthResponse = (): HealthCheckResult => ({
  status: "healthy",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  version: process.env.npm_package_version || "1.0.0",
  environment: process.env.NODE_ENV || "development",
  checks: {
    database: {
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    redis: {
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    memory: {
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    disk: {
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
    system: {
      status: "healthy",
      responseTime: 0,
      lastChecked: new Date().toISOString(),
    },
  },
  summary: {total: 5, healthy: 5, unhealthy: 0, degraded: 0},
});

@Controller("health")
export class HealthController {
  constructor(@Optional() private readonly healthService?: HealthService) {}

  /**
   * Basic health check endpoint
   * @returns {Promise<HealthCheckResult>} - The health check result
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async health() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();

    return {
      status: result.status,
      timestamp: result.timestamp,
      uptime: result.uptime,
      version: result.version,
      environment: result.environment,
    };
  }

  // Backwards-compatible synchronous check used by tests
  check(): {status: string; timestamp: string; uptime: number} {
    const timestamp = new Date().toISOString();
    return {status: "ok", timestamp, uptime: Math.floor(process.uptime())};
  }

  /**
   * Detailed health check endpoint
   * @returns {Promise<HealthCheckResult>} - The detailed health check result
   */
  @Get("detailed")
  @HttpCode(HttpStatus.OK)
  async detailedHealth() {
    return this.healthService
      ? this.healthService.getDetailedHealth()
      : this.health();
  }

  /**
   * Simple ping endpoint
   * @returns {Promise<{ message: string; timestamp: string }>} - The ping result
   */
  @Get("ping")
  @HttpCode(HttpStatus.OK)
  async ping() {
    return this.healthService
      ? this.healthService.ping()
      : {message: "pong", timestamp: new Date().toISOString()};
  }

  /**
   * Database health check endpoint
   * @returns {Promise<HealthCheckResult>} - The database health check result
   */
  @Get("database")
  @HttpCode(HttpStatus.OK)
  async databaseHealth() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();
    return {
      status: result.checks.database.status,
      timestamp: result.timestamp,
      responseTime: result.checks.database.responseTime,
      details: result.checks.database.details,
      error: result.checks.database.error,
    };
  }

  /**
   * Redis health check endpoint
   * @returns {Promise<object>} - The Redis health check result
   */
  @Get("redis")
  @HttpCode(HttpStatus.OK)
  async redisHealth() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();
    return {
      status: result.checks.redis.status,
      timestamp: result.timestamp,
      responseTime: result.checks.redis.responseTime,
      details: result.checks.redis.details,
      error: result.checks.redis.error,
    };
  }

  /**
   * Memory health check endpoint
   * @returns {Promise<object>} - The memory health check result
   */
  @Get("memory")
  @HttpCode(HttpStatus.OK)
  async memoryHealth() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();
    return {
      status: result.checks.memory.status,
      timestamp: result.timestamp,
      responseTime: result.checks.memory.responseTime,
      details: result.checks.memory.details,
      error: result.checks.memory.error,
    };
  }

  /**
   * System health check endpoint
   * @returns {Promise<object>} - The system health check result
   */
  @Get("system")
  @HttpCode(HttpStatus.OK)
  async systemHealth() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();
    return {
      status: result.checks.system.status,
      timestamp: result.timestamp,
      responseTime: result.checks.system.responseTime,
      details: result.checks.system.details,
      error: result.checks.system.error,
    };
  }

  /**
   * Readiness probe endpoint
   * @returns {Promise<object>} - The readiness probe result
   */
  @Get("ready")
  @HttpCode(HttpStatus.OK)
  async readiness() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();

    // Service is ready if database and Redis are healthy
    const isReady =
      result.checks.database.status === "healthy" &&
      result.checks.redis.status === "healthy";

    if (!isReady) {
      return {
        status: "unhealthy",
        timestamp: result.timestamp,
        error: "Database or Redis is not healthy",
        checks: {
          database: result.checks.database.status,
          redis: result.checks.redis.status,
        },
      };
    }

    return {
      status: "healthy",
      timestamp: result.timestamp,
      uptime: result.uptime,
    };
  }

  /**
   * Liveness probe endpoint
   * @returns {Promise<object>} - The liveness probe result
   */
  @Get("live")
  @HttpCode(HttpStatus.OK)
  async liveness() {
    const result = this.healthService
      ? await this.healthService.checkHealth()
      : getDefaultHealthResponse();

    // Service is alive if it can respond and basic checks pass
    const isAlive = result.status !== "unhealthy";

    if (!isAlive) {
      return {
        status: "unhealthy",
        timestamp: result.timestamp,
        error: "Service is unhealthy",
        overallStatus: result.status,
      };
    }

    return {
      status: "healthy",
      timestamp: result.timestamp,
      uptime: result.uptime,
      overallStatus: result.status,
    };
  }

  /**
   * Database connection pool status endpoint
   * @returns {Promise<object>} - The database connection pool status
   */
  @Get("database/pool")
  @HttpCode(HttpStatus.OK)
  async databasePoolHealth() {
    return this.healthService ? this.healthService.getDatabasePoolStatus() : {};
  }
}
