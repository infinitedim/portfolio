# Phase 1: Preparation & Analysis

## 🎯 Tujuan Phase

Mempersiapkan environment dan menganalisis semua komponen yang perlu dimigrasikan untuk memastikan tidak ada yang terlewat.

**Estimasi Waktu: 1-2 hari**

---

## 📋 Task Checklist

### 1.1 Project Backup

- [x] Git commit semua perubahan yang pending
- [ ] Push ke remote repository (requires authentication - manual)
- [x] Create backup branch: `git checkout -b backup/pre-migration`
- [ ] Export database dari Supabase (format SQL) (manual - perlu dilakukan secara manual)
- [ ] Download `.env` file backup (manual - perlu dilakukan secara manual)

### 1.2 Create Migration Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/nextjs-migration
```

✅ **Completed:** Migration branch `feature/nextjs-migration` telah dibuat dari `main`.

### 1.3 Document Current State

- [ ] Screenshot semua halaman yang ada (manual - perlu dilakukan secara manual)
- [x] Record API responses untuk semua endpoints (dokumentasi dibuat di `phase-1-api-responses.md`)
- [ ] Document current performance metrics (manual - perlu dilakukan secara manual)

---

## 🔍 Backend Analysis

### 1.4 Inventory NestJS Modules

Daftar lengkap modul NestJS yang perlu dimigrasikan:

| Module             | Path                | Priority    | Complexity | Dependencies                  |
| ------------------ | ------------------- | ----------- | ---------- | ----------------------------- |
| **AppModule**      | `src/app.module.ts` | 🔴 Critical | Low        | All modules                   |
| **AuthModule**     | `src/auth/`         | 🔴 Critical | High       | SecurityService, RedisService |
| **SecurityModule** | `src/security/`     | 🔴 Critical | Very High  | RedisService                  |
| **PrismaModule**   | `src/prisma/`       | 🔴 Critical | Medium     | -                             |
| **RedisModule**    | `src/redis/`        | 🔴 Critical | Low        | -                             |
| **BlogModule**     | `src/blog/`         | 🟡 High     | Low        | PrismaService                 |
| **ProjectsModule** | `src/projects/`     | 🟡 High     | Low        | PrismaService                 |
| **SpotifyModule**  | `src/spotify/`      | 🟢 Medium   | Medium     | RedisService                  |
| **HealthModule**   | `src/health/`       | 🟢 Medium   | Medium     | PrismaService, RedisService   |
| **AiModule**       | `src/ai/`           | 🟢 Medium   | Low        | ConfigService                 |
| **TrpcModule**     | `src/trpc/`         | 🔴 Critical | High       | All services                  |
| **CommonModule**   | `src/common/`       | 🟡 High     | Low        | -                             |
| **LoggingModule**  | `src/logging/`      | 🟢 Medium   | Low        | -                             |
| **AdminModule**    | `src/admin/`        | 🟢 Medium   | Low        | PrismaService, SecurityModule |

### 1.5 Inventory NestJS Services Detail

#### AuthService (`src/auth/auth.service.ts`)

**Lines of Code:** ~491 lines  
**Complexity:** High

**Methods to migrate:**

```typescript
// Core Authentication
- validateCredentials(email, password, clientIp, request): Promise<AuthResult>
- refreshToken(refreshToken, clientIp, request): Promise<TokenPair>
- logout(token, clientIp, request, refreshToken?): Promise<void>
- validateToken(token, request?): Promise<AuthUser>

// Token Management
- sign(user: AuthUser): string
- verify(token: string): AuthUser | null
- blacklistToken(jti: string, ttl: number): Promise<void>
- isTokenBlacklisted(jti: string): Promise<boolean>

