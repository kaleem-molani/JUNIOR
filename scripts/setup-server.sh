#!/bin/bash

# Server Setup Script for Lightsail
# Run this ONCE to initialize the server

set -e

echo "🚀 Initializing Lightsail server for trading app..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create app directory with correct permissions
echo "📁 Creating app directory..."
sudo mkdir -p /home/ubuntu/trading-app
sudo chown ubuntu:ubuntu /home/ubuntu/trading-app
cd /home/ubuntu/trading-app

# Initialize git repository
echo "📦 Initializing git repository..."
git init
git config user.name "Trading App Deploy"
git config user.email "deploy@tradingapp.com"

# Add remote origin
echo "🔗 Adding GitHub remote..."
git remote add origin https://github.com/kaleem-molani/JUNIOR.git

# Pull the code
echo "📥 Pulling application code..."
git pull origin master || git pull origin main

# Set correct permissions
echo "🔐 Setting permissions..."
chmod -R 755 /home/ubuntu/trading-app
chmod 600 .env* 2>/dev/null || true

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install

# Generate package-lock.json
echo "🔒 Generating package lock..."
npm install --package-lock-only

# Generate Prisma client
echo "🗄️ Setting up Prisma..."
npx prisma generate

# Create logs directory for PM2
echo "📝 Creating logs directory..."
mkdir -p logs

echo "✅ Server initialization complete!"
echo ""
echo "Next steps:"
echo "1. Set up your environment variables in .env.production"
echo "2. Run database migrations: npx prisma db push"
echo "3. Start the application: pm2 start ecosystem.config.js --env production"
echo ""
echo "For automated deployments, the GitHub Actions workflow will now work."