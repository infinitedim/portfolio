# 🚀 NestJS to NextJS Full Migration Plan

## Overview

Dokumen ini berisi panduan lengkap untuk migrasi infrastruktur portfolio dari **monorepo NestJS + NextJS** menjadi **NextJS Full-Stack** dengan App Router dan API Routes.

> [!CAUTION]
> Migrasi ini adalah perubahan besar yang memerlukan perencanaan matang. Pastikan untuk backup semua data dan kode sebelum memulai.

---

## 📋 Migration Phases

Migrasi dibagi menjadi **6 phase** yang harus dieksekusi secara berurutan:

| Phase | Nama                                                          | Estimasi Waktu | Prioritas   |
| ----- | ------------------------------------------------------------- | -------------- | ----------- |
| 1     | [Preparation & Analysis](./phase-1-preparation.md)            | 1-2 hari       | 🔴 Critical |
| 2     | [Core Infrastructure Setup](./phase-2-core-infrastructure.md) | 2-3 hari       | 🔴 Critical |
| 3     | [Service Layer Migration](./phase-3-service-layer.md)         | 3-5 hari       | 🔴 Critical |
| 4     | [API Routes & tRPC Migration](./phase-4-api-routes.md)        | 2-3 hari       | 🟡 High     |
| 5     | [Security & Middleware](./phase-5-security.md)                | 2-3 hari       | 🔴 Critical |
| 6     | [Cleanup & Optimization](./phase-6-cleanup.md)                | 1-2 hari       | 🟡 High     |

**Total Estimasi: 11-18 hari kerja**

---

## 🏗️ Current Architecture vs Target Architecture

### Current Architecture (Before)

```
portfolio-monorepo/
├── packages/
│   ├── backend/          # NestJS (Class-based, DI)
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── security/
│   │   │   ├── blog/
│   │   │   ├── projects/
│   │   │   ├── spotify/
│   │   │   ├── ai/
│   │   │   ├── health/
│   │   │   ├── redis/
│   │   │   ├── prisma/
│   │   │   └── trpc/
│   │   └── prisma/       # Schema & Migrations
│   ├── frontend/         # NextJS (Function-based)
│   │   └── src/
│   │       ├── app/
│   │       ├── lib/
│   │       │   └── trpc/serverless-router.ts  # Partial tRPC
│   │       └── components/
│   └── ui/               # Shared UI Components
└── tools/
    ├── trpc/
    └── logger/
```

### Target Architecture (After)

```
portfolio-nextjs/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/route.ts
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── spotify/route.ts
│   │   │   └── ai/chat/route.ts
│   │   ├── admin/
│   │   ├── projects/
│   │   └── layout.tsx
│   ├── server/             # Server-side code (replaces NestJS)
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── security.service.ts
│   │   │   ├── blog.service.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── spotify.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── health.service.ts
│   │   │   └── redis.service.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── trpc/
│   │   │   ├── router.ts
│   │   │   ├── context.ts
│   │   │   └── routers/
│   │   └── middleware/
│   ├── lib/
│   ├── hooks/
│   ├── components/
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── public/
```

---

## 🔑 Key Changes Summary

### 1. Dependency Injection → Module Pattern

```typescript
// Before (NestJS)
@Injectable()
export class AuthService {
  constructor(
    private readonly securityService: SecurityService,
    private readonly redisService: RedisService,
  ) {}
}

// After (NextJS)
import { securityService } from "./security.service";
import { redisService } from "./redis.service";

export const authService = {
  async validateCredentials(email: string, password: string) {
    // Use imported services directly
  },
};
```

### 2. Decorators → Functions

```typescript
// Before (NestJS)
@Controller("auth")
export class AuthController {
  @Post("login")
  @UseGuards(RateLimitGuard)
  async login(@Body() dto: LoginDto) {}
}

// After (NextJS API Route)
export async function POST(request: NextRequest) {
  await rateLimiter.check(request);
  const body = await request.json();
  // Handle login
}
```

### 3. Modules → Directory Structure

- NestJS modules → NextJS app directory structure
- NestJS controllers → NextJS API routes
- NestJS services → Plain TypeScript modules with functions/objects

---

