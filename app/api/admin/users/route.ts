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
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        isActive: true,
        isExecutionEnabled: true,
        primaryBroker: true,
        restrictedSymbols: true,
        _count: {
          select: {
            tradingAccounts: true,
            signals: true,
            logs: true
          }
        }
      }
    });

    // Transform data for frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isActive: user.isActive,
      isExecutionEnabled: user.isExecutionEnabled,
      primaryBroker: user.primaryBroker,
      restrictedSymbols: user.restrictedSymbols,
      accountsCount: user._count.tradingAccounts,
      signalsCount: user._count.signals,
      logsCount: user._count.logs
    }));

    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}