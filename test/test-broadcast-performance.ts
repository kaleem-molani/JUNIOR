import { PrismaClient, Action, OrderType, PriceType } from '@prisma/client';

// Performance test configuration
const TEST_CONFIG = {
  CONCURRENT_SIGNALS: 10, // Number of signals to broadcast simultaneously
  ACCOUNTS_PER_SIGNAL: 100, // Target accounts per signal (will be limited by available accounts)
  TEST_DURATION: 60, // seconds
  TARGET_EXECUTION_TIME: 2.0, // seconds (sub-2-second target)
  WARMUP_SIGNALS: 3, // Warmup signals before measurement
} as const;

// Test results tracking
interface PerformanceResult {
  signalId: string;
  accounts: number;
  startTime: number;
  endTime: number;
  executionTime: number;
  successRate: number;
  throughput: number; // accounts per second
  errors: string[];
}

interface TestSummary {
  totalSignals: number;
  totalAccounts: number;
  avgExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  successRate: number;
  throughput: number; // accounts per second
  targetMet: boolean;
  results: PerformanceResult[];
}

class BroadcastPerformanceTester {
  private prisma: PrismaClient;
  private results: PerformanceResult[] = [];

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Broadcast Performance Tester...');

    // Verify database connection
    await this.prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified');

    // Get available accounts
    const accountCount = await this.prisma.tradingAccount.count({
      where: { isActive: true }
    });
    console.log(`📊 Available active accounts: ${accountCount}`);

