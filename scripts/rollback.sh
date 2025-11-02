#!/bin/bash

# Rollback script
set -e

APP_DIR="/home/ubuntu/trading-app"
BACKUP_DIR="$APP_DIR/backups"

echo "🔄 Starting rollback..."

# Find latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backup found!"
    exit 1
fi

echo "Rolling back to: $LATEST_BACKUP"

# Stop application
pm2 stop trading-app

# Restore backup
rm -rf $APP_DIR/.next
cp -r $BACKUP_DIR/$LATEST_BACKUP $APP_DIR/.next

# Start application
pm2 start ecosystem.config.js --env production

echo "✅ Rollback completed!"