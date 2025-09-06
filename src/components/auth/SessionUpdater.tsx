'use client';

// This component is no longer needed because AuthProvider now directly initializes the Zustand store.
// Keeping the file but making it return null to avoid breaking any potential imports,
// although it should be safe to delete.

export function SessionUpdater() {
  return null;
}
