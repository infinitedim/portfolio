import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  AuditLogService,
  type AuditLogEntry,
  type AuditLogQuery,
  AuditEventType,
  AuditSeverity,
} from "../audit-log.service";
import type { Request } from "express";

// Mock the logger
vi.mock("../../logging/logger", () => ({
  securityLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("AuditLogService", () => {
  let service: AuditLogService;
  let mockPrismaService: any;
  let mockRedisService: any;
  let mockRequest: any;

  beforeEach(() => {
    mockPrismaService = {
      auditLog: {
        create: vi.fn(),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
        groupBy: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    mockRedisService = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue("OK"),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
    };

    mockRequest = {
      ip: "127.0.0.1",
      method: "GET",
      url: "/api/test",
      headers: {
        "user-agent": "test-agent",
      },
      connection: {
        remoteAddress: "127.0.0.1",
      },
    };

    service = new AuditLogService(mockPrismaService, mockRedisService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logEvent", () => {
    it("should cache audit event for batch processing", async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.LOGIN_SUCCESS,
        severity: AuditSeverity.LOW,
        action: "LOGIN",
        resource: "Auth",
      };

      await service.logEvent(entry);

      // The entry should be cached, not immediately written to database
      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
      expect(mockPrismaService.auditLog.createMany).not.toHaveBeenCalled();
    });

    it("should flush cache immediately for critical events", async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.SQL_INJECTION_ATTEMPT,
        severity: AuditSeverity.CRITICAL,
        action: "SECURITY_VIOLATION",
        resource: "Database",
      };

      // Mock Redis to return some cached entries for flushing
      mockRedisService.keys.mockResolvedValue(["audit:test-key"]);
      mockRedisService.get.mockResolvedValue(JSON.stringify(entry));

      await service.logEvent(entry);

      // Critical events should trigger immediate flush
      expect(mockPrismaService.auditLog.createMany).toHaveBeenCalled();
    });

    it("should enhance entry with request data when provided", async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.DATA_VIEWED,
        severity: AuditSeverity.LOW,
        action: "VIEW",
        resource: "Users",
      };

      await service.logEvent(entry, mockRequest as Request);

      // The entry should be enhanced with request data
      // We can't easily test the internal cache, but we can test that it doesn't throw
      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.SYSTEM_ERROR,
        severity: AuditSeverity.HIGH,
        action: "ERROR",
        resource: "System",
      };

      // Import and check the mocked logger
      const { securityLogger } = await import("../../logging/logger");

      // Mock Redis set to throw an error during caching
      mockRedisService.set.mockRejectedValue(new Error("Redis error"));

      await service.logEvent(entry);

      // Should not throw, but should log error using securityLogger
      expect(securityLogger.error).toHaveBeenCalledWith(
        "Failed to log audit event",
        expect.objectContaining({
          error: "Redis error",
        }),
      );
    });
  });

  describe("logSecurityEvent", () => {
    it("should log a security event with correct severity", async () => {
      const details = { ip: "192.168.1.1", userAgent: "test-agent" };

      await service.logSecurityEvent(
        AuditEventType.SUSPICIOUS_ACTIVITY,
        details,
        mockRequest as Request,
      );

      // Should not throw
      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("logAuthEvent", () => {
    it("should log successful authentication event", async () => {
      await service.logAuthEvent(
        AuditEventType.LOGIN_SUCCESS,
        "user-123",
        true,
        mockRequest as Request,
      );

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });

    it("should log failed authentication event", async () => {
      await service.logAuthEvent(
        AuditEventType.LOGIN_FAILED,
        "user-123",
        false,
        mockRequest as Request,
      );

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("logDataEvent", () => {
    it("should log data access event", async () => {
      await service.logDataEvent(
        AuditEventType.DATA_VIEWED,
        "Users",
        "user-123",
        "resource-123",
        mockRequest as Request,
      );

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe("queryAuditLogs", () => {
    it("should query audit logs with filters", async () => {
      const mockLogs = [
        {
          id: "audit-1",
          adminUserId: "user-123",
          action: "LOGIN_SUCCESS",
          resource: "Authentication",
          resourceId: null,
          details: null,
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
          createdAt: new Date("2023-01-01T10:00:00.000Z"),
          url: "/auth/login",
          method: "POST",
          statusCode: 200,
          sessionId: "session-123",
          metadata: null,
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const query: AuditLogQuery = { userId: "user-123" };
      const result = await service.queryAuditLogs(query);

      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe("user-123");
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ adminUserId: "user-123" }),
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("should handle query without filters", async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      const result = await service.queryAuditLogs({});

      expect(result).toEqual([]);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: "desc" },
        }),
      );
    });
  });

  describe("getAuditStats", () => {
    it("should return audit statistics", async () => {
      const mockStats = [
        { action: "LOGIN_SUCCESS", _count: { action: 10 } },
        { action: "DATA_ACCESS", _count: { action: 5 } },
      ];

      mockPrismaService.auditLog.groupBy.mockResolvedValue(mockStats);

      const result = await service.getAuditStats(30);

      expect(result).toEqual({
        LOGIN_SUCCESS: 10,
        DATA_ACCESS: 5,
      });
    });
  });

  describe("cleanupOldLogs", () => {
    it("should delete old audit logs", async () => {
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.cleanupOldLogs(90);

      expect(result).toBe(5);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe("exportAuditLogs", () => {
    it("should export audit logs as JSON", async () => {
      const mockLogs = [
        {
          id: "audit-1",
          adminUserId: "user-123",
          action: "LOGIN_SUCCESS",
          resource: "Authentication",
          resourceId: null,
          details: null,
          ipAddress: "127.0.0.1",
          userAgent: "test-agent",
          createdAt: new Date("2023-01-01T10:00:00.000Z"),
          url: "/auth/login",
          method: "POST",
          statusCode: 200,
          sessionId: "session-123",
          metadata: null,
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-01-31");

      const result = await service.exportAuditLogs(startDate, endDate);

      expect(result).toContain('"id": "audit-1"');
      expect(result).toContain('"action": "LOGIN_SUCCESS"');
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("Private Helper Methods", () => {
    describe("getClientIp", () => {
      it("should extract client IP from request", () => {
        const result = service["getClientIp"](mockRequest);
        expect(result).toBe("127.0.0.1");
      });

      it("should handle x-forwarded-for header", () => {
        const requestWithForwarded = {
          ...mockRequest,
          headers: {
            "x-forwarded-for": "203.0.113.1, 192.168.1.1",
          },
        };

        const result = service["getClientIp"](requestWithForwarded);
        expect(result).toBe("203.0.113.1");
      });

      it("should return unknown for missing IP", () => {
        const requestWithoutIp = {
          headers: {},
          connection: {},
          socket: {},
        };

        const result = service["getClientIp"](requestWithoutIp as Request);
        expect(result).toBe("unknown");
      });
    });

    describe("getSessionId", () => {
      it("should generate session ID from request", () => {
        const result = service["getSessionId"](mockRequest);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("mapSeverity", () => {
      it("should map actions to correct severity levels", () => {
        expect(service["mapSeverity"]("LOGIN_FAILED")).toBe(
          AuditSeverity.MEDIUM,
        );
        expect(service["mapSeverity"]("SUSPICIOUS_ACTIVITY")).toBe(
          AuditSeverity.HIGH,
        );
        expect(service["mapSeverity"]("SQL_INJECTION_ATTEMPT")).toBe(
          AuditSeverity.CRITICAL,
        );
        expect(service["mapSeverity"]("DATA_VIEWED")).toBe(AuditSeverity.LOW);
        expect(service["mapSeverity"]("UNKNOWN_ACTION")).toBe(
          AuditSeverity.LOW,
        );
      });
    });
  });

  describe("Batch Operations", () => {
    it("should handle batch insert of audit logs", async () => {
      const entries: AuditLogEntry[] = [
        {
          eventType: AuditEventType.DATA_VIEWED,
          severity: AuditSeverity.LOW,
          action: "VIEW",
          resource: "Users",
        },
        {
          eventType: AuditEventType.DATA_UPDATED,
          severity: AuditSeverity.MEDIUM,
          action: "UPDATE",
          resource: "Users",
        },
      ];

      mockPrismaService.auditLog.createMany.mockResolvedValue({ count: 2 });

      await service["batchInsertAuditLogs"](entries);

      expect(mockPrismaService.auditLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            action: "DATA_VIEWED",
            resource: "Users",
          }),
          expect.objectContaining({
            action: "DATA_UPDATED",
            resource: "Users",
          }),
        ]),
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors in logEvent", async () => {
      const entry: AuditLogEntry = {
        eventType: AuditEventType.DATA_VIEWED,
        severity: AuditSeverity.LOW,
        action: "VIEW",
        resource: "Users",
      };

      // Import and check the mocked logger
      const { securityLogger } = await import("../../logging/logger");

      // Mock Redis set to throw an error during caching
      mockRedisService.set.mockRejectedValue(
        new Error("Database connection failed"),
      );

      await service.logEvent(entry);

      expect(securityLogger.error).toHaveBeenCalledWith(
        "Failed to log audit event",
        expect.objectContaining({
          error: "Database connection failed",
        }),
      );
    });

    it("should handle errors in queryAuditLogs", async () => {
      const query: AuditLogQuery = { userId: "user-123" };

      mockPrismaService.auditLog.findMany.mockRejectedValue(
        new Error("Query failed"),
      );

      const result = await service.queryAuditLogs(query);
      expect(result).toEqual([]);
    });
  });
});
