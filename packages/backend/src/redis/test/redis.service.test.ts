import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RedisService } from "../redis.service";

const ENV_URL = "https://test.upstash.io";
const ENV_TOKEN = "test-token";

describe("RedisService", () => {
  let redisService: RedisService;

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
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
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
    // First access triggers initialization
    const instance = redisService.instance;
    expect(instance).toBeDefined();
    expect(typeof instance.get).toBe("function");
    expect(typeof instance.set).toBe("function");
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
    expect(typeof redisService.instance).toBe("object");
  });

  it("should only initialize Redis client once", () => {
    const first = redisService.instance;
    const second = redisService.instance;
    expect(first).toBe(second);
  });

  it("should handle different environment variable combinations", () => {
    // Test with missing URL
    delete process.env.UPSTASH_REDIS_REST_URL;
    const service1 = new RedisService();
    expect(() => service1.instance).toThrow(
      "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    );

    // Test with missing token
    process.env.UPSTASH_REDIS_REST_URL = ENV_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const service2 = new RedisService();
    expect(() => service2.instance).toThrow(
      "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
    );
  });

  it("should have proper method signatures", () => {
    // Test get method signature
    expect(redisService.get).toBeInstanceOf(Function);

    // Test set method signature
    expect(redisService.set).toBeInstanceOf(Function);

    // Test instance getter
    expect(redisService.instance).toBeDefined();
  });
});
