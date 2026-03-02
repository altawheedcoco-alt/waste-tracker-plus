import { ReactNode, memo } from 'react';

/**
 * Wrapper للصفحة الرئيسية العامة - محسّن للأداء
 * يستخدم CSS variables فقط بدون تعديل DOM مباشرة
 */
const LandingWrapper = memo(({ children }: { children: ReactNode }) => {
  return (
    <div className="landing-page" style={{
      ['--primary' as string]: '142 71% 45%',
      ['--accent' as string]: '160 84% 39%',
      ['--background' as string]: '140 8% 96%',
      ['--foreground' as string]: '150 20% 12%',
    }}>
      {children}
    </div>
  );
});

LandingWrapper.displayName = 'LandingWrapper';

export default LandingWrapper;