// Helper Functions (standalone, not methods)
- parseTimeToSeconds(timeStr: string): number
- getTokenBlacklistTTL(): number
- getTokenFamilyTTL(): number
```

**Dependencies:**

- `SecurityService` - JWT operations, password hashing
- `AuditLogService` - Login/logout logging
- `RedisService` - Token blacklist storage
- `env.config` - JWT configuration

---

#### SecurityService (`src/security/security.service.ts`)

**Lines of Code:** ~1336 lines  
**Complexity:** Very High

**Methods to migrate:**

```typescript
// JWT Token Operations
- generateAccessToken(payload): string
- generateRefreshToken(userId, familyId?): string
- verifyAccessToken(token): JWTPayload
- verifyRefreshToken(token): RefreshTokenPayload

// Password Operations
- hashPassword(password): Promise<string>
- verifyPassword(password, hash): Promise<boolean>

// API Key Operations
- generateApiKey(): string
- verifyApiKey(apiKey, storedHash): boolean

// Rate Limiting
- checkRateLimit(key, config): Promise<RateLimitResult>
- getRateLimitInfo(key): Promise<RateLimitInfo>

// Input Validation & Sanitization
- validateInput(input, options): ValidationResult
- sanitizeInput(input): string
- detectDangerousPatterns(input): string[]

// Security Headers
- getSecurityHeaders(): SecurityHeaders

// Encryption
- encrypt(data): string
- decrypt(encrypted): string

// CSRF
- generateCSRFToken(): string
- validateCSRFToken(token, storedToken): boolean

// Session Management
- createSession(userId, data, ttl): Promise<string>
- getSession(sessionId): Promise<SessionData | null>
- deleteSession(sessionId): Promise<void>
```

**Dependencies:**

- `RedisService` - Rate limiting storage, session storage
- `crypto` - Native Node.js crypto
- `jsonwebtoken` - JWT operations
- `bcryptjs` - Password hashing
- `zod` - Input validation

---

#### RedisService (`src/redis/redis.service.ts`)

**Lines of Code:** ~185 lines  
**Complexity:** Low

**Methods to migrate:**

```typescript
// Basic Operations
- get<T>(key): Promise<T | null>
- set<T>(key, value, ttlSeconds?): Promise<void>
- del(key): Promise<void>
- exists(key): Promise<boolean>
- incr(key): Promise<number>
- expire(key, seconds): Promise<void>
- ttl(key): Promise<number>
- keys(pattern): Promise<string[]>
- flushdb(): Promise<void>
- ping(): Promise<string>

// Info & Stats
- info(): Promise<Record<string, unknown>>
- memory(command?): Promise<Record<string, unknown>>
- stats(): Promise<Record<string, unknown>>
- testConnection(): Promise<ConnectionStatus>
```

**Dependencies:**

- `@upstash/redis` - Upstash Redis client

---

#### BlogService (`src/blog/blog.service.ts`)

**Lines of Code:** ~50 lines  
**Complexity:** Low

**Methods to migrate:**

```typescript
- getAll(options?): Promise<BlogPost[]>
- getBySlug(slug): Promise<BlogPost | null>
- create(data): Promise<BlogPost>
- update(id, data): Promise<BlogPost>
- delete(id): Promise<void>
```

**Dependencies:**

- `PrismaService`

---

#### ProjectsService (`src/projects/projects.service.ts`)

**Lines of Code:** ~30 lines  
**Complexity:** Low

**Methods to migrate:**

```typescript
- getAll(options?): Promise<Project[]>
- getBySlug(slug): Promise<Project | null>
- getFeatured(): Promise<Project[]>
```

**Dependencies:**

- `PrismaService`

---

#### SpotifyService (`src/spotify/spotify.service.ts`)

**Lines of Code:** ~168 lines  
**Complexity:** Medium

**Methods to migrate:**

```typescript
- nowPlaying(): Promise<NowPlayingResponse>
- getAccessToken(): Promise<string> (private)
```

**Dependencies:**

- `cache-manager` - In-memory cache
- `RedisService` - Distributed cache
- Spotify Web API

---

#### AiService (`src/ai/ai.service.ts`)

**Lines of Code:** ~40 lines  
**Complexity:** Low

**Methods to migrate:**

```typescript
- streamChat(messages: CoreMessage[]): Promise<Response>
```

**Dependencies:**

- `@ai-sdk/anthropic` - Anthropic Claude SDK
- `ai` - Vercel AI SDK

---

#### HealthService (`src/health/health.service.ts`)

**Lines of Code:** ~497 lines  
**Complexity:** Medium

**Methods to migrate:**

```typescript
- checkHealth(): Promise<HealthCheckResult>
- ping(): Promise<PingResult>
- getDetailedHealth(): Promise<HealthCheckResult>
- getDatabasePoolStatus(): Promise<PoolStatus>

