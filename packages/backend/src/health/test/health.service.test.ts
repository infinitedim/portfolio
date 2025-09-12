/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { HealthService } from "../health.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";

// Mock the services
const mockPrismaService = {
  $queryRaw: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

const mockRedisService = {
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  info: vi.fn(),
  memory: vi.fn(),
  ping: vi.fn(),
};

describe("HealthService", () => {
  let service: HealthService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkHealth", () => {
    it("should return healthy status when all checks pass", async () => {
      // Mock successful database check
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ])
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ]);

      // Mock successful Redis check
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue({
        redis_version: "7.0.0",
        connected_clients: 1,
        used_memory_human: "1.2M",
        uptime_in_seconds: 3600,
      });
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "1.2M",
      });

      const result = await service.checkHealth();

      expect(result.status).toBe("healthy");
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.healthy).toBe(5); // All 5 checks should be healthy
      expect(result.summary.unhealthy).toBe(0);
      expect(result.summary.degraded).toBe(0);
    });

    it("should return unhealthy status when database check fails", async () => {
      // Mock failed database check
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Mock successful Redis check
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue({
        redis_version: "7.0.0",
        connected_clients: 1,
        used_memory_human: "1.2M",
        uptime_in_seconds: 3600,
      });
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "1.2M",
      });

      const result = await service.checkHealth();

      expect(result.status).toBe("unhealthy");
      expect(result.checks.database.status).toBe("unhealthy");
      expect(result.checks.database.error).toBe("Database connection failed");
      expect(result.summary.unhealthy).toBe(1);
    });

    it("should return degraded status when memory usage is high", async () => {
      // Mock successful database check
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ])
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ]);

      // Mock successful Redis check
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue({
        redis_version: "7.0.0",
        connected_clients: 1,
        used_memory_human: "1.2M",
        uptime_in_seconds: 3600,
      });
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "1.2M",
      });

      // Mock high memory usage (80% of heap)
      const originalMemoryUsage = process.memoryUsage;
      vi.spyOn(process, "memoryUsage").mockReturnValue({
        heapUsed: 800 * 1024 * 1024, // 800MB
        heapTotal: 1000 * 1024 * 1024, // 1000MB
        external: 50 * 1024 * 1024, // 50MB
        rss: 1200 * 1024 * 1024, // 1200MB
        arrayBuffers: 10 * 1024 * 1024, // 10MB
      });

      const result = await service.checkHealth();

      expect(result.status).toBe("degraded");
      expect(result.checks.memory.status).toBe("degraded");
      expect(result.summary.degraded).toBe(1);

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe("ping", () => {
    it("should return pong message with timestamp", async () => {
      const result = await service.ping();

      expect(result.message).toBe("pong");
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe("getDetailedHealth", () => {
    it("should return the same result as checkHealth", async () => {
      // Mock successful checks
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ])
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ]);

      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue({
        redis_version: "7.0.0",
        connected_clients: 1,
        used_memory_human: "1.2M",
        uptime_in_seconds: 3600,
      });
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "1.2M",
      });

      const detailedResult = await service.getDetailedHealth();
      const checkResult = await service.checkHealth();

      expect(detailedResult).toEqual(checkResult);
    });
  });

  describe("health check details", () => {
    it("should include database connection details", async () => {
      const mockDbResult = [
        {
          version: "PostgreSQL 15.0",
          database: "test_db",
          user: "test_user",
        },
      ];

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockDbResult)
        .mockResolvedValueOnce(mockDbResult);

      // Mock other successful checks
      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue({
        redis_version: "7.0.0",
        connected_clients: 1,
        used_memory_human: "1.2M",
        uptime_in_seconds: 3600,
      });
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "1.2M",
      });

      const result = await service.checkHealth();

      expect(result.checks.database.details).toEqual({
        version: "PostgreSQL 15.0",
        database: "test_db",
        user: "test_user",
        connectionPool: "active",
      });
    });

    it("should include Redis connection details", async () => {
      // Mock successful database check
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ])
        .mockResolvedValueOnce([
          { version: "PostgreSQL 15.0", database: "test", user: "test_user" },
        ]);

      const mockRedisInfo = {
        redis_version: "7.0.0",
        connected_clients: 5,
        used_memory_human: "2.5M",
        uptime_in_seconds: 7200,
      };

      mockRedisService.set.mockResolvedValue(undefined);
      mockRedisService.get.mockResolvedValue("health_check");
      mockRedisService.del.mockResolvedValue(undefined);
      mockRedisService.info.mockResolvedValue(mockRedisInfo);
      mockRedisService.memory.mockResolvedValue({
        command: "USAGE",
        memory_usage: "2.5M",
      });

      const result = await service.checkHealth();

      expect(result.checks.redis.details).toEqual({
        version: "7.0.0",
        memory: { command: "USAGE", memory_usage: "2.5M" },
        connectedClients: 5,
        usedMemory: "2.5M",
        uptime: 7200,
      });
    });
  });
});
