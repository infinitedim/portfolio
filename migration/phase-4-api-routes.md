# Phase 4: API Routes & tRPC Migration

## 🎯 Tujuan Phase

Migrasi semua API endpoints dari NestJS controllers dan tRPC router ke NextJS App Router API routes.

**Estimasi Waktu: 2-3 hari**

---

## 📋 Task Checklist

### 4.1 tRPC Router Setup

- [ ] Update `src/server/trpc/router.ts`
- [ ] Create context with services
- [ ] Setup API route handler

### 4.2 tRPC Sub-routers

- [ ] Auth router
- [ ] Projects router
- [ ] Spotify router
- [ ] Security router
- [ ] Health router

### 4.3 REST API Routes (Non-tRPC)

- [ ] AI chat streaming endpoint
- [ ] Health check endpoint
- [ ] CSP report endpoint

---

## 🏗️ Implementation Details

### 4.1 tRPC Router Setup

#### 4.1.1 Create tRPC Initialization

**File:** `packages/frontend/src/server/trpc/init.ts`

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

#### 4.1.2 Create Context

**File:** `packages/frontend/src/server/trpc/context.ts`

```typescript
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authService, type AuthUser } from "../services";
import { prisma } from "../db";
import { redisService } from "../redis";
import {
  healthService,
  securityService,
  projectsService,
  spotifyService,
  auditLogService,
} from "../services";

export interface Context {
  user: AuthUser | null;
  headers: Headers;
  prisma: typeof prisma;
  services: {
    auth: typeof authService;
    security: typeof securityService;
    health: typeof healthService;
    projects: typeof projectsService;
    spotify: typeof spotifyService;
    auditLog: typeof auditLogService;
    redis: typeof redisService;
  };
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  const { req } = opts;

  // Extract auth token
  const authHeader = req.headers.get("authorization");
  let user: AuthUser | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      user = await authService.validateToken(token);
    } catch {
      // Invalid token, user remains null
    }
  }

  return {
    user,
    headers: req.headers,
    prisma,
    services: {
      auth: authService,
      security: securityService,
      health: healthService,
      projects: projectsService,
      spotify: spotifyService,
      auditLog: auditLogService,
      redis: redisService,
    },
  };
}
```

#### 4.1.3 Create Main Router

**File:** `packages/frontend/src/server/trpc/router.ts`

```typescript
import { router, publicProcedure } from "./init";
import { z } from "zod";
import { authRouter } from "./routers/auth";
import { projectsRouter } from "./routers/projects";
import { spotifyRouter } from "./routers/spotify";
import { securityRouter } from "./routers/security";
import { healthRouter } from "./routers/health";

export const appRouter = router({
  // Health endpoints
  health: publicProcedure.query(async ({ ctx }) => {
    try {
      const cached = await ctx.services.redis.get<{ status: string }>(
        "api:health",
      );
      if (cached) return cached;

      const payload = { status: "ok" } as const;
      await ctx.services.redis.set("api:health", payload, 5);
      return payload;
    } catch {
      return { status: "ok" } as const;
    }
  }),

  healthDetailed: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkHealth();
  }),

  // Echo for testing
  echo: publicProcedure
    .input(z.object({ msg: z.string() }))
    .query(({ input }) => input),

  // Sub-routers
  auth: authRouter,
  projects: projectsRouter,
  spotify: spotifyRouter,
  security: securityRouter,
  healthCheck: healthRouter,
});

export type AppRouter = typeof appRouter;
```

---

### 4.2 tRPC Sub-routers

#### 4.2.1 Auth Router

**File:** `packages/frontend/src/server/trpc/routers/auth.ts`

