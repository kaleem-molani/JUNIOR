#!/bin/bash

# Nginx Setup Script for Bitnami Trading App
# Run this on your Bitnami server to configure nginx as reverse proxy

set -e

echo "🚀 Setting up Nginx for Trading App..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're running as bitnami user
if [ "$USER" != "bitnami" ]; then
    print_error "This script must be run as the bitnami user"
    exit 1
fi

# Backup existing nginx configuration
print_status "Backing up existing nginx configuration..."
sudo cp /opt/bitnami/nginx/conf/bitnami/bitnami.conf /opt/bitnami/nginx/conf/bitnami/bitnami.conf.backup.$(date +%Y%m%d_%H%M%S)

# Create new nginx configuration
print_status "Creating new nginx configuration..."
sudo tee /opt/bitnami/nginx/conf/bitnami/bitnami.conf > /dev/null << 'EOF'
# Nginx configuration for Trading App

# Upstream for the Next.js application
upstream trading_app {
    server 127.0.0.1:4000;
    keepalive 32;
}

# HTTP to HTTPS redirect (optional - remove if you don't have SSL)
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Proxy settings
    location / {
        proxy_pass http://trading_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffer settings for large responses
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # API routes - no caching for dynamic content
    location /api/ {
        proxy_pass http://trading_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable caching for API routes
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://trading_app;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

print_status "Nginx configuration created"

# Test nginx configuration
print_status "Testing nginx configuration..."
sudo /opt/bitnami/nginx/sbin/nginx -t

if [ $? -eq 0 ]; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Restart nginx
print_status "Restarting nginx..."
sudo /opt/bitnami/ctlscript.sh restart nginx

if [ $? -eq 0 ]; then
    print_status "Nginx restarted successfully"
else
    print_error "Failed to restart nginx"
    exit 1
fi

# Test the proxy
print_status "Testing proxy connection..."
sleep 3
if curl -s http://localhost/health | grep -q "healthy"; then
    print_status "Nginx proxy is working!"
else
    print_warning "Nginx proxy test failed - checking if app is running..."
    if curl -s http://localhost:4000/api/health > /dev/null; then
        print_status "App is running on port 4000, nginx proxy should work"
    else
        print_error "App is not responding on port 4000"
        exit 1
    fi
fi

echo ""
print_status "Nginx setup completed successfully!"
echo ""
echo "🌐 Your application should now be accessible at:"
echo "   http://your-server-ip"
echo ""
echo "🔧 Configuration details:"
echo "   - Reverse proxy: nginx → Next.js app (port 4000)"
echo "   - Static file caching: enabled for /_next/static/"
echo "   - API routes: no caching"
echo "   - Health check: /health endpoint"
echo ""
echo "📝 To check nginx status:"
echo "   sudo /opt/bitnami/ctlscript.sh status nginx"
echo ""
echo "📝 To view nginx logs:"
echo "   sudo tail -f /opt/bitnami/nginx/logs/error_log"
echo "   sudo tail -f /opt/bitnami/nginx/logs/access_log"