import {NextRequest, NextResponse} from "next/server";

/** Extended browser info with version */
interface BrowserInfo {
  name: string;
  version?: string;
}

/** Extended NextRequest with geo data (Vercel/Edge) */
interface NextRequestWithGeo extends NextRequest {
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Generates a cryptographically secure nonce for CSP
 * @returns A unique nonce string using crypto.randomUUID
 */
function generateNonce() {
  return crypto.randomUUID();
}

/**
 * Generates security headers for the response
 * @param nonce - The nonce for Content Security Policy
 * @param _isDev - Whether the app is in development mode
 * @returns Object containing security headers
 */
function getSecurityHeaders(nonce: string, _isDev: boolean) {
  return {
    "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}';`,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
  } as Record<string, string>;
}

/**
 * Generates CORS headers based on allowed origins
 * @param origin - The request origin
 * @param allowed - Array of allowed origin strings
 * @returns CORS headers object if origin is allowed
 */
function getCORSHeaders(origin: string, allowed: string[]) {
  return allowed.includes(origin)
    ? {"Access-Control-Allow-Origin": origin}
    : {};
}

/**
 * Simple logger object for middleware logging
 */
const logger = {
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.info(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/**
 * Enhanced Next.js middleware for security, performance, and analytics
 *
 * Features:
 * - Security headers (CSP, X-Frame-Options, etc.)
 * - CORS handling
 * - Device detection (mobile/tablet/desktop)
 * - Browser detection and feature support
 * - Suspicious request pattern detection
 * - Resource preloading
 * - Cache control policies
 * - A/B testing experiment assignment
 * - Geo-location headers
 * - Performance monitoring
 * - Real User Monitoring (RUM) enablement
 *
 * @param request - The incoming Next.js request
 * @returns Modified NextResponse with security and performance headers
 */
export function middleware(request: NextRequest) {
  const startTime = Date.now();

  const userAgentHeader = request.headers.get("user-agent") || "";
  const device = {type: "desktop"};
  const browser = {name: "unknown"};

  if (/mobile/i.test(userAgentHeader)) {
    device.type = "mobile";
  } else if (/tablet|ipad/i.test(userAgentHeader)) {
    device.type = "tablet";
  }

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

  const nonce = generateNonce();
  response.headers.set("x-nonce", nonce);

  const isDevelopment = process.env.NODE_ENV === "development";
  const securityHeaders = getSecurityHeaders(nonce, isDevelopment);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const origin = request.headers.get("origin") || "";
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) =>
    o.trim(),
  ) || ["http://127.0.0.1:3000"];
  const corsHeaders = getCORSHeaders(origin, allowedOrigins);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (device.type === "mobile") {
    response.headers.set("X-Device-Type", "mobile");
    response.headers.set("Vary", "User-Agent");
  } else if (device.type === "tablet") {
    response.headers.set("X-Device-Type", "tablet");
    response.headers.set("Vary", "User-Agent");
  } else {
    response.headers.set("X-Device-Type", "desktop");
  }

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

  if (
    browser.name === "Chrome" &&
    typeof (browser as BrowserInfo).version === "string" &&
    parseInt((browser as BrowserInfo).version!, 10) >= 90
  ) {
    response.headers.set("X-Browser-Support", "modern");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  } else {
    response.headers.set("X-Browser-Support", "legacy");
  }

  response.headers.set(
    "Link",
    [
      "</fonts/jetbrains-mono-latin.woff2>; rel=preload; as=font; type=font/woff2; crossorigin",
      "<https://fonts.googleapis.com>; rel=preconnect",
      "<https://fonts.gstatic.com>; rel=preconnect; crossorigin",
    ].join(", "),
  );

  const requestId = crypto.randomUUID();
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("X-Timestamp", new Date().toISOString());

  const acceptEncoding = request.headers.get("accept-encoding") || "";
  if (acceptEncoding.includes("br")) {
    response.headers.set("X-Compression-Support", "brotli");
  } else if (acceptEncoding.includes("gzip")) {
    response.headers.set("X-Compression-Support", "gzip");
  }

  const {pathname} = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
  } else if (pathname.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else if (
    pathname === "/" ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/skills")
  ) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
  }

  const experiment = request.cookies.get("experiment-variant");
  if (!experiment) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set("experiment-variant", variant, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    response.headers.set("X-Experiment-Variant", variant);
  } else {
    response.headers.set("X-Experiment-Variant", experiment.value);
  }

  const country = (request as NextRequestWithGeo).geo?.country || "US";
  const region = (request as NextRequestWithGeo).geo?.region || "Unknown";
  response.headers.set("X-Geo-Country", country);
  response.headers.set("X-Geo-Region", region);

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

  const responseTime = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${responseTime}ms`);

  if (responseTime > 1000) {
    logger.warn("Slow request detected", {
      url: request.url,
      method: request.method,
      responseTime,
      userAgent: request.headers.get("user-agent"),
    });
  }

  if (pathname === "/") {
    response.headers.set("X-RUM-Enable", "true");
    response.headers.set("Timing-Allow-Origin", "*");
  }

  return response;
}

/**
 * Middleware configuration for Next.js
 *
 * Defines which routes should be processed by the middleware.
 * Excludes static files, images, and other resources that don't need middleware processing.
 *
 * @remarks
 * The matcher uses negative lookahead to exclude:
 * - _next/static (Next.js static assets)
 * - _next/image (Next.js image optimization)
 * - favicon.ico (site favicon)
 * - sw.js (service worker)
 * - manifest.json (PWA manifest)
 * - robots.txt (robots file)
 * - sitemap.xml (sitemap file)
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml).*)",
  ],
};
