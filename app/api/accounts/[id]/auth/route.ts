// app/api/accounts/[id]/auth/route.ts
// Get authentication status for an account

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BrokerFactory } from '@/lib/brokers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins cannot access trading account auth status
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super administrators cannot access trading account authentication' }, { status: 403 });
    }

    // Admins cannot access trading account auth status
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Administrators cannot access trading account authentication' }, { status: 403 });
    }

    const { id } = await params;
    const accountName = id;

    const authStorage = BrokerFactory.getAuthStorage();
    const credentials = await authStorage.loadAuth(accountName);

    if (!credentials) {
      return NextResponse.json({ data: null });
    }

    // Return auth status without sensitive data
    const authStatus = {
      hasAccessToken: !!(credentials.accessToken),
      hasRefreshToken: !!(credentials.refreshToken),
      clientCode: credentials.clientCode,
    };

    return NextResponse.json({ data: authStatus });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}