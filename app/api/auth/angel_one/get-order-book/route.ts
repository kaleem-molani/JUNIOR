// app/api/auth/angel_one/get-order-book/route.ts
// Get AngelOne order book

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

  // Super admins cannot access trading account order books
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators cannot access trading account order books' }, { status: 403 });
  }

  // Admins cannot access trading account order books
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators cannot access trading account order books' }, { status: 403 });
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

    console.log('📊 [API] Loading auth data for account:', account.id);
    const credentials = await authStorage.loadAuth(account.id);
    console.log('📊 [API] Credentials loaded:', !!credentials);
    console.log('📊 [API] Access token present:', !!credentials?.accessToken);

    if (!credentials?.accessToken) {
      console.log('❌ [API] No authentication data found');
      return NextResponse.json({
        error: 'No authentication data found. Please generate token first.'
      }, { status: 401 });
    }

    // Check and refresh tokens if needed
    console.log('🔄 [API] Checking token validity and refreshing if needed...');
    const validCredentials = await TokenManager.ensureValidTokens(account.id);

    if (!validCredentials?.accessToken) {
      console.log('❌ [API] Token refresh failed or no valid tokens available');
      return NextResponse.json({
        error: 'Authentication tokens expired. Please regenerate tokens.',
        code: 'TOKEN_EXPIRED',
        accountId: account.id,
        accountName: account.name
      }, { status: 401 });
    }

    console.log('📊 [API] Calling broker.getOrderBook()...');
    const orderBook = await broker.getOrderBook(validCredentials);
    console.log('📊 [API] Order book result:', orderBook);
    console.log('📊 [API] Order count:', orderBook.length);

    return NextResponse.json(orderBook);
  } catch (error) {
    console.error('Get order book error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}