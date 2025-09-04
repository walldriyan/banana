// src/components/auth/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionUpdater } from './SessionUpdater';
import type { Session } from 'next-auth';

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


export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The `session` prop here forces a static session, bypassing the fetch request.
    <SessionProvider session={dummyManagerSession}>
      <SessionUpdater />
      {children}
    </SessionProvider>
  );
}