```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    // Get client IP from headers
    const forwarded = ctx.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";
    const userAgent = ctx.headers.get("user-agent") || undefined;

    // Check rate limit
    const rateLimit = await ctx.services.security.checkRateLimit(
      clientIp,
      "login",
    );
    if (rateLimit.isBlocked) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: rateLimit.message || "Too many login attempts",
      });
    }

    try {
      const result = await ctx.services.auth.validateCredentials(
        input.email,
        input.password,
        clientIp,
        userAgent,
      );

      return {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: error instanceof Error ? error.message : "Login failed",
      });
    }
  }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const authHeader = ctx.headers.get("authorization");
      const accessToken = authHeader?.slice(7) || "";

      const forwarded = ctx.headers.get("x-forwarded-for");
      const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";
      const userAgent = ctx.headers.get("user-agent") || undefined;

      await ctx.services.auth.logout(
        accessToken,
        clientIp,
        userAgent,
        input.refreshToken,
      );

      return { success: true };
    }),

  refresh: publicProcedure
    .input(refreshSchema)
    .mutation(async ({ ctx, input }) => {
      const forwarded = ctx.headers.get("x-forwarded-for");
      const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";

      try {
        const tokens = await ctx.services.auth.refreshAccessToken(
          input.refreshToken,
          clientIp,
        );

        return {
          success: true,
          ...tokens,
        };
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Token refresh failed",
        });
      }
    }),

  validate: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const user = await ctx.services.auth.validateToken(input.token);
        return { valid: true, user };
      } catch {
        return { valid: false, user: null };
      }
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
});
```

#### 4.2.2 Projects Router

**File:** `packages/frontend/src/server/trpc/routers/projects.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure } from "../init";

const getProjectsSchema = z
  .object({
    section: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    featured: z.boolean().optional(),
  })
  .optional();

export const projectsRouter = router({
  get: publicProcedure
    .input(getProjectsSchema)
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const featured = input?.featured;

      const projects = await ctx.services.projects.getAll({
        limit,
        featured,
        status: "ACTIVE",
      });

      return projects;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.services.projects.getBySlug(input.slug);
      return project;
    }),

  getFeatured: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.services.projects.getFeatured(input?.limit);
    }),
});
```

#### 4.2.3 Spotify Router

**File:** `packages/frontend/src/server/trpc/routers/spotify.ts`

```typescript
import { router, publicProcedure } from "../init";

export const spotifyRouter = router({
  nowPlaying: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.spotify.nowPlaying();
  }),
});
```

#### 4.2.4 Security Router

**File:** `packages/frontend/src/server/trpc/routers/security.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";

export const securityRouter = router({
  validateInput: publicProcedure
    .input(
      z.object({
        input: z.string(),
        maxLength: z.number().optional(),
        allowHtml: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.services.security.validateInput(input.input, {
        maxLength: input.maxLength,
        allowHtml: input.allowHtml,
      });
    }),

  checkRateLimit: publicProcedure
    .input(
      z.object({
        key: z.string(),
        type: z.enum(["login", "api", "aiChat"]).default("api"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.services.security.checkRateLimit(
        input.key,
        input.type,
      );
      return {
        allowed: !result.isBlocked,
        remaining: result.remaining,
        resetTime: result.resetTime,
      };
    }),

  getCSRFToken: protectedProcedure.query(async ({ ctx }) => {
    const token = ctx.services.security.generateCSRFToken();

    // Store token with session (use user ID as session ID for simplicity)
    if (ctx.user) {
      await ctx.services.security.storeCSRFToken(ctx.user.userId, token, 3600);
    }

    return { token };
  }),

  getSecurityHeaders: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.security.getSecurityHeaders();
  }),
});
```

#### 4.2.5 Health Router

**File:** `packages/frontend/src/server/trpc/routers/health.ts`

```typescript
import { router, publicProcedure } from "../init";

export const healthRouter = router({
  ping: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.ping();
  }),

  check: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkHealth();
  }),

  database: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkDatabase();
  }),

  redis: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkRedis();
  }),

  memory: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.health.checkMemory();
  }),
});
```

#### 4.2.6 Create Routers Index

**File:** `packages/frontend/src/server/trpc/routers/index.ts`

```typescript
export { authRouter } from "./auth";
export { projectsRouter } from "./projects";
export { spotifyRouter } from "./spotify";
export { securityRouter } from "./security";
export { healthRouter } from "./health";
```

---

### 4.3 API Route Handlers

#### 4.3.1 tRPC API Route