// Private methods
- checkDatabase(): Promise<HealthCheck>
- checkRedis(): Promise<HealthCheck>
- checkMemory(): Promise<HealthCheck>
- checkDisk(): Promise<HealthCheck>
- checkSystem(): Promise<HealthCheck>
```

**Dependencies:**

- `PrismaService`
- `RedisService`
- `DatabaseConnectionManager`

---

#### AuditLogService (`src/security/audit-log.service.ts`)

**Lines of Code:** ~400+ lines  
**Complexity:** Medium

**Methods to migrate:**

```typescript
- logEvent(event: AuditEvent): Promise<void>
- getAuditLogs(filters): Promise<AuditLog[]>
- logLogin(userId, ip, userAgent): Promise<void>
- logLogout(userId, ip): Promise<void>
- logSecurityEvent(type, details): Promise<void>
```

**Dependencies:**

- `PrismaService`
- `RedisService` (for caching)

---

### 1.6 Inventory tRPC Routers

Daftar tRPC routers yang perlu dimigrasikan:

| Router             | Path                          | Procedures                                                                                                     |
| ------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **appRouter**      | `src/trpc/router.ts`          | health, healthDetailed, healthDatabase, healthRedis, healthMemory, healthSystem, healthReady, healthLive, echo |
| **authRouter**     | `src/trpc/auth.router.ts`     | login, logout, refresh, validate, me                                                                           |
| **projectsRouter** | `src/trpc/projects.router.ts` | get, getBySlug, getFeatured                                                                                    |
| **spotifyRouter**  | `src/trpc/spotify.router.ts`  | nowPlaying                                                                                                     |
| **securityRouter** | `src/trpc/security.router.ts` | validateInput, checkRateLimit, getCSRFToken                                                                    |

---

### 1.7 Inventory Middleware & Guards

| Middleware/Guard       | Path                                  | Purpose                           |
| ---------------------- | ------------------------------------- | --------------------------------- |
| **SecurityMiddleware** | `src/security/security.middleware.ts` | Security headers, request logging |
| **CSRFMiddleware**     | `src/security/csrf.middleware.ts`     | CSRF protection                   |
| **AuthGuard**          | `src/auth/auth.guard.ts`              | JWT authentication                |
| **ThrottlerGuard**     | `@nestjs/throttler`                   | Rate limiting (built-in)          |

---

### 1.8 Inventory Environment Variables

Semua environment variables yang digunakan:

```bash
# === Core ===
NODE_ENV=development|production|test

# === Database ===
DATABASE_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://... (optional)
DATABASE_URL_NON_POOLING=postgresql://... (optional)
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
DB_POOL_MIN=
DB_POOL_MAX=
DB_POOL_ACQUIRE_TIMEOUT=
DB_POOL_IDLE_TIMEOUT=
DB_QUERY_TIMEOUT=
DB_TRANSACTION_TIMEOUT=

# === Redis ===
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=

# === JWT ===
JWT_SECRET= (min 64 chars)
JWT_EXPIRES_IN=15m
REFRESH_TOKEN= (min 64 chars)
REFRESH_TOKEN_EXPIRES_IN=7d
JWT_ISSUER=portfolio-app
JWT_AUDIENCE=portfolio-users

# === Admin ===
ADMIN_EMAIL=
ADMIN_PASSWORD= (dev only)
ADMIN_HASH_PASSWORD= (production, bcrypt hash)

