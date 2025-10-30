// lib/broadcast/fast-broadcast.ts
// Ultra-fast simultaneous order execution for all accounts within 2 seconds

import { prisma } from '@/lib/prisma';
import { BatchTokenManager } from '@/lib/brokers/batch-token-manager';
import { BrokerFactory } from '@/lib/brokers';

export interface FastBroadcastResult {
  signalId: string;
  totalAccounts: number;
  executedOrders: number;
  failedOrders: number;
  executionTime: number;
  errors: Array<{ accountId: string; error: string }>;
  timestamp: Date;
}

import { IBrokerCredentials, IOrderRequest } from '@/lib/brokers/interfaces';

export interface PreBroadcastContext {
  signalId: string;
  symbolToken: string;
  validAccounts: Map<string, IBrokerCredentials>; // accountId -> credentials
  orderRequest: IOrderRequest;
}

export interface AccountExecutionResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export class FastBroadcast {
  private static readonly MAX_EXECUTION_TIME = 2000; // 2 seconds
  private static readonly FAST_FAIL_TIMEOUT = 500; // 500ms timeout per account

  /**
   * Pre-broadcast preparation: validate all tokens and prepare context
   */
  static async prepareBroadcast(
    adminId: string,
    symbol: string,
    quantity: number,
    action: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT',
    limitPrice?: number,
    productType: 'DELIVERY' | 'INTRADAY' = 'INTRADAY',
    exchange: 'NSE' = 'NSE'
  ): Promise<PreBroadcastContext | null> {
    console.log('⚡ [Fast Broadcast] ===== PRE-BROADCAST PREPARATION =====');
    const startTime = Date.now();

    try {
      // 1. Create signal in database (fast operation)
      const signal = await prisma.signal.create({
        data: {
          adminId,
          symbol,
          quantity,
          action,
          type: productType,
          orderType,
          limitPrice: orderType === 'LIMIT' ? limitPrice : null,
        },
      });

      console.log('⚡ [Fast Broadcast] Signal created:', signal.id);

      // 2. Get symbol token (cached/pre-computed ideally)
      const symbolToken = await this.getSymbolTokenFast(symbol, exchange);
      if (!symbolToken) {
        throw new Error(`Symbol token not found for ${symbol}`);
      }

      // 3. Batch validate ALL account tokens simultaneously
      console.log('⚡ [Fast Broadcast] Batch validating all account tokens...');
      // Get all active accounts that need token validation
      const accountsNeedingValidation = await this.getAllActiveAccountIds();
      const fullTokenResult = await BatchTokenManager.validateMultipleTokens(accountsNeedingValidation);

      console.log('⚡ [Fast Broadcast] Token validation complete:', fullTokenResult.validTokens.size, 'valid tokens');

      // 4. Prepare order request template
      const orderRequest = {
        symbol: symbol.toUpperCase(),
        symbolToken,
        side: action,
        quantity,
        price: orderType === 'LIMIT' ? limitPrice : undefined,
        orderType,
        productType,
        exchange,
      };

      const context: PreBroadcastContext = {
        signalId: signal.id,
        symbolToken,
        validAccounts: fullTokenResult.validTokens,
        orderRequest,
      };

      const prepTime = Date.now() - startTime;
      console.log('⚡ [Fast Broadcast] Pre-broadcast preparation complete in', prepTime, 'ms');

      return context;

    } catch (error) {
      console.error('⚡ [Fast Broadcast] Pre-broadcast preparation failed:', error);
      return null;
    }
  }

