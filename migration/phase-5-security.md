# Phase 5: Security & Middleware

## 🎯 Tujuan Phase

Implementasi security middleware dan proteksi untuk NextJS application.

**Estimasi Waktu: 2-3 hari**

---

## 📋 Task Checklist

- [ ] Create root middleware.ts
- [ ] Implement security headers
- [ ] Implement rate limiting
- [ ] Implement auth protection
- [ ] Create auth guard for API routes

---

## 🏗️ NextJS Root Middleware

**File:** `packages/frontend/middleware.ts`

```typescript
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/admin", "/api/admin"];
const SKIP_ROUTES = ["/_next", "/api/health", "/favicon.ico"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (SKIP_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // Add security headers
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://api.spotify.com",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }

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
```

---

## 🛡️ Auth Guard Helper

**File:** `packages/frontend/src/server/middleware/auth-guard.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authService } from "../services";

export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await authService.validateToken(authHeader.slice(7));
      return handler(request);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  };
}
```

---

## ⚡ Rate Limiter Helper

**File:** `packages/frontend/src/server/middleware/rate-limiter.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { securityService } from "../services";

export function withRateLimit(type: "login" | "api" | "aiChat" = "api") {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const result = await securityService.checkRateLimit(ip, type);

      if (result.isBlocked) {
        return NextResponse.json(
          { error: result.message },
          {
            status: 429,
            headers: { "Retry-After": String(result.retryAfter) },
          },
        );
      }

      return handler(request);
    };
  };
}
```

---

## 🔒 Security Checklist

- [ ] CSP header configured
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] HSTS enabled for production
- [ ] Protected routes require auth
- [ ] Rate limiting works

---

## ➡️ Next Step

Proceed to **[Phase 6: Cleanup & Optimization](./phase-6-cleanup.md)**
