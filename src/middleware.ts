import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Force password change before accessing the app
    if (token?.mustChangePassword && pathname !== '/auth/change-password') {
      return NextResponse.redirect(new URL('/auth/change-password', req.url));
    }

    // Already changed password — don't let them visit the change-password page again
    if (!token?.mustChangePassword && pathname === '/auth/change-password') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect all pages except sign-in, NextAuth API, static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth/signin).*)'],
};
