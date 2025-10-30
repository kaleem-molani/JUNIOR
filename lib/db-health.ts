// lib/db-health.ts
// Database connection health check utility

import { prisma } from './prisma';

export interface DBHealthStatus {
  status: 'healthy' | 'unhealthy';
  latency: number;
  connectionCount: number;
  lastChecked: Date;
  error?: string;
}

export class DBHealthChecker {
  private static lastHealthCheck: DBHealthStatus | null = null;
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  /**
   * Perform a health check on the database connection
   */
  static async checkHealth(): Promise<DBHealthStatus> {
    const startTime = Date.now();

    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1 as health_check`;

      const latency = Date.now() - startTime;

      // Get connection info (approximate)
      const connectionCount = await this.getConnectionCount();

      const healthStatus: DBHealthStatus = {
        status: 'healthy',
        latency,
        connectionCount,
        lastChecked: new Date(),
      };

      this.lastHealthCheck = healthStatus;
      return healthStatus;

    } catch (error) {
      const latency = Date.now() - startTime;

      const healthStatus: DBHealthStatus = {
        status: 'unhealthy',
        latency,
        connectionCount: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown database error',
      };

      this.lastHealthCheck = healthStatus;
      console.error('Database health check failed:', error);
      return healthStatus;
    }
  }

  /**
   * Get cached health status if recent, otherwise perform new check
   */
  static async getHealthStatus(): Promise<DBHealthStatus> {
    if (
      this.lastHealthCheck &&
      (Date.now() - this.lastHealthCheck.lastChecked.getTime()) < this.HEALTH_CHECK_INTERVAL
    ) {
      return this.lastHealthCheck;
    }

    return this.checkHealth();
  }

  /**
   * Get approximate connection count (PostgreSQL specific)
   */
  private static async getConnectionCount(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
        AND state = 'active'
      `;

      return result[0]?.count || 0;
    } catch (error) {
      // Fallback if we can't query connection count
      return -1;
    }
  }

  /**
   * Force disconnect and cleanup connections
   */
  static async forceDisconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      console.log('Database connections forcefully disconnected');
    } catch {
      // Ignore errors during forced disconnect
    }
  }
}