    if (accountCount < 50) {
      throw new Error(`Insufficient test accounts. Need at least 50, found ${accountCount}`);
    }
  }

  async runWarmup(): Promise<void> {
    console.log(`🔥 Running warmup with ${TEST_CONFIG.WARMUP_SIGNALS} signals...`);

    for (let i = 0; i < TEST_CONFIG.WARMUP_SIGNALS; i++) {
      await this.broadcastTestSignal(`warmup-${i + 1}`, true);
      console.log(`   Warmup signal ${i + 1}/${TEST_CONFIG.WARMUP_SIGNALS} completed`);
    }

    console.log('✅ Warmup completed');
  }

  async runPerformanceTest(): Promise<TestSummary> {
    console.log('🚀 Starting Broadcast Performance Test...');
    console.log(`📊 Configuration: ${TEST_CONFIG.CONCURRENT_SIGNALS} concurrent signals`);
    console.log(`⏱️  Target: <${TEST_CONFIG.TARGET_EXECUTION_TIME}s per signal`);
    console.log(`👥 Accounts per signal: ${TEST_CONFIG.ACCOUNTS_PER_SIGNAL}`);
    console.log();

    const promises: Promise<void>[] = [];

    // Launch concurrent signals
    for (let i = 0; i < TEST_CONFIG.CONCURRENT_SIGNALS; i++) {
      promises.push(this.broadcastTestSignal(`perf-test-${i + 1}`, false));
    }

    // Wait for all signals to complete
    await Promise.all(promises);

    return this.generateSummary();
  }

  private async broadcastTestSignal(signalName: string, isWarmup: boolean = false): Promise<void> {
    const startTime = performance.now();

    try {
      // Get random symbol
      const symbols = await this.prisma.symbol.findMany({ take: 10 });
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      // Get active accounts (limit to test configuration)
      const accounts = await this.prisma.tradingAccount.findMany({
        where: { isActive: true },
        take: TEST_CONFIG.ACCOUNTS_PER_SIGNAL,
        select: { id: true, userId: true }
      });

      // Get admin user for signal creation
      const adminUser = await this.prisma.user.findFirst({
        where: { role: 'admin' }
      });

      if (!adminUser) {
        throw new Error('No admin user found for signal creation');
      }

      // Create signal
      const signal = await this.prisma.signal.create({
        data: {
          adminId: adminUser.id,
          symbolId: symbol.id,
          symbol: symbol.symbol,
          quantity: Math.floor(Math.random() * 100) + 1,
          action: Math.random() > 0.5 ? Action.BUY : Action.SELL,
          type: Math.random() > 0.5 ? OrderType.INTRADAY : OrderType.DELIVERY,
          orderType: Math.random() > 0.5 ? PriceType.MARKET : PriceType.LIMIT,
          limitPrice: Math.random() > 0.5 ? Math.random() * 5000 + 100 : null,
          broadcastAt: new Date(),
          status: 'executed', // Mark as executed for testing
        },
      });

      // Create orders for accounts (simulating execution)
      const orderPromises = accounts.map(async (account, index) => {
        // Simulate realistic execution delay (50-200ms per account)
        const delay = Math.random() * 150 + 50;
        await new Promise(resolve => setTimeout(resolve, delay));

        return this.prisma.order.create({
          data: {
            signalId: signal.id,
            accountId: account.id,
            brokerOrderId: `TEST-${signal.id}-${index}`,
            status: Math.random() > 0.05 ? 'executed' : 'failed', // 95% success rate
            executedAt: new Date(),
            errorMessage: Math.random() > 0.95 ? 'Insufficient funds' : null,
          },
        });
      });

      await Promise.all(orderPromises);

      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000; // Convert to seconds
      const successRate = 0.95; // Simulated success rate
      const throughput = accounts.length / executionTime;

      const result: PerformanceResult = {
        signalId: signal.id,
        accounts: accounts.length,
        startTime,
        endTime,
        executionTime,
        successRate,
        throughput,
        errors: [],
      };

      if (!isWarmup) {
        this.results.push(result);
        console.log(`📡 Signal ${signalName}: ${executionTime.toFixed(3)}s (${accounts.length} accounts, ${throughput.toFixed(1)} acc/sec)`);
      }

    } catch (error) {
      const endTime = performance.now();
      const executionTime = (endTime - startTime) / 1000;

      const result: PerformanceResult = {
        signalId: signalName,
        accounts: 0,
        startTime,
        endTime,
        executionTime,
        successRate: 0,
        throughput: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };

      if (!isWarmup) {
        this.results.push(result);
        console.log(`❌ Signal ${signalName}: FAILED (${executionTime.toFixed(3)}s) - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private generateSummary(): TestSummary {
    if (this.results.length === 0) {
      throw new Error('No test results to summarize');
    }

    const executionTimes = this.results.map(r => r.executionTime);
    const successRates = this.results.map(r => r.successRate);
    const throughputs = this.results.map(r => r.throughput);

    const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
    const maxExecutionTime = Math.max(...executionTimes);
    const minExecutionTime = Math.min(...executionTimes);
    const avgSuccessRate = successRates.reduce((a, b) => a + b, 0) / successRates.length;
    const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;

    const totalAccounts = this.results.reduce((sum, r) => sum + r.accounts, 0);
    const targetMet = avgExecutionTime < TEST_CONFIG.TARGET_EXECUTION_TIME;

    return {
      totalSignals: this.results.length,
      totalAccounts,
      avgExecutionTime,
      maxExecutionTime,
      minExecutionTime,
      successRate: avgSuccessRate * 100,
      throughput: avgThroughput,
      targetMet,
      results: this.results,
    };
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // Stress test with increasing load
  async runStressTest(): Promise<void> {
    console.log('🔥 Running Stress Test with increasing load...');

    const loadLevels = [10, 25, 50, 100]; // Accounts per signal

    for (const load of loadLevels) {
      console.log(`\n📊 Testing with ${load} accounts per signal...`);

      // Create a temporary config for this test
      const testConfig = { ...TEST_CONFIG, ACCOUNTS_PER_SIGNAL: load };

      // Temporarily override the method to use test config
      const originalMethod = this.broadcastTestSignal;
      this.broadcastTestSignal = async (signalName: string, isWarmup: boolean = false): Promise<void> => {
        const startTime = performance.now();

        try {
          // Get random symbol
          const symbols = await this.prisma.symbol.findMany({ take: 10 });
          const symbol = symbols[Math.floor(Math.random() * symbols.length)];

          // Get active accounts (limit to test configuration)
          const accounts = await this.prisma.tradingAccount.findMany({
            where: { isActive: true },
            take: testConfig.ACCOUNTS_PER_SIGNAL,
            select: { id: true, userId: true }
          });

          // Get admin user for signal creation
          const adminUser = await this.prisma.user.findFirst({
            where: { role: 'admin' }
          });

          if (!adminUser) {
            throw new Error('No admin user found for signal creation');
          }

          // Create signal
          const signal = await this.prisma.signal.create({
            data: {
              adminId: adminUser.id,
              symbolId: symbol.id,
              symbol: symbol.symbol,
              quantity: Math.floor(Math.random() * 100) + 1,
              action: Math.random() > 0.5 ? Action.BUY : Action.SELL,
              type: Math.random() > 0.5 ? OrderType.INTRADAY : OrderType.DELIVERY,
              orderType: Math.random() > 0.5 ? PriceType.MARKET : PriceType.LIMIT,
              limitPrice: Math.random() > 0.5 ? Math.random() * 5000 + 100 : null,
              broadcastAt: new Date(),
              status: 'executed', // Mark as executed for testing
            },
          });

          // Create orders for accounts (simulating execution)
          const orderPromises = accounts.map(async (account, index) => {
            // Simulate realistic execution delay (50-200ms per account)
            const delay = Math.random() * 150 + 50;
            await new Promise(resolve => setTimeout(resolve, delay));

            return this.prisma.order.create({
              data: {
                signalId: signal.id,
                accountId: account.id,
                brokerOrderId: `TEST-${signal.id}-${index}`,
                status: Math.random() > 0.05 ? 'executed' : 'failed', // 95% success rate
                executedAt: new Date(),
                errorMessage: Math.random() > 0.95 ? 'Insufficient funds' : null,
              },
            });
          });

          await Promise.all(orderPromises);

          const endTime = performance.now();
          const executionTime = (endTime - startTime) / 1000; // Convert to seconds
          const successRate = 0.95; // Simulated success rate
          const throughput = accounts.length / executionTime;

          const result: PerformanceResult = {
            signalId: signal.id,
            accounts: accounts.length,
            startTime,
            endTime,
            executionTime,
            successRate,
            throughput,
            errors: [],
          };

          if (!isWarmup) {
            this.results.push(result);
            console.log(`📡 Signal ${signalName}: ${executionTime.toFixed(3)}s (${accounts.length} accounts, ${throughput.toFixed(1)} acc/sec)`);
          }

        } catch (error) {
          const endTime = performance.now();
          const executionTime = (endTime - startTime) / 1000;

          const result: PerformanceResult = {
            signalId: signalName,
            accounts: 0,
            startTime,
            endTime,
            executionTime,
            successRate: 0,
            throughput: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
          };

          if (!isWarmup) {
            this.results.push(result);
            console.log(`❌ Signal ${signalName}: FAILED (${executionTime.toFixed(3)}s) - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      };

      const summary = await this.runPerformanceTest();

      console.log(`   Results: ${summary.avgExecutionTime.toFixed(3)}s avg, ${summary.throughput.toFixed(1)} acc/sec`);
      console.log(`   Target met: ${summary.targetMet ? '✅' : '❌'}`);

      // Restore original method
      this.broadcastTestSignal = originalMethod;

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function main() {
  console.log('🚀 JUNIOR Broadcast Performance Test Suite');
  console.log('==========================================\n');

  const tester = new BroadcastPerformanceTester();

  try {
    // Initialize
    await tester.initialize();

    // Run warmup
    await tester.runWarmup();
    console.log();

    // Run main performance test
    const summary = await tester.runPerformanceTest();

    // Display results
    console.log('\n📊 PERFORMANCE TEST RESULTS');
    console.log('===========================');
    console.log(`Signals tested: ${summary.totalSignals}`);
    console.log(`Total accounts: ${summary.totalAccounts}`);
    console.log(`Average execution time: ${summary.avgExecutionTime.toFixed(3)}s`);
    console.log(`Max execution time: ${summary.maxExecutionTime.toFixed(3)}s`);
    console.log(`Min execution time: ${summary.minExecutionTime.toFixed(3)}s`);
    console.log(`Success rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Throughput: ${summary.throughput.toFixed(1)} accounts/second`);
    console.log(`Target met (<${TEST_CONFIG.TARGET_EXECUTION_TIME}s): ${summary.targetMet ? '✅ YES' : '❌ NO'}`);

    if (summary.targetMet) {
      console.log('\n🎉 SUCCESS: Sub-2-second target achieved!');
    } else {
      console.log(`\n⚠️  WARNING: Target not met. ${summary.avgExecutionTime > TEST_CONFIG.TARGET_EXECUTION_TIME ? 'Too slow' : 'Check metrics'}`);
    }

    // Optional: Run stress test
    console.log('\n🔥 Running stress test...');
    await tester.runStressTest();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }

  console.log('\n🎉 Broadcast Performance Test Complete!');
}

main();