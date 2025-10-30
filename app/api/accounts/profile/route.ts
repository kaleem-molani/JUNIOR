import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins don't have trading profiles
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super administrators do not have trading profiles' }, { status: 403 });
    }

    // Admins don't have trading profiles
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Administrators do not have trading profiles' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isExecutionEnabled: true,
        primaryBroker: true,
        restrictedSymbols: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins don't have trading profiles to update
    if (session.user.role === 'super_admin') {
      return NextResponse.json({ error: 'Super administrators do not have trading profiles to update' }, { status: 403 });
    }

    // Admins don't have trading profiles to update
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Administrators do not have trading profiles to update' }, { status: 403 });
    }

    const body = await request.json();
    const { name, isExecutionEnabled, primaryBroker, restrictedSymbols } = body;

    // Validate input - make fields optional for partial updates
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 });
    }

    if (isExecutionEnabled !== undefined && typeof isExecutionEnabled !== 'boolean') {
      return NextResponse.json({ error: 'isExecutionEnabled must be a boolean' }, { status: 400 });
    }

    if (primaryBroker !== undefined && typeof primaryBroker !== 'string') {
      return NextResponse.json({ error: 'primaryBroker must be a string' }, { status: 400 });
    }

    if (restrictedSymbols !== undefined && !Array.isArray(restrictedSymbols)) {
      return NextResponse.json({ error: 'restrictedSymbols must be an array' }, { status: 400 });
    }

    // Build update data object with only provided fields
    const updateData: {
      name?: string | null;
      isExecutionEnabled?: boolean;
      primaryBroker?: string | null;
      restrictedSymbols?: string[];
    } = {};
    if (name !== undefined) updateData.name = name || null;
    if (isExecutionEnabled !== undefined) updateData.isExecutionEnabled = isExecutionEnabled;
    if (primaryBroker !== undefined) updateData.primaryBroker = primaryBroker || null;
    if (restrictedSymbols !== undefined) updateData.restrictedSymbols = restrictedSymbols;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isExecutionEnabled: true,
        primaryBroker: true,
        restrictedSymbols: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}