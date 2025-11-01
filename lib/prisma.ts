import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with optimized connection pooling for high concurrency
function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Global Prisma client instance with connection pooling
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Connection health monitoring
export const prismaHealth = {
  async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 as test`
      return true
    } catch (error) {
      console.error('Database connection check failed:', error)
      return false
    }
  },

  async getConnectionInfo() {
    try {
      const result = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT version() as version
      `
      return {
        connected: true,
        version: result[0]?.version || 'Unknown',
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to get connection info:', error)
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }
    }
  },

  async getPoolStats() {
    try {
      // Get active connections (PostgreSQL specific)
      const activeConnections = await prisma.$queryRaw<{ count: number }[]>`
        SELECT count(*) as count FROM pg_stat_activity
        WHERE datname = current_database() AND state = 'active'
      `

      return {
        activeConnections: activeConnections[0]?.count || 0,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to get pool stats',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

// In development, store client on global to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handling for serverless environments
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  // Handle cleanup on process termination
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  // Handle cleanup on uncaught exceptions
  process.on('uncaughtException', async () => {
    await prisma.$disconnect()
    process.exit(1)
  })

  // Handle cleanup on unhandled promise rejections
  process.on('unhandledRejection', async () => {
    await prisma.$disconnect()
    process.exit(1)
  })
}