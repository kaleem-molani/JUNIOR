import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Check if user requires password change
    if (req.nextauth.token?.mustChangePassword && req.nextUrl.pathname !== '/force-password-change') {
      return Response.redirect(new URL('/force-password-change', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login page
     * - register page
     * - forgot password page
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password).*)',
  ],
};