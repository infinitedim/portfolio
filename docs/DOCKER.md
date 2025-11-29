# Docker Setup Guide

This document explains how to use Docker for local development and production deployment.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.20+
- Git

## Quick Start (Local Development)

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourblooo/portfolio.git
cd portfolio

# Copy environment template
cp .env.example .env
# Edit .env with your local settings
```

### 2. Start Development Environment

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 3. Access Services

| Service    | URL                    |
|------------|------------------------|
| Frontend   | http://localhost:3000  |
| Backend    | http://localhost:4000  |
| PostgreSQL | localhost:5432         |
| Redis      | localhost:6379         |
| Nginx      | http://localhost:80    |

## Docker Compose Files

| File                     | Purpose                          |
|--------------------------|----------------------------------|
| `docker-compose.yml`     | Local development environment    |
| `docker-compose.prod.yml`| Production deployment            |

## Dockerfile Reference

| File                            | Description                              |
|---------------------------------|------------------------------------------|
| `docker/Dockerfile.frontend.dev`| Frontend dev with hot reload            |
| `docker/Dockerfile.frontend.prod`| Frontend production (multi-stage)      |
| `docker/Dockerfile.backend.dev` | Backend dev with watch mode             |
| `docker/Dockerfile.backend.prod`| Backend production (multi-stage)        |

## Common Commands

### Development

```bash
# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend

# Rebuild and start
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Execute command in container
docker compose exec backend bun run prisma:migrate
docker compose exec backend bunx prisma studio

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

### Database Operations

```bash
# Run migrations
docker compose exec backend bunx prisma migrate dev

# Reset database
docker compose exec backend bunx prisma migrate reset

# Generate Prisma client
docker compose exec backend bunx prisma generate

# Access PostgreSQL CLI
docker compose exec postgres psql -U portfolio -d portfolio
```

### Debugging

```bash
# Check container status
docker compose ps

# Check container health
docker compose exec backend curl http://localhost:4000/health

# Inspect container
docker inspect portfolio-backend

# View container resources
docker stats
```

## Environment Variables

### Development (.env)

```env
# Database
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=portfolio_dev_password
POSTGRES_DB=portfolio

# Redis
REDIS_PASSWORD=redis_dev_password

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_change_in_production
SESSION_SECRET=dev_session_secret

# URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Volume Management

### Persistent Data
- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis persistence

### Development Volumes (bind mounts)
```yaml
volumes:
  - ./packages/backend:/app/packages/backend:delegated
  - /app/packages/backend/node_modules
```

The `:delegated` flag improves performance on macOS/Windows.

## Network Configuration

```
portfolio-network (bridge)
├── frontend:3000
├── backend:4000
├── postgres:5432
├── redis:6379
└── nginx:80,443
```

## Health Checks

All services have built-in health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs backend

# Verify environment
docker compose config

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Database connection issues

```bash
# Check if PostgreSQL is ready
docker compose exec postgres pg_isready

# Check network connectivity
docker compose exec backend ping postgres
```

### Hot reload not working

Ensure volumes are properly mounted and file watching is enabled:

```bash
# Restart with fresh volumes
docker compose down
docker compose up -d --force-recreate
```

### Permission issues on Linux

```bash
# Fix node_modules permissions
sudo chown -R $USER:$USER ./packages/*/node_modules
```

## Performance Tips

1. **Use BuildKit** for faster builds:
   ```bash
   DOCKER_BUILDKIT=1 docker compose build
   ```

2. **Cache dependencies** between builds by copying `package.json` first

3. **Use multi-stage builds** for smaller production images

4. **Limit container resources** in production:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

## Production Notes

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.
