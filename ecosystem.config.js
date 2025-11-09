// PM2 Ecosystem Configuration
// Usage:
//   Local development: pm2 start ecosystem.config.js
//   Production server: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [{
    name: 'trading-app',
    script: 'npm',
    args: 'start',
    // cwd will be auto-detected if not specified (works for both local and server)
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',  // Reduced from 1G to prevent memory issues
    restart_delay: 5000,         // Wait 5 seconds before restart
    max_restarts: 5,             // Limit restart attempts
    min_uptime: '10s',           // App must stay up for 10 seconds
    env: {
      NODE_ENV: 'development',
      PORT: 4000,
      NODE_OPTIONS: '--max-old-space-size=512'  // Limit Node.js memory
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      cwd: '/home/bitnami/trading-app',  // Only set for production server
      NODE_OPTIONS: '--max-old-space-size=1024'  // Higher limit for production
    },
    // Log files - will be created in current directory for local dev
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Add merge_logs to prevent log file conflicts
    merge_logs: true
  }]
};