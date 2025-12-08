/**
 * Singleton service container for tRPC context.
 * Prevents memory leaks and connection pool exhaustion by reusing service instances.
 *
 * Uses globalThis to ensure singletons survive across serverless warm starts.
 * This follows Prisma's recommended pattern for serverless environments.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#serverless-environments
 * @module trpc/services
 */

import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { SecurityService } from "../security/security.service";
import { AuditLogService } from "../security/audit-log.service";
import { AuthService } from "../auth/auth.service";
import { HealthService } from "../health/health.service";
import { DatabaseConnectionManager } from "../prisma/database-connection-manager.service";
import { CSRFTokenService } from "../security/csrf.service";
import { securityLogger } from "../logging/logger";

/**
 * Global storage type for singleton services.
 * Using globalThis ensures instances survive across module reloads in serverless.
 */
interface GlobalServiceStore {
  __prismaService?: PrismaService;
  __redisService?: RedisService;
  __securityService?: SecurityService;
  __auditLogService?: AuditLogService;
  __authService?: AuthService;
  __healthService?: HealthService;
  __databaseConnectionManager?: DatabaseConnectionManager;
  __csrfService?: CSRFTokenService;
}

// Extend globalThis with our service store
const globalStore = globalThis as unknown as GlobalServiceStore;

/**
 * Get or create the singleton PrismaService instance.
 * Uses globalThis to survive across serverless warm starts.
 */
export function getPrismaService(): PrismaService {
  if (!globalStore.__prismaService) {
    securityLogger.debug("Creating new PrismaService singleton", {
      component: "TrpcServices",
      operation: "getPrismaService",
    });
    globalStore.__prismaService = new PrismaService();
  }
  return globalStore.__prismaService;
}

/**
 * Get or create the singleton RedisService instance.
 * Upstash Redis REST client is stateless but we still benefit from instance reuse.
 */
export function getRedisService(): RedisService {
  if (!globalStore.__redisService) {
    securityLogger.debug("Creating new RedisService singleton", {
      component: "TrpcServices",
      operation: "getRedisService",
    });
    globalStore.__redisService = new RedisService();
  }
  return globalStore.__redisService;
}

/**
 * Get or create the singleton SecurityService instance.
 */
export function getSecurityService(): SecurityService {
  if (!globalStore.__securityService) {
    securityLogger.debug("Creating new SecurityService singleton", {
      component: "TrpcServices",
      operation: "getSecurityService",
    });
    globalStore.__securityService = new SecurityService(getRedisService());
  }
  return globalStore.__securityService;
}

/**
 * Get or create the singleton AuditLogService instance.
 */
export function getAuditLogService(): AuditLogService {
  if (!globalStore.__auditLogService) {
    securityLogger.debug("Creating new AuditLogService singleton", {
      component: "TrpcServices",
      operation: "getAuditLogService",
    });
    globalStore.__auditLogService = new AuditLogService(
      getPrismaService(),
      getRedisService(),
    );
  }
  return globalStore.__auditLogService;
}

/**
 * Get or create the singleton AuthService instance.
 */
export function getAuthService(): AuthService {
  if (!globalStore.__authService) {
    securityLogger.debug("Creating new AuthService singleton", {
      component: "TrpcServices",
      operation: "getAuthService",
    });
    globalStore.__authService = new AuthService(
      getSecurityService(),
      getAuditLogService(),
      getRedisService(),
    );
  }
  return globalStore.__authService;
}

/**
 * Get or create the singleton DatabaseConnectionManager instance.
 */
export function getDatabaseConnectionManager(): DatabaseConnectionManager {
  if (!globalStore.__databaseConnectionManager) {
    securityLogger.debug("Creating new DatabaseConnectionManager singleton", {
      component: "TrpcServices",
      operation: "getDatabaseConnectionManager",
    });
    globalStore.__databaseConnectionManager = new DatabaseConnectionManager(
      getPrismaService(),
    );
  }
  return globalStore.__databaseConnectionManager;
}

/**
 * Get or create the singleton HealthService instance.
 */
export function getHealthService(): HealthService {
  if (!globalStore.__healthService) {
    securityLogger.debug("Creating new HealthService singleton", {
      component: "TrpcServices",
      operation: "getHealthService",
    });
    globalStore.__healthService = new HealthService(
      getPrismaService(),
      getRedisService(),
      getDatabaseConnectionManager(),
    );
  }
  return globalStore.__healthService;
}

/**
 * Get or create the singleton CSRFTokenService instance.
 */
export function getCSRFService(): CSRFTokenService {
  if (!globalStore.__csrfService) {
    securityLogger.debug("Creating new CSRFTokenService singleton", {
      component: "TrpcServices",
      operation: "getCSRFService",
    });
    globalStore.__csrfService = new CSRFTokenService(getRedisService());
  }
  return globalStore.__csrfService;
}

/**
 * Service container providing all singleton services.
 * Use this in tRPC context for dependency injection.
 */
export interface ServiceContainer {
  prisma: PrismaService;
  redis: RedisService;
  security: SecurityService;
  auditLog: AuditLogService;
  auth: AuthService;
  health: HealthService;
  databaseConnectionManager: DatabaseConnectionManager;
  csrf: CSRFTokenService;
}

/**
 * Get all services as a container object.
 * All services are singletons and will be reused across requests.
 */
export function getServices(): ServiceContainer {
  return {
    prisma: getPrismaService(),
    redis: getRedisService(),
    security: getSecurityService(),
    auditLog: getAuditLogService(),
    auth: getAuthService(),
    health: getHealthService(),
    databaseConnectionManager: getDatabaseConnectionManager(),
    csrf: getCSRFService(),
  };
}

/**
 * Reset all singleton instances.
 * Only use for testing purposes.
 */
export function resetServices(): void {
  securityLogger.warn("Resetting all service singletons", {
    component: "TrpcServices",
    operation: "resetServices",
  });

  globalStore.__prismaService = undefined;
  globalStore.__redisService = undefined;
  globalStore.__securityService = undefined;
  globalStore.__auditLogService = undefined;
  globalStore.__authService = undefined;
  globalStore.__healthService = undefined;
  globalStore.__databaseConnectionManager = undefined;
  globalStore.__csrfService = undefined;
}
