import { useEffect, ReactNode } from 'react';

/**
 * Wrapper للصفحة الرئيسية العامة
 * يعزل الصفحة الرئيسية عن إعدادات الثيم الداخلية
 * ويطبق الألوان والتنسيقات الثابتة
 */
const LandingWrapper = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // تطبيق الألوان الثابتة للصفحة الرئيسية
    const root = document.documentElement;
    
    // حفظ القيم الحالية (للداشبورد)
    const savedValues = {
      primary: root.style.getPropertyValue('--primary'),
      ring: root.style.getPropertyValue('--ring'),
      accent: root.style.getPropertyValue('--accent'),
      fontSize: root.style.fontSize,
    };

    // تطبيق القيم الثابتة للصفحة الرئيسية
    root.style.setProperty('--primary', '142 71% 45%');
    root.style.setProperty('--ring', '142 71% 45%');
    root.style.setProperty('--accent', '160 84% 39%');
    root.style.setProperty('--eco-green', '142 71% 45%');
    root.style.setProperty('--eco-emerald', '160 84% 39%');
    root.style.fontSize = '16px';
    
    // إزالة وضع الظلام إن وجد
    root.classList.remove('dark');
    
    // تطبيق خط Cairo الثابت
    document.body.style.fontFamily = "'Cairo', sans-serif";

    // إعادة القيم عند مغادرة الصفحة
    return () => {
      if (savedValues.primary) {
        root.style.setProperty('--primary', savedValues.primary);
      }
      if (savedValues.ring) {
        root.style.setProperty('--ring', savedValues.ring);
      }
      if (savedValues.accent) {
        root.style.setProperty('--accent', savedValues.accent);
      }
      if (savedValues.fontSize) {
        root.style.fontSize = savedValues.fontSize;
      }
    };
  }, []);

  return (
    <div className="landing-page" style={{
      // تأكيد الألوان الثابتة
      ['--primary' as string]: '142 71% 45%',
      ['--accent' as string]: '160 84% 39%',
      ['--background' as string]: '140 20% 98%',
      ['--foreground' as string]: '150 30% 15%',
    }}>
      {children}
    </div>
  );
};

export default LandingWrapper;
