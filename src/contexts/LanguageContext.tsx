import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ar } from '@/i18n/ar';
import { en } from '@/i18n/en';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'ar' | 'en';

type TranslationKeys = typeof ar;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

const translations: Record<Language, TranslationKeys> = { ar, en };

const STORAGE_KEY = 'irecycle-language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return path;
    current = current[key];
  }
  return typeof current === 'string' ? current : path;
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  });

  // Load language preference from database only when auth state changes (not on every mount)
  useEffect(() => {
    // Don't make DB calls if we already have a saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return;

    const loadPreference = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile?.preferred_language && (profile.preferred_language === 'ar' || profile.preferred_language === 'en')) {
          setLanguageState(profile.preferred_language as Language);
          localStorage.setItem(STORAGE_KEY, profile.preferred_language);
        }
      } catch {
        // Silently fail - localStorage preference is sufficient
      }
    };

    // Defer DB call to not block initial render
    const timer = setTimeout(loadPreference, 2000);
    return () => clearTimeout(timer);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Save to database for persistence across devices
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang } as any)
        .eq('user_id', user.id);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
  }, [language]);

  const t = useCallback((key: string): string => {
    return getNestedValue(translations[language], key);
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    isRTL: language === 'ar',
  }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
