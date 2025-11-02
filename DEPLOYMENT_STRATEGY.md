# Simplified Deployment Strategy

## Overview
We've switched to a much simpler deployment approach that builds directly on the server instead of using complex artifact uploads/downloads.

## How It Works
1. **GitHub Actions** triggers on push to master/main or manual dispatch
2. **SSH to server** and navigate to `/home/ubuntu/trading-app`
3. **Pull latest code** from Git repository
4. **Build on server** using `npm run build`
5. **Deploy with PM2** using `ecosystem.config.js`

## Benefits
- ✅ **No file transfer issues** - everything builds on the server
- ✅ **Simpler workflow** - fewer moving parts
- ✅ **Faster deployments** - no artifact upload/download
- ✅ **More reliable** - eliminates SCP and artifact complications
- ✅ **Easier debugging** - build happens where the app runs

## Deployment Flow
```
GitHub Push → SSH to Server → Git Pull → npm ci → npm run build → PM2 Restart → Health Check
```

## Environment Variables
The deployment automatically creates `.env.production` with:
- `DATABASE_URL` (from GitHub secrets)
- `NEXTAUTH_SECRET` (from GitHub secrets)
- `NEXTAUTH_URL=http://juniorinfo.in/`
- `NODE_ENV=production`
- `PORT=4000`

## Manual Deployment
If needed, you can run the deployment script manually on the server:
```bash
cd /home/ubuntu/trading-app
./scripts/deploy.sh production
```

## Troubleshooting
- Check PM2 logs: `pm2 logs trading-app`
- Verify build: `ls -la .next/`
- Check environment: `cat .env.production`
- Health check: `curl http://localhost:4000/api/health`

## Rollback
If deployment fails, the workflow will attempt automatic rollback to the previous `.next` backup.