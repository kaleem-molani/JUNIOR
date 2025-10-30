import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins don't have trading accounts
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators do not have trading accounts' }, { status: 403 });
  }

  // Admins don't have trading accounts
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators do not have trading accounts' }, { status: 403 });
  }

  try {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins cannot create trading accounts
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators cannot create trading accounts' }, { status: 403 });
  }

  // Admins cannot create trading accounts
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators cannot create trading accounts' }, { status: 403 });
  }

  try {
    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, email: true }
    });

    if (!user?.isActive) {
      return NextResponse.json({
        error: 'Account not activated. Please contact administrator for approval.'
      }, { status: 403 });
    }

    const { broker, apiKey, secret, userPin, name, clientCode } = await request.json();

    if (!broker || !apiKey || !userPin || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const account = await prisma.tradingAccount.create({
      data: {
        userId: session.user.id,
        name,
        broker,
        clientCode,
        apiKey,
        secret: secret || '', // Optional for AngelOne
        userPin,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}