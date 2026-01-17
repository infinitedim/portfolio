import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock Prisma Client before importing
class MockPrismaClient {
  $queryRaw = vi.fn();
  $disconnect = vi.fn();
}

vi.mock("../../../node_modules/.prisma/client", () => ({
  PrismaClient: MockPrismaClient,
}));

// Mock pg Pool
class MockPool {
  on = vi.fn();
  end = vi.fn().mockResolvedValue(undefined);
}

vi.mock("pg", () => ({
  Pool: MockPool,
}));

// Mock PrismaPg adapter
class MockPrismaPg {
  constructor(pool: unknown) {
    // Mock constructor
  }
}

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: MockPrismaPg,
}));

describe("Database Layer - Prisma", () => {
  const originalEnv = process.env;
  let prismaModule: typeof import("../prisma");

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NODE_ENV: "test",
    };
    // Re-import module with new env
    vi.resetModules();
    prismaModule = await import("../prisma");
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("prisma client", () => {
    it("should export prisma client", () => {
      // Note: In actual implementation, prisma client is initialized
      // This test verifies the module exports are available
      expect(prismaModule).toHaveProperty("prisma");
      expect(prismaModule).toHaveProperty("testDatabaseConnection");
      expect(prismaModule).toHaveProperty("getDatabaseInfo");
      expect(prismaModule).toHaveProperty("disconnectDatabase");
    });
  });

  describe("testDatabaseConnection", () => {
    it("should return connection status with latency", async () => {
      // Mock the queryRaw method
      const mockQueryRaw = vi.fn().mockResolvedValue([{ "?column?": 1 }]);
      if (prismaModule.prisma && typeof prismaModule.prisma.$queryRaw === "function") {
        (prismaModule.prisma.$queryRaw as ReturnType<typeof vi.fn>).mockImplementation(mockQueryRaw);
      }

      const result = await prismaModule.testDatabaseConnection();

      expect(result).toHaveProperty("connected");
      expect(result).toHaveProperty("latency");
      expect(typeof result.latency).toBe("number");
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it("should handle connection errors", async () => {
      const mockQueryRaw = vi.fn().mockRejectedValue(new Error("Connection failed"));
      if (prismaModule.prisma && typeof prismaModule.prisma.$queryRaw === "function") {
        (prismaModule.prisma.$queryRaw as ReturnType<typeof vi.fn>).mockImplementation(mockQueryRaw);
      }

      const result = await prismaModule.testDatabaseConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toBe("Connection failed");
    });
  });

  describe("getDatabaseInfo", () => {
    it("should return database information structure", async () => {
      const mockData = [
        {
          version: "PostgreSQL 15.0",
          database: "test_db",
          user: "test_user",
        },
      ];
      const mockQueryRaw = vi.fn().mockResolvedValue(mockData);
      if (prismaModule.prisma && typeof prismaModule.prisma.$queryRaw === "function") {
        (prismaModule.prisma.$queryRaw as ReturnType<typeof vi.fn>).mockImplementation(mockQueryRaw);
      }

      const result = await prismaModule.getDatabaseInfo();

      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("database");
      expect(result).toHaveProperty("user");
      expect(typeof result.version).toBe("string");
      expect(typeof result.database).toBe("string");
      expect(typeof result.user).toBe("string");
    });
  });

  describe("disconnectDatabase", () => {
    it("should have disconnect function", async () => {
      // Test that the function exists and can be called
      // Note: Actual disconnection requires real Prisma client
      expect(typeof prismaModule.disconnectDatabase).toBe("function");
      
      // Try to call it (will use mocked disconnect)
      await expect(prismaModule.disconnectDatabase()).resolves.not.toThrow();
    });
  });
});

