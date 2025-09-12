import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
export var AuditEventType;
(function (AuditEventType) {
  // Authentication events
  AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
  AuditEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
  AuditEventType["LOGOUT"] = "LOGOUT";
  AuditEventType["PASSWORD_CHANGE"] = "PASSWORD_CHANGE";
  AuditEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
  // Authorization events
  AuditEventType["ACCESS_DENIED"] = "ACCESS_DENIED";
  AuditEventType["PERMISSION_GRANTED"] = "PERMISSION_GRANTED";
  AuditEventType["PERMISSION_REVOKED"] = "PERMISSION_REVOKED";
  // Data events
  AuditEventType["DATA_CREATED"] = "DATA_CREATED";
  AuditEventType["DATA_UPDATED"] = "DATA_UPDATED";
  AuditEventType["DATA_DELETED"] = "DATA_DELETED";
  AuditEventType["DATA_VIEWED"] = "DATA_VIEWED";
  AuditEventType["DATA_EXPORTED"] = "DATA_EXPORTED";
  // Security events
  AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
  AuditEventType["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
  AuditEventType["CSRF_VIOLATION"] = "CSRF_VIOLATION";
  AuditEventType["SQL_INJECTION_ATTEMPT"] = "SQL_INJECTION_ATTEMPT";
  AuditEventType["XSS_ATTEMPT"] = "XSS_ATTEMPT";
  AuditEventType["BRUTE_FORCE_ATTEMPT"] = "BRUTE_FORCE_ATTEMPT";
  // System events
  AuditEventType["CONFIGURATION_CHANGE"] = "CONFIGURATION_CHANGE";
  AuditEventType["SYSTEM_ERROR"] = "SYSTEM_ERROR";
  AuditEventType["ERROR_OCCURRED"] = "ERROR_OCCURRED";
  AuditEventType["BACKUP_CREATED"] = "BACKUP_CREATED";
  AuditEventType["MAINTENANCE_MODE"] = "MAINTENANCE_MODE";
})(AuditEventType || (AuditEventType = {}));
export var AuditSeverity;
(function (AuditSeverity) {
  AuditSeverity["LOW"] = "LOW";
  AuditSeverity["MEDIUM"] = "MEDIUM";
  AuditSeverity["HIGH"] = "HIGH";
  AuditSeverity["CRITICAL"] = "CRITICAL";
})(AuditSeverity || (AuditSeverity = {}));
@Injectable()
export class AuditLogService {
  prisma;
  redis;
  CACHE_TTL = 300; // 5 minutes
  BATCH_SIZE = 100;
  FLUSH_INTERVAL = 60000; // 1 minute
  constructor(prisma, redis) {
    this.prisma = prisma;
    this.redis = redis;
    // Start periodic flush of cached audit logs
    this.startPeriodicFlush();
  }
  /**
   * Log an audit event
   * @param {AuditLogEntry} entry - The audit log entry
   * @param {Request} request - Optional request object for additional context
   */
  async logEvent(entry, request) {
    try {
      // Enhance entry with request context if available
      const enhancedEntry = request
        ? this.enhanceEntryWithRequest(entry, request)
        : entry;
      // Cache the entry for batch processing
      await this.cacheAuditEntry(enhancedEntry);
      // For critical events, log immediately
      if (enhancedEntry.severity === AuditSeverity.CRITICAL) {
        await this.flushAuditCache();
      }
      // Log to console for development
      if (process.env.NODE_ENV === "development") {
        console.log("AUDIT LOG:", {
          timestamp: new Date().toISOString(),
          ...enhancedEntry,
        });
      }
    } catch (error) {
      console.error("Failed to log audit event:", error);
      // Don't throw - audit logging should not break the application
    }
  }
  /**
   * Log security event with high severity
   * @param {AuditEventType} eventType - The security event type
   * @param {Record<string, unknown>} details - Event details
   * @param {Request} request - Request object
   */
  async logSecurityEvent(eventType, details, request) {
    await this.logEvent(
      {
        eventType,
        severity: AuditSeverity.HIGH,
        details,
        action: "SECURITY_VIOLATION",
      },
      request,
    );
  }
  /**
   * Log authentication event
   * @param {AuditEventType} eventType - The authentication event type
   * @param {string} userId - User ID
   * @param {boolean} success - Whether the action was successful
   * @param {Request} request - Request object
   */
  async logAuthEvent(eventType, userId, success, request) {
    await this.logEvent(
      {
        eventType,
        severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
        userId,
        action: "AUTHENTICATION",
        details: { success },
      },
      request,
    );
  }
  /**
   * Log data access event
   * @param {AuditEventType} eventType - The data event type
   * @param {string} userId - User ID
   * @param {string} resource - Resource being accessed
   * @param {string} resourceId - Resource ID
   * @param {Request} request - Request object
   */
  async logDataEvent(eventType, userId, resource, resourceId, request) {
    await this.logEvent(
      {
        eventType,
        severity: AuditSeverity.LOW,
        userId,
        resource,
        resourceId,
        action: "DATA_ACCESS",
      },
      request,
    );
  }
  /**
   * Query audit logs
   * @param {AuditLogQuery} query - Query parameters
   * @returns {Promise<AuditLogEntry[]>} - Audit log entries
   */
  async queryAuditLogs(query) {
    try {
      const where = {};
      if (query.userId) {
        where.adminUserId = query.userId;
      }
      if (query.eventType) {
        where.action = query.eventType;
      }
      if (query.resource) {
        where.resource = query.resource;
      }
      if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
          where.createdAt.gte = query.startDate;
        }
        if (query.endDate) {
          where.createdAt.lte = query.endDate;
        }
      }
      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.limit || 100,
        skip: query.offset || 0,
      });
      return logs.map((log) => ({
        eventType: log.action,
        severity: this.mapSeverity(log.action),
        userId: log.adminUserId || undefined,
        resource: log.resource || undefined,
        resourceId: log.resourceId || undefined,
        action: log.action,
        details: log.details,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        url: log.url || undefined,
        method: log.method || undefined,
        statusCode: log.statusCode || undefined,
        sessionId: log.sessionId || undefined,
        metadata: log.metadata,
      }));
    } catch (error) {
      console.error("Failed to query audit logs:", error);
      return [];
    }
  }
  /**
   * Get audit log statistics
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Record<string, number>>} - Audit log statistics
   */
  async getAuditStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const logs = await this.prisma.auditLog.groupBy({
        by: ["action"],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          action: true,
        },
      });
      const stats = {};
      logs.forEach((log) => {
        stats[log.action] = log._count.action;
      });
      return stats;
    } catch (error) {
      console.error("Failed to get audit stats:", error);
      return {};
    }
  }
  /**
   * Clean up old audit logs
   * @param {number} daysToKeep - Number of days to keep logs
   * @returns {Promise<number>} - Number of logs deleted
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      return result.count;
    } catch (error) {
      console.error("Failed to cleanup old audit logs:", error);
      return 0;
    }
  }
  /**
   * Export audit logs for compliance
   * @param {Date} startDate - Start date for export
   * @param {Date} endDate - End date for export
   * @returns {Promise<string>} - JSON string of audit logs
   */
  async exportAuditLogs(startDate, endDate) {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      return "[]";
    }
  }
  // Private helper methods
  enhanceEntryWithRequest(entry, request) {
    return {
      ...entry,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers["user-agent"] || undefined,
      url: request.url,
      method: request.method,
      statusCode: request.statusCode,
      sessionId: this.getSessionId(request),
    };
  }
  getClientIp(request) {
    return (
      request.headers["x-forwarded-for"]?.split(",")[0] ||
      request.headers["x-real-ip"] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      "unknown"
    );
  }
  getSessionId(request) {
    return request.session?.id || "unknown";
  }
  async cacheAuditEntry(entry) {
    const key = `audit:${Date.now()}:${Math.random()}`;
    await this.redis.set(key, entry, this.CACHE_TTL);
  }
  async flushAuditCache() {
    try {
      const keys = await this.redis.keys("audit:*");
      const entries = [];
      for (const key of keys) {
        const entry = await this.redis.get(key);
        if (entry) {
          entries.push(entry);
          await this.redis.del(key);
        }
      }
      if (entries.length > 0) {
        await this.batchInsertAuditLogs(entries);
      }
    } catch (error) {
      console.error("Failed to flush audit cache:", error);
    }
  }
  async batchInsertAuditLogs(entries) {
    try {
      const auditLogs = entries.map((entry) => ({
        adminUserId: entry.userId || null,
        action: entry.eventType,
        resource: entry.resource || null,
        resourceId: entry.resourceId || null,
        details: entry.details || {},
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        url: entry.url || null,
        method: entry.method || null,
        statusCode: entry.statusCode || null,
        sessionId: entry.sessionId || null,
        metadata: entry.metadata || {},
      }));
      // Fix: Ensure all fields match the AuditLog model and Prisma input types
      const sanitizedAuditLogs = auditLogs.map((log) => ({
        adminUserId: log.adminUserId ?? undefined,
        action: log.action,
        resource: log.resource ?? "unknown",
        resourceId: log.resourceId ?? undefined,
        details: log.details ?? undefined,
        ipAddress: log.ipAddress ?? undefined,
        userAgent: log.userAgent ?? undefined,
        url: log.url ?? undefined,
        method: log.method ?? undefined,
        statusCode: log.statusCode ?? undefined,
        sessionId: log.sessionId ?? undefined,
        metadata: log.metadata ?? undefined,
      }));
      // Convert details and metadata to JSON-compatible values for Prisma
      const prismaAuditLogs = sanitizedAuditLogs.map((log) => ({
        ...log,
        details: log.details
          ? JSON.parse(JSON.stringify(log.details))
          : undefined,
        metadata: log.metadata
          ? JSON.parse(JSON.stringify(log.metadata))
          : undefined,
      }));
      await this.prisma.auditLog.createMany({ data: prismaAuditLogs });
    } catch (error) {
      console.error("Failed to batch insert audit logs:", error);
    }
  }
  startPeriodicFlush() {
    setInterval(() => {
      this.flushAuditCache();
    }, this.FLUSH_INTERVAL);
  }
  mapSeverity(action) {
    const criticalActions = [
      AuditEventType.SQL_INJECTION_ATTEMPT,
      AuditEventType.XSS_ATTEMPT,
      AuditEventType.BRUTE_FORCE_ATTEMPT,
    ];
    const highActions = [
      AuditEventType.ACCESS_DENIED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.CSRF_VIOLATION,
    ];
    if (criticalActions.includes(action)) {
      return AuditSeverity.CRITICAL;
    }
    if (highActions.includes(action)) {
      return AuditSeverity.HIGH;
    }
    if (action.includes("FAILED") || action.includes("DENIED")) {
      return AuditSeverity.MEDIUM;
    }
    return AuditSeverity.LOW;
  }
}
