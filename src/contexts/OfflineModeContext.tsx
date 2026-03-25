import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OfflineModeContextType {
  isOffline: boolean;
  setOfflineManually: (v: boolean) => void;
}

const OfflineModeContext = createContext<OfflineModeContextType>({ isOffline: false, setOfflineManually: () => {} });

export const useOfflineMode = () => useContext(OfflineModeContext);

export const OfflineModeProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(() => {
    return localStorage.getItem('__offline_mode') === 'true';
  });

  const setOfflineManually = useCallback((v: boolean) => {
    setIsOffline(v);
    localStorage.setItem('__offline_mode', String(v));
  }, []);

  // Auto-detect on mount
  useEffect(() => {
    if (isOffline) return;
    const check = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && (error.message?.includes('ERR_') || error.code === 'PGRST301' || error.message?.includes('fetch'))) {
          console.warn('[OfflineMode] Backend unreachable, activating offline mode');
          setOfflineManually(true);
        }
      } catch {
        console.warn('[OfflineMode] Network error, activating offline mode');
        setOfflineManually(true);
      }
    };
    const timer = setTimeout(check, 3000);
    return () => clearTimeout(timer);
  }, [isOffline, setOfflineManually]);

  return (
    <OfflineModeContext.Provider value={{ isOffline, setOfflineManually }}>
      {children}
    </OfflineModeContext.Provider>
  );
};