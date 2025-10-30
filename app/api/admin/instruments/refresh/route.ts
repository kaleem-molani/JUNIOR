// app/api/admin/instruments/refresh/route.ts
// API endpoint for refreshing trading instruments from AngelOne

import { NextResponse } from 'next/server';
import { InstrumentService } from '@/lib/services/instrument-service';

export async function POST() {
  console.log('🔄 [API] POST /api/admin/instruments/refresh - Starting instrument refresh');

  try {
    const instrumentService = new InstrumentService();

    // Start the refresh process
    await instrumentService.refreshInstruments();

    // Get refresh timestamp
    const lastRefresh = await instrumentService.getLastRefreshTime();

    console.log('✅ [API] Instrument refresh completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Instruments refreshed successfully',
      lastRefresh: lastRefresh?.toISOString(),
    });

  } catch (error) {
    console.error('❌ [API] Instrument refresh failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to refresh instruments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  console.log('📊 [API] GET /api/admin/instruments/refresh - Getting refresh status');

  try {
    const instrumentService = new InstrumentService();
    const lastRefresh = await instrumentService.getLastRefreshTime();

    return NextResponse.json({
      success: true,
      lastRefresh: lastRefresh?.toISOString(),
      needsRefresh: lastRefresh ? (Date.now() - lastRefresh.getTime()) > (24 * 60 * 60 * 1000) : true, // 24 hours
    });

  } catch (error) {
    console.error('❌ [API] Failed to get refresh status:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get refresh status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}