# CI/CD Pipeline Documentation

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the Portfolio application.

## Overview

The CI/CD pipeline is built with GitHub Actions and consists of two main workflows:

1. **CI Pipeline** (`ci.yml`) - Runs on every push and PR
2. **CD Pipeline** (`cd-production.yml`) - Deploys to production after CI passes

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CI Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push/PR → Lint → Test → Build → E2E Tests → Docker Build       │
│                    ↓                                             │
│              Security Scan                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓ (main branch only)
┌─────────────────────────────────────────────────────────────────┐
│                         CD Pipeline                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Deploy → Health Check → Migrations → Cleanup → Notify          │
│                    ↓ (on failure)                                │
│                 Rollback                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## CI Pipeline Jobs

### 1. Lint & Type Check

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Bun
      - Install dependencies
      - Run ESLint
      - Run TypeScript type check
```

**Purpose:** Catch code quality issues early

### 2. Unit & Integration Tests

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      - postgres:16-alpine
      - redis:7-alpine
    steps:
      - Setup environment
      - Run Prisma migrations
      - Execute tests
      - Upload coverage
```

**Purpose:** Verify business logic and integrations

### 3. Build

```yaml
jobs:
  build:
    strategy:
      matrix:
        package: [frontend, backend]
    steps:
      - Build application
      - Upload artifacts
```

**Purpose:** Ensure code compiles without errors

### 4. E2E Tests (Playwright)

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
```

**Purpose:** Test critical user journeys (PR only)

### 5. Docker Build

```yaml
jobs:
  docker-build:
    needs: [test, build]
    if: github.ref == 'refs/heads/main'
    steps:
      - Build Docker images
      - Push to GHCR
```

**Purpose:** Create production-ready container images

### 6. Security Scan

```yaml
jobs:
  security:
    steps:
      - Run Trivy vulnerability scanner
      - Upload SARIF results
```

**Purpose:** Detect security vulnerabilities

## CD Pipeline Jobs

### 1. Deploy

```yaml
jobs:
  deploy:
    environment: production
    steps:
      - Setup SSH connection
      - Copy deployment files
      - Create environment file
      - Pull latest images
      - Deploy with zero-downtime
      - Run health checks
      - Execute migrations
      - Cleanup old resources
```

### 2. Rollback (on failure)

```yaml
jobs:
  rollback:
    if: failure()
    steps:
      - Restore previous version
      - Notify team
```

## Required Secrets

Configure these in GitHub repository settings → Secrets and variables → Actions:

### Repository Secrets

| Secret Name            | Description                    |
|------------------------|--------------------------------|
| `VPS_SSH_PRIVATE_KEY`  | SSH key for VPS access         |
| `VPS_HOST`             | VPS IP address or hostname     |
| `VPS_USER`             | SSH username (e.g., `deploy`)  |
| `POSTGRES_USER`        | Database username              |
| `POSTGRES_PASSWORD`    | Database password              |
| `POSTGRES_DB`          | Database name                  |
| `REDIS_PASSWORD`       | Redis password                 |
| `JWT_SECRET`           | JWT signing secret             |
| `JWT_REFRESH_SECRET`   | JWT refresh token secret       |
| `SESSION_SECRET`       | Session secret                 |
| `SPOTIFY_CLIENT_ID`    | Spotify API client ID          |
| `SPOTIFY_CLIENT_SECRET`| Spotify API secret             |
| `SPOTIFY_REFRESH_TOKEN`| Spotify refresh token          |
| `ADMIN_EMAIL`          | Admin user email               |
| `ADMIN_PASSWORD`       | Admin user password            |
| `SLACK_WEBHOOK_URL`    | Slack notification webhook     |
| `CODECOV_TOKEN`        | Codecov upload token           |

### Repository Variables

| Variable Name          | Description                    |
|------------------------|--------------------------------|
| `DOMAIN`               | Production domain              |
| `PRODUCTION_URL`       | Full production URL            |
| `CORS_ORIGIN`          | Allowed CORS origins           |
| `NEXT_PUBLIC_API_URL`  | Public API URL                 |
| `NEXT_PUBLIC_APP_URL`  | Public app URL                 |

## Environment Configuration

### Development Environment

Not deployed automatically. Use `docker compose up` locally.

### Production Environment

Protected environment with required reviewers:
1. Go to Settings → Environments
2. Create `production` environment
3. Add required reviewers
4. Set deployment branch to `main`

## Branch Protection Rules

Configure for `main` branch:

- [x] Require pull request before merging
- [x] Require status checks to pass
  - `lint`
  - `test`
  - `build`
- [x] Require branches to be up to date
- [x] Require signed commits (optional)

## Dependabot Configuration

Automated dependency updates are configured in `.github/dependabot.yml`:

- Weekly updates for npm packages
- Weekly updates for GitHub Actions
- Weekly updates for Docker base images

Updates are grouped by:
- Production dependencies
- Development dependencies
- Next.js ecosystem
- NestJS ecosystem
- UI libraries

## Workflow Triggers

### CI Pipeline Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

### CD Pipeline Triggers

```yaml
on:
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]
    branches: [main]
