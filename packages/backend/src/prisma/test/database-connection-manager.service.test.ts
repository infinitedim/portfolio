import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  DatabaseConnectionManager,
  type ConnectionPoolStats,
  type ConnectionHealthStatus,
} from "../database-connection-manager.service";
import { PrismaService } from "../prisma.service";

// Mock ServerlessConfig
vi.mock("../config/serverless.config", () => ({
  ServerlessConfig: {
    getConfig: vi.fn().mockReturnValue({
      connectionPool: {
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 300000,
        },
        healthCheck: {
          enabled: true,
          intervalMs: 30000,
          timeoutMs: 5000,
        },
      },
    }),
  },
}));

describe("DatabaseConnectionManager", () => {
  let manager: DatabaseConnectionManager;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockResolvedValue([{ result: 1 }]),
      onModuleInit: vi.fn(),
      onModuleDestroy: vi.fn(),
      healthCheck: vi.fn().mockResolvedValue({
        isHealthy: true,
        status: "healthy",
        latency: 10,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConnectionManager,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    manager = module.get<DatabaseConnectionManager>(DatabaseConnectionManager);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initialize", () => {
    it("should initialize connection pool successfully", async () => {
      await manager.initialize();

      // Should be initialized after first call
      expect(mockPrismaService.$connect).toHaveBeenCalled();
    });

    it("should not reinitialize if already initialized", async () => {
      await manager.initialize();
      vi.clearAllMocks();

      await manager.initialize();

      // Should not call $connect again
      expect(mockPrismaService.$connect).not.toHaveBeenCalled();
    });

    it("should handle initialization errors gracefully", async () => {
      mockPrismaService.$connect.mockRejectedValue(
        new Error("Connection failed"),
      );

      await expect(manager.initialize()).rejects.toThrow("Connection failed");
    });
  });

  describe("getConnection", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should acquire connection from pool", async () => {
      const connection = await manager.getConnection();

      expect(connection).toBeDefined();
      expect(mockPrismaService.$connect).toHaveBeenCalled();
    });

    it("should handle connection acquisition timeout", async () => {
      // Mock a scenario where connections are exhausted
      mockPrismaService.$connect.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000)),
      );

      await expect(manager.getConnection()).rejects.toThrow();
    });
  });

  describe("releaseConnection", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should release connection back to pool", async () => {
      const connection = await manager.getConnection();

      await expect(
        manager.releaseConnection(connection),
      ).resolves.not.toThrow();
    });

    it("should handle releasing invalid connection", async () => {
      const invalidConnection = {} as PrismaService;

      await expect(
        manager.releaseConnection(invalidConnection),
      ).resolves.not.toThrow();
    });
  });

  describe("getPoolStats", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should return current pool statistics", async () => {
      const stats: ConnectionPoolStats = await manager.getPoolStats();

      expect(stats).toHaveProperty("activeConnections");
      expect(stats).toHaveProperty("idleConnections");
      expect(stats).toHaveProperty("totalConnections");
      expect(stats).toHaveProperty("waitingClients");
      expect(stats).toHaveProperty("maxConnections");

      expect(typeof stats.activeConnections).toBe("number");
      expect(typeof stats.idleConnections).toBe("number");
      expect(typeof stats.totalConnections).toBe("number");
      expect(typeof stats.waitingClients).toBe("number");
      expect(typeof stats.maxConnections).toBe("number");
    });

    it("should return accurate pool metrics", async () => {
      const stats = await manager.getPoolStats();

      expect(stats.maxConnections).toBe(10); // From mocked config
      expect(stats.totalConnections).toBeGreaterThanOrEqual(0);
      expect(
        stats.activeConnections + stats.idleConnections,
      ).toBeLessThanOrEqual(stats.totalConnections);
    });
  });

  describe("checkDatabaseHealth", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should return healthy status when database is accessible", async () => {
      const healthStatus: ConnectionHealthStatus =
        await manager.checkDatabaseHealth();

      expect(healthStatus).toHaveProperty("isHealthy");
      expect(healthStatus).toHaveProperty("timestamp");
      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
      expect(typeof healthStatus.latency).toBe("number");
    });

    it("should return unhealthy status when database query fails", async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const healthStatus = await manager.checkDatabaseHealth();

      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.error).toBe("Database connection failed");
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
    });

    it("should measure response latency accurately", async () => {
      const start = Date.now();

      const healthStatus = await manager.checkDatabaseHealth();

      const expectedLatency = Date.now() - start;
      expect(healthStatus.latency).toBeLessThanOrEqual(expectedLatency + 10); // Allow 10ms tolerance
    });
  });

  describe("cleanup", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should cleanup all connections gracefully", async () => {
      await manager.cleanup();

      expect(mockPrismaService.$disconnect).toHaveBeenCalled();
    });

    it("should handle cleanup errors gracefully", async () => {
      mockPrismaService.$disconnect.mockRejectedValue(
        new Error("Disconnect failed"),
      );

      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });

  describe("private methods", () => {
    beforeEach(async () => {
      await manager.initialize();
    });

    it("should maintain pool size within configured limits", async () => {
      // Test by acquiring multiple connections
      const connections = await Promise.all([
        manager.getConnection(),
        manager.getConnection(),
        manager.getConnection(),
      ]);

      const stats = await manager.getPoolStats();
      expect(stats.totalConnections).toBeLessThanOrEqual(10); // max from config

      // Release connections
      await Promise.all(
        connections.map((conn) => manager.releaseConnection(conn)),
      );
    });

    it("should handle concurrent connection requests", async () => {
      const connectionPromises = Array(5)
        .fill(null)
        .map(() => manager.getConnection());

      const connections = await Promise.all(connectionPromises);

      expect(connections).toHaveLength(5);
      connections.forEach((conn) => expect(conn).toBeDefined());

      // Cleanup
      await Promise.all(
        connections.map((conn) => manager.releaseConnection(conn)),
      );
    });
  });

  describe("error handling", () => {
    it("should handle connection pool exhaustion", async () => {
      await manager.initialize();

      // Mock scenario where all connections are busy
      const longRunningConnections = Array(15)
        .fill(null)
        .map(async () => {
          const conn = await manager.getConnection();
          // Don't release immediately to simulate busy connections
          return conn;
        });

      // This should eventually timeout or queue properly
      await expect(Promise.all(longRunningConnections)).rejects.toThrow();
    });

    it("should recover from temporary database unavailability", async () => {
      await manager.initialize();

      // Simulate database going down
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error("Database unavailable"),
      );

      let healthStatus = await manager.checkDatabaseHealth();
      expect(healthStatus.isHealthy).toBe(false);

      // Simulate database recovery
      mockPrismaService.$queryRaw.mockResolvedValueOnce([{ result: 1 }]);

      healthStatus = await manager.checkDatabaseHealth();
      expect(healthStatus.isHealthy).toBe(true);
    });
  });
});
