// src/app/api/auth/session/route.ts

import { auth } from "@/auth"
import { NextResponse } from 'next/server'

/**
 * API endpoint for external clients (like a Flutter app) to get the current session data.
 * This is a protected endpoint. The client must provide a valid session token (e.g., in a cookie).
 */
export async function GET() {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(session, { status: 200 })
}
