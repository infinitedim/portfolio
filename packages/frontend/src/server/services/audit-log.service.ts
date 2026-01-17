import { prisma } from "../db";
import { redisService } from "../redis";
import { securityLogger } from "../utils";

// ============================================================================
// TYPES
// ============================================================================

export enum AuditEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  TOKEN_REFRESH = "TOKEN_REFRESH",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  SECURITY_VIOLATION = "SECURITY_VIOLATION",
  RATE_LIMIT_HIT = "RATE_LIMIT_HIT",
  API_ACCESS = "API_ACCESS",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
}

export interface AuditEvent {
  action: string;
  resource: string;
  resourceId?: string;
  adminUserId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  sessionId?: string;
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log an audit event
 */
export async function logEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        adminUserId: event.adminUserId,
        details: event.details ? JSON.parse(JSON.stringify(event.details)) : null,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        url: event.url,
        method: event.method,
        statusCode: event.statusCode,
        sessionId: event.sessionId,
        metadata: {},
      },
    });
  } catch (error) {
    securityLogger.error("Failed to log audit event", { event, error });

    // Fallback to Redis for later processing
    try {
      const key = `audit:pending:${Date.now()}`;
      await redisService.set(key, event, 86400); // 24h TTL
    } catch {
      securityLogger.error("Failed to queue audit event to Redis");
    }
  }
}

/**
 * Log successful login
 */
export async function logLogin(
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGIN_SUCCESS,
    resource: "auth",
    adminUserId: userId,
    ipAddress,
    userAgent,
    details: { timestamp: new Date().toISOString() },
  });
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(
  email: string,
  ipAddress: string,
  reason: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGIN_FAILED,
    resource: "auth",
    ipAddress,
    details: {
      email,
      reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Log logout
 */
export async function logLogout(
  userId: string,
  ipAddress: string,
  userAgent?: string,
): Promise<void> {
  await logEvent({
    action: AuditEventType.LOGOUT,
    resource: "auth",
    adminUserId: userId,
    ipAddress,
    userAgent,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  type: string,
  details: Record<string, unknown>,
  ipAddress?: string,
): Promise<void> {
  securityLogger.warn("Security event", { type, details, ipAddress });

  await logEvent({
    action: AuditEventType.SECURITY_VIOLATION,
    resource: "security",
    ipAddress,
    details: { type, ...details },
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(options: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    details: unknown;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const where: Record<string, unknown> = {};

  if (options.userId) where.adminUserId = options.userId;
  if (options.action) where.action = options.action;
  if (options.resource) where.resource = options.resource;
  if (options.startDate || options.endDate) {
    where.createdAt = {
      ...(options.startDate && { gte: options.startDate }),
      ...(options.endDate && { lte: options.endDate }),
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const auditLogService = {
  logEvent,
  logLogin,
  logLoginFailure,
  logLogout,
  logSecurityEvent,
  getAuditLogs,
};

export type AuditLogService = typeof auditLogService;

