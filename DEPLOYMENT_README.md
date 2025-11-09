# Trading App CI/CD Setup Guide

This guide explains how to set up the CI/CD pipeline for deploying the trading application to AWS Lightsail.

## 🚀 Prerequisites

1. **AWS Lightsail Instance** running Ubuntu 22.04
2. **GitHub Repository** with the application code
3. **SSH Key Pair** for deployment
4. **Domain Name** (optional, for production)

## 📋 Setup Steps

### 1. Server Preparation

Connect to your Lightsail instance and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm postgresql-client git curl unzip

# Install PM2 for process management (alternative to systemd)
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /home/ubuntu/trading-app
sudo chown ubuntu:ubuntu /home/ubuntu/trading-app
cd /home/ubuntu/trading-app

# Clone repository
git clone https://github.com/yourusername/your-repo.git .
```

### 2. Environment Configuration

Create production environment file on your server:

```bash
cd /home/ubuntu/trading-app
cp .env.production.example .env.production
nano .env.production
```

**Required Environment Variables:**

```bash
# Database (REQUIRED for Prisma)
DATABASE_URL="postgresql://username:password@database-host:5432/trading_app?schema=public&connection_limit=20&pool_timeout=30&connection_timeout=15"

# NextAuth (REQUIRED for authentication)
NEXTAUTH_SECRET="your-production-nextauth-secret-here-generate-a-secure-random-string"
NEXTAUTH_URL="https://yourdomain.com"

# Application (REQUIRED)
NODE_ENV="production"
APP_ENV="production"
PORT=4000

# Security (REQUIRED)
SANDBOX_MODE="false"
MOCK_BROKER_API="false"
SKIP_REAL_TRADING="false"
```

**Important Notes:**
- Prisma commands (`prisma generate`, `prisma db push`) require `DATABASE_URL` to be set
- The deployment scripts automatically load `.env.production` or `.env` files
- Environment variables must be available during build and runtime
- Generate a secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`

### 3. PM2 Configuration

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'trading-app',
    script: 'npm start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

### 4. Nginx Configuration (Optional)

For production with domain:

```bash
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/trading-app

# Add:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/trading-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 🔑 GitHub Secrets Setup

In your GitHub repository, go to Settings → Secrets and variables → Actions and add:

### Required Secrets:
- `LIGHTSAIL_HOST` - Your Lightsail instance IP address
- `LIGHTSAIL_USER` - Usually `ubuntu`
- `LIGHTSAIL_SSH_KEY` - Private SSH key (generate with `ssh-keygen`)
- `LIGHTSAIL_PORT` - Usually `22`

### Optional Secrets:
- `SLACK_WEBHOOK` - For deployment notifications

### SSH Key Setup:

1. Generate SSH key pair on your local machine:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"
```

2. Copy public key to server:
```bash
ssh-copy-id ubuntu@your-instance-ip
```

3. Add private key to GitHub secret `LIGHTSAIL_SSH_KEY`:
```bash
cat ~/.ssh/id_rsa
# Copy the entire output to GitHub secret
```

## 🚀 Deployment Workflow

### Automatic Deployment
- Push to `master` or `main` branch → Automatic deployment
- Pull requests → Run tests only

### Manual Deployment
1. Go to GitHub Actions tab
2. Select "Deploy to Lightsail" workflow
3. Click "Run workflow"
4. Choose environment (production/staging)

### Pre-deployment Validation
```bash
# Validate environment setup before deployment
npm run validate-env
```

This script checks:
- Environment variables are loaded
- Database connection works
- Prisma schema is valid
- Application builds successfully

## 📊 Monitoring & Troubleshooting

### Check Application Status
```bash
# PM2 status
pm2 status

# Application logs
pm2 logs trading-app

# Health check
curl http://localhost:4000/api/health
```

### View Deployment Logs
```bash
# GitHub Actions logs in repository Actions tab
# Server logs in /home/ubuntu/trading-app/logs/
```

### Rollback Deployment
```bash
npm run rollback
```

## 🔧 Troubleshooting

### Environment Variable Issues
```bash
# Check if environment variables are loaded
cd /home/ubuntu/trading-app
cat .env.production

# Test database connection
export $(cat .env.production | xargs)
npx prisma db push --preview-feature

# Check Prisma client generation
npx prisma generate
```

### Database Connection Issues
```bash
# Test database connectivity
psql "$DATABASE_URL" -c "SELECT 1;"

# Check Prisma schema
npx prisma validate
```

### Deployment Failures
```bash
# Check PM2 logs
pm2 logs trading-app

# Check application health
curl http://localhost:4000/api/health

# Restart application
pm2 restart trading-app
```

### Rollback Issues
```bash
# Check available backups
ls -la /home/ubuntu/trading-app/backups/

# Manual rollback
npm run rollback
```

## 📞 Support

If deployment fails:
1. Check GitHub Actions logs
2. SSH into server and check PM2 logs
3. Verify environment variables
4. Test health endpoint
5. Use rollback if needed

## 🎯 Pipeline Features

✅ **Automated Testing** - Linting and API tests  
✅ **Build Verification** - Ensures successful builds  
✅ **Database Migrations** - Automatic Prisma updates  
✅ **Zero-downtime Deployment** - Service restart with health checks  
✅ **Automatic Backups** - Pre-deployment snapshots  
✅ **Rollback Capability** - Quick reversion on failures  
✅ **Slack Notifications** - Deployment status alerts  
✅ **Health Monitoring** - Post-deployment verification  

This CI/CD pipeline ensures reliable, automated deployments with safety features and monitoring capabilities.