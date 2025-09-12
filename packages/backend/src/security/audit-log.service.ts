/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",

  // Authorization events
  ACCESS_DENIED = "ACCESS_DENIED",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",

  // Data events
  DATA_CREATED = "DATA_CREATED",
  DATA_UPDATED = "DATA_UPDATED",
  DATA_DELETED = "DATA_DELETED",
  DATA_VIEWED = "DATA_VIEWED",
  DATA_EXPORTED = "DATA_EXPORTED",

  // Security events
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  CSRF_VIOLATION = "CSRF_VIOLATION",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",

  // System events
  CONFIGURATION_CHANGE = "CONFIGURATION_CHANGE",
  SYSTEM_ERROR = "SYSTEM_ERROR",
  ERROR_OCCURRED = "ERROR_OCCURRED",
  BACKUP_CREATED = "BACKUP_CREATED",
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
}

export enum AuditSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditLogService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 60000; // 1 minute

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    // Start periodic flush of cached audit logs
    this.startPeriodicFlush();
  }

  /**
   * Log an audit event
   * @param {AuditLogEntry} entry - The audit log entry
   * @param {Request} request - Optional request object for additional context
   */
  async logEvent(entry: AuditLogEntry, request?: Request): Promise<void> {
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
  async logSecurityEvent(
    eventType: AuditEventType,
    details: Record<string, unknown>,
    request?: Request,
  ): Promise<void> {
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
  async logAuthEvent(
    eventType: AuditEventType,
    userId: string,
    success: boolean,
    request?: Request,
  ): Promise<void> {
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
  async logDataEvent(
    eventType: AuditEventType,
    userId: string,
    resource: string,
    resourceId?: string,
    request?: Request,
  ): Promise<void> {
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
  async queryAuditLogs(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    try {
      const where: any = {};

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
        eventType: log.action as AuditEventType,
        severity: this.mapSeverity(log.action),
        userId: log.adminUserId || undefined,
        resource: log.resource || undefined,
        resourceId: log.resourceId || undefined,
        action: log.action,
        details: log.details as Record<string, unknown>,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        url: log.url || undefined,
        method: log.method || undefined,
        statusCode: log.statusCode || undefined,
        sessionId: log.sessionId || undefined,
        metadata: log.metadata as Record<string, unknown>,
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
  async getAuditStats(days: number = 30): Promise<Record<string, number>> {
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

      const stats: Record<string, number> = {};
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
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
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
  async exportAuditLogs(startDate: Date, endDate: Date): Promise<string> {
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

  private enhanceEntryWithRequest(
    entry: AuditLogEntry,
    request: Request,
  ): AuditLogEntry {
    return {
      ...entry,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers["user-agent"] || undefined,
      url: request.url,
      method: request.method,
      statusCode: (request as any).statusCode,
      sessionId: this.getSessionId(request),
    };
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (request.headers["x-real-ip"] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      "unknown"
    );
  }

  private getSessionId(request: Request): string {
    return (request as any).session?.id || "unknown";
  }

  private async cacheAuditEntry(entry: AuditLogEntry): Promise<void> {
    const key = `audit:${Date.now()}:${Math.random()}`;
    await this.redis.set(key, entry, this.CACHE_TTL);
  }

  private async flushAuditCache(): Promise<void> {
    try {
      const keys = await this.redis.keys("audit:*");
      const entries: AuditLogEntry[] = [];

      for (const key of keys) {
        const entry = await this.redis.get<AuditLogEntry>(key);
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

  private async batchInsertAuditLogs(entries: AuditLogEntry[]): Promise<void> {
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

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushAuditCache();
    }, this.FLUSH_INTERVAL);
  }

  private mapSeverity(action: string): AuditSeverity {
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

    if (criticalActions.includes(action as AuditEventType)) {
      return AuditSeverity.CRITICAL;
    }

    if (highActions.includes(action as AuditEventType)) {
      return AuditSeverity.HIGH;
    }

    if (action.includes("FAILED") || action.includes("DENIED")) {
      return AuditSeverity.MEDIUM;
    }

    return AuditSeverity.LOW;
  }
}
