// src/components/auth/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { useSessionStore } from '@/store/session-store';
import type { Session } from 'next-auth';
import { useEffect } from 'react';

// --- DEVELOPMENT WORKAROUND ---
// This dummy session is used to bypass the login flow during development.
// It automatically logs in the user as an 'admin' user with all permissions.
const dummyAdminSession: Session = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: 'admin',
    name: 'Admin User',
    role: 'admin',
    // 'access_all' permission grants access to everything.
    permissions: ['access_all'],
  },
};
// --- END DEVELOPMENT WORKAROUND ---

/**
 * A new initializer component that runs once.
 * It directly sets the Zustand store from the static dummy session,
 * completely avoiding the useSession() hook which triggers the problematic fetch.
 */
function ZustandSessionInitializer() {
    const { setSession } = useSessionStore();
    
    useEffect(() => {
        console.log("AuthProvider: Initializing Zustand store with dummy admin session:", dummyAdminSession);
        if (dummyAdminSession.user) {
            setSession({
                user: dummyAdminSession.user,
                permissions: dummyAdminSession.user.permissions || [],
                status: 'authenticated',
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ‼️ FIX: Use an empty dependency array to run this effect only once on mount.

    return null; // This component doesn't render anything.
}


export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("AuthProvider: Rendering with static SessionProvider to avoid client fetch.");
  return (
    // The `session` prop here forces a static session, bypassing the fetch request.
    // However, the useSession hook within components still attempts to fetch.
    // The key is to NOT call useSession and instead rely on our Zustand store.
    <SessionProvider session={dummyAdminSession} refetchOnWindowFocus={false}>
      <ZustandSessionInitializer />
      {children}
    </SessionProvider>
  );
}
