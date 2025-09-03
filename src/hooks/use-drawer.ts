// src/hooks/use-drawer.ts
'use client';

import { useContext } from 'react';
import { GlobalDrawerContext } from '@/context/GlobalDrawerContext';

export const useDrawer = () => {
  const context = useContext(GlobalDrawerContext);
  if (context === undefined) {
    throw new Error('useDrawer must be used within a GlobalDrawerProvider');
  }
  return context;
};
