// src/app/api/auth/session/route.ts

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth/options';

/**
 * API endpoint for external clients (like a Flutter app) to get the current session data.
 * This is a protected endpoint. The client must provide a valid session token (e.g., in a cookie).
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(session, { status: 200 });
}
