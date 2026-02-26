import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Language = 'ar' | 'en';

// Load core translations first (small ~15KB), then merge dashboard keys on demand
const loadCoreTranslations = async (lang: Language) => {
  if (lang === 'ar') {
    const { arCore } = await import('@/i18n/ar-core');
    return arCore;
  }
  const { en } = await import('@/i18n/en');
  return en;
};

const loadFullTranslations = async (lang: Language) => {
  if (lang === 'ar') {
    const { ar } = await import('@/i18n/ar');
    return ar;
  }
  const { en } = await import('@/i18n/en');
  return en;
};

// Pre-cache: load default language synchronously for instant first render
let cachedTranslations: Record<string, any> = {};
let cacheReady = false;

// Eagerly start loading default language
const defaultLang: Language = (() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('irecycle-language');
    if (saved === 'en') return 'en';
  }
  return 'ar';
})();

// Start loading core translations immediately (non-blocking, small bundle)
loadCoreTranslations(defaultLang).then(t => {
  cachedTranslations[defaultLang] = t;
  cacheReady = true;
});

// Preload full translations in background after core is ready
setTimeout(() => {
  loadFullTranslations(defaultLang).then(t => {
    cachedTranslations[defaultLang] = { ...cachedTranslations[defaultLang], ...t };
  });
}, 3000);

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
}

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
  const [language, setLanguageState] = useState<Language>(defaultLang);
  const [translations, setTranslations] = useState<any>(cachedTranslations[defaultLang] || null);

  // Load translations when language changes
  useEffect(() => {
    if (cachedTranslations[language]) {
      setTranslations(cachedTranslations[language]);
      return;
    }
    loadCoreTranslations(language).then(core => {
      cachedTranslations[language] = core;
      setTranslations(core);
      // Then load full translations in background
      loadFullTranslations(language).then(full => {
        cachedTranslations[language] = { ...core, ...full };
        setTranslations((prev: any) => ({ ...prev, ...full }));
      });
    });
  }, [language]);

  // Initial load from cache (may arrive async)
  useEffect(() => {
    if (!translations && cacheReady && cachedTranslations[language]) {
      setTranslations(cachedTranslations[language]);
    }
    if (!translations) {
      // Fallback: load again
      loadCoreTranslations(language).then(t => {
        cachedTranslations[language] = t;
        setTranslations(t);
      });
    }
  }, []);

  // Load language preference from database only when no saved preference
  useEffect(() => {
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
        // Silently fail
      }
    };

    const timer = setTimeout(loadPreference, 2000);
    return () => clearTimeout(timer);
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

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
    if (!translations) return key; // Return key as fallback while loading
    return getNestedValue(translations, key);
  }, [translations]);

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
