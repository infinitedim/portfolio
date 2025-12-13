import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RedisService } from "../redis.service";

const ENV_URL = "https://test.upstash.io";
const ENV_TOKEN = "test-token";

// The Redis module is mocked in the test setup file
// These tests verify the RedisService wrapper functionality

describe("RedisService", () => {
  let redisService: RedisService;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset envs and mocks
    process.env.UPSTASH_REDIS_REST_URL = ENV_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = ENV_TOKEN;

    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create new service instance
    redisService = new RedisService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("should throw if env vars are missing", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const service = new RedisService();
    expect(() => service.instance).toThrow(
      "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    );
  });

  it("should initialize Redis client with env vars", () => {
    // First access triggers initialization - the mock returns the mocked instance
    const instance = redisService.instance;
    expect(instance).toBeDefined();
  });

  it("should have get method", () => {
    // Test that the service has the expected methods
    expect(typeof redisService.get).toBe("function");
  });

  it("should have set method", () => {
    // Test that the service has the expected methods
    expect(typeof redisService.set).toBe("function");
  });

  it("should have instance getter", () => {
    // Test that the service has the instance getter
    const instance = redisService.instance;
    expect(instance).toBeDefined();
  });

  it("should only initialize Redis client once", () => {
    const first = redisService.instance;
    const second = redisService.instance;
    expect(first).toBe(second);
  });

  it("should handle missing URL env var", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = ENV_TOKEN;
    const service = new RedisService();
    expect(() => service.instance).toThrow(
      "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    );
  });

  it("should handle missing token env var", () => {
    process.env.UPSTASH_REDIS_REST_URL = ENV_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const service = new RedisService();
    expect(() => service.instance).toThrow(
      "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    );
  });

  it("should have proper method signatures", () => {
    // Test get method signature
    expect(redisService.get).toBeInstanceOf(Function);

    // Test set method signature
    expect(redisService.set).toBeInstanceOf(Function);

    // Test instance getter returns an object
    const instance = redisService.instance;
    expect(instance).toBeDefined();
  });

  it("should call get method on instance", async () => {
    const result = await redisService.get("test-key");
    // Mock returns null by default
    expect(result).toBeNull();
  });

  it("should call set method on instance", async () => {
    // Should not throw
    await expect(
      redisService.set("test-key", { value: "test" }),
    ).resolves.not.toThrow();
  });

  it("should call set method with TTL", async () => {
    // Should not throw
    await expect(
      redisService.set("test-key", { value: "test" }, 3600),
    ).resolves.not.toThrow();
  });

  it("should call del method on instance", async () => {
    // Should not throw
    await expect(redisService.del("test-key")).resolves.not.toThrow();
  });

  it("should call exists method on instance", async () => {
    const result = await redisService.exists("test-key");
    // Mock returns 1 which should be truthy
    expect(typeof result).toBe("boolean");
  });
});
