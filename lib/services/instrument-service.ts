// lib/services/instrument-service.ts
// Service for managing trading instruments/symbols from AngelOne API

import { prisma } from '@/lib/prisma';
import { HttpTransportService } from '@/lib/brokers/transport';

interface RawAngelOneInstrument {
  token?: string;
  instrument_token?: string;
  symboltoken?: string;
  symbol?: string;
  tradingsymbol?: string;
  name?: string;
  instrument_name?: string;
  expiry?: string;
  expirydate?: string;
  strike?: number;
  strikeprice?: number;
  lotsize?: number;
  lot_size?: number;
  instrumenttype?: string;
  instrument_type?: string;
  instrument?: string;
  exch_seg?: string;
  exchange?: string;
  exch?: string;
  tick_size?: number;
  ticksize?: number;
}

interface AngelOneInstrument {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: number | null;
  lotsize: number;
  instrumenttype: string;
  exch_seg: string;
  tick_size: number;
}

export class InstrumentService {
  private transport: HttpTransportService;
  private readonly instrumentsEndpoint = '/rest/angelbroking/instrument/download';

  constructor() {
    this.transport = new HttpTransportService('https://apiconnect.angelone.in');
  }

  /**
   * Fetch all instruments from AngelOne API
   */
  async fetchInstrumentsFromAPI(): Promise<AngelOneInstrument[]> {
    console.log('📊 [Instrument Service] ===== FETCHING INSTRUMENTS FROM ANGELONE =====');

    try {
      // Try the official AngelOne instruments endpoint
      console.log('📊 [Instrument Service] Trying official AngelOne instruments endpoint...');
      const response = await fetch('https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [Instrument Service] Raw response type:', typeof data);
      console.log('📊 [Instrument Service] Is array:', Array.isArray(data));
      console.log('📊 [Instrument Service] Length:', Array.isArray(data) ? data.length : 'N/A');

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid response format - expected array of instruments');
      }

      // Convert AngelOne format to our format
      const instruments: AngelOneInstrument[] = data.map((item: RawAngelOneInstrument, index) => {
        const instrument = {
          token: item.token || item.instrument_token || item.symboltoken || '',
          symbol: item.symbol || item.tradingsymbol || item.name || '',
          name: item.name || item.instrument_name || item.symbol || '',
          expiry: item.expiry || item.expirydate || '',
          strike: item.strike ? parseFloat(item.strike.toString()) : null,
          lotsize: item.lotsize ? parseInt(item.lotsize.toString()) : 1,
          instrumenttype: item.instrumenttype || item.instrument_type || item.instrument || '',
          exch_seg: item.exch_seg || item.exchange || item.exch || '',
          tick_size: item.tick_size ? parseFloat(item.tick_size.toString()) : 0.01,
        };

        // Debug YESBANK specifically
        if (instrument.symbol === 'YESBANK' || instrument.symbol === 'YESBANK-EQ' || item.symbol === 'YESBANK' || item.symbol === 'YESBANK-EQ' || item.tradingsymbol === 'YESBANK') {
          console.log('🔍 [Instrument Service] Found YESBANK at index', index, ':', {
            raw: item,
            processed: instrument,
            token: item.token || item.instrument_token || item.symboltoken,
            symbol: item.symbol || item.tradingsymbol || item.name,
            exchange: item.exch_seg || item.exchange || item.exch,
          });
        }

        // Debug IDEA-EQ specifically
        if (instrument.symbol === 'IDEA-EQ' || item.symbol === 'IDEA-EQ' || item.tradingsymbol === 'IDEA-EQ') {
          console.log('🔍 [Instrument Service] Found IDEA-EQ at index', index, ':', {
            raw: item,
            processed: instrument,
            token: item.token || item.instrument_token || item.symboltoken,
            symbol: item.symbol || item.tradingsymbol || item.name,
            exchange: item.exch_seg || item.exchange || item.exch,
          });
        }

        return instrument;
      }).filter(instrument => {
        // Skip instruments with empty tokens
        if (!instrument.token || instrument.token.trim() === '') {
          console.log('⚠️ [Instrument Service] Skipping instrument with empty token:', instrument.symbol);
          return false;
        }
        // Skip instruments with empty symbols
        if (!instrument.symbol || instrument.symbol.trim() === '') {
          console.log('⚠️ [Instrument Service] Skipping instrument with empty symbol:', instrument.token);
          return false;
        }
        return true;
      });

      console.log('📊 [Instrument Service] Successfully converted', instruments.length, 'instruments');
      console.log('📊 [Instrument Service] Sample instrument:', instruments[0]);

      // Check for duplicate tokens
      const tokenCounts = instruments.reduce((acc, inst) => {
        acc[inst.token] = (acc[inst.token] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicates = Object.entries(tokenCounts).filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        console.log('⚠️ [Instrument Service] Found duplicate tokens:', duplicates.slice(0, 5));
      }

      console.log('📊 [Instrument Service] ===== FETCH COMPLETE =====');

      return instruments;

    } catch (error) {
      console.error('❌ [Instrument Service] Failed to fetch instruments:', error);
      console.log('📊 [Instrument Service] ===== FETCH FAILED =====');
      throw error;
    }
  }

  /**
   * Store instruments in database
   */
  async storeInstruments(instruments: AngelOneInstrument[]): Promise<void> {
    console.log('💾 [Instrument Service] ===== STORING INSTRUMENTS IN DATABASE =====');
    console.log('💾 [Instrument Service] Processing', instruments.length, 'instruments');

    // Check for YESBANK specifically
    const yesbankInstruments = instruments.filter(i => i.symbol === 'YESBANK' || i.symbol === 'YESBANK-EQ');
    console.log('🔍 [Instrument Service] YESBANK instruments to store:', yesbankInstruments.length);
    yesbankInstruments.forEach(yb => {
      console.log('🔍 [Instrument Service] YESBANK details:', {
        token: yb.token,
        symbol: yb.symbol,
        exch_seg: yb.exch_seg,
        name: yb.name,
        instrumenttype: yb.instrumenttype,
      });
    });

    const batchSize = 10; // Reduced batch size to ensure no instruments are missed
    let processed = 0;

    for (let i = 0; i < instruments.length; i += batchSize) {
      const batch = instruments.slice(i, i + batchSize);
     // console.log('💾 [Instrument Service] Processing batch', Math.floor(i / batchSize) + 1, 'of', Math.ceil(instruments.length / batchSize));

      // Use upsert to create or update instruments
      const results = await Promise.allSettled(
        batch.map(instrument => {
          // Debug YESBANK in batch
          if (instrument.symbol === 'YESBANK' || instrument.symbol === 'YESBANK-EQ') {
            console.log('🔍 [Instrument Service] Processing YESBANK in batch:', {
              token: instrument.token,
              symbol: instrument.symbol,
              exch_seg: instrument.exch_seg,
            });
          }

          // Debug IDEA-EQ in batch
          if (instrument.symbol === 'IDEA-EQ') {
            console.log('🔍 [Instrument Service] Processing IDEA-EQ in batch:', {
              token: instrument.token,
              symbol: instrument.symbol,
              exch_seg: instrument.exch_seg,
            });
          }

          return prisma.symbol.upsert({
            where: { token: instrument.token },
            update: {
              symbol: instrument.symbol,
              name: instrument.name,
              exchange: instrument.exch_seg,
              instrumentType: instrument.instrumenttype,
              expiry: instrument.expiry ? new Date(instrument.expiry) : null,
              strike: instrument.strike || null,
              lotSize: instrument.lotsize || null,
              tickSize: instrument.tick_size || null,
              exchSeg: instrument.exch_seg,
              lastUpdated: new Date(),
              isActive: true,
            },
            create: {
              token: instrument.token,
              symbol: instrument.symbol,
              name: instrument.name,
              exchange: instrument.exch_seg,
              instrumentType: instrument.instrumenttype,
              expiry: instrument.expiry ? new Date(instrument.expiry) : null,
              strike: instrument.strike || null,
              lotSize: instrument.lotsize || null,
              tickSize: instrument.tick_size || null,
              exchSeg: instrument.exch_seg,
              isActive: true,
            },
          }).catch(error => {
            console.error('❌ [Instrument Service] Failed to upsert instrument:', {
              token: instrument.token,
              symbol: instrument.symbol,
              exch_seg: instrument.exch_seg,
              instrumenttype: instrument.instrumenttype,
              error: error.message,
              code: error.code,
            });
            throw error;
          });
        })
      );

      // Count results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++;
          // We can't easily distinguish between create and update with upsert
          // but we can assume most are updates on refresh
        } else {
          console.error('❌ [Instrument Service] Batch upsert failed for instrument:', batch[index].token, result.reason);
        }
      });
    }

    console.log('💾 [Instrument Service] Processed', processed, 'instruments');
    console.log('💾 [Instrument Service] ===== STORAGE COMPLETE =====');
  }

  /**
   * Refresh all instruments from AngelOne API
   */
  async refreshInstruments(): Promise<void> {
    console.log('🔄 [Instrument Service] ===== REFRESHING ALL INSTRUMENTS =====');

    try {
      const instruments = await this.fetchInstrumentsFromAPI();
      await this.storeInstruments(instruments);

      console.log('✅ [Instrument Service] Instrument refresh completed successfully');
      console.log('🔄 [Instrument Service] ===== REFRESH COMPLETE =====');
    } catch (error) {
      console.error('❌ [Instrument Service] Instrument refresh failed:', error);
      console.log('🔄 [Instrument Service] ===== REFRESH FAILED =====');
      throw error;
    }
  }

  /**
   * Search symbols for UI autocomplete
   */
  async searchSymbols(query: string, limit: number = 20, exchange: string = 'NSE'): Promise<Array<{
    id: string;
    token: string;
    symbol: string;
    name: string;
    exchange: string;
    instrumentType: string;
  }>> {
    console.log('🔍 [Instrument Service] Searching symbols with query:', query, 'exchange:', exchange);

    try {
      const symbols = await prisma.symbol.findMany({
        where: {
          isActive: true,
          token: { not: null },
          exchange: exchange,
          OR: [
            {
              AND: [
                { symbol: { contains: query, mode: 'insensitive' } },
                exchange === 'NSE' ? {} : { instrumentType: { not: null } }
              ]
            },
            {
              AND: [
                { name: { contains: query, mode: 'insensitive' } },
                exchange === 'NSE' ? {} : { instrumentType: { not: null } }
              ]
            },
          ],
        },
        select: {
          id: true,
          token: true,
          symbol: true,
          name: true,
          exchange: true,
          instrumentType: true,
        },
        orderBy: [
          { symbol: 'asc' },
        ],
        take: limit,
      });

      console.log('🔍 [Instrument Service] Found', symbols.length, 'matching symbols');
      return symbols as Array<{
        id: string;
        token: string;
        symbol: string;
        name: string;
        exchange: string;
        instrumentType: string;
      }>;
    } catch (error) {
      console.error('❌ [Instrument Service] Symbol search failed:', error);
      throw error;
    }
  }

  /**
   * Get instrument details by token
   */
  async getInstrumentByToken(token: string) {
    console.log('📋 [Instrument Service] Getting instrument details for token:', token);

    try {
      const instrument = await prisma.symbol.findUnique({
        where: { token },
        select: {
          id: true,
          token: true,
          symbol: true,
          name: true,
          exchange: true,
          instrumentType: true,
          expiry: true,
          strike: true,
          lotSize: true,
          tickSize: true,
          exchSeg: true,
          lastUpdated: true,
        },
      });

      console.log('📋 [Instrument Service] Instrument found:', !!instrument);
      return instrument;
    } catch (error) {
      console.error('❌ [Instrument Service] Failed to get instrument:', error);
      throw error;
    }
  }

  /**
   * Get last refresh timestamp
   */
  async getLastRefreshTime(): Promise<Date | null> {
    try {
      const lastInstrument = await prisma.symbol.findFirst({
        orderBy: { lastUpdated: 'desc' },
        select: { lastUpdated: true },
      });

      return lastInstrument?.lastUpdated || null;
    } catch (error) {
      console.error('❌ [Instrument Service] Failed to get last refresh time:', error);
      return null;
    }
  }
}
