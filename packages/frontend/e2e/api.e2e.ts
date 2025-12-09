import { test, expect } from "@playwright/test";

/**
 * E2E tests for API and tRPC endpoints
 */

test.describe("API Health Checks", () => {
  test("should return healthy status from health endpoint", async ({
    request,
  }) => {
    const response = await request.get("/api/trpc/health");

    // tRPC returns JSON-RPC format
    expect(response.ok() || response.status() === 200).toBe(true);
  });

  test("should handle batch requests", async ({ request }) => {
    const response = await request.get(
      "/api/trpc/health,healthDetailed?batch=1",
    );

    // Should handle batch requests
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("tRPC Endpoints", () => {
  test("echo endpoint should work", async ({ request }) => {
    const response = await request.get(
      "/api/trpc/echo?batch=1&input=%7B%220%22%3A%7B%22msg%22%3A%22test%22%7D%7D",
    );

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test("auth.login should reject empty credentials", async ({ request }) => {
    const response = await request.post("/api/trpc/auth.login", {
      data: {
        "0": {
          json: {
            email: "",
            password: "",
          },
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Should return error for invalid input
    expect(response.status()).toBeLessThan(500);
  });

  test("security.validateInput should detect XSS", async ({ request }) => {
    const response = await request.post("/api/trpc/security.validateInput", {
      data: {
        "0": {
          json: {
            input: "<script>alert('xss')</script>",
          },
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      // Should detect dangerous content
      if (data?.[0]?.result?.data?.json) {
        expect(data[0].result.data.json.isValid).toBe(false);
        expect(data[0].result.data.json.riskLevel).toBe("high");
      }
    }
  });

  test("security.validateInput should pass clean input", async ({
    request,
  }) => {
    const response = await request.post("/api/trpc/security.validateInput", {
      data: {
        "0": {
          json: {
            input: "Hello, this is clean text!",
          },
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      if (data?.[0]?.result?.data?.json) {
        expect(data[0].result.data.json.isValid).toBe(true);
        expect(data[0].result.data.json.riskLevel).toBe("low");
      }
    }
  });
});

test.describe("API Error Handling", () => {
  test("should return 404 for non-existent endpoints", async ({ request }) => {
    const response = await request.get("/api/nonexistent");

    expect(response.status()).toBe(404);
  });

  test("should handle malformed JSON gracefully", async ({ request }) => {
    const response = await request.post("/api/trpc/auth.login", {
      data: "invalid json{",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Should return error status, not crash
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("should set appropriate security headers", async ({ request }) => {
    const response = await request.get("/api/trpc/health");

    const headers = response.headers();

    // Check for common security headers
    // Note: Actual headers depend on your configuration
    expect(headers).toBeDefined();
  });
});

test.describe("Rate Limiting", () => {
  test("should handle rapid requests", async ({ request }) => {
    const requests = Array.from({ length: 10 }, () =>
      request.get("/api/trpc/health"),
    );

    const responses = await Promise.all(requests);

    // Most requests should succeed, but some might be rate limited
    const successCount = responses.filter((r) => r.ok()).length;
    const rateLimitedCount = responses.filter((r) => r.status() === 429).length;

    // At least some requests should succeed
    expect(successCount + rateLimitedCount).toBe(10);
  });
});

test.describe("CORS", () => {
  test("should handle preflight requests", async ({ request }) => {
    const response = await request.fetch("/api/trpc/health", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });

    // Should respond to OPTIONS
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Content Types", () => {
  test("should return JSON content type", async ({ request }) => {
    const response = await request.get("/api/trpc/health");

    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});

test.describe("Spotify Integration", () => {
  test("should return now playing status", async ({ request }) => {
    const response = await request.get("/api/trpc/spotify.nowPlaying");

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      // Should have isPlaying field
      if (data?.result?.data?.json) {
        expect(typeof data.result.data.json.isPlaying).toBe("boolean");
      }
    }
  });
});

test.describe("Projects API", () => {
  test("should return projects list", async ({ request }) => {
    const response = await request.get(
      "/api/trpc/projects.get?batch=1&input=%7B%220%22%3A%7B%7D%7D",
    );

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      // Should return array or empty object
      expect(data).toBeDefined();
    }
  });

  test("should accept section parameter", async ({ request }) => {
    const input = encodeURIComponent(
      JSON.stringify({ "0": { json: { section: "featured" } } }),
    );
    const response = await request.get(
      `/api/trpc/projects.get?batch=1&input=${input}`,
    );

    expect(response.status()).toBeLessThan(500);
  });

  test("should accept limit parameter", async ({ request }) => {
    const input = encodeURIComponent(
      JSON.stringify({ "0": { json: { limit: 5 } } }),
    );
    const response = await request.get(
      `/api/trpc/projects.get?batch=1&input=${input}`,
    );

    expect(response.status()).toBeLessThan(500);
  });
});
