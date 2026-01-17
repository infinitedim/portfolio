import { Redis } from "@upstash/redis";

// Environment validation
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Track availability
let redisAvailable = true;

// Global singleton
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[Redis] Missing credentials, Redis features disabled");
    redisAvailable = false;
    return null;
  }

  try {
    return new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error("[Redis] Failed to create client:", error);
    redisAvailable = false;
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// Redis Service Layer (replicates NestJS RedisService)
export const redisService = {
  isAvailable(): boolean {
    return redisAvailable && redis !== null;
  },

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      return (await redis.get<T>(key)) ?? null;
    } catch (error) {
      console.error("[Redis] GET error:", error);
      return null;
    }
  },

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<boolean> {
    if (!redis) return false;
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error("[Redis] SET error:", error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("[Redis] DEL error:", error);
      return false;
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("[Redis] EXISTS error:", error);
      return false;
    }
  },

  async incr(key: string): Promise<number> {
    if (!redis) return 0;
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error("[Redis] INCR error:", error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.expire(key, seconds);
      return true;
    } catch (error) {
      console.error("[Redis] EXPIRE error:", error);
      return false;
    }
  },

  async ttl(key: string): Promise<number> {
    if (!redis) return -2;
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.error("[Redis] TTL error:", error);
      return -2;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error("[Redis] KEYS error:", error);
      return [];
    }
  },

  async ping(): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.ping();
    } catch (error) {
      console.error("[Redis] PING error:", error);
      return null;
    }
  },

  async testConnection(): Promise<{
    status: "connected" | "disconnected";
    responseTime: number;
    error?: string;
  }> {
    const start = Date.now();
    if (!redis) {
      return {
        status: "disconnected",
        responseTime: Date.now() - start,
        error: "Redis client not initialized",
      };
    }

    try {
      await redis.ping();
      return {
        status: "connected",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "disconnected",
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async info(): Promise<Record<string, unknown>> {
    if (!redis) {
      return { error: "Redis not available" };
    }

    const pingResult = await this.ping();
    return {
      redis_version: "Upstash Redis",
      connected_clients: 1,
      used_memory_human: "N/A",
      uptime_in_seconds: Math.floor(process.uptime()),
      ping: pingResult,
    };
  },
};

export type RedisService = typeof redisService;

