// app/api/auth/angel_one/get-trade-book/route.ts
// Get AngelOne trade book

import { NextRequest, NextResponse } from 'next/server';
import { BrokerFactory } from '@/lib/brokers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TokenManager } from '@/lib/brokers/token-manager';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins cannot access trading account trade books
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators cannot access trading account trade books' }, { status: 403 });
  }

  // Admins cannot access trading account trade books
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators cannot access trading account trade books' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountName = searchParams.get('accountName');

    if (!accountName) {
      return NextResponse.json({
        error: 'Missing required parameter: accountName'
      }, { status: 400 });
    }

    // Verify that the account belongs to the authenticated user
    const account = await prisma.tradingAccount.findFirst({
      where: {
        userId: session.user.id,
        name: accountName,
      },
    });

    if (!account) {
      return NextResponse.json({
        error: 'Account not found or access denied'
      }, { status: 404 });
    }

    const broker = BrokerFactory.createAngelOneBroker();
    const authStorage = BrokerFactory.getAuthStorage();

    const credentials = await authStorage.loadAuth(account.id);
    if (!credentials?.accessToken) {
      return NextResponse.json({
        error: 'No authentication data found. Please generate token first.'
      }, { status: 401 });
    }

    // Check and refresh tokens if needed
    const validCredentials = await TokenManager.ensureValidTokens(account.id);

    if (!validCredentials?.accessToken) {
      return NextResponse.json({
        error: 'Authentication tokens expired. Please regenerate tokens.'
      }, { status: 401 });
    }

    const tradeBook = await broker.getTradeBook(validCredentials);

    return NextResponse.json(tradeBook);
  } catch (error) {
    console.error('Get trade book error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}