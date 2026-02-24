import { useEffect, useRef, ReactNode, memo } from 'react';

/**
 * Wrapper للصفحة الرئيسية العامة - محسّن للأداء
 */
const LandingWrapper = memo(({ children }: { children: ReactNode }) => {
  const savedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const root = document.documentElement;
    
    // Save current values once
    savedRef.current = {
      primary: root.style.getPropertyValue('--primary'),
      ring: root.style.getPropertyValue('--ring'),
      accent: root.style.getPropertyValue('--accent'),
      fontSize: root.style.fontSize,
    };

    // Batch DOM writes
    root.style.cssText += ';--primary:142 71% 45%;--ring:142 71% 45%;--accent:160 84% 39%;--eco-green:142 71% 45%;--eco-emerald:160 84% 39%;';
    root.style.fontSize = '16px';
    root.classList.remove('dark');
    document.body.style.fontFamily = "'Cairo', sans-serif";

    return () => {
      const s = savedRef.current;
      if (s.primary) root.style.setProperty('--primary', s.primary);
      if (s.ring) root.style.setProperty('--ring', s.ring);
      if (s.accent) root.style.setProperty('--accent', s.accent);
      if (s.fontSize) root.style.fontSize = s.fontSize;
    };
  }, []);

  return (
    <div className="landing-page" style={{
      ['--primary' as string]: '142 71% 45%',
      ['--accent' as string]: '160 84% 39%',
      ['--background' as string]: '140 20% 98%',
      ['--foreground' as string]: '150 30% 15%',
    }}>
      {children}
    </div>
  );
});

export default LandingWrapper;
