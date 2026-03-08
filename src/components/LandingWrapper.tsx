import { ReactNode, memo } from 'react';

/**
 * Wrapper للصفحة الرئيسية العامة - محسّن للأداء
 * يستخدم CSS class فقط بدون تعديل styles مباشرة
 */
const LandingWrapper = memo(({ children }: { children: ReactNode }) => {
  return (
    <div className="landing-page">
      {children}
    </div>
  );
});

LandingWrapper.displayName = 'LandingWrapper';

export default LandingWrapper;
