import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ensure we're only processing API routes (though matcher handles this)
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Clone the response
  const response = NextResponse.next();

  // Add the required header for zrok to work properly with API routes
  response.headers.set('skip_zrok_interstitial', 'true');

  return response;
}

// Apply middleware only to API routes
export const config = {
  matcher: '/api/:path*',
};