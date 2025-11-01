import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const requestType = searchParams.get('requestType') as 'frontend_to_backend' | 'backend_to_broker' | null;
    const method = searchParams.get('method');
    const statusCode = searchParams.get('statusCode');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      requestType?: 'frontend_to_backend' | 'backend_to_broker';
      method?: string;
      statusCode?: number;
      userId?: string;
      startedAt?: { gte?: Date; lte?: Date };
      OR?: Array<{
        url?: { contains: string; mode: string };
        body?: { contains: string; mode: string };
        responseBody?: { contains: string; mode: string };
        error?: { contains: string; mode: string };
      }>;
    } = {};

    if (requestType) {
      where.requestType = requestType;
    }

    if (method) {
      where.method = method;
    }

    if (statusCode) {
      where.statusCode = parseInt(statusCode);
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.startedAt = {};
      if (startDate) {
        where.startedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.startedAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { url: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { responseBody: { contains: search, mode: 'insensitive' } },
        { error: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.apiRequest.count({ where });

    // Get API requests with pagination
    const apiRequests = await prisma.apiRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get statistics
    const stats = await prisma.apiRequest.groupBy({
      by: ['requestType', 'method', 'isSuccessful'],
      _count: {
        id: true
      },
      _avg: {
        duration: true
      }
    });

    // Calculate response time statistics
    const responseTimeStats = await prisma.apiRequest.aggregate({
      where: {
        duration: { not: null }
      },
      _avg: {
        duration: true
      },
      _min: {
        duration: true
      },
      _max: {
        duration: true
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      apiRequests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        totalRequests: totalCount,
        avgResponseTime: responseTimeStats._avg.duration,
        minResponseTime: responseTimeStats._min.duration,
        maxResponseTime: responseTimeStats._max.duration,
        requestTypeBreakdown: stats.reduce((acc, stat) => {
          const key = `${stat.requestType}_${stat.method}_${stat.isSuccessful}`;
          acc[key] = {
            count: stat._count.id,
            avgDuration: stat._avg.duration
          };
          return acc;
        }, {} as Record<string, { count: number; avgDuration: number | null }>)
      }
    });

  } catch (error) {
    console.error('API monitoring error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}