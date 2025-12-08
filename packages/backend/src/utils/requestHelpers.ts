import { NextRequest } from "next/server";

/**
 * Get configured trusted proxies from environment.
 * These are IP addresses of reverse proxies that we trust to provide X-Forwarded-For.
 */
function getTrustedProxies(): string[] {
  const proxies = process.env.TRUSTED_PROXIES || "";
  return proxies
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Check if a request is from a known CDN/proxy that always provides correct client IP.
 * Cloudflare and Vercel are examples of such proxies.
 */
function isKnownCDN(request: NextRequest): boolean {
  // If we have cf-connecting-ip, we're behind Cloudflare
  if (request.headers.get("cf-connecting-ip")) {
    return true;
  }
  // If we have x-vercel-forwarded-for, we're on Vercel
  if (request.headers.get("x-vercel-forwarded-for")) {
    return true;
  }
  return false;
}

/**
 * Get client IP address from request with proper security validation.
 * Only trusts proxy headers when configured or behind known CDN.
 * @param {NextRequest} request - The Next.js request object
 * @returns {string} The client IP address
 */
export function getClientIP(request: NextRequest): string {
  const trustedProxies = getTrustedProxies();

  // Cloudflare provides the original client IP reliably
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP && isKnownCDN(request)) {
    return cfConnectingIP;
  }

  // Vercel provides x-vercel-forwarded-for reliably
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() || "unknown";
  }

  // x-real-ip is typically set by nginx when configured properly
  const realIP = request.headers.get("x-real-ip");

  // Only trust X-Forwarded-For if we have configured trusted proxies
  // or if we detect a known CDN
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && (trustedProxies.length > 0 || isKnownCDN(request))) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (realIP && (trustedProxies.length > 0 || isKnownCDN(request))) {
    return realIP;
  }

  // Fallback: If no proxy headers are trusted, return unknown
  // In serverless environments, we often can't get the true socket IP
  return "unknown";
}

/**
 * Get user agent from request
 * @param {NextRequest} request - The Next.js request object
 * @returns {string} The user agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Get request metadata for logging
 * @param {NextRequest} request - The Next.js request object
 * @returns {object} The request metadata
 */
export function getRequestMetadata(request: NextRequest) {
  return {
    ip: getClientIP(request),
    userAgent: getUserAgent(request),
    url: request.url,
    method: request.method,
    referer: request.headers.get("referer"),
    origin: request.headers.get("origin"),
  };
}