```

## Caching Strategy

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.bun/install/cache
      node_modules
      packages/*/node_modules
      tools/*/node_modules
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
```

Benefits:
- Faster dependency installation
- Reduced CI time by 60-70%

## Docker Image Strategy

Images are tagged with:
- `latest` - Latest main branch build
- `{branch}` - Branch name
- `{sha}` - Commit SHA (7 characters)

Example:
```
ghcr.io/yourblooo/portfolio/frontend:latest
ghcr.io/yourblooo/portfolio/frontend:main
ghcr.io/yourblooo/portfolio/frontend:abc1234
```

## Notifications

### Slack Integration

Notifications sent on:
- Deployment success
- Deployment failure
- Rollback executed

Configure `SLACK_WEBHOOK_URL` secret with your Slack incoming webhook.

## Monitoring CI/CD

### GitHub Actions Dashboard

View workflow runs at:
`https://github.com/{owner}/{repo}/actions`

### Failed Workflow Debugging

1. Check the failed job logs
2. Review artifact uploads
3. SSH into runner if needed (self-hosted)

## Performance Optimization

### Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Cancels in-progress runs for the same branch.

### Matrix Builds

```yaml
strategy:
  matrix:
    package: [frontend, backend]
```

Builds run in parallel.

### Conditional Jobs

```yaml
if: github.ref == 'refs/heads/main'
```

Only runs on main branch.

## Troubleshooting

### CI Failures

1. **Lint errors**: Fix ESLint/TypeScript issues locally
2. **Test failures**: Check test logs, run locally with same DB
3. **Build failures**: Verify dependencies and environment variables

### CD Failures

1. **SSH connection**: Verify VPS is accessible, keys are correct
2. **Docker pull**: Check GHCR authentication
3. **Health check**: Review container logs on VPS

### Common Issues

| Issue | Solution |
|-------|----------|
| Bun cache issues | Clear cache: `rm -rf ~/.bun` |
| Docker build fails | Check Dockerfile syntax |
| Migration fails | Verify DATABASE_URL |
| SSL errors | Renew certificates |

## Manual Deployment

If automated deployment fails:

```bash
# SSH into VPS
ssh deploy@your-vps

# Navigate to project
cd ~/portfolio

# Manual deploy
./scripts/docker-deploy.sh
```

## Security Considerations

1. **Secrets**: Never commit secrets to repository
2. **SSH Keys**: Use deploy keys, not personal keys
3. **Container Registry**: Use private registry (GHCR)
4. **Environment**: Separate dev/staging/production secrets

## Future Improvements

- [ ] Add staging environment
- [ ] Implement canary deployments
- [ ] Add performance testing
- [ ] Set up log aggregation
- [ ] Add infrastructure as code (Terraform)
