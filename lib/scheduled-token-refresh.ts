// lib/scheduled-token-refresh.ts
// Server-side scheduled token refresh service

import * as cron from 'node-cron';
import { TokenManager } from './brokers/token-manager';

let isSchedulerRunning = false;

export class TokenRefreshScheduler {
  private static instance: TokenRefreshScheduler;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {}

  static getInstance(): TokenRefreshScheduler {
    if (!TokenRefreshScheduler.instance) {
      TokenRefreshScheduler.instance = new TokenRefreshScheduler();
    }
    return TokenRefreshScheduler.instance;
  }

  /**
   * Start the scheduled token refresh service
   */
  start(): void {
    if (isSchedulerRunning) {
      console.log('⏰ [Token Refresh Scheduler] Scheduler is already running');
      return;
    }

    console.log('⏰ [Token Refresh Scheduler] Starting scheduled token refresh service...');
    console.log('⏰ [Token Refresh Scheduler] Service started at:', new Date().toISOString());

    // Function to run the token refresh job
    const runTokenRefresh = async () => {
      console.log('⏰ [Token Refresh Scheduler] ===== SCHEDULED JOB START =====');
      console.log('⏰ [Token Refresh Scheduler] Execution time:', new Date().toISOString());

      try {
        await TokenManager.refreshExpiringTokens();
        console.log('✅ [Token Refresh Scheduler] Token refresh completed successfully');
      } catch (error) {
        console.error('❌ [Token Refresh Scheduler] Token refresh failed:', error);
      }

      console.log('⏰ [Token Refresh Scheduler] ===== SCHEDULED JOB END =====');
    };

    // Schedule to run twice daily at 6:00 AM and 6:00 PM IST
    // Cron format: "0 6,18 * * *" (minute 0, hours 6 and 18, every day)
    const cronSchedule = '0 6,18 * * *';

    console.log('⏰ [Token Refresh Scheduler] Scheduling job with cron:', cronSchedule);

    this.cronJob = cron.schedule(cronSchedule, runTokenRefresh, {
      timezone: "Asia/Kolkata" // IST timezone
    });

    isSchedulerRunning = true;
    console.log('⏰ [Token Refresh Scheduler] Scheduled token refresh job configured');
    console.log('⏰ [Token Refresh Scheduler] Next runs at 6:00 AM and 6:00 PM IST daily');
  }

  /**
   * Stop the scheduled token refresh service
   */
  stop(): void {
    if (this.cronJob) {
      console.log('⏰ [Token Refresh Scheduler] Stopping scheduled token refresh service...');
      this.cronJob.stop();
      this.cronJob = null;
      isSchedulerRunning = false;
      console.log('⏰ [Token Refresh Scheduler] Scheduled token refresh service stopped');
    } else {
      console.log('⏰ [Token Refresh Scheduler] Scheduler is not running');
    }
  }

  /**
   * Check if the scheduler is running
   */
  isRunning(): boolean {
    return isSchedulerRunning;
  }

  /**
   * Manually trigger a token refresh (for testing or immediate refresh)
   */
  async triggerManualRefresh(): Promise<void> {
    console.log('🔄 [Token Refresh Scheduler] Manual token refresh triggered');

    try {
      await TokenManager.refreshExpiringTokens();
      console.log('✅ [Token Refresh Scheduler] Manual token refresh completed successfully');
    } catch (error) {
      console.error('❌ [Token Refresh Scheduler] Manual token refresh failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tokenRefreshScheduler = TokenRefreshScheduler.getInstance();