// app/api/scheduler/refresh/route.ts
// Manually trigger token refresh

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Only admins and super admins can trigger manual refresh
  if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    console.log('🔄 [Scheduler API] Manual token refresh triggered by:', session.user.email);

    // Dynamic import to avoid client-side bundling
    const { tokenRefreshScheduler } = await import('@/lib/scheduled-token-refresh');

    await tokenRefreshScheduler.triggerManualRefresh();

    return NextResponse.json({
      success: true,
      message: 'Token refresh completed successfully'
    });
  } catch (error) {
    console.error('❌ [Scheduler API] Manual token refresh failed:', error);
    return NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}