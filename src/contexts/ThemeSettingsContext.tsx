import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'red' | 'teal';
export type FontFamily = 
  // Arabic fonts
  | 'cairo' | 'tajawal' | 'almarai' | 'ibm-plex' | 'noto-kufi' 
  | 'amiri' | 'harmattan' | 'scheherazade' | 'reem-kufi' | 'aref-ruqaa'
  | 'lemonada' | 'marhey' | 'readex-pro' | 'baloo-bhaijaan' | 'changa'
  | 'el-messiri' | 'lalezar' | 'rakkas' | 'mirza' | 'katibeh'
  // English fonts
  | 'inter' | 'roboto' | 'open-sans' | 'montserrat' | 'poppins'
  | 'nunito' | 'raleway' | 'source-sans' | 'work-sans' | 'dm-sans'
  | 'space-grotesk' | 'outfit' | 'plus-jakarta' | 'manrope' | 'sora'
  | 'lexend' | 'red-hat' | 'be-vietnam' | 'cabinet-grotesk' | 'general-sans';
export type DisplayMode = 'auto' | 'desktop' | 'tablet' | 'mobile';
export type VisualMode = 'light' | 'dim' | 'dark';

interface ThemeSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSize: number;
  isDarkMode: boolean;
  visualMode: VisualMode;
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
  setVisualMode: (mode: VisualMode) => void;
  toggleDarkMode: () => void;
  resetToDefaults: () => void;
}

interface ThemeSettingsContextType extends ThemeValuesContextType, ThemeActionsContextType {}

const defaultSettings: ThemeSettings = {
  themeColor: 'green',
  fontFamily: 'cairo',
  fontSize: 16,
  isDarkMode: false,
  visualMode: 'light',
  displayMode: 'auto',
};

// Per-mode font defaults
const visualModeFonts: Record<VisualMode, { family: string; import: string }> = {
  light: { family: "'Cairo', sans-serif", import: 'Cairo:wght@300;400;500;600;700;800' },
  dim: { family: "'Tajawal', sans-serif", import: 'Tajawal:wght@300;400;500;700;800' },
  dark: { family: "'Readex Pro', sans-serif", import: 'Readex+Pro:wght@200;300;400;500;600;700' },
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
  // Arabic fonts
  'cairo': 'Cairo:wght@300;400;500;600;700;800',
  'tajawal': 'Tajawal:wght@300;400;500;700;800',
  'almarai': 'Almarai:wght@300;400;700;800',
  'ibm-plex': 'IBM+Plex+Sans+Arabic:wght@300;400;500;600;700',
  'noto-kufi': 'Noto+Kufi+Arabic:wght@300;400;500;600;700',
  'amiri': 'Amiri:wght@400;700',
  'harmattan': 'Harmattan:wght@400;500;600;700',
  'scheherazade': 'Scheherazade+New:wght@400;500;600;700',
  'reem-kufi': 'Reem+Kufi:wght@400;500;600;700',
  'aref-ruqaa': 'Aref+Ruqaa:wght@400;700',
  'lemonada': 'Lemonada:wght@300;400;500;600;700',
  'marhey': 'Marhey:wght@300;400;500;600;700',
  'readex-pro': 'Readex+Pro:wght@200;300;400;500;600;700',
  'baloo-bhaijaan': 'Baloo+Bhaijaan+2:wght@400;500;600;700;800',
  'changa': 'Changa:wght@200;300;400;500;600;700;800',
  'el-messiri': 'El+Messiri:wght@400;500;600;700',
  'lalezar': 'Lalezar:wght@400',
  'rakkas': 'Rakkas:wght@400',
  'mirza': 'Mirza:wght@400;500;600;700',
  'katibeh': 'Katibeh:wght@400',
  // English fonts
  'inter': 'Inter:wght@300;400;500;600;700;800',
  'roboto': 'Roboto:wght@300;400;500;700;900',
  'open-sans': 'Open+Sans:wght@300;400;500;600;700;800',
  'montserrat': 'Montserrat:wght@300;400;500;600;700;800',
  'poppins': 'Poppins:wght@300;400;500;600;700;800',
  'nunito': 'Nunito:wght@300;400;500;600;700;800',
  'raleway': 'Raleway:wght@300;400;500;600;700;800',
  'source-sans': 'Source+Sans+3:wght@300;400;500;600;700;800',
  'work-sans': 'Work+Sans:wght@300;400;500;600;700;800',
  'dm-sans': 'DM+Sans:wght@300;400;500;600;700',
  'space-grotesk': 'Space+Grotesk:wght@300;400;500;600;700',
  'outfit': 'Outfit:wght@300;400;500;600;700;800',
  'plus-jakarta': 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800',
  'manrope': 'Manrope:wght@300;400;500;600;700;800',
  'sora': 'Sora:wght@300;400;500;600;700;800',
  'lexend': 'Lexend:wght@300;400;500;600;700;800',
  'red-hat': 'Red+Hat+Display:wght@300;400;500;600;700;800',
  'be-vietnam': 'Be+Vietnam+Pro:wght@300;400;500;600;700;800',
  'cabinet-grotesk': 'Josefin+Sans:wght@300;400;500;600;700',
  'general-sans': 'Figtree:wght@300;400;500;600;700;800',
};

