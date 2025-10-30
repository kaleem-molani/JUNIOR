// lib/brokers/angelone.ts
// SOLID: Single Responsibility - AngelOne broker implementation

import {
  IBroker,
  IBrokerCredentials,
  IOrderRequest,
  IOrderResponse,
  IOrderBookEntry,
  ITradeBookEntry,
  ISymbolDetails,
  IAuthenticationService,
  IOrderService,
  ISymbolService,
  ITransportService,
} from './interfaces';

export class AngelOneBroker implements IBroker {
  private authService: IAuthenticationService;
  private orderService: IOrderService;
  private symbolService: ISymbolService;
  private transport: ITransportService;

  constructor(
    authService: IAuthenticationService,
    orderService: IOrderService,
    symbolService: ISymbolService,
    transport: ITransportService
  ) {
    this.authService = authService;
    this.orderService = orderService;
    this.symbolService = symbolService;
    this.transport = transport;
  }

  async authenticate(credentials: IBrokerCredentials, totp: string, accountId: string): Promise<boolean> {
    return this.authService.authenticate(credentials, totp, accountId);
  }

  async placeOrder(credentials: IBrokerCredentials, order: IOrderRequest): Promise<IOrderResponse> {
    return this.orderService.placeOrder(credentials, order);
  }

  async getOrderBook(credentials: IBrokerCredentials): Promise<IOrderBookEntry[]> {
    return this.orderService.getOrderBook(credentials);
  }

  async getTradeBook(credentials: IBrokerCredentials): Promise<ITradeBookEntry[]> {
    return this.orderService.getTradeBook(credentials);
  }

  async cancelOrder(credentials: IBrokerCredentials, orderId: string): Promise<boolean> {
    return this.orderService.cancelOrder(credentials, orderId);
  }

  async resolveSymbol(symbol: string, credentials: IBrokerCredentials): Promise<string> {
    return this.symbolService.resolveSymbol(symbol, credentials);
  }

  async getSymbolDetails(symbolToken: string, credentials: IBrokerCredentials): Promise<ISymbolDetails> {
    return this.symbolService.getSymbolDetails(symbolToken, credentials);
  }

  isAuthenticated(credentials: IBrokerCredentials): boolean {
    return this.authService.isAuthenticated(credentials);
  }
}