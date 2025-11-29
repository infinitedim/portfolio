#!/bin/bash

# ============================================================================
# Rollback Script for Portfolio Services
# Rolls back to a previous deployment version
# ============================================================================

set -Eeuo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="$HOME/portfolio-backups"

# Helper functions
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

echo "🔄 Portfolio Rollback"
echo "===================="
echo ""

# ============================================================================
# List available backups
# ============================================================================
list_backups() {
    echo -e "${BLUE}Available backups:${NC}"
    echo "──────────────────"

    if [ ! -d "$BACKUP_DIR" ]; then
        warning "No backup directory found"
        return 1
    fi

    local count=0
    for backup in "$BACKUP_DIR"/backup-*.tar.gz; do
        if [ -f "$backup" ]; then
            count=$((count + 1))
            local filename=$(basename "$backup")
            local date_str=$(echo "$filename" | sed 's/backup-\([0-9]*\)-\([0-9]*\).*/\1-\2/')
            local size=$(du -h "$backup" | cut -f1)
            echo "  $count) $filename ($size)"
        fi
    done

    if [ $count -eq 0 ]; then
        warning "No backups found in $BACKUP_DIR"
        return 1
    fi

    echo ""
    return 0
}

# ============================================================================
# Rollback to previous image tag
# ============================================================================
rollback_to_previous() {
    info "Rolling back to previous deployment..."

    # Check if we have the last working config
    if [ -f "$BACKUP_DIR/last-working-config.yml" ]; then
        info "Found last working configuration"

        # Stop current services
        docker compose -f "$COMPOSE_FILE" down

        # Restore from last working config
        cp "$BACKUP_DIR/last-working-config.yml" "$COMPOSE_FILE"

        # Start services
        docker compose -f "$COMPOSE_FILE" up -d

        success "Rolled back to last working configuration"
    else
        error "No previous configuration found for rollback"
    fi
}

# ============================================================================
# Rollback from backup
# ============================================================================
rollback_from_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi

    info "Extracting backup: $backup_file"

    # Create temp directory
    local temp_dir=$(mktemp -d)
    trap "rm -rf $temp_dir" EXIT

    # Extract backup
    tar -xzf "$backup_file" -C "$temp_dir"

    # Stop current services
    info "Stopping current services..."
    docker compose -f "$COMPOSE_FILE" down

    # Restore files
    info "Restoring configuration files..."
    cp "$temp_dir/$COMPOSE_FILE" "$COMPOSE_FILE" 2>/dev/null || true
    cp "$temp_dir/.env" ".env" 2>/dev/null || true
    cp -r "$temp_dir/docker/nginx" "docker/" 2>/dev/null || true

    # Start services
    info "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d

    success "Rollback completed from: $backup_file"
}

# ============================================================================
# Rollback database
# ============================================================================
rollback_database() {
    local db_backup="$1"

    if [ ! -f "$db_backup" ]; then
        error "Database backup not found: $db_backup"
    fi

    warning "This will replace the current database with the backup!"
    echo -n "Are you sure? (yes/no): "
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        info "Database rollback cancelled"
        return 0
    fi

    info "Restoring database from: $db_backup"

    # Decompress if needed
    if [[ "$db_backup" == *.gz ]]; then
        gunzip -k "$db_backup"
        db_backup="${db_backup%.gz}"
    fi

    # Load environment
    source .env

    # Restore database
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$db_backup"

    success "Database restored from backup"
}

# ============================================================================
# Main menu
# ============================================================================
main() {
    case "${1:-menu}" in
        "previous")
            rollback_to_previous
            ;;
        "backup")
            if [ -z "${2:-}" ]; then
                list_backups
                echo -n "Enter backup number: "
                read -r num
                backup_file=$(ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | sed -n "${num}p")
            else
                backup_file="$2"
            fi
            rollback_from_backup "$backup_file"
            ;;
        "database")
            if [ -z "${2:-}" ]; then
                echo -e "${BLUE}Available database backups:${NC}"
                ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -5
                echo -n "Enter backup filename: "
                read -r backup_file
            else
                backup_file="$2"
            fi
            rollback_database "$backup_file"
            ;;
        "list")
            list_backups
            ;;
        "menu"|*)
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  previous          Rollback to previous deployment"
            echo "  backup [file]     Rollback from a specific backup"
            echo "  database [file]   Restore database from backup"
            echo "  list              List available backups"
            echo ""
            list_backups 2>/dev/null || true
            ;;
    esac
}

main "$@"
