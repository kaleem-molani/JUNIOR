// app/api/accounts/[id]/orders/route.ts
// Get orders for a specific account

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
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

    // For now, return mock orders data
    // In production, this would fetch from the broker API or database
    const mockOrders = [
      {
        id: '1',
        orderId: 'ORD001',
        symbol: 'RELIANCE',
        side: 'BUY',
        quantity: 10,
        price: 2500,
        status: 'EXECUTED',
        orderDate: new Date().toISOString(),
      },
      {
        id: '2',
        orderId: 'ORD002',
        symbol: 'TCS',
        side: 'SELL',
        quantity: 5,
        price: 3200,
        status: 'PENDING',
        orderDate: new Date().toISOString(),
      },
    ];

    return NextResponse.json(mockOrders);
  } catch (error) {
    console.error('Error fetching account orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}