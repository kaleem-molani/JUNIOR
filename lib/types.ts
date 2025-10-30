// Shared types for the trading app

export type Role = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isExecutionEnabled: boolean;
  primaryBroker?: string;
  restrictedSymbols: string[];
}

export interface TradingAccount {
  id: string;
  userId: string;
  name: string; // Account name/identifier
  broker: string;
  clientCode?: string | null; // AngelOne client code
  apiKey: string;
  secret: string;
  userPin: string;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date | null;
  dbPath?: string; // Path for storing auth data
}

export interface Signal {
  id: string;
  adminId: string;
  symbol: string;
  quantity: number;
  action: 'BUY' | 'SELL';
  type: 'INTRADAY' | 'DELIVERY';
  broadcastAt: Date;
  status: 'pending' | 'executed' | 'failed';
}

export interface UserSignal {
  id: string;
  symbol: string;
  quantity: number;
  action: 'BUY' | 'SELL';
  type: 'INTRADAY' | 'DELIVERY';
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  broadcastAt: string;
  status: string;
  adminEmail: string;
  executedAt?: string;
  errorMessage?: string;
  orderId?: string;
}

export interface Order {
  id: string;
  signalId: string;
  accountId: string;
  brokerOrderId?: string;
  status: 'pending' | 'executed' | 'failed';
  executedAt?: Date;
  errorMessage?: string;
  rawResponse?: unknown; // Raw response from broker API
}

export interface Symbol {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  lastUpdated: Date;
}

export interface TaggedSymbol {
  id: string;
  userId: string;
  symbolId: string;
  taggedAt: Date;
}

export interface Log {
  id: string;
  userId?: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
}

export interface BrokerInterface {
  executeOrder(account: TradingAccount, signal: Signal): Promise<Order>;
  refreshToken(account: TradingAccount): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }>;
}

export interface OrderBookEntry {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  status: string;
  orderDate: string;
}

export interface TradeBookEntry {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  tradeDate: string;
}

export interface AccountOrder {
  id: string;
  orderId?: string;
  symbol?: string;
  side?: string;
  quantity?: number;
  price?: number;
  status?: string;
  orderDate?: string;
}