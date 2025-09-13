import { describe, it, expect, vi } from "vitest";
import { optimizedDB, PerformanceOptimizedDB } from "../performance-db";

describe("PerformanceOptimizedDB", () => {
  it("should create singleton instance", () => {
    const instance1 = PerformanceOptimizedDB.getInstance();
    const instance2 = PerformanceOptimizedDB.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(PerformanceOptimizedDB);
  });

  it("should cache query results", async () => {
    const mockQuery = vi.fn().mockResolvedValue("test-data");

    // First call should execute query
    const result1 = await optimizedDB.cachedQuery("test-key", mockQuery, 1000);
    expect(result1).toBe("test-data");
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await optimizedDB.cachedQuery("test-key", mockQuery, 1000);
    expect(result2).toBe("test-data");
    expect(mockQuery).toHaveBeenCalledTimes(1); // Still only called once
  });

  it("should create optimized query functions", () => {
    const queries = optimizedDB.createOptimizedQueries();

    expect(queries).toHaveProperty("cachedFetch");
    expect(queries).toHaveProperty("batchOperations");
    expect(queries).toHaveProperty("paginatedQuery");
    expect(typeof queries.cachedFetch).toBe("function");
    expect(typeof queries.batchOperations).toBe("function");
    expect(typeof queries.paginatedQuery).toBe("function");
  });

  it("should track cache statistics", () => {
    const stats = optimizedDB.getCacheStats();

    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("memoryUsage");
    expect(typeof stats.size).toBe("number");
    expect(typeof stats.memoryUsage).toBe("number");
  });

  it("should clear cache by pattern", () => {
    optimizedDB.clearCache("test");
    const stats = optimizedDB.getCacheStats();

    // Should be able to clear cache without errors
    expect(stats).toHaveProperty("size");
  });
});