# === Spotify ===
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=

# === AI ===
ANTHROPIC_API_KEY=

# === GitHub ===
GH_TOKEN=
GH_USERNAME=

# === Firebase ===
FIREBASE_PROJECT_ID=

# === Logging ===
LOG_LEVEL=error|warn|info|debug|http
ANALYZE=true|false

# === Server ===
PORT=4000
FRONTEND_ORIGIN=
TLS_KEY_PATH=
TLS_CERT_PATH=

# === Next.js Public ===
NEXT_PUBLIC_ANALYTICS_ENABLED=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_ROADMAP_AUTH_TOKEN=
NEXT_PUBLIC_ROADMAP_USER_ID=

# === Other ===
SECRET_KEY=
CUSTOM_KEY=
NPM_PACKAGE_VERSION=
```

---

## 🖥️ Frontend Analysis

### 1.9 Existing Serverless Router

File `packages/frontend/src/lib/trpc/serverless-router.ts` sudah memiliki:

**Already Implemented:**

- ✅ Basic tRPC setup dengan `initTRPC`
- ✅ Prisma client singleton (`getPrisma()`)
- ✅ Redis client singleton (`getRedis()`)
- ✅ Basic rate limiting (`checkRateLimit()`)
- ✅ Health router (check, detailed)
- ✅ Auth router (partial - login, logout, refresh)
- ✅ Spotify router (stub - returns `{ isPlaying: false }`)
- ✅ Security router (validateInput, checkRateLimit)
- ✅ Projects router (get with database query)

**Needs Enhancement:**

- ⚠️ Auth router tidak lengkap (perlu full token management)
- ⚠️ Spotify router hanya stub
- ⚠️ Security service functions (XSS, SQLi protection)
- ⚠️ Rate limiting perlu Redis support
- ⚠️ Audit logging belum ada

### 1.10 Frontend API Routes

Current routes di `packages/frontend/src/app/api/`:

- `api/trpc/[trpc]/route.ts` - tRPC handler

---

## 📄 Files to Create

### Phase 2 - Core Infrastructure

```
src/server/
├── db/
│   ├── prisma.ts           # Prisma client singleton
│   └── index.ts
├── redis/
│   ├── client.ts           # Upstash Redis client
│   └── index.ts
├── config/
│   ├── env.ts              # Environment validation
│   └── index.ts
└── utils/
    ├── logger.ts           # Winston logger
    └── index.ts
```

### Phase 3 - Service Layer

```
src/server/services/
├── auth.service.ts
├── security.service.ts     # ~800+ lines
├── audit-log.service.ts
├── blog.service.ts
├── projects.service.ts
├── spotify.service.ts
├── ai.service.ts
├── health.service.ts
└── index.ts
```

### Phase 4 - API Routes

```
src/app/api/
├── trpc/
│   └── [trpc]/route.ts
├── auth/
│   ├── login/route.ts
│   ├── logout/route.ts
│   └── refresh/route.ts
├── health/
│   └── route.ts
├── spotify/
│   └── now-playing/route.ts
└── ai/
    └── chat/route.ts
```

### Phase 5 - Security

```
src/middleware.ts           # Next.js middleware
src/server/middleware/
├── rate-limiter.ts
├── csrf.ts
├── security-headers.ts
└── auth-guard.ts
```

---

## ✅ Phase 1 Completion Checklist

- [x] All backups completed (backup branch created: `backup/pre-migration`)
- [x] Migration branch created (`feature/nextjs-migration`)
- [x] Current state documented (API responses documented in `phase-1-api-responses.md`)
- [x] All NestJS modules inventoried (including AdminModule)
- [x] All services mapped
- [x] All tRPC routers listed
- [x] All middleware identified
- [x] Environment variables documented
- [x] Frontend analysis complete
- [x] File structure planned

---

## ➡️ Next Step

Proceed to **[Phase 2: Core Infrastructure Setup](./phase-2-core-infrastructure.md)**
