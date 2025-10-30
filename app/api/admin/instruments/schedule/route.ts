// app/api/admin/instruments/schedule/route.ts
// API endpoint for scheduled instrument refresh (can be called by cron jobs)

import { NextResponse } from 'next/server';
import { InstrumentService } from '@/lib/services/instrument-service';

export async function POST() {
  console.log('⏰ [API] POST /api/admin/instruments/schedule - Scheduled instrument refresh');

  try {
    const instrumentService = new InstrumentService();

    // Check if refresh is needed (every 24 hours)
    const lastRefresh = await instrumentService.getLastRefreshTime();
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    if (lastRefresh && lastRefresh > twentyFourHoursAgo) {
      console.log('⏰ [API] Instruments are up to date, skipping refresh');
      return NextResponse.json({
        success: true,
        message: 'Instruments are up to date',
        lastRefresh: lastRefresh.toISOString(),
        skipped: true,
      });
    }

    // Perform refresh
    await instrumentService.refreshInstruments();

    // Get updated refresh timestamp
    const newLastRefresh = await instrumentService.getLastRefreshTime();

    console.log('✅ [API] Scheduled instrument refresh completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Scheduled instruments refresh completed',
      lastRefresh: newLastRefresh?.toISOString(),
      skipped: false,
    });

  } catch (error) {
    console.error('❌ [API] Scheduled instrument refresh failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Scheduled instrument refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}