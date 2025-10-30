// app/api/symbols/search/route.ts
// API endpoint for searching trading symbols

import { NextRequest, NextResponse } from 'next/server';
import { InstrumentService } from '@/lib/services/instrument-service';

export async function GET(request: NextRequest) {
  console.log('🔍 [API] GET /api/symbols/search - Searching symbols');

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const exchangeParam = searchParams.get('exchange');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const exchange = exchangeParam || 'NSE'; // Default to NSE

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Query parameter "q" is required and must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const instrumentService = new InstrumentService();
    const symbols = await instrumentService.searchSymbols(query.trim(), Math.min(limit, 50), exchange); // Max 50 results

    console.log('🔍 [API] Found', symbols.length, 'symbols for query:', query, 'on exchange:', exchange);

    return NextResponse.json({
      success: true,
      data: symbols,
      count: symbols.length,
    });

  } catch (error) {
    console.error('❌ [API] Symbol search failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to search symbols',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}