import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../prisma.service";
import { Logger } from "@nestjs/common";

// Mock ServerlessConfig
vi.mock("../../config/serverless.config", () => ({
  ServerlessConfig: {
    getConfig: () => ({
      databaseUrl: "postgresql://test:test@localhost:5432/test",
      logLevel: "debug",
      isServerless: false,
      isVercel: false,
      connectionPool: {
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 10000,
        },
      },
    }),
  },
}));

// Mock PrismaClient
const mockPrismaClient = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $queryRaw: vi.fn(),
  $on: vi.fn(),
  $: vi.fn(),
};

vi.mock("@prisma/client", () => ({
  PrismaClient: class MockPrismaClient {
    constructor() {
      Object.assign(this, mockPrismaClient);
    }
  },
}));

describe("PrismaService Connection Cleanup", () => {
  let service: PrismaService;
  let module: TestingModule;

  beforeEach(async () => {
    vi.clearAllMocks();

    module = await Test.createTestingModule({
      providers: [PrismaService, Logger],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    if (service) {
      await service.emergencyCleanup();
    }
    await module?.close();
  });

  describe("Connection Management", () => {
    it("should track connection state correctly", async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(true);
      expect(status.isConnecting).toBe(false);
      expect(status.lastConnectionTime).toBeInstanceOf(Date);
      expect(status.connectionAttempts).toBe(0);
    });

    it("should reset connection attempts after successful connection", async () => {
      mockPrismaClient.$connect
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockRejectedValueOnce(new Error("Connection failed"))
        .mockResolvedValueOnce(undefined);

      await service.onModuleInit();

      const status = service.getConnectionStatus();
      expect(status.connectionAttempts).toBe(0); // Should be reset after success
    });

    it("should handle connection failures gracefully", async () => {
      mockPrismaClient.$connect.mockRejectedValue(
        new Error("Connection failed"),
      );

      await expect(service.onModuleInit()).rejects.toThrow();

      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(false);
      expect(status.connectionAttempts).toBe(0); // Reset after max attempts
    });
  });

  describe("Health Checks", () => {
    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it("should return healthy status when database is accessible", async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ "1": 1 }]);

      const health = await service.healthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.status).toBe("healthy");
      expect(health.latency).toBeGreaterThan(0);
      expect(health.lastConnection).toBeInstanceOf(Date);
    });

    it("should return unhealthy status when database is not accessible", async () => {
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error("Database error"));

      const health = await service.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.status).toBe("unhealthy");
      expect(health.error).toBe("Database error");
    });
  });

  describe("Retry Logic", () => {
    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it("should retry operations on retryable errors", async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("connection timeout"))
        .mockResolvedValueOnce("success");

      const result = await service.executeWithRetry(operation, 2);

      expect(operation).toHaveBeenCalledTimes(2);
      expect(result).toBe("success");
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("syntax error"));

      await expect(service.executeWithRetry(operation, 2)).rejects.toThrow(
        "syntax error",
      );

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should attempt reconnection on connection errors", async () => {
      const connectSpy = vi.spyOn(service as any, "connectWithRetry");
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error("connection lost"))
        .mockResolvedValueOnce("success");

      mockPrismaClient.$connect.mockResolvedValue(undefined);

      const result = await service.executeWithRetry(operation, 2);

      expect(connectSpy).toHaveBeenCalled();
      expect(result).toBe("success");
    });
  });

  describe("Cleanup Operations", () => {
    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it("should perform graceful disconnect", async () => {
      await service.onModuleDestroy();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();

      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(false);
    });

    it("should handle disconnect timeout", async () => {
      mockPrismaClient.$disconnect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15000)),
      );

      const disconnectPromise = service.onModuleDestroy();

      // Should resolve due to timeout, not hang
      await expect(disconnectPromise).resolves.toBeUndefined();
    });

    it("should perform emergency cleanup", async () => {
      await service.emergencyCleanup();

      const status = service.getConnectionStatus();
      expect(status.isConnected).toBe(false);
      expect(status.isConnecting).toBe(false);
      expect(status.connectionAttempts).toBe(0);
    });
  });

  describe("Error Classification", () => {
    beforeEach(async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it("should correctly identify retryable errors", () => {
      const retryableErrors = [
        new Error("connection timeout"),
        new Error("ECONNRESET"),
        new Error("connection lost"),
        new Error("server closed the connection unexpectedly"),
      ];

      retryableErrors.forEach((error) => {
        expect(service["isRetryableError"](error)).toBe(true);
      });
    });

    it("should correctly identify non-retryable errors", () => {
      const nonRetryableErrors = [
        new Error("syntax error"),
        new Error("permission denied"),
        new Error("table does not exist"),
      ];

      nonRetryableErrors.forEach((error) => {
        expect(service["isRetryableError"](error)).toBe(false);
      });
    });

    it("should correctly identify connection errors", () => {
      const connectionErrors = [
        new Error("connection terminated unexpectedly"),
        new Error("ECONNREFUSED"),
        new Error("connection dropped"),
      ];

      connectionErrors.forEach((error) => {
        expect(service["isConnectionError"](error)).toBe(true);
      });
    });
  });

  describe("Concurrent Connection Attempts", () => {
    it("should handle concurrent connection attempts correctly", async () => {
      mockPrismaClient.$connect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      // Start multiple connection attempts simultaneously
      const promises = [
        service["connectWithRetry"](),
        service["connectWithRetry"](),
        service["connectWithRetry"](),
      ];

      await Promise.all(promises);

      // Should only connect once, not three times
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });
  });
});
