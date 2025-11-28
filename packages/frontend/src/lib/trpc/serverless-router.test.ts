import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// Mock environment variables
vi.stubEnv("ADMIN_EMAIL", "admin@test.com");
vi.stubEnv("ADMIN_PASSWORD", "testpassword123");
vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

// Mock Redis
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(() => mockRedis),
}));

// Mock Prisma
const mockPrisma = {
  $queryRaw: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Import after mocks
import { appRouter } from "./serverless-router";

describe("Serverless tRPC Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Health Router", () => {
    it("should return ok status for basic health check", async () => {
      const caller = appRouter.createCaller({});
      const result = await caller.health();

      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
    });

    it("should return detailed health status", async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ 1: 1 }]);
      mockRedis.ping.mockResolvedValueOnce("PONG");

      const caller = appRouter.createCaller({});
      const result = await caller.healthDetailed();

      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.checks).toBeDefined();
    });

    it("should handle database failure in detailed health check", async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      const caller = appRouter.createCaller({});
      const result = await caller.healthDetailed();

      expect(result.checks.database.status).toBe("unhealthy");
      expect(result.checks.database.error).toBeDefined();
    });
  });

  describe("Auth Router", () => {
    describe("login", () => {
      it("should successfully login with correct credentials", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.auth.login({
          email: "admin@test.com",
          password: "testpassword123",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.user.email).toBe("admin@test.com");
          expect(result.user.role).toBe("admin");
          expect(result.accessToken).toBeDefined();
          expect(result.refreshToken).toBeDefined();
        }
      });

      it("should reject invalid credentials", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.auth.login({
          email: "admin@test.com",
          password: "wrongpassword",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Invalid credentials");
        }
      });

      it("should reject invalid email format", async () => {
        const caller = appRouter.createCaller({});

        await expect(
          caller.auth.login({
            email: "not-an-email",
            password: "password",
          }),
        ).rejects.toThrow();
      });

      it("should reject empty password", async () => {
        const caller = appRouter.createCaller({});

        await expect(
          caller.auth.login({
            email: "admin@test.com",
            password: "",
          }),
        ).rejects.toThrow();
      });
    });

    describe("logout", () => {
      it("should successfully logout", async () => {
        mockRedis.del.mockResolvedValueOnce(1);

        const caller = appRouter.createCaller({});
        const result = await caller.auth.logout({
          accessToken: "some-token",
        });

        expect(result.success).toBe(true);
      });
    });

    describe("validate", () => {
      it("should return error when redis is not configured", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.auth.validate({
          accessToken: "some-token",
        });

        // Without Redis, validation is not available
        expect(result.success).toBe(false);
      });
    });

    describe("refresh", () => {
      it("should return error when redis is not configured", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.auth.refresh({
          refreshToken: "some-refresh-token",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Token refresh not available");
        }
      });
    });
  });

  describe("Security Router", () => {
    describe("validateInput", () => {
      it("should pass clean input", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: "Hello, this is clean text!",
        });

        expect(result.isValid).toBe(true);
        expect(result.riskLevel).toBe("low");
      });

      it("should detect script tags", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: "<script>alert('xss')</script>",
        });

        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe("high");
      });

      it("should detect javascript: protocol", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: "javascript:alert(1)",
        });

        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe("high");
      });

      it("should detect event handlers", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: '<img onerror="alert(1)">',
        });

        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe("high");
      });

      it("should detect SQL injection patterns", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: "1; SELECT * FROM users--",
        });

        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe("high");
      });

      it("should sanitize HTML tags", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.validateInput({
          input: "<p>Hello</p><div>World</div>",
        });

        expect(result.sanitizedInput).toBe("HelloWorld");
      });
    });

    describe("checkRateLimit", () => {
      it("should allow first request", async () => {
        const caller = appRouter.createCaller({});
        const result = await caller.security.checkRateLimit({
          key: "unique-key-" + Date.now(),
          type: "test",
        });

        expect(result.allowed).toBe(true);
      });
    });
  });

  describe("Spotify Router", () => {
    describe("nowPlaying", () => {
      it("should return not playing when no spotify token", async () => {
        vi.stubEnv("SPOTIFY_REFRESH_TOKEN", "");

        const caller = appRouter.createCaller({});
        const result = await caller.spotify.nowPlaying();

        expect(result.isPlaying).toBe(false);
      });
    });
  });

  describe("Projects Router", () => {
    describe("get", () => {
      it("should return empty array on database error", async () => {
        mockPrisma.$queryRaw.mockRejectedValueOnce(new Error("DB Error"));

        const caller = appRouter.createCaller({});
        const result = await caller.projects.get({});

        expect(result.data).toEqual([]);
      });

      it("should accept optional section parameter", async () => {
        mockPrisma.$queryRaw.mockResolvedValueOnce([]);

        const caller = appRouter.createCaller({});
        const result = await caller.projects.get({ section: "featured" });

        expect(result.meta.section).toBe("featured");
      });

      it("should accept optional limit parameter", async () => {
        mockPrisma.$queryRaw.mockResolvedValueOnce([]);

        const caller = appRouter.createCaller({});
        const result = await caller.projects.get({ limit: 5 });

        expect(result.data).toBeDefined();
      });
    });
  });

  describe("Echo Procedure", () => {
    it("should echo back the input message", async () => {
      const caller = appRouter.createCaller({});
      const result = await caller.echo({ msg: "Hello, World!" });

      expect(result.msg).toBe("Hello, World!");
    });
  });
});

describe("Input Validation", () => {
  it("should validate login input schema", () => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    // Valid input
    expect(() =>
      loginSchema.parse({ email: "test@example.com", password: "pass" }),
    ).not.toThrow();

    // Invalid email
    expect(() =>
      loginSchema.parse({ email: "invalid", password: "pass" }),
    ).toThrow();

    // Empty password
    expect(() =>
      loginSchema.parse({ email: "test@example.com", password: "" }),
    ).toThrow();
  });
});
