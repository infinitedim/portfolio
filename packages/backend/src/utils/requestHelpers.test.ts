import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  getClientIP,
  getUserAgent,
  getRequestMetadata,
} from "./requestHelpers";

describe("requestHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getClientIP function", () => {
    it("should be defined and exportable", () => {
      expect(getClientIP).toBeDefined();
      expect(typeof getClientIP).toBe("function");
    });

    it("should return IP from x-forwarded-for header", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", "192.168.1.100, 10.0.0.1"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.100");
    });

    it("should return IP from x-real-ip header when x-forwarded-for is not available", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-real-ip", "192.168.1.200"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.200");
    });

    it("should return IP from cf-connecting-ip header when others are not available", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["cf-connecting-ip", "192.168.1.300"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.300");
    });

    it("should return 'unknown' when no IP headers are present", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000");

      const result = getClientIP(mockRequest);
      expect(result).toBe("unknown");
    });

    it("should prioritize x-forwarded-for over other headers", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          ["x-forwarded-for", "192.168.1.100"],
          ["x-real-ip", "192.168.1.200"],
          ["cf-connecting-ip", "192.168.1.300"],
        ],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.100");
    });

    it("should handle x-forwarded-for with single IP", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", "192.168.1.100"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.100");
    });

    it("should handle x-forwarded-for with multiple IPs and return first one", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", "192.168.1.100, 10.0.0.1, 172.16.0.1"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.100");
    });

    it("should trim whitespace from x-forwarded-for IP", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", " 192.168.1.100 , 10.0.0.1 "]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.100");
    });

    it("should handle empty x-forwarded-for header", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          ["x-forwarded-for", ""],
          ["x-real-ip", "192.168.1.200"],
        ],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("192.168.1.200");
    });

    it("should handle IPv6 addresses", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", "2001:db8::1"]],
      });

      const result = getClientIP(mockRequest);
      expect(result).toBe("2001:db8::1");
    });
  });

  describe("getUserAgent function", () => {
    it("should be defined and exportable", () => {
      expect(getUserAgent).toBeDefined();
      expect(typeof getUserAgent).toBe("function");
    });

    it("should return user agent from header", () => {
      const userAgentString =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["user-agent", userAgentString]],
      });

      const result = getUserAgent(mockRequest);
      expect(result).toBe(userAgentString);
    });

    it("should return 'unknown' when user-agent header is not present", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000");

      const result = getUserAgent(mockRequest);
      expect(result).toBe("unknown");
    });

    it("should handle empty user-agent header", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["user-agent", ""]],
      });

      const result = getUserAgent(mockRequest);
      expect(result).toBe("unknown");
    });

    it("should handle complex user-agent strings", () => {
      const complexUserAgent =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1";
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["user-agent", complexUserAgent]],
      });

      const result = getUserAgent(mockRequest);
      expect(result).toBe(complexUserAgent);
    });

    it("should handle bot user agents", () => {
      const botUserAgent = "Googlebot/2.1 (+http://www.google.com/bot.html)";
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["user-agent", botUserAgent]],
      });

      const result = getUserAgent(mockRequest);
      expect(result).toBe(botUserAgent);
    });
  });

  describe("getRequestMetadata function", () => {
    it("should be defined and exportable", () => {
      expect(getRequestMetadata).toBeDefined();
      expect(typeof getRequestMetadata).toBe("function");
    });

    it("should return complete request metadata", () => {
      const mockRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "POST",
        headers: [
          ["x-forwarded-for", "192.168.1.100"],
          ["user-agent", "Mozilla/5.0 Test Browser"],
          ["referer", "http://127.0.0.1:3000/"],
          ["origin", "http://127.0.0.1:3000"],
        ],
      });

      const result = getRequestMetadata(mockRequest);

      expect(result).toEqual({
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0 Test Browser",
        url: "http://localhost:3000/api/test",
        method: "POST",
        referer: "http://127.0.0.1:3000/",
        origin: "http://127.0.0.1:3000",
      });
    });

    it("should handle missing optional headers", () => {
      const mockRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      const result = getRequestMetadata(mockRequest);

      expect(result).toEqual({
        ip: "unknown",
        userAgent: "unknown",
        url: "http://localhost:3000/api/test",
        method: "GET",
        referer: null,
        origin: null,
      });
    });

    it("should handle partial headers", () => {
      const mockRequest = new NextRequest("http://localhost:3000/api/test", {
        method: "PUT",
        headers: [
          ["user-agent", "Test Browser"],
          ["origin", "http://127.0.0.1:3000"],
        ],
      });

      const result = getRequestMetadata(mockRequest);

      expect(result).toEqual({
        ip: "unknown",
        userAgent: "Test Browser",
        url: "http://localhost:3000/api/test",
        method: "PUT",
        referer: null,
        origin: "http://127.0.0.1:3000",
      });
    });

    it("should use correct IP detection logic", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [
          ["x-real-ip", "192.168.1.200"],
          ["user-agent", "Test Browser"],
        ],
      });

      const result = getRequestMetadata(mockRequest);
      expect(result.ip).toBe("192.168.1.200");
    });

    it("should use correct user agent detection logic", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000", {
        headers: [["x-forwarded-for", "192.168.1.100"]],
      });

      const result = getRequestMetadata(mockRequest);
      expect(result.userAgent).toBe("unknown");
    });

    it("should handle different HTTP methods", () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

      methods.forEach((method) => {
        const mockRequest = new NextRequest("http://127.0.0.1:3000", {
          method,
        });

        const result = getRequestMetadata(mockRequest);
        expect(result.method).toBe(method);
      });
    });

    it("should handle different URLs", () => {
      const urls = [
        "http://localhost:3000/",
        "http://localhost:3000/",
        "http://localhost:3000/api/users",
        "https://example.com/api/v1/data",
        "http://localhost:3000/path/to/resource?query=value",
      ];

      const expectedUrls = [
        "http://localhost:3000/",
        "http://localhost:3000/",
        "http://localhost:3000/api/users",
        "https://example.com/api/v1/data",
        "http://localhost:3000/path/to/resource?query=value",
      ];

      urls.forEach((url, index) => {
        const mockRequest = new NextRequest(url);
        const result = getRequestMetadata(mockRequest);
        expect(result.url).toBe(expectedUrls[index]);
      });
    });

    it("should return object with all required properties", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000");
      const result = getRequestMetadata(mockRequest);

      expect(result).toHaveProperty("ip");
      expect(result).toHaveProperty("userAgent");
      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("method");
      expect(result).toHaveProperty("referer");
      expect(result).toHaveProperty("origin");
    });

    it("should handle complex scenarios", () => {
      const mockRequest = new NextRequest(
        "https://api.example.com/v1/users/123?include=profile",
        {
          method: "PATCH",
          headers: [
            ["x-forwarded-for", "203.0.113.1, 198.51.100.1"],
            ["user-agent", "MyApp/1.0 (iOS 14.0; iPhone12,1)"],
            ["referer", "https://app.example.com/users/123"],
            ["origin", "https://app.example.com"],
          ],
        },
      );

      const result = getRequestMetadata(mockRequest);

      expect(result).toEqual({
        ip: "203.0.113.1",
        userAgent: "MyApp/1.0 (iOS 14.0; iPhone12,1)",
        url: "https://api.example.com/v1/users/123?include=profile",
        method: "PATCH",
        referer: "https://app.example.com/users/123",
        origin: "https://app.example.com",
      });
    });
  });

  describe("integration tests", () => {
    it("should work together correctly", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000/api/test", {
        method: "POST",
        headers: [
          ["x-forwarded-for", "192.168.1.100, 10.0.0.1"],
          ["user-agent", "Test Browser/1.0"],
        ],
      });

      const ip = getClientIP(mockRequest);
      const userAgent = getUserAgent(mockRequest);
      const metadata = getRequestMetadata(mockRequest);

      expect(ip).toBe("192.168.1.100");
      expect(userAgent).toBe("Test Browser/1.0");
      expect(metadata.ip).toBe(ip);
      expect(metadata.userAgent).toBe(userAgent);
    });

    it("should handle edge cases consistently", () => {
      const mockRequest = new NextRequest("http://127.0.0.1:3000");

      const ip = getClientIP(mockRequest);
      const userAgent = getUserAgent(mockRequest);
      const metadata = getRequestMetadata(mockRequest);

      expect(ip).toBe("unknown");
      expect(userAgent).toBe("unknown");
      expect(metadata.ip).toBe("unknown");
      expect(metadata.userAgent).toBe("unknown");
    });
  });
});