const fontFamilyCSS: Record<FontFamily, string> = {
  // Arabic fonts
  'cairo': "'Cairo', sans-serif",
  'tajawal': "'Tajawal', sans-serif",
  'almarai': "'Almarai', sans-serif",
  'ibm-plex': "'IBM Plex Sans Arabic', sans-serif",
  'noto-kufi': "'Noto Kufi Arabic', sans-serif",
  'amiri': "'Amiri', serif",
  'harmattan': "'Harmattan', sans-serif",
  'scheherazade': "'Scheherazade New', serif",
  'reem-kufi': "'Reem Kufi', sans-serif",
  'aref-ruqaa': "'Aref Ruqaa', serif",
  'lemonada': "'Lemonada', cursive",
  'marhey': "'Marhey', cursive",
  'readex-pro': "'Readex Pro', sans-serif",
  'baloo-bhaijaan': "'Baloo Bhaijaan 2', cursive",
  'changa': "'Changa', sans-serif",
  'el-messiri': "'El Messiri', sans-serif",
  'lalezar': "'Lalezar', cursive",
  'rakkas': "'Rakkas', cursive",
  'mirza': "'Mirza', cursive",
  'katibeh': "'Katibeh', cursive",
  // English fonts
  'inter': "'Inter', sans-serif",
  'roboto': "'Roboto', sans-serif",
  'open-sans': "'Open Sans', sans-serif",
  'montserrat': "'Montserrat', sans-serif",
  'poppins': "'Poppins', sans-serif",
  'nunito': "'Nunito', sans-serif",
  'raleway': "'Raleway', sans-serif",
  'source-sans': "'Source Sans 3', sans-serif",
  'work-sans': "'Work Sans', sans-serif",
  'dm-sans': "'DM Sans', sans-serif",
  'space-grotesk': "'Space Grotesk', sans-serif",
  'outfit': "'Outfit', sans-serif",
  'plus-jakarta': "'Plus Jakarta Sans', sans-serif",
  'manrope': "'Manrope', sans-serif",
  'sora': "'Sora', sans-serif",
  'lexend': "'Lexend', sans-serif",
  'red-hat': "'Red Hat Display', sans-serif",
  'be-vietnam': "'Be Vietnam Pro', sans-serif",
  'cabinet-grotesk': "'Josefin Sans', sans-serif",
  'general-sans': "'Figtree', sans-serif",
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

    // Visual mode: light / dim / dark
    root.classList.remove('dark', 'dim');
    if (settings.visualMode === 'dark' || settings.isDarkMode) {
      root.classList.add('dark');
    } else if (settings.visualMode === 'dim') {
      root.classList.add('dim');
    }

    root.style.fontSize = `${settings.fontSize}px`;
    
    // Apply mode-specific font as base, user override takes priority
    const modeFont = visualModeFonts[settings.visualMode];
    const userFont = fontFamilyCSS[settings.fontFamily];
    document.body.style.fontFamily = userFont || modeFont.family;

    // Load both mode font and user font
    const modeFontUrl = `https://fonts.googleapis.com/css2?family=${modeFont.import}&display=swap`;
    const userFontUrl = `https://fonts.googleapis.com/css2?family=${fontImports[settings.fontFamily]}&display=swap`;
    
    const fontLink = document.getElementById('dynamic-font') as HTMLLinkElement;
    if (fontLink) {
      if (fontLink.href !== userFontUrl) fontLink.href = userFontUrl;
    } else {
      const link = document.createElement('link');
      link.id = 'dynamic-font';
      link.rel = 'stylesheet';
      link.href = userFontUrl;
      document.head.appendChild(link);
    }

    // Load mode font separately
    const modeFontLink = document.getElementById('mode-font') as HTMLLinkElement;
    if (modeFontLink) {
      if (modeFontLink.href !== modeFontUrl) modeFontLink.href = modeFontUrl;
    } else {
      const link = document.createElement('link');
      link.id = 'mode-font';
      link.rel = 'stylesheet';
      link.href = modeFontUrl;
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
    setSettings((prev) => {
      const newDark = !prev.isDarkMode;
      return { ...prev, isDarkMode: newDark, visualMode: newDark ? 'dark' : 'light' };
    });
  }, []);

  const setVisualMode = useCallback((mode: VisualMode) => {
    setSettings((prev) => ({ ...prev, visualMode: mode, isDarkMode: mode === 'dark' }));
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
    setVisualMode,
    toggleDarkMode,
    resetToDefaults,
  }), [setThemeColor, setFontFamily, setFontSize, setDisplayMode, setVisualMode, toggleDarkMode, resetToDefaults]);

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
