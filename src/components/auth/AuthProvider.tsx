// src/components/auth/AuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { SessionUpdater } from './SessionUpdater';


export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth">
      <SessionUpdater />
      {children}
    </SessionProvider>
  );
}
