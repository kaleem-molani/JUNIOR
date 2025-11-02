// app/api/accounts/[id]/orders/route.ts
// Get orders for a specific account

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/accounts/:id/orders
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins cannot access trading account orders
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super administrators cannot access trading account orders' }, { status: 403 });
    }

    // Admins cannot access trading account orders
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Administrators cannot access trading account orders' }, { status: 403 });
    }

    const { id: accountId } = await params;
    if (!accountId) {
      return NextResponse.json({ error: 'Missing account id' }, { status: 400 });
    }

    // Verify that the account belongs to the authenticated user
    const account = await prisma.tradingAccount.findUnique({
      where: { id: accountId },
      select: { id: true, userId: true, name: true },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 });
    }

    // Fetch orders from DB and include signal details for richer response
    const orders = await prisma.order.findMany({
      where: { accountId: account.id },
      include: {
        signal: {
          select: {
            symbol: true,
            quantity: true,
            action: true,
            limitPrice: true,
            broadcastAt: true,
          },
        },
      },
      orderBy: { executedAt: 'desc' },
    });

    // Map to response shape expected by the frontend
    const result = orders.map(o => ({
      id: o.id,
      orderId: o.brokerOrderId || o.id,
      symbol: o.signal?.symbol || 'N/A',
      side: o.signal?.action || 'BUY',
      quantity: o.signal?.quantity || 0,
      price: o.signal?.limitPrice ?? null,
      status: o.status,
      orderDate: (o.executedAt || o.signal?.broadcastAt || new Date()).toISOString(),
      errorMessage: o.errorMessage || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching account orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}