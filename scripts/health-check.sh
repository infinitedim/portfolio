#!/bin/bash

# ============================================================================
# Health Check Script for Portfolio Services
# Checks all services and reports their status
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TIMEOUT=10
EXIT_CODE=0

echo "🏥 Portfolio Health Check"
echo "========================="
echo ""

# Helper functions
check_service() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    echo -n "Checking $name... "

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null) || HTTP_CODE="000"

    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $HTTP_CODE)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE, expected $expected_code)"
        return 1
    fi
}

check_container() {
    local name="$1"

    echo -n "Container $name... "

    STATUS=$(docker inspect --format='{{.State.Status}}' "$name" 2>/dev/null) || STATUS="not found"
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$name" 2>/dev/null) || HEALTH="none"

    if [ "$STATUS" = "running" ]; then
        if [ "$HEALTH" = "healthy" ]; then
            echo -e "${GREEN}✓ running (healthy)${NC}"
        elif [ "$HEALTH" = "none" ]; then
            echo -e "${GREEN}✓ running${NC}"
        else
            echo -e "${YELLOW}⚠ running ($HEALTH)${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ $STATUS${NC}"
        return 1
    fi
}

check_database() {
    echo -n "PostgreSQL connection... "

    if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${POSTGRES_USER:-portfolio}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

check_redis() {
    echo -n "Redis connection... "

    if docker compose -f docker-compose.prod.yml exec -T redis redis-cli -a "${REDIS_PASSWORD:-}" ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

check_disk_space() {
    echo -n "Disk space... "

    USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ "$USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ OK${NC} (${USAGE}% used)"
        return 0
    elif [ "$USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (${USAGE}% used)"
        return 0
    else
        echo -e "${RED}✗ CRITICAL${NC} (${USAGE}% used)"
        return 1
    fi
}

check_memory() {
    echo -n "Memory usage... "

    USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

    if [ "$USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ OK${NC} (${USAGE}% used)"
        return 0
    elif [ "$USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠ WARNING${NC} (${USAGE}% used)"
        return 0
    else
        echo -e "${RED}✗ CRITICAL${NC} (${USAGE}% used)"
        return 1
    fi
}

# ============================================================================
# Run checks
# ============================================================================

echo -e "${BLUE}Container Status:${NC}"
echo "─────────────────"
check_container "portfolio-frontend-prod" || EXIT_CODE=1
check_container "portfolio-backend-prod" || EXIT_CODE=1
check_container "portfolio-postgres-prod" || EXIT_CODE=1
check_container "portfolio-redis-prod" || EXIT_CODE=1
check_container "portfolio-nginx-prod" || EXIT_CODE=1
echo ""

echo -e "${BLUE}Service Endpoints:${NC}"
echo "──────────────────"
check_service "Frontend" "$FRONTEND_URL" || EXIT_CODE=1
check_service "Backend API" "$BACKEND_URL/health" || EXIT_CODE=1
check_service "Backend tRPC" "$BACKEND_URL/trpc" "404" || EXIT_CODE=1
echo ""

echo -e "${BLUE}Database Connections:${NC}"
echo "─────────────────────"
check_database || EXIT_CODE=1
check_redis || EXIT_CODE=1
echo ""

echo -e "${BLUE}System Resources:${NC}"
echo "─────────────────"
check_disk_space || EXIT_CODE=1
check_memory || EXIT_CODE=1
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "========================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}All health checks passed!${NC}"
else
    echo -e "${RED}Some health checks failed!${NC}"
fi

exit $EXIT_CODE
