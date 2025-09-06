// This middleware is temporarily disabled to bypass the login page for development.
// It can be re-enabled by restoring the original content.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
