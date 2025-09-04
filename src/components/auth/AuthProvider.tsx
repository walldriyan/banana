// src/components/auth/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { useSessionStore } from '@/store/session-store';
import type { Session } from 'next-auth';
import { useEffect } from 'react';

// --- DEVELOPMENT WORKAROUND ---
// This dummy session is used to bypass the login flow during development.
// It automatically logs in the user as 'manager_user'.
// For production, the `session` prop should be removed from SessionProvider.
const dummyManagerSession: Session = {
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  user: {
    id: 'manager_user',
    name: 'Manager User',
    role: 'manager',
    // Permissions are hardcoded here to match the expected permissions for a manager.
    // This ensures the AuthorizationGuard works correctly without a real login.
    permissions: [
        'pos.view',
        'pos.create.transaction',
        'history.view',
        'bills.update',
        'bills.delete',
        'refund.process'
    ],
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
        console.log("AuthProvider: Initializing Zustand store with dummy session.");
        setSession({
            user: dummyManagerSession.user,
            permissions: dummyManagerSession.user.permissions || [],
            status: 'authenticated',
        });
    }, [setSession]);

    return null; // This component doesn't render anything.
}


export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("AuthProvider: Rendering with static SessionProvider.");
  return (
    // The `session` prop here forces a static session, bypassing the fetch request.
    // However, the useSession hook within components still attempts to fetch.
    // The key is to NOT call useSession and instead rely on our Zustand store.
    <SessionProvider session={dummyManagerSession} refetchOnWindowFocus={false}>
      <ZustandSessionInitializer />
      {children}
    </SessionProvider>
  );
}
