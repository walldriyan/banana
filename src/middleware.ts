// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // If the user is not authenticated, they are already redirected to the login page by withAuth.
    // If they are authenticated and try to access the login page, redirect them to the home page.
    if (token && pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Allow the request to proceed if none of the above conditions are met.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // A user is authorized if they have a valid token
    },
    pages: {
      signIn: '/login', // Redirect to this page if the user is not authorized
    },
  }
);

// This config specifies which routes are protected by the middleware.
export const config = {
  // Match all routes except for API routes, static files, and image optimization files.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.png|font/.*).*)',
  ],
};
