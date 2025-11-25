// src/middleware.ts
import { withAuth } from "next-auth/middleware"
import { getToken } from "next-auth/jwt"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If user is trying to access login page but is already authenticated, redirect to home
  if (pathname.startsWith('/login') && token) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Use withAuth to protect other routes
  const authMiddleware = withAuth({
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  });

  // @ts-ignore
  return authMiddleware(req);
}

// The `matcher` specifies which routes are protected by this middleware.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - withAuth will not apply to /api/auth/* itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
