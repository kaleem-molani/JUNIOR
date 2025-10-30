import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super admins cannot manage trading accounts
  if (session.user.role === 'super_admin') {
    return NextResponse.json({ error: 'Super administrators cannot manage trading accounts' }, { status: 403 });
  }

  // Admins cannot manage trading accounts
  if (session.user.role === 'admin') {
    return NextResponse.json({ error: 'Administrators cannot manage trading accounts' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // First check if the account belongs to the user
    const account = await prisma.tradingAccount.findFirst({
      where: { id: id, userId: session.user.id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const { isActive } = await request.json();

    const updatedAccount = await prisma.tradingAccount.update({
      where: { id: id },
      data: { isActive },
    });

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}