## 📦 Dependencies to Add/Remove

### Dependencies to REMOVE

| Package                    | Reason                           |
| -------------------------- | -------------------------------- |
| `@nestjs/common`           | NestJS framework                 |
| `@nestjs/core`             | NestJS framework                 |
| `@nestjs/config`           | Use Next.js env handling         |
| `@nestjs/platform-express` | Not needed                       |
| `@nestjs/throttler`        | Replace with custom rate limiter |
| `@nestjs/cli`              | Build tool not needed            |
| `@nestjs/testing`          | Replace with vitest              |
| `nest-winston`             | Use winston directly             |
| `reflect-metadata`         | NestJS dependency                |
| `rxjs`                     | NestJS dependency                |

### Dependencies to KEEP

| Package             | Reason                               |
| ------------------- | ------------------------------------ |
| `@prisma/client`    | Database ORM                         |
| `@upstash/redis`    | Redis caching                        |
| `@trpc/server`      | tRPC API                             |
| `@trpc/client`      | tRPC client                          |
| `@ai-sdk/anthropic` | AI integration                       |
| `ai`                | AI SDK                               |
| `bcryptjs`          | Password hashing                     |
| `jsonwebtoken`      | JWT handling                         |
| `zod`               | Schema validation                    |
| `helmet`            | Security headers (adapt for Next.js) |

### Dependencies to ADD

| Package            | Reason                                    |
| ------------------ | ----------------------------------------- |
| `next-safe-action` | Server actions with validation (optional) |

---

## ⚠️ Critical Considerations

### Breaking Changes to Address

1. **Environment Variables**: Relocate from `packages/backend/.env` ke root
2. **Prisma Schema**: Move dari `packages/backend/prisma/` ke root `prisma/`
3. **tRPC Router**: Complete migration dari partial serverless router
4. **Auth Flow**: Adapt JWT handling untuk Next.js middleware
5. **Rate Limiting**: Implement custom solution karena tidak ada `@nestjs/throttler`

### Data Migration

- No database schema changes required
- Prisma migrations tetap compatible
- Redis data structure tidak berubah

### Testing Strategy

- Unit tests: Migrate dari Vitest (already used)
- E2E tests: Continue dengan Playwright
- API tests: Update untuk NextJS API routes

---

## 📊 Risk Assessment

| Risk                     | Impact | Probability | Mitigation                         |
| ------------------------ | ------ | ----------- | ---------------------------------- |
| Breaking auth flow       | High   | Medium      | Extensive testing, gradual rollout |
| Rate limiting bypass     | High   | Low         | Implement before public release    |
| Performance regression   | Medium | Medium      | Benchmark before/after             |
| Missing security headers | High   | Low         | Use security checklist             |
| tRPC type loss           | Medium | Low         | Validate types during migration    |

---

## ✅ Pre-Migration Checklist

- [ ] Full project backup
- [ ] Database backup (Supabase)
- [ ] Document current `.env` variables
- [ ] Run all existing tests
- [ ] Create feature branch `feature/nextjs-migration`
- [ ] Review semua phase documents
- [ ] Setup staging environment

---

## 🎯 Success Criteria

1. ✅ All API endpoints functioning identically
2. ✅ Auth flow works (login, logout, token refresh)
3. ✅ Rate limiting active
4. ✅ Security headers present
5. ✅ tRPC types preserved
6. ✅ No performance regression (< 10% latency increase)
7. ✅ All tests passing
8. ✅ Clean build (no warnings)
9. ✅ Deployment to Vercel successful

---

## 📚 Phase Documents

Lanjutkan membaca setiap phase secara berurutan:

1. **[Phase 1: Preparation & Analysis](./phase-1-preparation.md)** - Start here!
2. **[Phase 2: Core Infrastructure Setup](./phase-2-core-infrastructure.md)**
3. **[Phase 3: Service Layer Migration](./phase-3-service-layer.md)**
4. **[Phase 4: API Routes & tRPC Migration](./phase-4-api-routes.md)**
5. **[Phase 5: Security & Middleware](./phase-5-security.md)**
6. **[Phase 6: Cleanup & Optimization](./phase-6-cleanup.md)**
