// app/api/accounts/[id]/signals/route.ts
// Get signals received by a specific user account

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🎯 [API] Get signals for account:', params.id);

  const session = await getServerSession(authOptions);
  if (!session) {
    console.log('❌ [API] No session found');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins don't have trading accounts or signals
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators do not have trading accounts or signals' }, { status: 403 });
  }

  // Admins don't have trading accounts or signals
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators do not have trading accounts or signals' }, { status: 403 });
  }

  const accountId = params.id;
  console.log('👤 [API] User ID from session:', session.user.id);

  try {
    // Verify that the account belongs to the authenticated user
    const account = await prisma.tradingAccount.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    });

    if (!account) {
      return NextResponse.json({
        error: 'Account not found or access denied'
      }, { status: 404 });
    }

    // Get all signals (not just those with orders) - signals are "received" by all active accounts
    // But we still need to check if there are any orders for this account to show status
    const signals = await prisma.signal.findMany({
      orderBy: { broadcastAt: 'desc' },
      take: 50, // Last 50 signals
      include: {
        admin: {
          select: { email: true }
        },
        orders: {
          where: {
            accountId: accountId
          },
          select: {
            id: true,
            status: true,
            executedAt: true,
            errorMessage: true
          }
        }
      }
    });

    console.log('📊 [API] Found', signals.length, 'signals for account', accountId);
    console.log('📊 [API] Sample signal:', signals[0] ? {
      id: signals[0].id,
      symbol: signals[0].symbol,
      ordersCount: signals[0].orders.length
    } : 'No signals');

    // Transform data for frontend
    const transformedSignals = signals.map(signal => {
      const accountOrder = signal.orders[0]; // There should be only one order per signal per account

      return {
        id: signal.id,
        symbol: signal.symbol,
        quantity: signal.quantity,
        action: signal.action,
        type: signal.type,
        orderType: signal.orderType,
        limitPrice: signal.limitPrice,
        broadcastAt: signal.broadcastAt.toISOString(),
        status: accountOrder?.status || 'pending',
        adminEmail: signal.admin.email,
        executedAt: accountOrder?.executedAt?.toISOString(),
        errorMessage: accountOrder?.errorMessage,
        orderId: accountOrder?.id
      };
    });

    return NextResponse.json(transformedSignals);
  } catch (error) {
    console.error('Get user signals error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}