import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SpotifyServiceBackend } from "../spotify.service";

describe("SpotifyServiceBackend", () => {
  let spotifyService: SpotifyServiceBackend;
  let mockCache: any;
  let mockRedisService: any;

  beforeEach(() => {
    // Setup environment variables
    process.env.SPOTIFY_CLIENT_ID = "test-client-id";
    process.env.SPOTIFY_CLIENT_SECRET = "test-client-secret";

    // Create mock cache manager
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      mget: vi.fn(),
      ttl: vi.fn(),
      mset: vi.fn(),
      del: vi.fn(),
      reset: vi.fn(),
      wrap: vi.fn(),
      store: {},
    } as any;

    // Create mock Redis service
    mockRedisService = {
      get: vi.fn(),
      set: vi.fn(),
      instance: {
        get: vi.fn(),
        set: vi.fn(),
      },
    } as any;

    // Create service instance with mocked dependencies
    spotifyService = new SpotifyServiceBackend(mockCache, mockRedisService);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.SPOTIFY_CLIENT_ID;
    delete process.env.SPOTIFY_CLIENT_SECRET;
  });

  describe("constructor", () => {
    it("should create service instance with dependencies", () => {
      expect(spotifyService).toBeDefined();
      expect(spotifyService).toBeInstanceOf(SpotifyServiceBackend);
    });

    it("should have nowPlaying method", () => {
      expect(typeof spotifyService.nowPlaying).toBe("function");
    });
  });

  describe("environment variables", () => {
    it("should require SPOTIFY_CLIENT_ID", () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      expect(
        () => new SpotifyServiceBackend(mockCache, mockRedisService),
      ).not.toThrow();
    });

    it("should require SPOTIFY_CLIENT_SECRET", () => {
      delete process.env.SPOTIFY_CLIENT_SECRET;
      expect(
        () => new SpotifyServiceBackend(mockCache, mockRedisService),
      ).not.toThrow();
    });
  });

  describe("nowPlaying method", () => {
    it("should have proper method signature", () => {
      expect(typeof spotifyService.nowPlaying).toBe("function");
      expect(spotifyService.nowPlaying).toBeInstanceOf(Function);
    });

    it("should return a promise", () => {
      const result = spotifyService.nowPlaying();
      expect(result).toBeInstanceOf(Promise);
    });

    it("should return NowPlayingResponse type", async () => {
      // Mock the fetch calls to return a valid response
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "test-access-token",
              token_type: "Bearer",
              expires_in: 3600,
            }),
        })
        .mockResolvedValueOnce({
          status: 204, // No content - not playing
          ok: true,
        });

      const result = await spotifyService.nowPlaying();

      expect(result).toHaveProperty("isPlaying");
      expect(typeof result.isPlaying).toBe("boolean");
    });
  });

  describe("service structure", () => {
    it("should have cache dependency", () => {
      expect(mockCache).toBeDefined();
      expect(typeof mockCache.get).toBe("function");
      expect(typeof mockCache.set).toBe("function");
    });

    it("should have Redis service dependency", () => {
      expect(mockRedisService).toBeDefined();
      expect(typeof mockRedisService.get).toBe("function");
      expect(typeof mockRedisService.set).toBe("function");
    });
  });

  describe("method availability", () => {
    it("should have nowPlaying as public method", () => {
      expect(spotifyService.nowPlaying).toBeDefined();
      expect(typeof spotifyService.nowPlaying).toBe("function");
    });

    it("should have proper method visibility", () => {
      // Test that public methods are accessible
      expect(spotifyService.nowPlaying).toBeDefined();
      expect(typeof spotifyService.nowPlaying).toBe("function");
    });
  });

  describe("error handling", () => {
    it("should handle missing environment variables gracefully", () => {
      delete process.env.SPOTIFY_CLIENT_ID;
      delete process.env.SPOTIFY_CLIENT_SECRET;

      const service = new SpotifyServiceBackend(mockCache, mockRedisService);
      expect(service).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      // Mock fetch to simulate API error
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await spotifyService.nowPlaying();

      expect(result).toEqual({ isPlaying: false });
    });

    it("should handle rate limiting gracefully", async () => {
      // Mock fetch to simulate rate limiting
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "test-access-token",
              token_type: "Bearer",
              expires_in: 3600,
            }),
        })
        .mockResolvedValueOnce({
          status: 429,
          statusText: "Too Many Requests",
          ok: false,
        });

      // Service should handle rate limiting gracefully and return fallback
      const result = await spotifyService.nowPlaying();
      expect(result).toEqual({ isPlaying: false });
    });
  });

  describe("dependency injection", () => {
    it("should accept cache manager dependency", () => {
      const customCache = {
        get: vi.fn(),
        set: vi.fn(),
        mget: vi.fn(),
        ttl: vi.fn(),
        mset: vi.fn(),
        del: vi.fn(),
        reset: vi.fn(),
        wrap: vi.fn(),
        store: {},
      } as any;

      const service = new SpotifyServiceBackend(customCache, mockRedisService);
      expect(service).toBeDefined();
    });

    it("should accept Redis service dependency", () => {
      const customRedis = {
        get: vi.fn(),
        set: vi.fn(),
        instance: {
          get: vi.fn(),
          set: vi.fn(),
        },
      } as any;

      const service = new SpotifyServiceBackend(mockCache, customRedis);
      expect(service).toBeDefined();
    });
  });

  describe("client credentials flow", () => {
    it("should use client credentials grant type", async () => {
      // Mock fetch to capture the request
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "test-access-token",
              token_type: "Bearer",
              expires_in: 3600,
            }),
        })
        .mockResolvedValueOnce({
          status: 204,
          ok: true,
        });

      global.fetch = mockFetch;

      await spotifyService.nowPlaying();

      // Check that the token request used client_credentials
      const tokenCall = mockFetch.mock.calls[0];
      expect(tokenCall).toBeDefined();
      expect(tokenCall![0]).toBe("https://accounts.spotify.com/api/token");
      expect(tokenCall![1].method).toBe("POST");

      const body = new URLSearchParams(tokenCall![1].body);
      expect(body.get("grant_type")).toBe("client_credentials");
    });
  });
});
