import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const signals = await prisma.signal.findMany({
      orderBy: { broadcastAt: 'desc' },
      take: 50, // Last 50 signals
      include: {
        admin: {
          select: { email: true }
        },
        orders: {
          select: {
            status: true,
            accountId: true
          }
        }
      }
    });

    // Transform data for frontend
    const transformedSignals = signals.map(signal => ({
      id: signal.id,
      symbol: signal.symbol,
      quantity: signal.quantity,
      action: signal.action,
      type: signal.type,
      orderType: signal.orderType,
      limitPrice: signal.limitPrice,
      broadcastAt: signal.broadcastAt.toISOString(),
      status: signal.status,
      adminEmail: signal.admin.email,
      ordersCount: signal.orders.length,
      successRate: signal.orders.length > 0
        ? (signal.orders.filter(order => order.status === 'executed').length / signal.orders.length) * 100
        : 0
    }));

    return NextResponse.json(transformedSignals);
  } catch (error) {
    console.error('Get signals error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}