// app/api/monitoring/route.ts
// Monitoring dashboard API endpoint

import { NextRequest, NextResponse } from 'next/server'
import { prisma, prismaHealth } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')

    switch (metric) {
      case 'database':
        return await getDatabaseMetrics()
      case 'broadcast':
        return await getBroadcastMetrics()
      case 'system':
        return await getSystemMetrics()
      default:
        return await getAllMetrics()
    }
  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    )
  }
}

async function getDatabaseMetrics() {
  try {
    // Simple connection test
    const connectionHealth = await prismaHealth.checkConnection()

    // Simple connection info
    const connectionInfo = await prismaHealth.getConnectionInfo()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        connection: connectionHealth,
        info: connectionInfo,
        pool: { activeConnections: 0 }, // Simplified
        tables: [], // Simplified
      },
    })
  } catch (error) {
    console.error('Database metrics error:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      database: {
        connection: false,
        info: { connected: false, error: 'Database connection failed' },
        pool: { activeConnections: 0 },
        tables: [],
      },
    })
  }
}

async function getBroadcastMetrics() {
  // Get recent broadcast performance data
  const recentBroadcasts = await prisma.signal.findMany({
    take: 50,
    orderBy: { broadcastAt: 'desc' },
    include: {
      _count: {
        select: { orders: true }
      }
    }
  })

  // Calculate performance metrics
  const totalSignals = recentBroadcasts.length
  const totalOrders = recentBroadcasts.reduce((sum, signal) => sum + signal._count.orders, 0)
  const avgOrdersPerSignal = totalSignals > 0 ? totalOrders / totalSignals : 0

  // Get execution times (mock data for now - would need actual timing data)
  const executionMetrics = {
    averageExecutionTime: 1.2, // seconds
    maxExecutionTime: 1.8,
    minExecutionTime: 0.8,
    targetTime: 2.0, // sub-2-second target
    successRate: 98.5,
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    broadcast: {
      totalSignals,
      totalOrders,
      avgOrdersPerSignal,
      executionMetrics,
      recentActivity: recentBroadcasts.slice(0, 10).map(signal => ({
        id: signal.id,
        symbol: signal.symbol,
        action: signal.action,
        quantity: signal.quantity,
        orderCount: signal._count.orders,
        broadcastAt: signal.broadcastAt,
      })),
    },
  })
}

async function getSystemMetrics() {
  const systemMetrics = {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      APP_ENV: process.env.APP_ENV,
      SANDBOX_MODE: process.env.SANDBOX_MODE,
    },
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    system: systemMetrics,
  })
}

async function getAllMetrics() {
  const [dbResponse, broadcastResponse, systemResponse] = await Promise.all([
    getDatabaseMetrics(),
    getBroadcastMetrics(),
    getSystemMetrics(),
  ])

  const dbData = await dbResponse.json()
  const broadcastData = await broadcastResponse.json()
  const systemData = await systemResponse.json()

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    metrics: {
      database: dbData.database,
      broadcast: broadcastData.broadcast,
      system: systemData.system,
    },
  })
}