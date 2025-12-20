/* eslint-disable @typescript-eslint/no-explicit-any */
import {Injectable} from "@nestjs/common";
import {Redis} from "@upstash/redis";

@Injectable()
export class RedisService {
  private client?: Redis;

  get instance(): Redis {
    if (!this.client) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) {
        throw new Error(
          "Upstash Redis envs missing: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN",
        );
      }
      this.client = new Redis({url, token});
    }
    return this.client;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    return (await this.instance.get<T | null>(key)) ?? null;
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.instance.set(key, value, {ex: ttlSeconds});
    } else {
      await this.instance.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.instance.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.instance.exists(key);
    return result === 1;
  }

  async incr(key: string): Promise<number> {
    return await this.instance.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.instance.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.instance.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.instance.keys(pattern);
  }

  async flushdb(): Promise<void> {
    await this.instance.flushdb();
  }

  async ping(): Promise<string> {
    return await this.instance.ping();
  }

  /**
   * Get Redis server information
   * Note: Upstash Redis REST API has limited INFO command support
   * @returns {Promise<Record<string, unknown>>} - The Redis server information
   */
  async info(): Promise<Record<string, unknown>> {
    try {
      // For Upstash Redis REST API, we'll simulate basic info
      // In a real Redis setup, you'd use: await this.instance.info()
      const pingResult = await this.ping();

      return {
        redis_version: "Upstash Redis",
        connected_clients: 1,
        used_memory_human: "N/A",
        uptime_in_seconds: Math.floor(process.uptime()),
        total_commands_processed: 0,
        keyspace_hits: 0,
        keyspace_misses: 0,
        ping: pingResult,
      };
    } catch (error) {
      throw new Error(
        `Failed to get Redis info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get memory usage information
   * Note: Upstash Redis REST API has limited MEMORY command support
   * @param {string} command - The command to get memory usage information
   * @returns {Promise<Record<string, unknown>>} - The memory usage information
   */
  async memory(command: string = "USAGE"): Promise<Record<string, unknown>> {
    try {
      // For Upstash Redis REST API, we'll return basic memory info
      // In a real Redis setup, you'd use: await this.instance.memory(command)
      return {
        command: command,
        memory_usage: "N/A",
        peak_memory: "N/A",
        total_system_memory: "N/A",
        used_memory: "N/A",
        used_memory_peak: "N/A",
        used_memory_rss: "N/A",
        used_memory_lua: "N/A",
        mem_fragmentation_ratio: "N/A",
        mem_allocator: "N/A",
        active_defrag_running: false,
        lazyfree_pending_objects: 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get Redis memory info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get Redis server statistics
   * @returns {Promise<Record<string, unknown>>} - The Redis server statistics
   */
  async stats(): Promise<Record<string, unknown>> {
    try {
      const info = await this.info();
      const pingResult = await this.ping();

      return {
        status: "connected",
        ping: pingResult,
        uptime: info.uptime_in_seconds,
        version: info.redis_version,
        connected_clients: info.connected_clients,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get Redis stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Test Redis connectivity and basic operations
   * @returns {Promise<{status: "connected" | "disconnected"; responseTime: number; error?: string;}>} - The test connection result
   */
  async testConnection(): Promise<{
    status: "connected" | "disconnected";
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // perform a real ping to verify connectivity
      await this.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: "connected",
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "disconnected",
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
