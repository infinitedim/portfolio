/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import {
  generateNonce,
  getSecurityHeaders,
  getCORSHeaders,
} from "@portfolio/backend/src/security/csp";
// Note: Use server-side logger for middleware
import { logger } from "@portfolio/backend/src/logging/logger";

/**
 * Enhanced middleware for the application with improved security
 * @param {NextRequest} request - The request object
 * @returns {NextResponse} The response object
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Parse user agent for device detection
  const userAgentHeader = request.headers.get("user-agent") || "";
  const device = { type: "desktop" };
  const browser = { name: "unknown" };

  // Simple user agent parsing for device type
  if (/mobile/i.test(userAgentHeader)) {
    device.type = "mobile";
  } else if (/tablet|ipad/i.test(userAgentHeader)) {
    device.type = "tablet";
  }

  // Simple browser detection
  if (/chrome/i.test(userAgentHeader)) {
    browser.name = "chrome";
  } else if (/firefox/i.test(userAgentHeader)) {
    browser.name = "firefox";
  } else if (
    /safari/i.test(userAgentHeader) &&
    !/chrome/i.test(userAgentHeader)
  ) {
    browser.name = "safari";
  } else if (/edg/i.test(userAgentHeader)) {
    browser.name = "edge";
  }

  const response = NextResponse.next();

  // Generate nonce for CSP
  const nonce = generateNonce();
  response.headers.set("x-nonce", nonce);

  // Add comprehensive security headers
  const isDevelopment = process.env.NODE_ENV === "development";
  const securityHeaders = getSecurityHeaders(nonce, isDevelopment);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle CORS
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  ) || ["http://127.0.0.1:3000"];
  const corsHeaders = getCORSHeaders(origin, allowedOrigins);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Device-specific optimizations with security considerations
  if (device.type === "mobile") {
    response.headers.set("X-Device-Type", "mobile");
    response.headers.set("Vary", "User-Agent");
  } else if (device.type === "tablet") {
    response.headers.set("X-Device-Type", "tablet");
    response.headers.set("Vary", "User-Agent");
  } else {
    response.headers.set("X-Device-Type", "desktop");
  }

  // Security logging for suspicious requests
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // XSS via javascript protocol
  ];

  const url = request.url;
  const userAgent = request.headers.get("user-agent") || "";

  if (
    suspiciousPatterns.some(
      (pattern) => pattern.test(url) || pattern.test(userAgent),
    )
  ) {
    logger.warn("Suspicious request detected", {
      ip: request.headers.get("x-forwarded-for") || "Unknown",
      url,
      userAgent,
      headers: Object.fromEntries(request.headers.entries()),
    });
  }

  // Browser-specific optimizations
  if (
    browser.name === "Chrome" &&
    typeof (browser as any).version === "string" &&
    parseInt((browser as any).version, 10) >= 90
  ) {
    response.headers.set("X-Browser-Support", "modern");
    // Enable advanced features for modern browsers
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  } else {
    response.headers.set("X-Browser-Support", "legacy");
  }

  // Performance hints
  response.headers.set(
    "Link",
    [
      "</fonts/jetbrains-mono-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
      "<https://fonts.googleapis.com>; rel=preconnect",
      "<https://fonts.gstatic.com>; rel=preconnect; crossorigin",
    ].join(", "),
  );

  // Analytics and monitoring headers
  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("X-Timestamp", new Date().toISOString());

  // Compression hints
  const acceptEncoding = request.headers.get("accept-encoding") || "";
  if (acceptEncoding.includes("br")) {
    response.headers.set("X-Compression-Support", "brotli");
  } else if (acceptEncoding.includes("gzip")) {
    response.headers.set("X-Compression-Support", "gzip");
  }

  // Cache optimization based on path
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    // API routes - shorter cache
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
  } else if (pathname.startsWith("/_next/static/")) {
    // Static assets - long cache
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else if (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/skills")
  ) {
    // Main pages - moderate cache with revalidation
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
  }

  // A/B Testing support (example)
  const experiment = request.cookies.get("experiment-variant");
  if (!experiment) {
    // Assign random variant for A/B testing
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set("experiment-variant", variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    response.headers.set("X-Experiment-Variant", variant);
  } else {
    response.headers.set("X-Experiment-Variant", experiment.value);
  }

  // Geolocation-based optimizations (if you have multiple regions)
  const country = (request as any).geo?.country || "US";
  const region = (request as any).geo?.region || "Unknown";
  response.headers.set("X-Geo-Country", country);
  response.headers.set("X-Geo-Region", region);

  // Theme preference detection from system
  const acceptHeader = request.headers.get("sec-ch-prefers-color-scheme");
  if (acceptHeader === "dark") {
    response.cookies.set("system-theme", "dark", {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
    });
  } else if (acceptHeader === "light") {
    response.cookies.set("system-theme", "light", {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
    });
  }

  // Performance monitoring
  const responseTime = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${responseTime}ms`);

  // Log performance metrics for monitoring
  if (responseTime > 1000) {
    // Log slow requests
    logger.warn("Slow request detected", {
      url: request.url,
      method: request.method,
      responseTime,
      userAgent: request.headers.get("user-agent"),
    });
  }

  // Real User Monitoring (RUM) setup
  if (pathname === "/") {
    response.headers.set("X-RUM-Enable", "true");
    response.headers.set("Timing-Allow-Origin", "*");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
