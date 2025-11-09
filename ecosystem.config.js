module.exports = {
  apps: [{
    name: 'trading-app',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    autorestart: false,           // Disable auto-restart to prevent loops
    watch: false,
    max_memory_restart: '400M',   // Conservative memory limit
    restart_delay: 30000,         // 30 second delay if manually restarted
    max_restarts: 1,              // Only 1 restart attempt
    min_uptime: '120s',           // Must stay up for 2 minutes
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOST: '127.0.0.1',          // Only localhost
      NODE_OPTIONS: '--max-old-space-size=300 --max-http-header-size=8192'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true
  }]
};