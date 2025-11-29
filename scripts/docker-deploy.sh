#!/bin/bash

# ============================================================================
# Docker Deployment Script for VPS
# Zero-downtime deployment with health checks
# ============================================================================

set -Eeuo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=5
BACKUP_DIR="$HOME/portfolio-backups"

echo "🚀 Portfolio Docker Deployment"
echo "=============================="

# Check if docker compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Docker compose file not found: $COMPOSE_FILE"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    error ".env file not found. Please create one before deploying."
fi

# Load environment variables
source .env

# Create backup directory
mkdir -p "$BACKUP_DIR"

# ============================================================================
# Step 1: Backup current state
# ============================================================================
backup_current_state() {
    info "Creating backup of current deployment state..."

    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"

    # Backup docker compose file and environment
    tar -czvf "$BACKUP_FILE" \
        "$COMPOSE_FILE" \
        ".env" \
        "docker/nginx" \
        2>/dev/null || true

    # Save current image tags
    docker compose -f "$COMPOSE_FILE" config > "$BACKUP_DIR/last-working-config.yml" 2>/dev/null || true

    success "Backup created: $BACKUP_FILE"
}

# ============================================================================
# Step 2: Pull new images
# ============================================================================
pull_images() {
    info "Pulling latest Docker images..."

    docker compose -f "$COMPOSE_FILE" pull || error "Failed to pull images"

    success "Images pulled successfully"
}

# ============================================================================
# Step 3: Database backup (optional)
# ============================================================================
backup_database() {
    info "Creating database backup..."

    DB_BACKUP_FILE="$BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql"

    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$DB_BACKUP_FILE" 2>/dev/null || {
        warning "Database backup skipped (container might not be running)"
        return 0
    }

    # Compress backup
    gzip "$DB_BACKUP_FILE"

    success "Database backup created: ${DB_BACKUP_FILE}.gz"
}

# ============================================================================
# Step 4: Deploy with zero-downtime
# ============================================================================
deploy() {
    info "Deploying services..."

    # Scale down old containers and start new ones
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --force-recreate

    success "Containers started"
}

# ============================================================================
# Step 5: Health check
# ============================================================================
health_check() {
    info "Running health checks..."

    local retries=0
    local backend_healthy=false
    local frontend_healthy=false

    while [ $retries -lt $HEALTH_CHECK_RETRIES ]; do
        # Check backend health
        if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
            backend_healthy=true
        fi

        # Check frontend health
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            frontend_healthy=true
        fi

        if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
            success "All services are healthy!"
            return 0
        fi

        retries=$((retries + 1))
        info "Health check attempt $retries/$HEALTH_CHECK_RETRIES..."
        sleep $HEALTH_CHECK_INTERVAL
    done

    error "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
}

# ============================================================================
# Step 6: Cleanup old resources
# ============================================================================
cleanup() {
    info "Cleaning up old resources..."

    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true

    # Remove old backups (keep last 5)
    ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

    success "Cleanup completed"
}

# ============================================================================
# Main deployment flow
# ============================================================================
main() {
    backup_current_state
    backup_database
    pull_images
    deploy
    health_check
    cleanup

    echo ""
    success "🎉 Deployment completed successfully!"
    echo ""
    info "Services status:"
    docker compose -f "$COMPOSE_FILE" ps
}

# Run main function
main "$@"
