// lib/brokers/mock-broker.ts
// Mock broker implementation for sandbox testing

import { IBroker, IBrokerCredentials, IOrderRequest, IOrderResponse, IOrderBookEntry, ITradeBookEntry, ISymbolDetails } from './interfaces';

export class MockBroker implements IBroker {
  private static mockOrderIdCounter = 1000000;
  private static executionDelay = 50; // 50ms simulated API delay

  async authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<boolean> {
    console.log(`🔧 [Mock Broker] Authenticating account ${accountId}`);

    // Simulate authentication delay
    await this.delay(MockBroker.executionDelay);

    // Mock successful authentication
    return true;
  }

  async placeOrder(credentials: IBrokerCredentials, order: IOrderRequest): Promise<IOrderResponse> {
    console.log(`🔧 [Mock Broker] Placing ${order.side} order for ${order.symbol}`);

    // Simulate API call delay
    await this.delay(MockBroker.executionDelay);

    // Generate mock order response
    const orderId = `MOCK${++MockBroker.mockOrderIdCounter}`;

    // Simulate occasional failures (2% failure rate)
    if (Math.random() < 0.02) {
      return {
        orderId,
        status: 'failed',
        message: 'Mock broker: Insufficient funds'
      };
    }

    return {
      orderId,
      status: 'executed',
      message: 'Mock order executed successfully'
    };
  }

  async getOrderBook(): Promise<IOrderBookEntry[]> {
    await this.delay(MockBroker.executionDelay);

    return [
      {
        orderId: 'MOCK123456',
        symbol: 'RELIANCE',
        side: 'BUY',
        quantity: 10,
        price: 2500.50,
        status: 'EXECUTED',
        orderDate: new Date().toISOString()
      },
      {
        orderId: 'MOCK123457',
        symbol: 'TCS',
        side: 'SELL',
        quantity: 5,
        price: 3200.75,
        status: 'PENDING',
        orderDate: new Date().toISOString()
      }
    ];
  }

  async getTradeBook(): Promise<ITradeBookEntry[]> {
    await this.delay(MockBroker.executionDelay);

    return [
      {
        tradeId: 'TRADE001',
        orderId: 'MOCK123456',
        symbol: 'RELIANCE',
        side: 'BUY',
        quantity: 10,
        price: 2500.50,
        tradeDate: new Date().toISOString()
      }
    ];
  }

  async cancelOrder(_credentials: IBrokerCredentials, orderId: string): Promise<boolean> {
    console.log(`🔧 [Mock Broker] Cancelling order ${orderId}`);
    await this.delay(MockBroker.executionDelay);
    return true;
  }

  async resolveSymbol(symbol: string): Promise<string> {
    await this.delay(MockBroker.executionDelay / 2);

    // Mock symbol resolution
    if (symbol.includes('-EQ')) {
      return symbol.replace('-EQ', '');
    }

    return `${symbol}-EQ`;
  }

  async getSymbolDetails(symbolToken: string): Promise<ISymbolDetails> {
    await this.delay(MockBroker.executionDelay / 2);

    return {
      symbol: symbolToken.replace('-EQ', ''),
      name: symbolToken.replace('-EQ', ''),
      exchange: 'NSE',
      symbolToken,
      instrumentType: 'EQ',
      lotSize: 1
    };
  }

  isAuthenticated(credentials: IBrokerCredentials): boolean {
    return !!(credentials.accessToken && credentials.apiKey);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock Auth Service for testing
export class MockAuthService {
  async refreshToken(credentials: IBrokerCredentials): Promise<IBrokerCredentials> {
    console.log('🔧 [Mock Auth] Refreshing token');

    await this.delay(50); // 50ms delay for mock auth

    return {
      ...credentials,
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}