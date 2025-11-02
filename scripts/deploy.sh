#!/bin/bash

# Deployment script for manual deployments
set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/ubuntu/trading-app"
BACKUP_DIR="$APP_DIR/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create logs directory
mkdir -p $APP_DIR/logs

# Make scripts executable
chmod +x $APP_DIR/scripts/*.sh

# Function to log with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Backup current version
log "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_$TIMESTAMP"

if [ -d "$APP_DIR/.next" ]; then
    cp -r $APP_DIR/.next $BACKUP_DIR/$BACKUP_NAME
    log "Backup created: $BACKUP_NAME"
fi

# Stop application
log "Stopping application..."
pm2 stop trading-app || warn "Application was not running"

# Load environment variables
log "Loading environment variables..."
if [ -f ".env.production" ]; then
    export $(cat .env.production | xargs)
    log "Environment variables loaded from .env.production"
elif [ -f ".env" ]; then
    export $(cat .env | xargs)
    log "Environment variables loaded from .env"
else
    warn "No environment file found, using system environment variables"
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable is not set!"
    exit 1
fi

log "Database URL configured: ${DATABASE_URL:0:50}..."
log "Installing dependencies..."
npm ci --production

# Generate Prisma client
log "Generating Prisma client..."
npx prisma generate

# Run database migrations
log "Running database migrations..."
npx prisma db push --accept-data-loss

# Build application
log "Building application..."
npm run build

# Start application
log "Starting application..."
pm2 start ecosystem.config.js --env production

# Wait for startup
log "Waiting for application to start..."
sleep 15

# Health check
log "Running health check..."
if curl -f -s http://localhost:4000/api/health > /dev/null; then
    log "✅ Deployment successful!"
    log "Application is running and healthy"

    # Clean old backups (keep last 5)
    cd $BACKUP_DIR
    ls -t | tail -n +6 | xargs -r rm -rf
    log "Old backups cleaned up"
else
    error "❌ Health check failed!"
    warn "Application may not be responding correctly"
    exit 1
fi