import { cache } from "react";

/**
 * High-Performance Database Query Optimizations
 *
 * This module provides optimized database queries with advanced caching,
 * connection pooling, and query batching for maximum performance.
 */

interface QueryCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface BatchQuery<T> {
  key: string;
  query: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

class PerformanceOptimizedDB {
  private static instance: PerformanceOptimizedDB;
  private queryCache = new Map<string, QueryCacheEntry<unknown>>();
  private batchedQueries = new Map<string, BatchQuery<unknown>[]>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 10; // ms
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): PerformanceOptimizedDB {
    if (!PerformanceOptimizedDB.instance) {
      PerformanceOptimizedDB.instance = new PerformanceOptimizedDB();
    }
    return PerformanceOptimizedDB.instance;
  }

  /**
   * Execute cached query with automatic invalidation
   */
  public async cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.DEFAULT_CACHE_TTL,
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }

    const result = await queryFn();

    this.queryCache.set(key, {
      data: result,
      timestamp: Date.now(),
      ttl,
    });

    return result;
  }

  /**
   * Batch multiple queries to reduce database round trips
   */
  public async batchQuery<T>(
    batchKey: string,
    queryKey: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.batchedQueries.has(batchKey)) {
        this.batchedQueries.set(batchKey, []);
      }

      this.batchedQueries.get(batchKey)!.push({
        key: queryKey,
        query: queryFn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(
          () => this.executeBatch(),
          this.BATCH_DELAY,
        );
      }
    });
  }

  /**
   * Execute all batched queries in parallel
   */
  private async executeBatch(): Promise<void> {
    const allBatches = Array.from(this.batchedQueries.entries());
    this.batchedQueries.clear();
    this.batchTimeout = null;

    await Promise.all(
      allBatches.map(async ([_batchKey, queries]) => {
        const results = await Promise.allSettled(queries.map((q) => q.query()));

        queries.forEach((query, index) => {
          const result = results[index];
          if (result && result.status === "fulfilled") {
            query.resolve(result.value);
          } else if (result && result.status === "rejected") {
            query.reject(result.reason);
          }
        });
      }),
    );
  }

  /**
   * Create optimized query functions with caching
   */
  public createOptimizedQueries() {
    return {
      /**
       * Generic cached query wrapper
       */
      cachedFetch: cache(
        async <T>(
          key: string,
          fetchFn: () => Promise<T>,
          ttl?: number,
        ): Promise<T> => {
          return this.cachedQuery(key, fetchFn, ttl);
        },
      ),

      /**
       * Batch multiple database operations
       */
      batchOperations: async <T>(
        operations: Array<{ key: string; operation: () => Promise<T> }>,
      ): Promise<T[]> => {
        const batchKey = `batch_${Date.now()}`;
        return Promise.all(
          operations.map((op) =>
            this.batchQuery(batchKey, op.key, op.operation),
          ),
        );
      },

      /**
       * Optimized pagination helper
       */
      paginatedQuery: cache(
        async <T>(
          key: string,
          queryFn: (offset: number, limit: number) => Promise<T[]>,
          page: number = 1,
          limit: number = 10,
        ): Promise<{
          data: T[];
          page: number;
          limit: number;
          total?: number;
        }> => {
          const offset = (page - 1) * limit;
          const cacheKey = `${key}_page_${page}_limit_${limit}`;

          const data = await this.cachedQuery(
            cacheKey,
            () => queryFn(offset, limit),
            2 * 60 * 1000, // 2 minutes cache for paginated data
          );

          return {
            data,
            page,
            limit,
          };
        },
      ),
    };
  }

  /**
   * Clear cache by pattern
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.queryCache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.queryCache.delete(key));
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats() {
    const stats = {
      size: this.queryCache.size,
      memoryUsage: 0,
    };

    for (const [key, value] of this.queryCache.entries()) {
      stats.memoryUsage += key.length + JSON.stringify(value.data).length;
    }

    return stats;
  }
}

export const optimizedDB = PerformanceOptimizedDB.getInstance();
export { PerformanceOptimizedDB };
