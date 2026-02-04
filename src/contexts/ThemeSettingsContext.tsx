import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'teal';
export type FontFamily = 'cairo' | 'tajawal' | 'almarai' | 'ibm-plex' | 'noto-kufi';
export type DisplayMode = 'auto' | 'desktop' | 'tablet' | 'mobile';

interface ThemeSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSize: number;
  isDarkMode: boolean;
  displayMode: DisplayMode;
}

// Split contexts for optimized re-renders
interface ThemeValuesContextType {
  settings: ThemeSettings;
  effectiveDisplayMode: 'desktop' | 'tablet' | 'mobile';
}

interface ThemeActionsContextType {
  setThemeColor: (color: ThemeColor) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDarkMode: () => void;
  resetToDefaults: () => void;
}

interface ThemeSettingsContextType extends ThemeValuesContextType, ThemeActionsContextType {}

const defaultSettings: ThemeSettings = {
  themeColor: 'green',
  fontFamily: 'cairo',
  fontSize: 16,
  isDarkMode: false,
  displayMode: 'auto',
};

const ThemeValuesContext = createContext<ThemeValuesContextType | undefined>(undefined);
const ThemeActionsContext = createContext<ThemeActionsContextType | undefined>(undefined);
const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'irecycle-theme-settings';

const colorPalettes: Record<ThemeColor, { primary: string; accent: string; ring: string }> = {
  green: { primary: '142 71% 45%', accent: '160 84% 39%', ring: '142 71% 45%' },
  blue: { primary: '217 91% 60%', accent: '199 89% 48%', ring: '217 91% 60%' },
  purple: { primary: '262 83% 58%', accent: '280 87% 50%', ring: '262 83% 58%' },
  orange: { primary: '25 95% 53%', accent: '38 92% 50%', ring: '25 95% 53%' },
  red: { primary: '0 72% 51%', accent: '346 77% 50%', ring: '0 72% 51%' },
  teal: { primary: '174 84% 32%', accent: '182 77% 38%', ring: '174 84% 32%' },
};

const fontImports: Record<FontFamily, string> = {
  'cairo': 'Cairo:wght@300;400;500;600;700;800',
  'tajawal': 'Tajawal:wght@300;400;500;700;800',
  'almarai': 'Almarai:wght@300;400;700;800',
  'ibm-plex': 'IBM+Plex+Sans+Arabic:wght@300;400;500;600;700',
  'noto-kufi': 'Noto+Kufi+Arabic:wght@300;400;500;600;700',
};

const fontFamilyCSS: Record<FontFamily, string> = {
  'cairo': "'Cairo', sans-serif",
  'tajawal': "'Tajawal', sans-serif",
  'almarai': "'Almarai', sans-serif",
  'ibm-plex': "'IBM Plex Sans Arabic', sans-serif",
  'noto-kufi': "'Noto Kufi Arabic', sans-serif",
};

const getActualScreenMode = (): 'desktop' | 'tablet' | 'mobile' => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Optimized hooks
export const useThemeValues = () => {
  const context = useContext(ThemeValuesContext);
  if (context === undefined) {
    throw new Error('useThemeValues must be used within a ThemeSettingsProvider');
  }
  return context;
};

export const useThemeActions = () => {
  const context = useContext(ThemeActionsContext);
  if (context === undefined) {
    throw new Error('useThemeActions must be used within a ThemeSettingsProvider');
  }
  return context;
};

// Combined hook for backward compatibility
export const useThemeSettings = () => {
  const context = useContext(ThemeSettingsContext);
  if (context === undefined) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  }
  return context;
};

// Selector hooks for specific values
export const useIsDarkMode = () => {
  const { settings } = useThemeValues();
  return settings.isDarkMode;
};

export const useThemeColor = () => {
  const { settings } = useThemeValues();
  return settings.themeColor;
};

export const useEffectiveDisplayMode = () => {
  const { effectiveDisplayMode } = useThemeValues();
  return effectiveDisplayMode;
};

export const ThemeSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  const [actualScreenMode, setActualScreenMode] = useState<'desktop' | 'tablet' | 'mobile'>(getActualScreenMode);

  useEffect(() => {
    const handleResize = () => {
      setActualScreenMode(getActualScreenMode());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveDisplayMode = useMemo(() => 
    settings.displayMode === 'auto' ? actualScreenMode : settings.displayMode,
    [settings.displayMode, actualScreenMode]
  );

  // Apply theme settings to document
  useEffect(() => {
    const root = document.documentElement;
    const palette = colorPalettes[settings.themeColor];
    
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--ring', palette.ring);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--sidebar-primary', palette.primary);
    root.style.setProperty('--sidebar-ring', palette.ring);
    root.style.setProperty('--eco-green', palette.primary);
    root.style.setProperty('--eco-emerald', palette.accent);

    if (settings.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.fontSize = `${settings.fontSize}px`;
    document.body.style.fontFamily = fontFamilyCSS[settings.fontFamily];

    const fontLink = document.getElementById('dynamic-font') as HTMLLinkElement;
    if (fontLink) {
      fontLink.href = `https://fonts.googleapis.com/css2?family=${fontImports[settings.fontFamily]}&display=swap`;
    } else {
      const link = document.createElement('link');
      link.id = 'dynamic-font';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontImports[settings.fontFamily]}&display=swap`;
      document.head.appendChild(link);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Memoized action handlers
  const setThemeColor = useCallback((color: ThemeColor) => {
    setSettings((prev) => ({ ...prev, themeColor: color }));
  }, []);

  const setFontFamily = useCallback((font: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily: font }));
  }, []);

  const setFontSize = useCallback((size: number) => {
    setSettings((prev) => ({ ...prev, fontSize: Math.max(14, Math.min(20, size)) }));
  }, []);

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  // Memoized context values
  const valuesContextValue = useMemo<ThemeValuesContextType>(() => ({
    settings,
    effectiveDisplayMode,
  }), [settings, effectiveDisplayMode]);

  const actionsContextValue = useMemo<ThemeActionsContextType>(() => ({
    setThemeColor,
    setFontFamily,
    setFontSize,
    setDisplayMode,
    toggleDarkMode,
    resetToDefaults,
  }), [setThemeColor, setFontFamily, setFontSize, setDisplayMode, toggleDarkMode, resetToDefaults]);

  const combinedValue = useMemo<ThemeSettingsContextType>(() => ({
    ...valuesContextValue,
    ...actionsContextValue,
  }), [valuesContextValue, actionsContextValue]);

  return (
    <ThemeSettingsContext.Provider value={combinedValue}>
      <ThemeValuesContext.Provider value={valuesContextValue}>
        <ThemeActionsContext.Provider value={actionsContextValue}>
          {children}
        </ThemeActionsContext.Provider>
      </ThemeValuesContext.Provider>
    </ThemeSettingsContext.Provider>
  );
};
