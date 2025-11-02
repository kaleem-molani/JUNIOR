// app/api/admin/users/[id]/approve/route.ts
// Approve a user (activate their account)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized - Super admin access required' }, { status: 401 });
  }

  const { id: userId } = await params;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ error: 'User is already active' }, { status: 400 });
    }

    // Activate the user
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    // Log the approval action
    await prisma.log.create({
      data: {
        userId: session.user.id,
        action: 'USER_APPROVAL',
        details: {
          approvedUserId: userId,
          approvedUserEmail: user.email,
          action: 'activated'
        },
        level: 'info'
      }
    });

    return NextResponse.json({
      message: 'User approved successfully',
      user: { id: user.id, email: user.email, isActive: true }
    });
  } catch (error) {
    console.error('User approval error:', error);
    return NextResponse.json({ error: 'Failed to approve user' }, { status: 500 });
  }
}