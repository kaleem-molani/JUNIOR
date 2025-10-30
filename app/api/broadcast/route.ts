import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { symbol, quantity, action, type, orderType = 'MARKET', limitPrice, exchange = 'NSE' } = await request.json();

    if (!symbol || !quantity || !action || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
      return NextResponse.json({ error: 'Limit price is required for limit orders' }, { status: 400 });
    }

    // Ensure symbol exists - find or create
    let symbolRecord = await prisma.symbol.findFirst({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!symbolRecord) {
      // Create new symbol if it doesn't exist
      symbolRecord = await prisma.symbol.create({
        data: {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          exchange: 'NSE',
        },
      });
    }

    // Execute ultra-fast broadcast for all accounts simultaneously
    const { FastBroadcast } = await import('@/lib/broadcast/fast-broadcast');
    const broadcastResult = await FastBroadcast.broadcastSignal(
      session.user.id,
      symbol,
      quantity,
      action as 'BUY' | 'SELL',
      orderType as 'MARKET' | 'LIMIT',
      limitPrice,
      type as 'DELIVERY' | 'INTRADAY',
      exchange as 'NSE'
    );

    if (!broadcastResult) {
      return NextResponse.json({
        error: 'Broadcast preparation failed'
      }, { status: 500 });
    }

    console.log(`📡 [Broadcast] Fast broadcast completed in ${broadcastResult.executionTime}ms`);
    console.log(`📡 [Broadcast] Executed: ${broadcastResult.executedOrders}/${broadcastResult.totalAccounts}`);

    return NextResponse.json({
      success: true,
      signal: { id: broadcastResult.signalId, symbol, quantity, action, type, orderType, limitPrice },
      broadcastResult,
      message: `Signal broadcast executed for ${broadcastResult.executedOrders}/${broadcastResult.totalAccounts} accounts in ${broadcastResult.executionTime}ms`,
    });
  } catch (error) {
    console.error('Broadcast API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}