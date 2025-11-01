// app/api/admin/users/[id]/deactivate/route.ts
// Deactivate a user (deactivate their account)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized - Super admin access required' }, { status: 401 });
  }

  const userId = id;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'User is already inactive' }, { status: 400 });
    }

    // Deactivate the user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Log the deactivation action
    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: 'USER_DEACTIVATION',
        details: {
          deactivatedUserId: userId,
          deactivatedUserEmail: user.email,
          action: 'deactivated'
        },
        level: 'info'
      }
    });

    return NextResponse.json({
      message: 'User deactivated successfully',
      user: { id: user.id, email: user.email, isActive: false }
    });
  } catch (error) {
    console.error('User deactivation error:', error);
    return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
  }
}