  /**
   * Execute orders simultaneously across all accounts within 2 seconds
   */
  static async executeBroadcast(context: PreBroadcastContext): Promise<FastBroadcastResult> {
    console.log('⚡ [Fast Broadcast] ===== SIMULTANEOUS ORDER EXECUTION =====');
    const startTime = Date.now();

    const result: FastBroadcastResult = {
      signalId: context.signalId,
      totalAccounts: context.validAccounts.size,
      executedOrders: 0,
      failedOrders: 0,
      executionTime: 0,
      errors: [],
      timestamp: new Date(),
    };

    // Create execution promises for ALL accounts simultaneously
    const executionPromises = Array.from(context.validAccounts.entries()).map(
      ([accountId, credentials]) => this.executeOrderForAccount(accountId, credentials, context)
    );

    // Execute ALL orders simultaneously with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout exceeded')), this.MAX_EXECUTION_TIME);
    });

    try {
      const executionResults = await Promise.race([
        Promise.allSettled(executionPromises),
        timeoutPromise,
      ]) as PromiseSettledResult<AccountExecutionResult>[];

      // Process results
      executionResults.forEach((settledResult, index) => {
        const accountId = Array.from(context.validAccounts.keys())[index];

        if (settledResult.status === 'fulfilled') {
          const orderResult = settledResult.value;
          if (orderResult.success) {
            result.executedOrders++;
            // Async logging - don't wait
            if (orderResult.orderId) {
              this.logOrderAsync(context.signalId, accountId, { orderId: orderResult.orderId });
            }
          } else {
            result.failedOrders++;
            result.errors.push({ accountId, error: orderResult.error || 'Unknown error' });
          }
        } else {
          // Promise rejected
          result.failedOrders++;
          result.errors.push({
            accountId,
            error: settledResult.reason?.message || 'Execution failed'
          });
        }
      });

    } catch (error) {
      console.error('⚡ [Fast Broadcast] Execution timeout or critical error:', error);
      result.failedOrders = context.validAccounts.size;
      result.errors.push({
        accountId: 'system',
        error: 'Execution timeout exceeded 2 seconds'
      });
    }

    result.executionTime = Date.now() - startTime;

    console.log('⚡ [Fast Broadcast] Execution complete in', result.executionTime, 'ms');
    console.log('⚡ [Fast Broadcast] Results:', {
      executed: result.executedOrders,
      failed: result.failedOrders,
      total: result.totalAccounts,
    });

    return result;
  }

  /**
   * Execute order for a single account with fast-fail timeout
   */
  private static async executeOrderForAccount(
    accountId: string,
    credentials: IBrokerCredentials,
    context: PreBroadcastContext
  ): Promise<AccountExecutionResult> {
    // Fast-fail timeout per account
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Account execution timeout')), this.FAST_FAIL_TIMEOUT);
    });

    try {
      const executionPromise = this.placeOrderFast(accountId, credentials, context);
      const result = await Promise.race([executionPromise, timeoutPromise]) as { orderId: string };

      return { success: true, orderId: result.orderId };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fast order placement with minimal overhead
   */
  private static async placeOrderFast(
    accountId: string,
    credentials: IBrokerCredentials,
    context: PreBroadcastContext
  ): Promise<{ orderId: string }> {
    // Create broker instance (should be pooled/reused)
    const broker = BrokerFactory.createAngelOneBroker();

    // Place order directly
    const orderResponse = await broker.placeOrder(credentials, context.orderRequest);

    if (orderResponse.status === 'failed') {
      throw new Error(orderResponse.message || 'Order placement failed');
    }

    return { orderId: orderResponse.orderId };
  }

  /**
   * Async logging - don't block execution
   */
  private static async logOrderAsync(
    signalId: string,
    accountId: string,
    orderResult: { orderId: string }
  ): Promise<void> {
    try {
      // Save order to database asynchronously
      await prisma.order.create({
        data: {
          signalId,
          accountId,
          brokerOrderId: orderResult.orderId,
          status: 'executed',
          executedAt: new Date(),
        },
      });

      // Log to system (async, don't wait)
      await prisma.log.create({
        data: {
          userId: 'system',
          action: 'FAST_ORDER_EXECUTION',
          details: {
            signalId,
            accountId,
            orderId: orderResult.orderId,
            executionTime: Date.now(),
          },
          level: 'info',
        },
      });
    } catch (error) {
      // Log logging failure but don't throw - execution already succeeded
      console.error('⚡ [Fast Broadcast] Async logging failed:', error);
    }
  }

  /**
   * Get symbol token with caching
   */
  private static async getSymbolTokenFast(symbol: string, exchange: string): Promise<string | null> {
    // Try exact symbol match first
    let symbolRecord = await prisma.symbol.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        exchange,
        isActive: true,
      },
      select: { token: true },
    });

    // Try SYMBOL-EQ variant
    if (!symbolRecord?.token) {
      symbolRecord = await prisma.symbol.findFirst({
        where: {
          symbol: `${symbol.toUpperCase()}-EQ`,
          exchange,
          isActive: true,
        },
        select: { token: true },
      });
    }

    return symbolRecord?.token || null;
  }

  /**
   * Get all active account IDs
   */
  private static async getAllActiveAccountIds(): Promise<string[]> {
    const accounts = await prisma.tradingAccount.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    return accounts.map(acc => acc.id);
  }

  /**
   * Complete fast broadcast workflow
   */
  static async broadcastSignal(
    adminId: string,
    symbol: string,
    quantity: number,
    action: 'BUY' | 'SELL',
    orderType: 'MARKET' | 'LIMIT' = 'MARKET',
    limitPrice?: number,
    productType: 'DELIVERY' | 'INTRADAY' = 'INTRADAY',
    exchange: 'NSE' = 'NSE'
  ): Promise<FastBroadcastResult | null> {
    console.log('⚡ [Fast Broadcast] ===== STARTING FAST BROADCAST =====');

    // Phase 1: Pre-broadcast preparation
    const context = await this.prepareBroadcast(
      adminId, symbol, quantity, action, orderType, limitPrice, productType, exchange
    );

    if (!context) {
      console.error('⚡ [Fast Broadcast] Pre-broadcast preparation failed');
      return null;
    }

    // Phase 2: Simultaneous execution
    const result = await this.executeBroadcast(context);

    console.log('⚡ [Fast Broadcast] ===== FAST BROADCAST COMPLETE =====');
    console.log('⚡ [Fast Broadcast] Total execution time:', result.executionTime, 'ms');

    return result;
  }
}