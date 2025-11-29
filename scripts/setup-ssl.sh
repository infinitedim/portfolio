#!/bin/bash

# ============================================================================
# SSL Certificate Setup Script
# Generates SSL certificates using Let's Encrypt
# ============================================================================

set -euo pipefail

# Colors
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
SSL_DIR="docker/nginx/ssl"
CERTBOT_DIR="docker/nginx/certbot/www"

echo "🔐 SSL Certificate Setup"
echo "========================"
echo ""

# Get domain from environment or argument
DOMAIN="${1:-${DOMAIN:-}}"
EMAIL="${2:-${ADMIN_EMAIL:-}}"

if [ -z "$DOMAIN" ]; then
    echo -n "Enter your domain (e.g., example.com): "
    read -r DOMAIN
fi

if [ -z "$EMAIL" ]; then
    echo -n "Enter your email for Let's Encrypt: "
    read -r EMAIL
fi

# Create directories
mkdir -p "$SSL_DIR"
mkdir -p "$CERTBOT_DIR"

# ============================================================================
# Option 1: Self-signed certificate (Development)
# ============================================================================
generate_self_signed() {
    info "Generating self-signed certificate for development..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/CN=$DOMAIN" \
        -addext "subjectAltName=DNS:$DOMAIN,DNS:api.$DOMAIN,DNS:www.$DOMAIN"

    success "Self-signed certificate generated"
    warning "This certificate is for development only!"
}

# ============================================================================
# Option 2: Let's Encrypt certificate (Production)
# ============================================================================
generate_letsencrypt() {
    info "Generating Let's Encrypt certificate..."

    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        error "Certbot is not installed. Install with: sudo apt install certbot"
    fi

    # Check if domain resolves
    if ! host "$DOMAIN" > /dev/null 2>&1; then
        error "Domain $DOMAIN does not resolve. Please check your DNS settings."
    fi

    # Stop nginx if running
    docker compose -f docker-compose.prod.yml stop nginx 2>/dev/null || true

    # Request certificate
    sudo certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "api.$DOMAIN" \
        -d "www.$DOMAIN"

    # Copy certificates
    info "Copying certificates..."
    sudo cp -rL "/etc/letsencrypt/live/$DOMAIN/" "$SSL_DIR/"
    sudo chown -R "$USER:$USER" "$SSL_DIR"

    # Restart nginx
    docker compose -f docker-compose.prod.yml start nginx 2>/dev/null || true

    success "Let's Encrypt certificate generated!"
}

# ============================================================================
# Option 3: Use existing certificates
# ============================================================================
use_existing() {
    info "Please copy your certificates to:"
    echo "  - $SSL_DIR/fullchain.pem (certificate chain)"
    echo "  - $SSL_DIR/privkey.pem (private key)"
    echo ""
    info "Then restart nginx:"
    echo "  docker compose -f docker-compose.prod.yml restart nginx"
}

# ============================================================================
# Setup certbot auto-renewal
# ============================================================================
setup_renewal() {
    info "Setting up automatic certificate renewal..."

    # Create renewal script
    cat > /tmp/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
docker compose -f ~/portfolio/docker-compose.prod.yml exec nginx nginx -s reload
EOF

    sudo mv /tmp/renew-certs.sh /etc/cron.daily/renew-certs
    sudo chmod +x /etc/cron.daily/renew-certs

    success "Auto-renewal configured (runs daily)"
}

# ============================================================================
# Main menu
# ============================================================================
echo "Select SSL certificate option:"
echo "1) Self-signed (Development)"
echo "2) Let's Encrypt (Production)"
echo "3) Use existing certificates"
echo ""
echo -n "Enter choice [1-3]: "
read -r choice

case $choice in
    1)
        generate_self_signed
        ;;
    2)
        generate_letsencrypt
        setup_renewal
        ;;
    3)
        use_existing
        ;;
    *)
        error "Invalid choice"
        ;;
esac

echo ""
success "SSL setup complete!"
echo ""
info "Certificate location: $SSL_DIR"
info "Update nginx config domain and restart services"
