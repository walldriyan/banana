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
  const { setSession, clearSession, setUserAndPermissions } = useSessionStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUserAndPermissions(session.user, session.user.permissions || []);
    } else if (status === 'unauthenticated') {
      clearSession();
    }
  }, [session, status, setUserAndPermissions, clearSession]);

  // This component does not render anything.
  return null;
}
