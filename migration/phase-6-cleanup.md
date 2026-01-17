# Phase 6: Cleanup & Optimization

## 🎯 Tujuan Phase

Membersihkan kode lama, mengoptimasi performa, dan finalisasi migrasi.

**Estimasi Waktu: 1-2 hari**

---

## 📋 Task Checklist

### 6.1 Remove Backend Package

- [x] Verify all services migrated
- [ ] Remove `packages/backend` directory (deferred - keep for reference)
- [x] Update workspace configuration
- [x] Update Turborepo tasks

### 6.2 Update Dependencies

- [ ] Remove unused NestJS dependencies (deferred - keep for reference)
- [x] Update package.json scripts
- [ ] Clean up node_modules (manual step)

### 6.3 Update Configuration Files

- [x] Update root package.json
- [x] Update turbo.json
- [ ] Update docker-compose files (deferred - keep backend service commented)
- [ ] Update GitHub Actions (deferred)

### 6.4 Testing & Verification

- [ ] Run all tests (manual step)
- [ ] Test all API endpoints (manual step)
- [ ] Performance benchmarking (manual step)
- [ ] Security audit (manual step)

---

## 🏗️ Implementation Details

### 6.1 Remove Backend Package

#### 6.1.1 Pre-removal Verification

```bash
# Verify all API endpoints work
curl http://localhost:3000/api/health
curl http://localhost:3000/api/trpc/health
curl http://localhost:3000/api/trpc/projects.get

# Run frontend tests
cd packages/frontend
bun run test

# Verify build works
bun run build
```

#### 6.1.2 Remove Backend Directory

```bash
# Remove backend package
rm -rf packages/backend

# Remove from git (if not already)
git rm -rf packages/backend
```

---

### 6.2 Update Root package.json

```json
{
  "name": "portfolio",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.3.5",
  "workspaces": ["packages/frontend", "packages/ui", "tools/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "format": "npx prettier --write .",
    "prepare": "husky",
    "prisma:generate": "cd packages/frontend && bunx prisma generate",
    "prisma:migrate": "cd packages/frontend && bunx prisma migrate dev",
    "prisma:studio": "cd packages/frontend && bunx prisma studio"
  }
}
```

---

### 6.3 Update turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {},
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

### 6.4 Update Docker Configuration

**File:** `docker-compose.yml`

```yaml
version: "3.8"
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL}
      - UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN}
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-portfolio}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

### 6.5 Update Dockerfile

**File:** `docker/Dockerfile`

```dockerfile
FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/ui/package.json ./packages/ui/
RUN bun install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
WORKDIR /app/packages/frontend
RUN bunx prisma generate

# Build Next.js
RUN bun run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/packages/frontend/.next/standalone ./
COPY --from=builder /app/packages/frontend/.next/static ./.next/static
COPY --from=builder /app/packages/frontend/public ./public

EXPOSE 3000
CMD ["bun", "run", "server.js"]
```

---

### 6.6 Final Cleanup Commands

```bash
# Remove old lock files and node_modules
rm -rf node_modules
rm -rf packages/*/node_modules

# Reinstall dependencies
bun install

# Generate Prisma client
bun run prisma:generate

# Run type check
bun run type-check

# Run tests
bun run test

# Build for production
bun run build
```

---

## ✅ Final Verification Checklist

### Functionality

- [ ] Frontend builds successfully
- [ ] All API routes respond correctly
- [ ] Authentication flow works
- [ ] Protected routes secured
- [ ] Rate limiting active
- [ ] CSRF protection working

### Performance

- [ ] Build time acceptable
- [ ] API response times < 200ms
- [ ] No memory leaks

### Security

- [ ] No exposed secrets in code
- [ ] Security headers present
- [ ] No NestJS remnants

### Code Quality

- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] All tests pass

---

## 🎉 Migration Complete!

Setelah semua checklist selesai, migrasi dari NestJS + NextJS monorepo ke NextJS full-stack telah berhasil!

### Summary of Changes

1. ✅ Removed NestJS backend
2. ✅ Migrated all services to function-based TypeScript
3. ✅ Created NextJS API routes and tRPC handlers
4. ✅ Implemented security middleware
5. ✅ Unified codebase in NextJS

### Benefits Achieved

- Single framework to maintain
- Function-based architecture (consistent with React)
- Simplified deployment (single Vercel project)
- Reduced bundle size
- Better developer experience
