// PM2 Ecosystem Configuration
// Usage:
//   Local development: pm2 start ecosystem.config.js
//   Production server: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [{
    name: 'trading-app',
    script: './node_modules/.bin/next',
    args: 'start',
    cwd: process.cwd(), // Explicitly set to current working directory
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      cwd: '/home/bitnami/trading-app'  // Only set for production server
    },
    // Log files - will be created in current directory for local dev
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};