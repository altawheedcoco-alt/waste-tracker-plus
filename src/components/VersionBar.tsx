import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * شريط الإصدار الذهبي - يظهر أعلى الهيدر
 * Golden version badge bar with radiant glow effect
 */
const VersionBar = memo(() => {
  const { language } = useLanguage();

  return (
    <div className="fixed top-0 left-0 right-0 z-[61] h-7 bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 dark:from-amber-950/95 dark:via-amber-900/85 dark:to-amber-950/95 border-b border-amber-700/30 overflow-hidden">
      {/* Animated shimmer overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(251,191,36,0.08)_40%,rgba(251,191,36,0.15)_50%,rgba(251,191,36,0.08)_60%,transparent_100%)] animate-[shimmer_3s_ease-in-out_infinite]" />
      
      <div className="relative h-full flex items-center justify-center gap-2.5">
        <Sparkles className="w-3 h-3 text-amber-400/70 animate-pulse" />
        
        <span className="text-[10px] sm:text-[11px] font-semibold text-amber-200/70 tracking-wide">
          {language === 'ar' ? 'آي ريسايكل — منصة حلول إدارة المخلفات — الإصدار' : 'iRecycle — Waste Management Solution Platform — Version'}
        </span>
        
        {/* Golden glowing version number */}
        <span className="relative inline-flex items-center">
          {/* Outer glow */}
          <span className="absolute inset-0 blur-lg bg-amber-400/40 rounded-full scale-150" />
          {/* Inner glow */}
          <span className="absolute inset-0 blur-sm bg-amber-300/30 rounded-full scale-125" />
          {/* Badge */}
          <span className="relative px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 text-[10px] sm:text-[11px] font-black tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.5),0_0_30px_rgba(251,191,36,0.25)] border border-amber-300/50">
            v5.1
          </span>
        </span>
        
        <span className="hidden sm:inline text-[10px] font-medium text-amber-300/50 tracking-wide">
          {language === 'ar' ? '— النضج المتكامل ♻️' : '— Full Maturity ♻️'}
        </span>
        
        <Sparkles className="w-3 h-3 text-amber-400/70 animate-pulse" />
      </div>
    </div>
  );
});

VersionBar.displayName = 'VersionBar';

export default VersionBar;
