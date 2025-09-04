'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSessionStore } from '@/store/session-store';

/**
 * This component's sole purpose is to sync the NextAuth session state
 * into the Zustand global store. This makes session data easily accessible
 * to all client components without needing to call `useSession` everywhere.
 */
export function SessionUpdater() {
  const { data: session, status } = useSession();
  const { setSession, clearSession } = useSessionStore();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      setSession({
        user: session.user,
        permissions: session.user.permissions || [],
        status: 'authenticated',
      });
    } else if (status === 'unauthenticated') {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  return null; // This component does not render anything.
}
