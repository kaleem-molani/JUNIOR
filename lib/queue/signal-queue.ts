// lib/queue/signal-queue.ts
// Signal broadcasting queue for reliable multi-account order execution

import { prisma } from '@/lib/prisma';
import { BrokerFactory } from '@/lib/brokers';
import { BatchTokenManager } from '@/lib/brokers/batch-token-manager';

export interface SignalJob {
  id: string;
  signalId: string;
  accountId: string;
  symbol: string;
  symbolToken: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  productType: 'DELIVERY' | 'INTRADAY' | 'MARGIN';
  exchange: 'NSE' | 'BSE' | 'MCX';
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface SignalBroadcastResult {
  signalId: string;
  totalAccounts: number;
  successfulOrders: number;
  failedOrders: number;
  processingTime: number;
  errors: Array<{ accountId: string; error: string }>;
}

export class SignalQueue {
  private static readonly MAX_RETRIES = 3;
  private static readonly CONCURRENT_JOBS = 10; // Process 10 accounts simultaneously
  private static readonly JOB_TIMEOUT = 30000; // 30 seconds per job

  private static jobQueue: SignalJob[] = [];
  private static processing = false;
  private static jobIdCounter = 0;

  /**
   * Add signal broadcast jobs to queue for all active accounts
   */
  static async enqueueSignalBroadcast(signalId: string): Promise<number> {
    console.log('📋 [Signal Queue] ===== ENQUEUEING SIGNAL BROADCAST =====');
    console.log('📋 [Signal Queue] Signal ID:', signalId);

    // Get signal details
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { symbolData: true },
    });

    if (!signal) {
      throw new Error(`Signal ${signalId} not found`);
    }

    // Get all active accounts
    const activeAccounts = await prisma.tradingAccount.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    console.log('📋 [Signal Queue] Found', activeAccounts.length, 'active accounts');

    // Get symbol token
    let symbolToken = signal.symbolData?.token;
    if (!symbolToken) {
      // Try to find symbol in database
      const symbolRecord = await prisma.symbol.findFirst({
        where: {
          OR: [
            { symbol: signal.symbol.toUpperCase() },
            { symbol: `${signal.symbol.toUpperCase()}-EQ` },
          ],
          exchange: 'NSE',
          isActive: true,
        },
      });
      symbolToken = symbolRecord?.token;
    }

    if (!symbolToken) {
      throw new Error(`Symbol token not found for ${signal.symbol}`);
    }

    // Create jobs for each account
    const jobs: SignalJob[] = activeAccounts.map(account => ({
      id: `job_${++this.jobIdCounter}_${Date.now()}`,
      signalId,
      accountId: account.id,
      symbol: signal.symbol,
      symbolToken,
      side: signal.action as 'BUY' | 'SELL',
      quantity: signal.quantity,
      orderType: signal.orderType as 'MARKET' | 'LIMIT',
      limitPrice: signal.limitPrice || undefined,
      productType: signal.type as 'DELIVERY' | 'INTRADAY' | 'MARGIN',
      exchange: 'NSE', // Default to NSE
      createdAt: new Date(),
      status: 'pending',
      retryCount: 0,
    }));

    // Add jobs to queue
    this.jobQueue.push(...jobs);

