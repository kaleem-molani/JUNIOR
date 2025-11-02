// app/api/scheduler/status/route.ts
// Get scheduler status

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Dynamic import to avoid client-side bundling
    const { tokenRefreshScheduler } = await import('@/lib/scheduled-token-refresh');

    // Ensure scheduler is started
    if (!tokenRefreshScheduler.isRunning()) {
      console.log('⏰ [Scheduler API] Starting scheduler on status check...');
      tokenRefreshScheduler.start();
    }

    const isRunning = tokenRefreshScheduler.isRunning();

    return NextResponse.json({
      success: true,
      scheduler: {
        isRunning,
        schedule: 'Twice daily at 6:00 AM and 6:00 PM IST',
        timezone: 'Asia/Kolkata',
        nextRuns: ['6:00 AM IST', '6:00 PM IST']
      }
    });
  } catch (error) {
    console.error('❌ [Scheduler API] Error getting status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}