import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const signalId = searchParams.get('signalId');
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (signalId) {
      where.signalId = signalId;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (status) {
      where.status = status;
    }

    // For non-admin users, only show their own orders
    if (session.user.role !== 'admin') {
      const userAccounts = await prisma.tradingAccount.findMany({
        where: { userId: session.user.id },
        select: { id: true }
      });
      where.accountId = { in: userAccounts.map(acc => acc.id) };
    }

    // Get orders with related data
    const orders = await prisma.order.findMany({
      where,
      include: {
        signal: {
          select: {
            id: true,
            symbol: true,
            quantity: true,
            action: true,
            type: true,
            orderType: true,
            limitPrice: true,
            broadcastAt: true
          }
        },
        account: {
          select: {
            id: true,
            name: true,
            broker: true,
            clientCode: true,
            user: {
              select: {
                id: true,
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

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });

    // Calculate success rate and other stats
    const stats = {
      total: totalCount,
      executed: orders.filter(o => o.status === 'executed').length,
      pending: orders.filter(o => o.status === 'pending').length,
      failed: orders.filter(o => o.status === 'failed').length,
      partiallyExecuted: orders.filter(o => o.status === 'partially_executed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      successRate: totalCount > 0 ? Math.round((orders.filter(o => o.status === 'executed').length / totalCount) * 100) : 0
    };

    return NextResponse.json({
      orders,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}