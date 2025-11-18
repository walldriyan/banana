'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme-store';
import React from 'react';

// Client component to wrap children and apply font changes from Zustand
export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const font = useThemeStore((state) => state.font);

  useEffect(() => {
    document.body.classList.remove('font-inter', 'font-custom');
    if (font === 'custom') {
      document.body.classList.add('font-custom');
    } else {
      document.body.classList.add('font-inter');
    }
  }, [font]);

  return <>{children}</>;
}
