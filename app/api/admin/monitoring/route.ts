import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized - Super admin access required' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type') || 'overview';
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    switch (dataType) {
      case 'accounts':
        return await getAllAccounts(limit, offset);
      case 'signals':
        return await getAllSignals(limit, offset);
      case 'orders':
        return await getAllOrders(limit, offset);
      case 'tradebook':
        return await getTradebook(limit, offset);
      case 'overview':
      default:
        return await getSystemOverview();
    }
  } catch (error) {
    console.error('Super admin monitoring error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

async function getSystemOverview() {
  // Get comprehensive system statistics
  const [
    userStats,
    accountStats,
    signalStats,
    orderStats,
    recentActivity
  ] = await Promise.all([
    // User statistics
    prisma.user.aggregate({
      _count: { id: true },
      where: { isActive: true }
    }),

    // Account statistics
    prisma.tradingAccount.aggregate({
      _count: { id: true },
      where: { isActive: true }
    }),

    // Signal statistics
    prisma.signal.aggregate({
      _count: { id: true },
      where: { status: 'executed' }
    }),

    // Order statistics
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    }),

    // Recent activity (last 24 hours)
    prisma.signal.findMany({
      where: {
        broadcastAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        admin: {
          select: { email: true, name: true }
        },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { broadcastAt: 'desc' },
      take: 20
    })
  ]);

  const orderStatsMap = orderStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    overview: {
      totalUsers: userStats._count.id,
      totalActiveAccounts: accountStats._count.id,
      totalExecutedSignals: signalStats._count.id,
      orderStats: orderStatsMap,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        symbol: activity.symbol,
        action: activity.action,
        quantity: activity.quantity,
        status: activity.status,
        broadcastAt: activity.broadcastAt.toISOString(),
        admin: activity.admin,
        ordersCount: activity._count.orders
      }))
    }
  });
}

async function getAllAccounts(limit: number, offset: number) {
  const accounts = await prisma.tradingAccount.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
          isActive: true
        }
      },
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });

  const total = await prisma.tradingAccount.count();

  return NextResponse.json({
    accounts: accounts.map(account => ({
      id: account.id,
      name: account.name,
      broker: account.broker,
      clientCode: account.clientCode,
      isActive: account.isActive,
      createdAt: account.createdAt.toISOString(),
      lastUsed: account.lastUsed?.toISOString(),
      ordersCount: account._count.orders,
      user: account.user
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

async function getAllSignals(limit: number, offset: number) {
  const signals = await prisma.signal.findMany({
    include: {
      admin: {
        select: {
          email: true,
          name: true
        }
      },
      symbolData: {
        select: {
          symbol: true,
          name: true,
          exchange: true
        }
      },
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { broadcastAt: 'desc' },
    take: limit,
    skip: offset
  });

  const total = await prisma.signal.count();

  return NextResponse.json({
    signals: signals.map(signal => ({
      id: signal.id,
      symbol: signal.symbol,
      quantity: signal.quantity,
      action: signal.action,
      type: signal.type,
      orderType: signal.orderType,
      limitPrice: signal.limitPrice,
      broadcastAt: signal.broadcastAt.toISOString(),
      status: signal.status,
      ordersCount: signal._count.orders,
      admin: signal.admin,
      symbolData: signal.symbolData
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

async function getAllOrders(limit: number, offset: number) {
  const orders = await prisma.order.findMany({
    include: {
      signal: {
        select: {
          symbol: true,
          action: true,
          quantity: true,
          broadcastAt: true
        }
      },
      account: {
        select: {
          name: true,
          broker: true,
          user: {
            select: {
              email: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: { executedAt: 'desc' },
    take: limit,
    skip: offset
  });

  const total = await prisma.order.count();

  return NextResponse.json({
    orders: orders.map(order => ({
      id: order.id,
      signalId: order.signalId,
      accountId: order.accountId,
      brokerOrderId: order.brokerOrderId,
      status: order.status,
      executedAt: order.executedAt?.toISOString(),
      errorMessage: order.errorMessage,
      signal: order.signal,
      account: {
        name: order.account.name,
        broker: order.account.broker,
        user: order.account.user
      }
    })),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}

async function getTradebook(limit: number, offset: number) {
  // Get comprehensive tradebook with all order details
  const orders = await prisma.order.findMany({
    where: {
      executedAt: { not: null } // Only executed orders
    },
    include: {
      signal: {
        select: {
          symbol: true,
          action: true,
          quantity: true,
          type: true,
          orderType: true,
          limitPrice: true,
          broadcastAt: true
        }
      },
      account: {
        select: {
          name: true,
          broker: true,
          user: {
            select: {
              email: true,
              name: true,
              role: true
            }
          }
        }
      }
    },
    orderBy: { executedAt: 'desc' },
    take: limit,
    skip: offset
  });

  const total = await prisma.order.count({
    where: { executedAt: { not: null } }
  });

  // Calculate trade statistics
  const stats = {
    totalTrades: total,
    successfulTrades: orders.filter(o => o.status === 'executed').length,
    failedTrades: orders.filter(o => o.status === 'failed').length,
    buyTrades: orders.filter(o => o.signal.action === 'BUY').length,
    sellTrades: orders.filter(o => o.signal.action === 'SELL').length,
    totalValue: orders.reduce((sum, order) => {
      // Estimate value based on quantity and typical price
      const estimatedPrice = order.signal.limitPrice || 100; // Default estimate
      return sum + (order.signal.quantity * estimatedPrice);
    }, 0)
  };

  return NextResponse.json({
    tradebook: orders.map(order => ({
      id: order.id,
      tradeId: order.brokerOrderId || order.id,
      symbol: order.signal.symbol,
      action: order.signal.action,
      quantity: order.signal.quantity,
      price: order.signal.limitPrice,
      orderType: order.signal.orderType,
      tradeType: order.signal.type,
      status: order.status,
      executedAt: order.executedAt?.toISOString(),
      signalTime: order.signal.broadcastAt.toISOString(),
      broker: order.account.broker,
      accountName: order.account.name,
      user: order.account.user,
      errorMessage: order.errorMessage
    })),
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}