**File:** `packages/frontend/src/app/api/trpc/[trpc]/route.ts`

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createContext } from "@/server/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
```

#### 4.3.2 AI Chat Streaming Route

**File:** `packages/frontend/src/app/api/ai/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/server/services";
import { securityService } from "@/server/services";
import type { CoreMessage } from "ai";

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() || "unknown";

    // Check rate limit
    const rateLimit = await securityService.checkRateLimit(clientIp, "aiChat");
    if (rateLimit.isBlocked) {
      return NextResponse.json({ error: rateLimit.message }, { status: 429 });
    }

    // Parse request body
    const body = await request.json();
    const messages: CoreMessage[] = body.messages || [];

    if (!messages.length) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Stream response
    return aiService.streamChat(messages);
  } catch (error) {
    console.error("[AI Chat Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

#### 4.3.3 Health Check Route

**File:** `packages/frontend/src/app/api/health/route.ts`

```typescript
import { NextResponse } from "next/server";
import { healthService } from "@/server/services";

export async function GET() {
  try {
    const health = await healthService.checkHealth();

    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: "Health check failed" },
      { status: 503 },
    );
  }
}
```

#### 4.3.4 CSP Report Route

**File:** `packages/frontend/src/app/api/csp-report/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auditLogService, AuditEventType } from "@/server/services";

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    // Log CSP violation
    await auditLogService.logSecurityEvent(
      "csp_violation",
      report,
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 }); // Don't expose errors
  }
}
```

---

### 4.4 Update Frontend tRPC Client

#### 4.4.1 Update Type Import

**File:** `packages/frontend/src/lib/trpc.ts`

```typescript
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
// Update import to use new router
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

function getTRPCUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/trpc";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/trpc";
}

let trpcClient: ReturnType<typeof createTRPCProxyClient<AppRouter>> | null =
  null;

if (typeof window !== "undefined") {
  try {
    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getTRPCUrl(),
          headers: async () => {
            try {
              const { authService } = await import("./auth/authService");
              const memoryToken = authService.getAccessToken();
              if (memoryToken) {
                return { Authorization: `Bearer ${memoryToken}` };
              }
              return {};
            } catch (err) {
              console.warn("Token retrieval failed:", err);
              return {};
            }
          },
        }),
      ],
    });
  } catch (error) {
    console.warn("Failed to create tRPC client:", error);
  }
}

export function getTRPCClient() {
  if (typeof window === "undefined") {
    throw new Error("tRPC client is only available on the client side");
  }
  if (!trpcClient) {
    throw new Error("tRPC client failed to initialize");
  }
  return trpcClient;
}

export { trpcClient };
```

---

### 4.5 Create Server Index

**File:** `packages/frontend/src/server/index.ts`

```typescript
// Database
export { prisma } from "./db";

// Redis
export { redisService } from "./redis";

// Configuration
export { getEnv, isProduction, getJWTConfig, getAdminConfig } from "./config";

// Services
export {
  authService,
  securityService,
  auditLogService,
  blogService,
  projectsService,
  spotifyService,
  aiService,
  healthService,
} from "./services";

// tRPC
export { appRouter, type AppRouter } from "./trpc/router";
export { createContext, type Context } from "./trpc/context";
```

---

## ✅ Phase 4 Verification

### Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test tRPC health
curl http://localhost:3000/api/trpc/health

# Test echo
curl -X POST http://localhost:3000/api/trpc/echo \
  -H "Content-Type: application/json" \
  -d '{"json":{"msg":"hello"}}'

# Test projects
curl http://localhost:3000/api/trpc/projects.get

# Test login (should fail with invalid credentials)
curl -X POST http://localhost:3000/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"json":{"email":"test@test.com","password":"wrong"}}'
```

### Verification Checklist

- [ ] tRPC router properly typed
- [ ] API route `/api/trpc/[trpc]` responds
- [ ] Health endpoint returns status
- [ ] Auth login returns tokens on success
- [ ] Projects endpoint returns data
- [ ] Rate limiting works
- [ ] AI chat streaming works
- [ ] TypeScript compilation passes

---

## ➡️ Next Step

Proceed to **[Phase 5: Security & Middleware](./phase-5-security.md)**
