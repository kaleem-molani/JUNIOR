// test-monitoring-dashboard.ts
// Comprehensive test script for monitoring dashboard and performance validation

import { performance } from 'perf_hooks';

interface MonitoringData {
  database: {
    connection: boolean;
    info: { connected: boolean; version?: string; error?: string };
    pool: { activeConnections?: number; error?: string };
    tables: Array<{ tablename: string; live_rows: number; dead_rows: number; inserts: number }>;
  };
  broadcast: {
    totalSignals: number;
    totalOrders: number;
    avgOrdersPerSignal: number;
    executionMetrics: {
      averageExecutionTime: number;
      maxExecutionTime: number;
      minExecutionTime: number;
      targetTime: number;
      successRate: number;
    };
    recentActivity: Array<{
      id: string;
      symbol: string;
      action: string;
      quantity: number;
      orderCount: number;
      broadcastAt: string;
    }>;
  };
  system: {
    memory: { rss: number; heapTotal: number; heapUsed: number; external: number };
    uptime: number;
    nodeVersion: string;
    platform: string;
    environment: { NODE_ENV?: string; APP_ENV?: string; SANDBOX_MODE?: string };
  };
}

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  duration?: number;
  error?: string;
  details?: Record<string, unknown>;
}

class MonitoringDashboardTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:4001') {
    this.baseUrl = baseUrl;
  }

  private async makeRequest(endpoint: string, options?: RequestInit): Promise<{ data: MonitoringData; duration: number }> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const duration = performance.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as MonitoringData;
      return { data, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      throw { error: error instanceof Error ? error.message : 'Unknown error', duration };
    }
  }

  private logResult(result: TestResult) {
    this.results.push(result);
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration.toFixed(2)}ms)` : '';
    console.log(`${statusIcon} ${result.test}${duration}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  }

  async testMonitoringAPI() {
    console.log('\n🧪 Testing Monitoring API...');

    try {
      const { data, duration } = await this.makeRequest('/api/monitoring');
      this.logResult({
        test: 'Monitoring API Response',
        status: 'PASS',
        duration,
        details: {
          hasDatabase: !!data.database,
          hasBroadcast: !!data.broadcast,
          hasSystem: !!data.system,
        },
      });

      // Test database metrics
      if (data.database) {
        this.logResult({
          test: 'Database Metrics',
          status: 'PASS',
          details: {
            connection: data.database.connection,
            activeConnections: data.database.pool?.activeConnections,
            tableCount: data.database.tables?.length,
          },
        });
      }

      // Test broadcast metrics
      if (data.broadcast) {
        this.logResult({
          test: 'Broadcast Metrics',
          status: 'PASS',
          details: {
            totalSignals: data.broadcast.totalSignals,
            totalOrders: data.broadcast.totalOrders,
            avgExecutionTime: data.broadcast.executionMetrics?.averageExecutionTime,
            successRate: data.broadcast.executionMetrics?.successRate,
            onTarget: data.broadcast.executionMetrics?.averageExecutionTime <= data.broadcast.executionMetrics?.targetTime,
          },
        });
      }

      // Test system metrics
      if (data.system) {
        this.logResult({
          test: 'System Metrics',
          status: 'PASS',
          details: {
            uptime: data.system.uptime,
            memoryUsed: Math.round(data.system.memory?.heapUsed / 1024 / 1024),
            nodeVersion: data.system.nodeVersion,
            platform: data.system.platform,
          },
        });
      }

    } catch (error: unknown) {
      this.logResult({
        test: 'Monitoring API Response',
        status: 'FAIL',
        duration: error && typeof error === 'object' && 'duration' in error ? (error as { duration: number }).duration : undefined,
        error: error && typeof error === 'object' && 'error' in error ? (error as { error: string }).error : 'Unknown error',
      });
    }
  }

  async testPerformanceTargets() {
    console.log('\n🎯 Testing Performance Targets...');

    try {
      const { data } = await this.makeRequest('/api/monitoring');

      const targetTime = data.broadcast?.executionMetrics?.targetTime || 2.0;
      const avgTime = data.broadcast?.executionMetrics?.averageExecutionTime || 0;

      this.logResult({
        test: 'Sub-2-Second Execution Target',
        status: avgTime <= targetTime ? 'PASS' : 'FAIL',
        details: {
          target: targetTime,
          actual: avgTime,
          difference: (avgTime - targetTime).toFixed(3),
        },
      });

      const successRate = data.broadcast?.executionMetrics?.successRate || 0;
      this.logResult({
        test: 'High Success Rate (>95%)',
        status: successRate >= 95 ? 'PASS' : 'FAIL',
        details: {
          successRate: `${successRate}%`,
          target: '95%',
        },
      });

    } catch (error: unknown) {
      this.logResult({
        test: 'Performance Targets Check',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async testConcurrentLoad() {
    console.log('\n⚡ Testing Concurrent Load (100+ accounts simulation)...');

    const concurrentRequests = 50; // Simulate 50 concurrent monitoring requests
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(this.makeRequest('/api/monitoring'));
    }

    const startTime = performance.now();

    try {
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logResult({
        test: `Concurrent Load (${concurrentRequests} requests)`,
        status: failed === 0 ? 'PASS' : 'FAIL',
        duration: totalDuration,
        details: {
          successful,
          failed,
          avgResponseTime: (totalDuration / concurrentRequests).toFixed(2),
          throughput: (concurrentRequests / (totalDuration / 1000)).toFixed(2) + ' req/sec',
        },
      });

    } catch (error: unknown) {
      this.logResult({
        test: 'Concurrent Load Test',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async testDatabaseHealth() {
    console.log('\n🗄️  Testing Database Health...');

    try {
      const { data } = await this.makeRequest('/api/monitoring');

      // Check connection
      this.logResult({
        test: 'Database Connection',
        status: data.database?.connection ? 'PASS' : 'FAIL',
        details: data.database?.info,
      });

      // Check connection pool
      const activeConnections = data.database?.pool?.activeConnections || 0;
      this.logResult({
        test: 'Connection Pool Health',
        status: activeConnections >= 0 && activeConnections < 50 ? 'PASS' : 'FAIL',
        details: {
          activeConnections,
          poolLimit: 50,
        },
      });

      // Check table statistics
      const tables = data.database?.tables || [];
      this.logResult({
        test: 'Table Statistics Available',
        status: tables.length > 0 ? 'PASS' : 'FAIL',
        details: {
          tableCount: tables.length,
          tables: tables.slice(0, 3).map((t) => t.tablename),
        },
      });

    } catch (error: unknown) {
      this.logResult({
        test: 'Database Health Check',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async runAllTests() {
    console.log('🚀 JUNIOR Monitoring Dashboard Test Suite');
    console.log('==========================================');

    await this.testMonitoringAPI();
    await this.testPerformanceTargets();
    await this.testConcurrentLoad();
    await this.testDatabaseHealth();

    this.printSummary();
  }

  private printSummary() {
    console.log('\n📊 Test Summary');
    console.log('===============');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.test}: ${result.error || 'No details'}`);
        });
    }

    console.log('\n🎉 Monitoring Dashboard Test Complete!');
  }
}

// Run the tests
async function main() {
  const tester = new MonitoringDashboardTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MonitoringDashboardTester };