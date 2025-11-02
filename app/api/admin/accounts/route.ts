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
    const accounts = await prisma.tradingAccount.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform data for frontend with human-readable timestamps
    const transformedAccounts = accounts.map(account => {
      const tokenUpdatedAt = account.lastUsed || account.createdAt;

      return {
        id: account.id,
        name: account.name,
        broker: account.broker,
        clientCode: account.clientCode,
        userEmail: account.user.email,
        userName: account.user.name,
        isActive: account.isActive,
        tokenUpdatedAt: tokenUpdatedAt.toISOString(),
        createdAt: account.createdAt.toISOString()
      };
    });

    return NextResponse.json(transformedAccounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}