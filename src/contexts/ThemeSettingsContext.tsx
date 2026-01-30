import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'teal';
export type FontFamily = 'cairo' | 'tajawal' | 'almarai' | 'ibm-plex' | 'noto-kufi';
export type DisplayMode = 'auto' | 'desktop' | 'tablet' | 'mobile';

interface ThemeSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSize: number; // 14-20
  isDarkMode: boolean;
  displayMode: DisplayMode;
}

interface ThemeSettingsContextType {
  settings: ThemeSettings;
  setThemeColor: (color: ThemeColor) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  toggleDarkMode: () => void;
  resetToDefaults: () => void;
  effectiveDisplayMode: 'desktop' | 'tablet' | 'mobile';
}

const defaultSettings: ThemeSettings = {
  themeColor: 'green',
  fontFamily: 'cairo',
  fontSize: 16,
  isDarkMode: false,
  displayMode: 'auto',
};

const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'irecycle-theme-settings';

// Color palettes for different themes
const colorPalettes: Record<ThemeColor, { primary: string; accent: string; ring: string }> = {
  green: { primary: '142 71% 45%', accent: '160 84% 39%', ring: '142 71% 45%' },
  blue: { primary: '217 91% 60%', accent: '199 89% 48%', ring: '217 91% 60%' },
  purple: { primary: '262 83% 58%', accent: '280 87% 50%', ring: '262 83% 58%' },
  orange: { primary: '25 95% 53%', accent: '38 92% 50%', ring: '25 95% 53%' },
  red: { primary: '0 72% 51%', accent: '346 77% 50%', ring: '0 72% 51%' },
  teal: { primary: '174 84% 32%', accent: '182 77% 38%', ring: '174 84% 32%' },
};

// Font imports
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

// Detect actual screen size
const getActualScreenMode = (): 'desktop' | 'tablet' | 'mobile' => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
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

  // Listen to window resize for auto mode
  useEffect(() => {
    const handleResize = () => {
      setActualScreenMode(getActualScreenMode());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate effective display mode
  const effectiveDisplayMode = settings.displayMode === 'auto' ? actualScreenMode : settings.displayMode;

  // Apply theme settings to document
  useEffect(() => {
    const root = document.documentElement;
    const palette = colorPalettes[settings.themeColor];
    
    // Apply color palette
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--ring', palette.ring);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--sidebar-primary', palette.primary);
    root.style.setProperty('--sidebar-ring', palette.ring);
    
    // Apply eco colors for gradient utilities
    root.style.setProperty('--eco-green', palette.primary);
    root.style.setProperty('--eco-emerald', palette.accent);

    // Apply dark mode
    if (settings.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply font size
    root.style.fontSize = `${settings.fontSize}px`;

    // Apply font family
    document.body.style.fontFamily = fontFamilyCSS[settings.fontFamily];

    // Load font dynamically
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

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setThemeColor = (color: ThemeColor) => {
    setSettings((prev) => ({ ...prev, themeColor: color }));
  };

  const setFontFamily = (font: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily: font }));
  };

  const setFontSize = (size: number) => {
    setSettings((prev) => ({ ...prev, fontSize: Math.max(14, Math.min(20, size)) }));
  };

  const setDisplayMode = (mode: DisplayMode) => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  };

  const toggleDarkMode = () => {
    setSettings((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <ThemeSettingsContext.Provider
      value={{
        settings,
        setThemeColor,
        setFontFamily,
        setFontSize,
        setDisplayMode,
        toggleDarkMode,
        resetToDefaults,
        effectiveDisplayMode,
      }}
    >
      {children}
    </ThemeSettingsContext.Provider>
  );
};

export const useThemeSettings = () => {
  const context = useContext(ThemeSettingsContext);
  if (context === undefined) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  }
  return context;
};
