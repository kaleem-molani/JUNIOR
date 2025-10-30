import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Helper function to create Prisma client with optimized settings
function createPrismaClient() {
  return new PrismaClient({
    // Connection pool settings for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Logging in development only
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection timeout and pool settings
    // Note: These are handled by the database URL parameters in production
  })
}

// Use existing client in development, create new one in production/serverless
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// In development, store client on global to prevent hot reload issues
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handling for serverless environments
if (typeof process !== 'undefined') {
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