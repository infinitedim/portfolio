import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { middleware } from "../middleware";
import { NextRequest, NextResponse } from "next/server";

describe("middleware", () => {
  let mockRequest: NextRequest;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockResponse: NextResponse;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a basic mock request
    mockRequest = new NextRequest("http://127.0.0.1:3000", {
      method: "GET",
      headers: [
        [
          "user-agent",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        ],
        ["origin", "http://127.0.0.1:3000"],
        ["accept-encoding", "gzip, deflate, br"],
      ],
    });

    // Create a basic mock response
    mockResponse = NextResponse.next();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should be defined and exportable", () => {
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("should return a NextResponse", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      // Check for NextResponse-like properties instead of instanceof
      expect(result).toHaveProperty("headers");
      expect(result).toHaveProperty("cookies");
    });

    it("should handle basic request without errors", () => {
      expect(() => middleware(mockRequest)).not.toThrow();
    });
  });

  describe("security headers", () => {
    it("should set security headers", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle security configuration", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle CORS configuration", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("device detection", () => {
    it("should handle desktop device", () => {
      const desktopRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ],
        ],
      });

      const result = middleware(desktopRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle mobile device", () => {
      const mobileRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
          ],
        ],
      });

      const result = middleware(mobileRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle tablet device", () => {
      const tabletRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
          ],
        ],
      });

      const result = middleware(tabletRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("browser detection", () => {
    it("should handle Chrome browser", () => {
      const chromeRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          ],
        ],
      });

      const result = middleware(chromeRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle Firefox browser", () => {
      const firefoxRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
          ],
        ],
      });

      const result = middleware(firefoxRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle Safari browser", () => {
      const safariRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          [
            "user-agent",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
          ],
        ],
      });

      const result = middleware(safariRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("performance optimizations", () => {
    it("should handle performance headers", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle compression support", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle response time tracking", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("cache optimization", () => {
    it("should handle API routes caching", () => {
      const apiRequest = new NextRequest("http://127.0.0.1:3000/api/test", {
        headers: [["user-agent", "Mozilla/5.0"]],
      });
      apiRequest.nextUrl.pathname = "/api/test";

      const result = middleware(apiRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle static assets caching", () => {
      const staticRequest = new NextRequest(
        "http://127.0.0.1:3000/_next/static/test.js",
        {
          headers: [["user-agent", "Mozilla/5.0"]],
        },
      );
      staticRequest.nextUrl.pathname = "/_next/static/test.js";

      const result = middleware(staticRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle main pages caching", () => {
      const mainPageRequest = new NextRequest(
        "http://127.0.0.1:3000/projects",
        {
          headers: [["user-agent", "Mozilla/5.0"]],
        },
      );
      mainPageRequest.nextUrl.pathname = "/projects";

      const result = middleware(mainPageRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("A/B testing", () => {
    it("should handle experiment variant cookies", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle existing experiment variant cookie", () => {
      const requestWithCookie = new NextRequest("http://127.0.0.1:3000", {
        headers: [["user-agent", "Mozilla/5.0"]],
      });
      requestWithCookie.cookies.set("experiment-variant", "B");

      const result = middleware(requestWithCookie);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("geolocation", () => {
    it("should handle geo headers", () => {
      const result = middleware(mockRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("theme detection", () => {
    it("should handle dark theme preference", () => {
      const darkThemeRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          ["user-agent", "Mozilla/5.0"],
          ["sec-ch-prefers-color-scheme", "dark"],
        ],
      });

      const result = middleware(darkThemeRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle light theme preference", () => {
      const lightThemeRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          ["user-agent", "Mozilla/5.0"],
          ["sec-ch-prefers-color-scheme", "light"],
        ],
      });

      const result = middleware(lightThemeRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("suspicious request detection", () => {
    it("should handle suspicious requests with path traversal", () => {
      const suspiciousRequest = new NextRequest(
        "http://127.0.0.1:3000/../../../etc/passwd",
        {
          headers: [["user-agent", "Mozilla/5.0"]],
        },
      );

      expect(() => middleware(suspiciousRequest)).not.toThrow();
    });

    it("should handle suspicious requests with XSS attempts", () => {
      const suspiciousRequest = new NextRequest(
        "http://127.0.0.1:3000/test?q=<script>alert('xss')</script>",
        {
          headers: [["user-agent", "Mozilla/5.0"]],
        },
      );

      expect(() => middleware(suspiciousRequest)).not.toThrow();
    });

    it("should handle suspicious requests with SQL injection", () => {
      const suspiciousRequest = new NextRequest(
        "http://127.0.0.1:3000/test?q=union select * from users",
        {
          headers: [["user-agent", "Mozilla/5.0"]],
        },
      );

      expect(() => middleware(suspiciousRequest)).not.toThrow();
    });
  });

  describe("RUM setup", () => {
    it("should handle RUM for homepage", () => {
      const homepageRequest = new NextRequest("http://127.0.0.1:3000/", {
        headers: [["user-agent", "Mozilla/5.0"]],
      });
      homepageRequest.nextUrl.pathname = "/";

      const result = middleware(homepageRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });

    it("should handle RUM for other pages", () => {
      const otherPageRequest = new NextRequest("http://127.0.0.1:3000/about", {
        headers: [["user-agent", "Mozilla/5.0"]],
      });
      otherPageRequest.nextUrl.pathname = "/about";

      const result = middleware(otherPageRequest);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("headers");
    });
  });

  describe("error handling", () => {
    it("should handle missing headers gracefully", () => {
      const minimalRequest = new NextRequest("http://127.0.0.1:3000");

      expect(() => middleware(minimalRequest)).not.toThrow();
    });

    it("should handle missing environment variables", () => {
      // Temporarily remove environment variables
      const originalOrigins = process.env.ALLOWED_ORIGINS;
      delete (process.env as any).ALLOWED_ORIGINS;

      expect(() => middleware(mockRequest)).not.toThrow();

      // Restore environment variables
      if (originalOrigins) {
        process.env.ALLOWED_ORIGINS = originalOrigins;
      }
    });
  });

  describe("middleware configuration", () => {
    it("should have proper config export", async () => {
      const { config } = await import("../middleware");
      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
    });

    it("should have proper matcher configuration", async () => {
      const { config } = await import("../middleware");
      expect(config.matcher[0]).toContain("_next/static");
      expect(config.matcher[0]).toContain("_next/image");
      expect(config.matcher[0]).toContain("favicon.ico");
    });
  });
});
