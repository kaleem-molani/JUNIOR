// lib/brokers/symbols.ts
// SOLID: Single Responsibility - Handles symbol resolution and market data

import { ISymbolService, ISymbolDetails, ITransportService, IBrokerCredentials } from './interfaces';

interface AngelOneSymbolSearchResult {
  symbol: string;
  name: string;
  exch_seg: string;
  instrumenttype: string;
  expiry: string;
  strike: number;
  lotsize: number;
  token: string;
}

interface AngelOneQuoteResponse {
  status: boolean;
  data: Record<string, AngelOneSymbolSearchResult>;
}

export class AngelOneSymbolService implements ISymbolService {
  private transport: ITransportService;
  private readonly searchEndpoint = '/rest/secure/angelbroking/market/v1/searchInstrumentsByString';
  private readonly quoteEndpoint = '/rest/secure/angelbroking/market/v1/quote';

  constructor(transport: ITransportService) {
    this.transport = transport;
  }

  async resolveSymbol(symbol: string, credentials: IBrokerCredentials): Promise<string> {
    // For AngelOne, symbols are typically already tokens or need to be searched
    // For now, if it's a numeric token, return as-is, otherwise search
    if (/^\d+$/.test(symbol)) {
      return symbol; // Already a token
    }

    // Search for the symbol and return the first match's token
    const results = await this.searchSymbols(symbol, credentials);
    if (results.length > 0) {
      return results[0].symbolToken;
    }

    throw new Error(`Symbol not found: ${symbol}`);
  }

  async getSymbolDetails(symbolToken: string, credentials: IBrokerCredentials): Promise<ISymbolDetails> {
    const quotes = await this.getQuote([symbolToken], credentials);
    const quote = quotes[symbolToken];

    if (quote) {
      return {
        symbol: quote.symbol,
        name: quote.name,
        exchange: quote.exch_seg,
        symbolToken: quote.token,
        instrumentType: quote.instrumenttype,
        lotSize: quote.lotsize,
      };
    }

    throw new Error(`Symbol details not found for token: ${symbolToken}`);
  }

  // Additional methods for authenticated operations
  async searchSymbols(query: string, credentials: IBrokerCredentials): Promise<ISymbolDetails[]> {
    if (!credentials.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
      };

      const response = await this.transport.post<{
        status: boolean;
        data: AngelOneSymbolSearchResult[];
      }>(this.searchEndpoint, { symbol: query }, headers);

      if (response.status && response.data) {
        return response.data.map(item => ({
          symbol: item.symbol,
          name: item.name,
          exchange: item.exch_seg,
          symbolToken: item.token,
          instrumentType: item.instrumenttype,
          lotSize: item.lotsize,
        }));
      }

      return [];
    } catch (error) {
      console.error('Symbol search failed:', error);
      return [];
    }
  }

  async getQuote(symbols: string[], credentials: IBrokerCredentials): Promise<Record<string, AngelOneSymbolSearchResult>> {
    if (!credentials.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const headers = {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': 'null',
        'X-ClientPublicIP': 'null',
        'X-MACAddress': 'null',
      };

      const response = await this.transport.post<AngelOneQuoteResponse>(
        this.quoteEndpoint,
        { symbols },
        headers
      );

      if (response.status && response.data) {
        return response.data;
      }

      return {};
    } catch (error) {
      console.error('Quote fetch failed:', error);
      return {};
    }
  }
}