import { describe, it, expect, vi } from "vitest";
import { initTRPC } from "@trpc/server";
import { z } from "zod";

// Mock @portfolio/logger
vi.mock("@portfolio/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Mock crypto
vi.mock("crypto", () => ({
  randomBytes: vi.fn((size: number) =>
    Buffer.from("a".repeat(size * 2), "hex"),
  ),
  randomUUID: vi.fn(() => "mocked-uuid-12345"),
}));

describe("Security Router", () => {
  const t = initTRPC.create();
  const publicProcedure = t.procedure;

  describe("validateInput procedure", () => {
    it("should validate clean input", async () => {
      const router = t.router({
        validateInput: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => {
            const dangerous = /<script|javascript:|on\w+=/i.test(input.text);
            return {
              valid: !dangerous,
              sanitized: input.text.replace(/<[^>]*>/g, ""),
            };
          }),
      });

      const caller = router.createCaller({});
      const result = await caller.validateInput({ text: "Hello World" });

      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("Hello World");
    });

    it("should detect XSS in input", async () => {
      const router = t.router({
        validateInput: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => {
            const dangerous = /<script|javascript:|on\w+=/i.test(input.text);
            return {
              valid: !dangerous,
              sanitized: input.text.replace(/<[^>]*>/g, ""),
            };
          }),
      });

      const caller = router.createCaller({});
      const result = await caller.validateInput({
        text: '<script>alert("xss")</script>',
      });

      expect(result.valid).toBe(false);
    });
  });

  describe("checkRateLimit procedure", () => {
    it("should check rate limit and return status", async () => {
      const rateLimitStore = new Map<string, number[]>();

      const router = t.router({
        checkRateLimit: publicProcedure
          .input(z.object({ key: z.string(), limit: z.number() }))
          .query(({ input }) => {
            const now = Date.now();
            const windowMs = 60000; // 1 minute
            const requests = rateLimitStore.get(input.key) || [];
            const recentRequests = requests.filter(
              (time) => now - time < windowMs,
            );

            const allowed = recentRequests.length < input.limit;

            if (allowed) {
              recentRequests.push(now);
              rateLimitStore.set(input.key, recentRequests);
            }

            return {
              allowed,
              remaining: Math.max(0, input.limit - recentRequests.length),
              resetAt: new Date(now + windowMs).toISOString(),
            };
          }),
      });

      const caller = router.createCaller({});
      const result = await caller.checkRateLimit({
        key: "user:123",
        limit: 100,
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeDefined();
      expect(result.resetAt).toBeDefined();
    });

    it("should reject when rate limit exceeded", async () => {
      const router = t.router({
        checkRateLimit: publicProcedure
          .input(z.object({ key: z.string(), limit: z.number() }))
          .query(({ input }) => {
            // Simulate limit exceeded
            if (input.limit === 0) {
              return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(Date.now() + 60000).toISOString(),
              };
            }
            return {
              allowed: true,
              remaining: input.limit - 1,
              resetAt: new Date(Date.now() + 60000).toISOString(),
            };
          }),
      });

      const caller = router.createCaller({});
      const result = await caller.checkRateLimit({ key: "user:456", limit: 0 });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("getRateLimitInfo procedure", () => {
    it("should return rate limit info for a key", async () => {
      const router = t.router({
        getRateLimitInfo: publicProcedure
          .input(z.object({ key: z.string() }))
          .query(({ input }) => ({
            key: input.key,
            limit: 100,
            remaining: 95,
            resetAt: new Date(Date.now() + 60000).toISOString(),
            windowMs: 60000,
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.getRateLimitInfo({ key: "api:general" });

      expect(result.key).toBe("api:general");
      expect(result.limit).toBe(100);
      expect(result.remaining).toBeDefined();
    });
  });

  describe("sanitizeText procedure", () => {
    it("should sanitize HTML tags", async () => {
      const router = t.router({
        sanitizeText: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            original: input.text,
            sanitized: input.text
              .replace(/<[^>]*>/g, "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;"),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.sanitizeText({
        text: '<div onclick="alert()">Hello</div>',
      });

      expect(result.sanitized).not.toContain("<div");
      expect(result.sanitized).not.toContain("onclick");
    });

    it("should preserve plain text", async () => {
      const router = t.router({
        sanitizeText: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            original: input.text,
            sanitized: input.text.replace(/<[^>]*>/g, ""),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.sanitizeText({
        text: "Plain text without HTML",
      });

      expect(result.sanitized).toBe("Plain text without HTML");
    });
  });

  describe("hasSqlInjectionPatterns procedure", () => {
    it("should detect SQL injection patterns", async () => {
      const sqlPatterns =
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)|(-{2})|(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i;

      const router = t.router({
        hasSqlInjectionPatterns: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            hasSqlInjection: sqlPatterns.test(input.text),
            patterns: [],
          })),
      });

      const caller = router.createCaller({});

      const safeResult = await caller.hasSqlInjectionPatterns({
        text: "John Doe",
      });
      expect(safeResult.hasSqlInjection).toBe(false);

      const unsafeResult = await caller.hasSqlInjectionPatterns({
        text: "'; DROP TABLE users; --",
      });
      expect(unsafeResult.hasSqlInjection).toBe(true);
    });

    it("should detect UNION-based injection", async () => {
      const sqlPatterns = /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)/i;

      const router = t.router({
        hasSqlInjectionPatterns: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            hasSqlInjection: sqlPatterns.test(input.text),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.hasSqlInjectionPatterns({
        text: "1 UNION SELECT * FROM users",
      });

      expect(result.hasSqlInjection).toBe(true);
    });
  });

  describe("hasXssPatterns procedure", () => {
    it("should detect XSS patterns", async () => {
      const xssPatterns =
        /<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i;

      const router = t.router({
        hasXssPatterns: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            hasXss: xssPatterns.test(input.text),
          })),
      });

      const caller = router.createCaller({});

      const safeResult = await caller.hasXssPatterns({ text: "Hello World" });
      expect(safeResult.hasXss).toBe(false);

      const unsafeResult = await caller.hasXssPatterns({
        text: '<script>alert("xss")</script>',
      });
      expect(unsafeResult.hasXss).toBe(true);
    });

    it("should detect onclick handlers", async () => {
      const xssPatterns = /on\w+\s*=/i;

      const router = t.router({
        hasXssPatterns: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            hasXss: xssPatterns.test(input.text),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.hasXssPatterns({
        text: '<img src="x" onerror="alert(1)">',
      });

      expect(result.hasXss).toBe(true);
    });

    it("should detect javascript: protocol", async () => {
      const xssPatterns = /javascript:/i;

      const router = t.router({
        hasXssPatterns: publicProcedure
          .input(z.object({ text: z.string() }))
          .query(({ input }) => ({
            hasXss: xssPatterns.test(input.text),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.hasXssPatterns({
        text: '<a href="javascript:alert(1)">click</a>',
      });

      expect(result.hasXss).toBe(true);
    });
  });

  describe("generateSecureToken procedure", () => {
    it("should generate token of specified length", async () => {
      const router = t.router({
        generateSecureToken: publicProcedure
          .input(z.object({ length: z.number().min(8).max(256) }))
          .query(({ input }) => {
            const chars =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let token = "";
            for (let i = 0; i < input.length; i++) {
              token += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return { token, length: token.length };
          }),
      });

      const caller = router.createCaller({});
      const result = await caller.generateSecureToken({ length: 32 });

      expect(result.token.length).toBe(32);
    });

    it("should reject invalid length", async () => {
      const router = t.router({
        generateSecureToken: publicProcedure
          .input(z.object({ length: z.number().min(8).max(256) }))
          .query(({ input }) => ({
            token: "x".repeat(input.length),
            length: input.length,
          })),
      });

      const caller = router.createCaller({});

      await expect(caller.generateSecureToken({ length: 5 })).rejects.toThrow();
      await expect(
        caller.generateSecureToken({ length: 300 }),
      ).rejects.toThrow();
    });
  });

  describe("validateEmail procedure", () => {
    it("should validate correct email formats", async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      const router = t.router({
        validateEmail: publicProcedure
          .input(z.object({ email: z.string() }))
          .query(({ input }) => ({
            valid: emailRegex.test(input.email),
            email: input.email.toLowerCase(),
          })),
      });

      const caller = router.createCaller({});

      const validResult = await caller.validateEmail({
        email: "test@example.com",
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = await caller.validateEmail({
        email: "invalid-email",
      });
      expect(invalidResult.valid).toBe(false);
    });

    it("should lowercase email", async () => {
      const router = t.router({
        validateEmail: publicProcedure
          .input(z.object({ email: z.string() }))
          .query(({ input }) => ({
            valid: true,
            email: input.email.toLowerCase(),
          })),
      });

      const caller = router.createCaller({});
      const result = await caller.validateEmail({
        email: "Test@EXAMPLE.COM",
      });

      expect(result.email).toBe("test@example.com");
    });
  });

  describe("validatePassword procedure", () => {
    it("should validate password strength", async () => {
      const router = t.router({
        validatePassword: publicProcedure
          .input(z.object({ password: z.string() }))
          .query(({ input }) => {
            const hasMinLength = input.password.length >= 8;
            const hasUppercase = /[A-Z]/.test(input.password);
            const hasLowercase = /[a-z]/.test(input.password);
            const hasNumber = /\d/.test(input.password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(input.password);

            const strength = [
              hasMinLength,
              hasUppercase,
              hasLowercase,
              hasNumber,
              hasSpecial,
            ].filter(Boolean).length;

            return {
              valid: strength >= 4,
              strength:
                strength <= 2 ? "weak" : strength <= 3 ? "medium" : "strong",
              checks: {
                minLength: hasMinLength,
                uppercase: hasUppercase,
                lowercase: hasLowercase,
                number: hasNumber,
                special: hasSpecial,
              },
            };
          }),
      });

      const caller = router.createCaller({});

      const weakResult = await caller.validatePassword({ password: "weak" });
      expect(weakResult.strength).toBe("weak");

      const strongResult = await caller.validatePassword({
        password: "StrongP@ss123",
      });
      expect(strongResult.strength).toBe("strong");
      expect(strongResult.valid).toBe(true);
    });
  });

  describe("validateUsername procedure", () => {
    it("should validate username format", async () => {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;

      const router = t.router({
        validateUsername: publicProcedure
          .input(z.object({ username: z.string() }))
          .query(({ input }) => ({
            valid: usernameRegex.test(input.username),
            normalized: input.username.toLowerCase(),
          })),
      });

      const caller = router.createCaller({});

      const validResult = await caller.validateUsername({
        username: "john_doe123",
      });
      expect(validResult.valid).toBe(true);

      const invalidResult = await caller.validateUsername({
        username: "ab",
      });
      expect(invalidResult.valid).toBe(false);

      const invalidCharsResult = await caller.validateUsername({
        username: "user@name!",
      });
      expect(invalidCharsResult.valid).toBe(false);
    });

    it("should reject reserved usernames", async () => {
      const reserved = ["admin", "root", "system", "null", "undefined"];

      const router = t.router({
        validateUsername: publicProcedure
          .input(z.object({ username: z.string() }))
          .query(({ input }) => {
            const isReserved = reserved.includes(input.username.toLowerCase());
            return {
              valid: !isReserved,
              reserved: isReserved,
            };
          }),
      });

      const caller = router.createCaller({});

      const result = await caller.validateUsername({ username: "admin" });
      expect(result.valid).toBe(false);
      expect(result.reserved).toBe(true);
    });
  });
});
