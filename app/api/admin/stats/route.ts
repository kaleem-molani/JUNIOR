import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get various stats in parallel
    const [
      totalUsers,
      totalSignals,
      activeAccounts,
      totalOrders,
      recentSignals,
      userGrowth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.signal.count(),
      prisma.tradingAccount.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.signal.count({
        where: {
          broadcastAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalSignals,
      activeAccounts,
      totalOrders,
      recentSignals, // Signals in last 24 hours
      userGrowth, // Users registered in last 30 days
      averageOrdersPerSignal: totalSignals > 0 ? Math.round(totalOrders / totalSignals) : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}