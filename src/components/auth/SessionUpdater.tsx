// src/components/auth/SessionUpdater.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useSessionStore } from '@/store/session-store';
import { useEffect } from 'react';

/**
 * A client component that synchronizes the NextAuth session with the Zustand global state.
 * This ensures that user data and permissions are available throughout the app
 * without needing to call useSession() in every component.
 */
export function SessionUpdater() {
  const { data: session, status } = useSession();
  const { setSession, clearSession } = useSessionStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setSession({
        user: session.user,
        permissions: session.user.permissions || [],
        status: 'authenticated',
      });
    } else if (status === 'unauthenticated') {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  // This component does not render anything.
  return null;
}
