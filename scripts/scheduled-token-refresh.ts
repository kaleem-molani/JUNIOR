// scripts/scheduled-token-refresh.ts
// Scheduled job to refresh tokens twice daily

import * as cron from 'node-cron';
import { TokenManager } from '../lib/brokers/token-manager';

console.log('⏰ [Scheduled Token Refresh] Starting scheduled token refresh service...');
console.log('⏰ [Scheduled Token Refresh] Service started at:', new Date().toISOString());
console.log('⏰ [Scheduled Token Refresh] Schedule: Every 12 hours (twice daily)');

// Function to run the token refresh job
async function runTokenRefresh() {
  console.log('⏰ [Scheduled Token Refresh] ===== SCHEDULED JOB START =====');
  console.log('⏰ [Scheduled Token Refresh] Execution time:', new Date().toISOString());

  try {
    await TokenManager.refreshExpiringTokens();
    console.log('✅ [Scheduled Token Refresh] Token refresh completed successfully');
  } catch (error) {
    console.error('❌ [Scheduled Token Refresh] Token refresh failed:', error);
  }

  console.log('⏰ [Scheduled Token Refresh] ===== SCHEDULED JOB END =====');
}

// Schedule to run twice daily at 6:00 AM and 6:00 PM
// Cron format: "0 6,18 * * *" (minute 0, hours 6 and 18, every day)
const cronSchedule = '0 6,18 * * *';

console.log('⏰ [Scheduled Token Refresh] Scheduling job with cron:', cronSchedule);

cron.schedule(cronSchedule, runTokenRefresh, {
  timezone: "Asia/Kolkata" // IST timezone
});

console.log('⏰ [Scheduled Token Refresh] Scheduled token refresh job configured');
console.log('⏰ [Scheduled Token Refresh] Next runs at 6:00 AM and 6:00 PM IST daily');
console.log('⏰ [Scheduled Token Refresh] Service is running... (Press Ctrl+C to stop)');

// Keep the process running
process.on('SIGINT', () => {
  console.log('⏰ [Scheduled Token Refresh] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('⏰ [Scheduled Token Refresh] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});