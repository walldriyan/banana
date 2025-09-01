// src/context/GlobalDrawerContext.tsx
'use client';

import React, { createContext, useState, useCallback, useMemo } from 'react';

interface DrawerOptions {
  content: React.ReactNode;
  title?: string;
  description?: string;
}

interface DrawerContextType {
  isOpen: boolean;
  content: React.ReactNode | null;
  title: string | null;
  description: string | null;
  openDrawer: (options: DrawerOptions) => void;
  closeDrawer: () => void;
}

export const GlobalDrawerContext = createContext<DrawerContextType | undefined>(undefined);

export function GlobalDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const openDrawer = useCallback((options: DrawerOptions) => {
    setContent(options.content);
    setTitle(options.title || null);
    setDescription(options.description || null);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Add a small delay to allow the closing animation to finish before clearing content
    setTimeout(() => {
      setContent(null);
      setTitle(null);
      setDescription(null);
    }, 200);
  }, []);

  const value = useMemo(() => ({
    isOpen,
    content,
    title,
    description,
    openDrawer,
    closeDrawer,
  }), [isOpen, content, title, description, openDrawer, closeDrawer]);

  return (
    <GlobalDrawerContext.Provider value={value}>
      {children}
    </GlobalDrawerContext.Provider>
  );
}
