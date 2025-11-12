// src/store/theme-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeState = {
  font: 'inter' | 'custom';
  setFont: (font: 'inter' | 'custom') => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      font: 'inter', // Default font
      setFont: (font) => set({ font }),
    }),
    {
      name: 'theme-storage', // unique name
      storage: createJSONStorage(() => localStorage), // use localStorage
    }
  )
);
