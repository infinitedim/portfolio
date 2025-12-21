import { describe, it, expect, vi, beforeEach } from "vitest";
import { TrpcClient } from "@/lib/utils/trpc-client";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("TrpcClient", () => {
  let client: TrpcClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TrpcClient();
  });

  describe("constructor", () => {
    it("creates client with default base URL", () => {
      const testClient = new TrpcClient();
      expect(testClient).toBeDefined();
    });
  });

  describe("executeRequest", () => {
    it("makes GET request for query type", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { data: "test" } }),
      });

      await client.executeRequest("health", "check", "query");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.check"),
        expect.objectContaining({
          method: "GET",
        }),
      );
    });

    it("makes POST request for mutation type", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { data: "test" } }),
      });

      await client.executeRequest("user", "create", "mutation", {
        email: "test@example.com",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("user.create"),
        expect.objectContaining({
          method: "POST",
          body: expect.any(String),
        }),
      );
    });

    it("includes parameters in query string for GET requests", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { data: "test" } }),
      });

      await client.executeRequest("health", "check", "query", { id: "123" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("id=123"),
        expect.any(Object),
      );
    });

    it("includes parameters in body for POST requests", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: { data: "test" } }),
      });

      await client.executeRequest("user", "create", "mutation", {
        name: "John",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("John"),
        }),
      );
    });

    it("returns parsed JSON response", async () => {
      const mockResponse = { result: { data: { status: "ok" } } };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.executeRequest("health", "check", "query");

      expect(result).toEqual(mockResponse);
    });

    it("throws error on HTTP error response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error"),
      });

      await expect(
        client.executeRequest("health", "check", "query"),
      ).rejects.toThrow(/HTTP error/);
    });

    it("throws error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await expect(
        client.executeRequest("health", "check", "query"),
      ).rejects.toThrow("Network error");
    });

    it("sets Content-Type header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.executeRequest("health", "check", "query");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("includes credentials in request", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.executeRequest("health", "check", "query");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        }),
      );
    });

    it("skips empty parameters in query string", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.executeRequest("health", "check", "query", {
        id: "123",
        empty: "",
        nullValue: null,
        undefinedValue: undefined,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("id=123");
      expect(url).not.toContain("empty=");
      expect(url).not.toContain("nullValue=");
      expect(url).not.toContain("undefinedValue=");
    });
  });

  describe("testConnection", () => {
    it("returns connection status on success", async () => {
      // Note: The spread operator in testConnection spreads the API response,
      // which may override the status field
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ healthy: true }),
      });

      const result = await client.testConnection();

      expect(result.status).toBe("connected");
      expect(result.timestamp).toBeDefined();
    });

    it("returns disconnected status on failure", async () => {
      mockFetch.mockRejectedValue(new Error("Connection refused"));

      const result = await client.testConnection();

      expect(result.status).toBe("disconnected");
      expect(result.error).toBe("Connection refused");
    });

    it("returns disconnected on HTTP error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await client.testConnection();

      expect(result.status).toBe("disconnected");
    });

    it("includes timestamp in response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ healthy: true }),
      });

      const result = await client.testConnection();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe("getServiceDefinitions", () => {
    it("fetches service definitions", async () => {
      const mockServices = { services: ["health", "auth"] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockServices),
      });

      const result = await client.getServiceDefinitions();

      expect(result).toEqual(mockServices);
    });

    it("throws error on failure", async () => {
      mockFetch.mockRejectedValue(new Error("Failed to fetch"));

      await expect(client.getServiceDefinitions()).rejects.toThrow(
        "Failed to fetch",
      );
    });
  });

  describe("healthCheck", () => {
    it("calls health endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.health"),
        expect.any(Object),
      );
    });
  });

  describe("ping", () => {
    it("calls ping endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ pong: true }),
      });

      await client.ping();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.ping"),
        expect.any(Object),
      );
    });
  });

  describe("getDetailedHealth", () => {
    it("calls healthDetailed endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy", details: {} }),
      });

      await client.getDetailedHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthDetailed"),
        expect.any(Object),
      );
    });
  });

  describe("checkDatabaseHealth", () => {
    it("calls healthDatabase endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      await client.checkDatabaseHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthDatabase"),
        expect.any(Object),
      );
    });
  });

  describe("checkRedisHealth", () => {
    it("calls healthRedis endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      await client.checkRedisHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthRedis"),
        expect.any(Object),
      );
    });
  });

  describe("checkMemoryHealth", () => {
    it("calls healthMemory endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      await client.checkMemoryHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthMemory"),
        expect.any(Object),
      );
    });
  });

  describe("checkSystemHealth", () => {
    it("calls healthSystem endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: "healthy" }),
      });

      await client.checkSystemHealth();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthSystem"),
        expect.any(Object),
      );
    });
  });

  describe("checkReadiness", () => {
    it("calls healthReady endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ready: true }),
      });

      await client.checkReadiness();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthReady"),
        expect.any(Object),
      );
    });
  });

  describe("checkLiveness", () => {
    it("calls healthLive endpoint", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ alive: true }),
      });

      await client.checkLiveness();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("health.healthLive"),
        expect.any(Object),
      );
    });
  });
});
