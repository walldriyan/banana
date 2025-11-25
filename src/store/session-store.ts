import { create } from 'zustand';
import { User } from 'next-auth';
import { persist, createJSONStorage } from 'zustand/middleware';

type SessionStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface SessionState {
  // Use the extended User type from next-auth
  user: User | null;
  permissions: string[];
  status: SessionStatus;
  setSession: (session: { user: User | null; permissions: string[], status: SessionStatus }) => void;
  clearSession: () => void;
  setUserAndPermissions: (user: User, permissions: string[]) => void;
}

/**
 * Zustand store for managing user data and permissions globally on the client-side.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      permissions: [],
      status: 'loading',
      setSession: (session) => set({ 
          user: session.user, 
          permissions: session.permissions,
          status: session.status 
      }),
      setUserAndPermissions: (user, permissions) => set({
        user,
        permissions,
        status: 'authenticated'
      }),
      clearSession: () => set({ 
          user: null, 
          permissions: [], 
          status: 'unauthenticated' 
      }),
    }),
    {
      name: 'session-storage', // unique name
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        // Only persist necessary data to avoid storing sensitive info if not needed
        user: state.user,
        permissions: state.permissions,
        status: state.status
      })
    }
  )
);
