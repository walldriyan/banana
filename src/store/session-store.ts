import { create } from 'zustand';
import { User } from 'next-auth';

type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface SessionState {
  user: User | null;
  permissions: string[];
  status: SessionStatus;
  setSession: (session: { user: User | null; permissions: string[], status: SessionStatus }) => void;
  clearSession: () => void;
}

/**
 * Zustand store for managing the user's session state globally on the client-side.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  permissions: [],
  status: 'loading',
  setSession: (session) => set({ 
      user: session.user, 
      permissions: session.permissions,
      status: session.status 
    }),
  clearSession: () => set({ user: null, permissions: [], status: 'unauthenticated' }),
}));
