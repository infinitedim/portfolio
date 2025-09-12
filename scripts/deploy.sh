#!/bin/bash

# Terminal Portfolio Monorepo - Vercel Deployment Script (Turborepo + Bun)
# This script handles pre-deployment checks and deployment of the frontend app to Vercel

set -Eeuo pipefail  # Exit on error/undefined vars, and fail on pipe errors

echo "🚀 Terminal Portfolio - Vercel Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

ROOT_DIR=$(pwd)
FRONTEND_DIR="packages/frontend"

# Check root and frontend package.json
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the monorepo root."
fi
if [ ! -d "$FRONTEND_DIR" ] || [ ! -f "$FRONTEND_DIR/package.json" ]; then
    error "Frontend app not found at $FRONTEND_DIR. Ensure the monorepo structure is correct."
fi

info "Starting pre-deployment checks..."

# 1. Check Bun and Node versions
if ! command -v bun >/dev/null 2>&1; then
    error "Bun is required. Install from https://bun.sh (e.g., 'curl -fsSL https://bun.sh/install | bash')."
fi

BUN_VERSION=$(bun --version)
NODE_VERSION=$(node --version || echo "not found")
info "Bun version: $BUN_VERSION"
info "Node.js version: $NODE_VERSION"

# 2. Install dependencies (root workspace)
info "Installing dependencies with Bun..."
bun install
success "Dependencies installed"

# 3. Run type checking via Turborepo
info "Running type checking across workspace..."
if bun run type-check; then
    success "Type checking passed"
else
    error "Type checking failed. Please fix TypeScript errors before deployment."
fi

# 4. Run linting via Turborepo
info "Running ESLint across workspace..."
if bun run lint; then
    success "Linting passed"
else
    warning "Linting issues found. Consider fixing them before deployment."
fi

# 5. Run tests via Turborepo (non-blocking unless you prefer strict)
if bun run test; then
    success "Tests passed"
else
    warning "No tests found or tests failed"
fi

# 6. Build frontend only (with Turborepo filter)
info "Building frontend project..."
if bun x turbo run build --filter=@portfolio/frontend...; then
    success "Frontend build completed successfully"
else
    error "Frontend build failed. Please fix build errors before deployment."
fi

# 7. Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    info "Installing Vercel CLI globally..."
    npm install -g vercel || true
fi
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI not available. Install it or ensure it is on PATH."
fi

# 8. Environment check
if [ -f "$FRONTEND_DIR/.env.local" ] || [ -f ".env" ] || [ -f ".env.local" ]; then
    warning "Local env files detected. Ensure all required variables are configured in Vercel project settings."
fi

# 9. Check for security vulnerabilities (optional)
if command -v npm &> /dev/null; then
    info "Checking for security vulnerabilities (npm audit)..."
    if npm audit --audit-level=high; then
        success "No high-severity vulnerabilities found"
    else
        warning "Security vulnerabilities detected. Consider running 'npm audit fix' locally."
    fi
else
    info "npm not available; skipping npm audit."
fi

# 10. Performance check - bundle size (frontend)
info "Checking frontend bundle size..."
BUILD_SIZE=$(du -sh "$FRONTEND_DIR/.next" 2>/dev/null | cut -f1 || echo "Unknown")
info "Frontend build size: $BUILD_SIZE"

# 11. Deployment options
echo ""
echo "Deployment Options:"
echo "1. Deploy to preview (default)"
echo "2. Deploy to production"
echo "3. Cancel deployment"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1|"")
        info "Deploying to preview environment (frontend)..."
        vercel --cwd "$FRONTEND_DIR" --confirm
        ;;
    2)
        warning "Deploying to PRODUCTION environment..."
        read -p "Are you sure? This will update the live site. (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            vercel --cwd "$FRONTEND_DIR" --prod --confirm
        else
            info "Production deployment cancelled"
            exit 0
        fi
        ;;
    3)
        info "Deployment cancelled"
        exit 0
        ;;
    *)
        error "Invalid option"
        ;;
esac

# 12. Post-deployment checks
info "Running post-deployment checks..."

# Get deployment URL from Vercel
DEPLOY_URL=""
if command -v jq >/dev/null 2>&1; then
    DEPLOY_URL=$(vercel ls --cwd "$FRONTEND_DIR" --limit=1 --format=json | jq -r '.[0].url' 2>/dev/null || echo "")
else
    # Fallback: try parse last line with grep/sed (best-effort)
    DEPLOY_URL=$(vercel ls --cwd "$FRONTEND_DIR" --limit=1 2>/dev/null | sed -n 's/.*\s\(.*\.vercel\.app\).*/\1/p' | head -n1)
fi

if [ -n "$DEPLOY_URL" ]; then
    info "Deployment URL: https://$DEPLOY_URL"
    
    # Health check
    info "Performing health check..."
    sleep 5  # Wait for deployment to be ready
    
    if curl -f -s "https://$DEPLOY_URL" > /dev/null || \
       curl -f -s "https://$DEPLOY_URL/api/health" > /dev/null || \
       curl -f -s "https://$DEPLOY_URL/healthz" > /dev/null ; then
        success "Health check passed"
    else
        warning "Health check failed or endpoint not available"
    fi
    
    # Performance check
    info "Performance check..."
    if command -v lighthouse &> /dev/null; then
        lighthouse "https://$DEPLOY_URL" --only-categories=performance --quiet --chrome-flags="--headless"
    else
        info "Lighthouse not installed. Skipping performance check."
    fi
    
else
    warning "Could not retrieve deployment URL"
fi

# 13. Cleanup (frontend cache)
info "Cleaning up frontend cache..."
rm -rf "$FRONTEND_DIR/.next/cache" 2>/dev/null || true

# 14. Summary
echo ""
echo "🎉 Deployment Summary"
echo "===================="
success "Deployment completed successfully!"

if [ -n "$DEPLOY_URL" ]; then
    echo ""
    echo "🔗 Your site is live at: https://$DEPLOY_URL"
    echo ""
    echo "📊 Quick actions:"
    echo "   - View site: https://$DEPLOY_URL"
    echo "   - Health check: https://$DEPLOY_URL/api/health"
    echo "   - Vercel dashboard: https://vercel.com/dashboard"
fi

echo ""
echo "🚀 Next steps:"
echo "   - Test all functionality on the deployed site"
echo "   - Monitor performance and error rates"
echo "   - Set up monitoring alerts if needed"
echo ""

success "Deployment script completed!" 