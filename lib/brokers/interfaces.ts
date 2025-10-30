// lib/brokers/interfaces.ts
// SOLID: Interface Segregation - Separate interfaces for different responsibilities

export interface IBrokerCredentials {
  clientCode?: string;
  apiKey: string;
  userPin: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface IOrderRequest {
  symbol: string;
  symbolToken?: string; // AngelOne instrument token
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET';
  productType: 'DELIVERY' | 'INTRADAY' | 'MARGIN';
  exchange: 'NSE' | 'BSE' | 'MCX' | 'NFO' | 'BFO';
}

export interface IOrderResponse {
  orderId: string;
  status: 'pending' | 'executed' | 'failed';
  message?: string;
  requestData?: unknown; // Request payload sent to broker
  responseData?: unknown; // Raw response from broker
}

export interface IOrderBookEntry {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  status: string;
  orderDate: string;
}

export interface ITradeBookEntry {
  tradeId: string;
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  tradeDate: string;
}

export interface IAngelOneOrderData {
  variety: string;
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: string;
  exchange: string;
  ordertype: string;
  producttype: string;
  duration: string;
  quantity: string;
  triggerprice: string;
  price?: string; // Optional for MARKET orders
}

export interface IAuthenticationService {
  authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<boolean>;
  refreshToken(credentials: IBrokerCredentials): Promise<IBrokerCredentials>;
  isAuthenticated(credentials: IBrokerCredentials): boolean;
}

export interface IOrderService {
  placeOrder(credentials: IBrokerCredentials, order: IOrderRequest): Promise<IOrderResponse>;
  getOrderBook(credentials: IBrokerCredentials): Promise<IOrderBookEntry[]>;
  getTradeBook(credentials: IBrokerCredentials): Promise<ITradeBookEntry[]>;
  cancelOrder(credentials: IBrokerCredentials, orderId: string): Promise<boolean>;
}

export interface ISymbolDetails {
  symbol: string;
  name: string;
  exchange: string;
  symbolToken: string;
  instrumentType: string;
  lotSize: number;
}

export interface ITransportService {
  post<T>(url: string, data: Record<string, unknown>, headers?: Record<string, string>): Promise<T>;
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
}

export interface ISymbolService {
  resolveSymbol(symbol: string, credentials: IBrokerCredentials): Promise<string>; // Returns symbol token
  getSymbolDetails(symbolToken: string, credentials: IBrokerCredentials): Promise<ISymbolDetails>;
}

export interface IBroker {
  authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<boolean>;
  placeOrder(credentials: IBrokerCredentials, order: IOrderRequest): Promise<IOrderResponse>;
  getOrderBook(credentials: IBrokerCredentials): Promise<IOrderBookEntry[]>;
  getTradeBook(credentials: IBrokerCredentials): Promise<ITradeBookEntry[]>;
  cancelOrder(credentials: IBrokerCredentials, orderId: string): Promise<boolean>;
  resolveSymbol(symbol: string, credentials: IBrokerCredentials): Promise<string>;
  getSymbolDetails(symbolToken: string, credentials: IBrokerCredentials): Promise<ISymbolDetails>;
  isAuthenticated(credentials: IBrokerCredentials): boolean;
}