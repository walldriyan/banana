// src/context/LanguageContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import en from '@/lib/locales/en.json';
import si from '@/lib/locales/si.json';

type Language = 'en' | 'si';

const translations = { en, si };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'en');

  useEffect(() => {
    if (!initialLanguage) {
      const savedLanguage = localStorage.getItem('language') as Language | null;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'si')) {
        setLanguageState(savedLanguage);
      }
    }
  }, [initialLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
    }
  }, []);

  const t = useCallback((key: keyof typeof en): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
