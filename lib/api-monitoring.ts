import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Headers to exclude from logging (sensitive data)
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'x-secret-key',
  'x-access-token',
  'x-refresh-token',
  'cookie',
  'set-cookie'
]);

// Filter sensitive headers from request/response
function filterHeaders(headers: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!SENSITIVE_HEADERS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  return request.ip || 'unknown';
}

// Determine request type
function getRequestType(url: string): 'frontend_to_backend' | 'backend_to_broker' {
  // If it's an external URL (not localhost/127.0.0.1), it's backend to broker
  if (url.includes('angelone') || url.includes('broker') || url.includes('api.') || url.includes('external')) {
    return 'backend_to_broker';
  }

  // If it's an internal API call, it's frontend to backend
  if (url.includes('/api/')) {
    return 'frontend_to_backend';
  }

  return 'frontend_to_backend';
}

// Extract user ID from request (if authenticated)
async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    // Try to get user from session token
    const token = request.cookies.get('next-auth.session-token')?.value ||
                  request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (token) {
      // For now, we'll need to decode the JWT to get user ID
      // This is a simplified approach - in production you'd validate the token properly
      const { decode } = await import('next-auth/jwt');
      const decoded = await decode({
        token,
        secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'
      });

      return decoded?.sub || null;
    }
  } catch (error) {
    console.error('Error extracting user ID:', error);
  }

  return null;
}

export async function apiMonitoringMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = uuidv4();
  const url = request.url;
  const method = request.method;

  console.log(`🔍 API Monitoring: ${method} ${url}`);

  // Skip logging for monitoring and admin monitoring APIs to avoid infinite loops
  if (url.includes('/api/monitoring') || url.includes('/api/admin/monitoring')) {
    console.log(`⏭️ Skipping monitoring endpoint: ${url}`);
    return NextResponse.next();
  }

  // Only log API routes, not static assets or other requests
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`⏭️ Not an API route: ${request.nextUrl.pathname}`);
    return NextResponse.next();
  }

  console.log(`✅ Processing API request: ${method} ${request.nextUrl.pathname}`);

  // For now, just pass through without database logging
  // We'll add database logging after confirming middleware works
  return NextResponse.next();
}