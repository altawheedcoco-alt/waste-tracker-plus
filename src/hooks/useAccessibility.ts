import { useEffect, useCallback, useState } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  focusIndicators: true,
  keyboardNavigation: true,
};

const STORAGE_KEY = 'accessibility-settings';

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultSettings, ...JSON.parse(stored) };
      } catch {
        return defaultSettings;
      }
    }
    
    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    return {
      ...defaultSettings,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
      root.style.fontSize = '18px';
    } else {
      root.classList.remove('large-text');
      root.style.fontSize = '';
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Screen reader mode
    if (settings.screenReaderMode) {
      root.setAttribute('aria-live', 'polite');
    } else {
      root.removeAttribute('aria-live');
    }
    
    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('show-focus');
    } else {
      root.classList.remove('show-focus');
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content (Alt + 1)
      if (e.altKey && e.key === '1') {
        const main = document.querySelector('main, [role="main"]');
        if (main instanceof HTMLElement) {
          main.focus();
          main.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      // Skip to navigation (Alt + 2)
      if (e.altKey && e.key === '2') {
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav instanceof HTMLElement) {
          const firstLink = nav.querySelector('a, button');
          if (firstLink instanceof HTMLElement) {
            firstLink.focus();
          }
        }
      }
      
      // Open accessibility menu (Alt + A)
      if (e.altKey && e.key === 'a') {
        const accessibilityBtn = document.querySelector('[data-accessibility-trigger]');
        if (accessibilityBtn instanceof HTMLElement) {
          accessibilityBtn.click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);

  const updateSetting = useCallback(<K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSetting = useCallback((key: keyof AccessibilitySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  return {
    settings,
    updateSetting,
    toggleSetting,
    resetSettings,
    announce,
  };
};
