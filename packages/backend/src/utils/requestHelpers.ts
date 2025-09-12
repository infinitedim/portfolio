import { NextRequest } from "next/server";

/**
 * Get client IP address from request
 * @param {NextRequest} request - The Next.js request object
 * @returns {string} The client IP address
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers for IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to a default
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
