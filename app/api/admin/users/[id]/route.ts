import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        isExecutionEnabled: true,
        primaryBroker: true,
        restrictedSymbols: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's trading accounts
    const tradingAccounts = await prisma.tradingAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        broker: true,
        clientCode: true,
        apiKey: true,
        isActive: true,
        createdAt: true,
        lastUsed: true,
        _count: {
          select: { orders: true }
        }
      }
    });

    // Get user's signals
    const signals = await prisma.signal.findMany({
      where: { adminId: userId },
      orderBy: { broadcastAt: 'desc' },
      take: 50, // Limit for performance
      select: {
        id: true,
        symbol: true,
        quantity: true,
        action: true,
        type: true,
        orderType: true,
        limitPrice: true,
        broadcastAt: true,
        status: true,
        _count: {
          select: { orders: true }
        }
      }
    });

    // Get user's recent orders (tradebook)
    const orders = await prisma.order.findMany({
      where: {
        account: {
          userId: userId
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 100, // Limit for performance
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
            broker: true
          }
        }
      }
    });

    // Get user's activity logs
    const logs = await prisma.log.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50, // Limit for performance
      select: {
        id: true,
        action: true,
        details: true,
        timestamp: true,
        level: true
      }
    });

    // Calculate statistics
    const stats = {
      totalAccounts: tradingAccounts.length,
      activeAccounts: tradingAccounts.filter(acc => acc.isActive).length,
      totalSignals: signals.length,
      executedSignals: signals.filter(sig => sig.status === 'executed').length,
      totalOrders: orders.length,
      executedOrders: orders.filter(order => order.status === 'executed').length,
      failedOrders: orders.filter(order => order.status === 'failed').length,
      totalLogs: logs.length,
    };

    return NextResponse.json({
      user,
      tradingAccounts: tradingAccounts.map(account => ({
        ...account,
        ordersCount: account._count.orders
      })),
      signals: signals.map(signal => ({
        ...signal,
        ordersCount: signal._count.orders
      })),
      orders: orders.map(order => ({
        id: order.id,
        signalId: order.signalId,
        accountId: order.accountId,
        brokerOrderId: order.brokerOrderId,
        status: order.status,
        executedAt: order.executedAt?.toISOString(),
        errorMessage: order.errorMessage,
        signal: order.signal,
        account: order.account
      })),
      logs,
      stats
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}