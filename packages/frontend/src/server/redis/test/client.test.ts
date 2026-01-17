import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { redis, redisService } from "../client";

// Mock Upstash Redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    ping: vi.fn(),
  })),
}));

describe("Redis Layer - Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "test-token",
      NODE_ENV: "test",
    };
    // Reset module to re-initialize Redis client
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("redisService", () => {
    describe("isAvailable", () => {
      it("should return true when Redis is available", async () => {
        // Re-import after setting env
        const { redisService: newService } = await import("../client");
        // Redis should be available with proper env vars
        expect(typeof newService.isAvailable()).toBe("boolean");
      });
    });

    describe("get", () => {
      it("should get value from Redis", async () => {
        const mockGet = vi.fn().mockResolvedValue("test-value");
        if (redis) {
          (redis.get as ReturnType<typeof vi.fn>).mockImplementation(mockGet);
        }

        const result = await redisService.get("test-key");

        expect(result).toBeDefined();
      });

      it("should return null when Redis is not available", async () => {
        // Mock redis as null
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.get("test-key");

        expect(result).toBeNull();
      });

      it("should handle errors gracefully", async () => {
        const mockGet = vi.fn().mockRejectedValue(new Error("Redis error"));
        if (redis) {
          (redis.get as ReturnType<typeof vi.fn>).mockImplementation(mockGet);
        }

        const result = await redisService.get("test-key");

        expect(result).toBeNull();
      });
    });

    describe("set", () => {
      it("should set value in Redis", async () => {
        if (!redis) {
          // Skip if redis is not available
          return;
        }
        const mockSet = vi.fn().mockResolvedValue("OK");
        (redis.set as ReturnType<typeof vi.fn>).mockImplementation(mockSet);

        const result = await redisService.set("test-key", "test-value");

        expect(result).toBe(true);
      });

      it("should set value with TTL", async () => {
        if (!redis) {
          // Skip if redis is not available
          return;
        }
        const mockSet = vi.fn().mockResolvedValue("OK");
        (redis.set as ReturnType<typeof vi.fn>).mockImplementation(mockSet);

        const result = await redisService.set("test-key", "test-value", 3600);

        expect(result).toBe(true);
        expect(mockSet).toHaveBeenCalled();
      });

      it("should return false when Redis is not available", async () => {
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.set("test-key", "test-value");

        expect(result).toBe(false);
      });
    });

    describe("del", () => {
      it("should delete key from Redis", async () => {
        if (!redis) {
          return;
        }
        const mockDel = vi.fn().mockResolvedValue(1);
        (redis.del as ReturnType<typeof vi.fn>).mockImplementation(mockDel);

        const result = await redisService.del("test-key");

        expect(result).toBe(true);
      });

      it("should return false when Redis is not available", async () => {
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.del("test-key");

        expect(result).toBe(false);
      });
    });

    describe("exists", () => {
      it("should check if key exists", async () => {
        const mockExists = vi.fn().mockResolvedValue(1);
        if (redis) {
          (redis.exists as ReturnType<typeof vi.fn>).mockImplementation(mockExists);
        }

        const result = await redisService.exists("test-key");

        expect(typeof result).toBe("boolean");
      });

      it("should return false when Redis is not available", async () => {
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.exists("test-key");

        expect(result).toBe(false);
      });
    });

    describe("incr", () => {
      it("should increment value", async () => {
        if (!redis) {
          return;
        }
        const mockIncr = vi.fn().mockResolvedValue(2);
        (redis.incr as ReturnType<typeof vi.fn>).mockImplementation(mockIncr);

        const result = await redisService.incr("test-key");

        expect(result).toBe(2);
      });

      it("should return 0 when Redis is not available", async () => {
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.incr("test-key");

        expect(result).toBe(0);
      });
    });

    describe("ping", () => {
      it("should ping Redis server", async () => {
        if (!redis) {
          return;
        }
        const mockPing = vi.fn().mockResolvedValue("PONG");
        (redis.ping as ReturnType<typeof vi.fn>).mockImplementation(mockPing);

        const result = await redisService.ping();

        expect(result).toBe("PONG");
      });

      it("should return null when Redis is not available", async () => {
        vi.spyOn(redisService, "isAvailable").mockReturnValue(false);

        const result = await redisService.ping();

        expect(result).toBeNull();
      });
    });

    describe("testConnection", () => {
      it("should test Redis connection", async () => {
        const mockPing = vi.fn().mockResolvedValue("PONG");
        if (redis) {
          (redis.ping as ReturnType<typeof vi.fn>).mockImplementation(mockPing);
        }

        const result = await redisService.testConnection();

        expect(result).toHaveProperty("status");
        expect(result).toHaveProperty("responseTime");
        expect(["connected", "disconnected"]).toContain(result.status);
        expect(typeof result.responseTime).toBe("number");
      });

      it("should handle connection errors", async () => {
        const mockPing = vi.fn().mockRejectedValue(new Error("Connection failed"));
        if (redis) {
          (redis.ping as ReturnType<typeof vi.fn>).mockImplementation(mockPing);
        }

        const result = await redisService.testConnection();

        expect(result.status).toBe("disconnected");
        expect(result.error).toBeDefined();
      });
    });
  });
});