    console.log('📋 [Signal Queue] Enqueued', jobs.length, 'jobs for processing');

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return jobs.length;
  }

  /**
   * Start processing jobs from the queue
   */
  private static async startProcessing(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    console.log('📋 [Signal Queue] ===== STARTING QUEUE PROCESSING =====');

    while (this.jobQueue.length > 0) {
      try {
        // Get next batch of jobs
        const batchSize = Math.min(this.CONCURRENT_JOBS, this.jobQueue.length);
        const batch = this.jobQueue.splice(0, batchSize);

        console.log('📋 [Signal Queue] Processing batch of', batch.length, 'jobs');

        // Process batch in parallel
        const batchPromises = batch.map(job => this.processJob(job));

        // Wait for batch to complete with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Batch processing timeout')), this.JOB_TIMEOUT * batchSize);
        });

        await Promise.race([
          Promise.allSettled(batchPromises),
          timeoutPromise,
        ]);

        console.log('📋 [Signal Queue] Batch processing completed');

      } catch (error) {
        console.error('📋 [Signal Queue] Error processing batch:', error);
        // Continue with next batch even if current batch fails
      }
    }

    this.processing = false;
    console.log('📋 [Signal Queue] ===== QUEUE PROCESSING COMPLETE =====');
  }

  /**
   * Process a single job
   */
  private static async processJob(job: SignalJob): Promise<void> {
    try {
      console.log('📋 [Signal Queue] Processing job:', job.id, 'for account:', job.accountId);

      job.status = 'processing';

      // Get account credentials using batch token manager
      const tokenResult = await BatchTokenManager.validateMultipleTokens([job.accountId]);

      if (tokenResult.errors.has(job.accountId)) {
        throw new Error(`Token validation failed: ${tokenResult.errors.get(job.accountId)}`);
      }

      const credentials = tokenResult.validTokens.get(job.accountId);
      if (!credentials) {
        throw new Error('No valid credentials found for account');
      }

      // Create order request
      const orderRequest = {
        symbol: job.symbol,
        symbolToken: job.symbolToken,
        side: job.side,
        quantity: job.quantity,
        price: job.orderType === 'LIMIT' ? job.limitPrice : undefined,
        orderType: job.orderType,
        productType: job.productType,
        exchange: job.exchange,
      };

      // Place order
      const broker = BrokerFactory.createAngelOneBroker();
      const orderResponse = await broker.placeOrder(credentials, orderRequest);

      // Create order record in database
      await prisma.order.create({
        data: {
          signalId: job.signalId,
          accountId: job.accountId,
          brokerOrderId: orderResponse.orderId,
          status: orderResponse.status === 'executed' ? 'executed' : 'pending',
          executedAt: orderResponse.status === 'executed' ? new Date() : null,
          errorMessage: orderResponse.status === 'failed' ? orderResponse.message : null,
        },
      });

      // Log the order placement
      await prisma.log.create({
        data: {
          userId: 'system', // System-generated orders
          action: 'ORDER_PLACEMENT',
          details: {
            signalId: job.signalId,
            accountId: job.accountId,
            symbol: job.symbol,
            symbolToken: job.symbolToken,
            side: job.side,
            quantity: job.quantity,
            orderType: job.orderType,
            limitPrice: job.limitPrice,
            productType: job.productType,
            exchange: job.exchange,
            orderId: orderResponse.orderId,
            status: orderResponse.status,
            message: orderResponse.message,
          },
          level: orderResponse.status === 'failed' ? 'error' : 'info',
        },
      });

      job.status = 'completed';
      console.log('📋 [Signal Queue] Job completed:', job.id);

    } catch (error) {
      console.error('📋 [Signal Queue] Job failed:', job.id, error);

      job.retryCount++;
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (job.retryCount < this.MAX_RETRIES) {
        // Re-queue job for retry
        console.log('📋 [Signal Queue] Re-queuing job for retry:', job.id, 'attempt:', job.retryCount);
        job.status = 'pending';
        this.jobQueue.unshift(job); // Add to front of queue
      } else {
        job.status = 'failed';
        console.log('📋 [Signal Queue] Job permanently failed after', this.MAX_RETRIES, 'retries:', job.id);
      }
    }
  }

  /**
   * Get queue statistics
   */
  static getQueueStats() {
    const pending = this.jobQueue.filter(job => job.status === 'pending').length;
    const processing = this.jobQueue.filter(job => job.status === 'processing').length;
    const completed = this.jobQueue.filter(job => job.status === 'completed').length;
    const failed = this.jobQueue.filter(job => job.status === 'failed').length;

    return {
      queueLength: this.jobQueue.length,
      pending,
      processing,
      completed,
      failed,
      isProcessing: this.processing,
    };
  }

  /**
   * Clear all jobs from queue (emergency use only)
   */
  static clearQueue(): void {
    console.log('📋 [Signal Queue] Clearing queue with', this.jobQueue.length, 'jobs');
    this.jobQueue = [];
  }
}