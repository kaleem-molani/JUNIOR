import { NextRequest, NextResponse } from 'next/server';
import { apiMonitoringMiddleware } from '@/lib/api-monitoring';

console.log('🚀 Middleware loaded!');

export function middleware(request: NextRequest) {
  console.log(`🌐 Middleware: ${request.method} ${request.nextUrl.pathname}`);

  // Apply API monitoring to all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`📊 Applying API monitoring to: ${request.nextUrl.pathname}`);
    return apiMonitoringMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};