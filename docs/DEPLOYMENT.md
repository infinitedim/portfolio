# Production Deployment Guide

This document explains how to deploy the Portfolio application to a production VPS using Docker.

## Prerequisites

### VPS Requirements
- Ubuntu 22.04 LTS or Debian 12
- Minimum 2GB RAM, 2 vCPU
- 20GB SSD storage
- Docker Engine 24.0+
- Docker Compose v2.20+

### Domain Setup
- Domain pointed to VPS IP address
- DNS A record configured

## Initial Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker compose version
```

### 3. Install Certbot (for SSL)

```bash
sudo apt install certbot -y
```

### 4. Create Application Directory

```bash
mkdir -p ~/portfolio
cd ~/portfolio
```

## Deployment Steps

### 1. Clone Repository (First Time)

```bash
git clone https://github.com/yourblooo/portfolio.git ~/portfolio
cd ~/portfolio
```

### 2. Configure Environment

Create `.env` file with production values:

```bash
cat > .env << 'EOF'
# Docker
DOCKER_REGISTRY=ghcr.io
DOCKER_REPO=yourblooo/portfolio
IMAGE_TAG=latest
DOMAIN=yourdomain.com

# Database
POSTGRES_USER=portfolio
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=portfolio

# Redis
REDIS_PASSWORD=STRONG_REDIS_PASSWORD_HERE

# JWT (generate with: openssl rand -base64 64)
JWT_SECRET=YOUR_JWT_SECRET
JWT_REFRESH_SECRET=YOUR_JWT_REFRESH_SECRET
SESSION_SECRET=YOUR_SESSION_SECRET

# URLs
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Spotify
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=STRONG_ADMIN_PASSWORD
EOF

# Secure the file
chmod 600 .env
```

### 3. Setup SSL Certificates

```bash
# Create directories
mkdir -p docker/nginx/ssl
mkdir -p docker/nginx/certbot/www

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates (or symlink)
sudo cp -rL /etc/letsencrypt/live/yourdomain.com docker/nginx/ssl/

# Set permissions
sudo chown -R $USER:$USER docker/nginx/ssl
```

### 4. Update Nginx Configuration

Edit `docker/nginx/nginx.prod.conf` and replace `${DOMAIN}` with your domain.

### 5. Deploy

```bash
# Login to container registry
echo $GITHUB_TOKEN | docker login ghcr.io -u yourblooo --password-stdin

# Pull images
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec backend bunx prisma migrate deploy

# Check status
docker compose -f docker-compose.prod.yml ps
```

### 6. Verify Deployment

```bash
# Run health check
./scripts/health-check.sh

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

## SSL Certificate Renewal

### Automatic Renewal (with Certbot container)

The `docker-compose.prod.yml` includes a certbot container that auto-renews certificates.

### Manual Renewal

```bash
# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Renew certificates
sudo certbot renew

# Copy new certificates
sudo cp -rL /etc/letsencrypt/live/yourdomain.com docker/nginx/ssl/

# Restart nginx
docker compose -f docker-compose.prod.yml start nginx
```

## Updating the Application

### Via GitHub Actions (Automated)

Push to `main` branch triggers automatic deployment via CI/CD pipeline.

### Manual Update

```bash
# Pull latest code
git pull origin main

# Pull new images
docker compose -f docker-compose.prod.yml pull

# Deploy with zero downtime
./scripts/docker-deploy.sh

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec backend bunx prisma migrate deploy
```

## Rollback

If something goes wrong:

```bash
# Quick rollback to previous
./scripts/rollback.sh previous

# Rollback from specific backup
./scripts/rollback.sh backup backup-20240115-120000.tar.gz

# Restore database
./scripts/rollback.sh database db-20240115-120000.sql.gz
```

## Monitoring

### Check Service Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Health Check

```bash
./scripts/health-check.sh
```

### Resource Usage

```bash
docker stats
```

## Backup Strategy

### Automatic Backups

The deployment script creates backups automatically. Backups are stored in `~/portfolio-backups/`.

### Manual Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U portfolio portfolio | gzip > backup-$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c backup-20240115.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U portfolio portfolio
```

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS configured correctly
- [ ] Firewall enabled (UFW)
- [ ] Docker socket not exposed
- [ ] Environment file secured (chmod 600)
- [ ] Regular security updates
- [ ] Rate limiting enabled in Nginx
- [ ] Fail2ban installed

### Firewall Setup

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

## Troubleshooting

### Container not starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs backend

# Verify environment
docker compose -f docker-compose.prod.yml config
```

### Database connection issues

```bash
# Check PostgreSQL status
docker compose -f docker-compose.prod.yml exec postgres pg_isready

# Check network
docker network inspect portfolio_portfolio-internal
```

### SSL issues

```bash
# Test SSL
openssl s_client -connect yourdomain.com:443

# Check certificate expiry
sudo certbot certificates
```

### Out of disk space

```bash
# Clean up Docker resources
docker system prune -af

# Remove old backups
ls -la ~/portfolio-backups/
rm ~/portfolio-backups/old-backup.tar.gz
```

## Useful Commands

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# View container resource usage
docker stats --no-stream

# Clean up unused resources
docker system prune -af
```

## Support

For issues or questions:
1. Check the [troubleshooting](#troubleshooting) section
2. Review logs with `docker compose logs`
3. Open an issue on GitHub
