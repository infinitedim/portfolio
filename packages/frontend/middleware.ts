import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/admin", "/api/admin"];
const SKIP_ROUTES = ["/_next", "/api/health", "/favicon.ico"];

/**
 * Generates a cryptographically secure nonce for CSP
 */
function generateNonce() {
  return crypto.randomUUID();
}

/**
 * Generates security headers for the response
 */
function getSecurityHeaders(nonce: string, isDev: boolean) {
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://api.spotify.com wss:",
    "media-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const headers: Record<string, string> = {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  if (!isDev) {
    headers["Strict-Transport-Security"] =
      "max-age=31536000; includeSubDomains";
  }

  return headers;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (SKIP_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Add security headers
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === "development";
  const securityHeaders = getSecurityHeaders(nonce, isDev);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  response.headers.set("x-nonce", nonce);

  // Check protected routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const authHeader = request.headers.get("authorization");
    const tokenCookie = request.cookies.get("auth-token");

    if (!authHeader?.startsWith("Bearer ") && !tokenCookie) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

