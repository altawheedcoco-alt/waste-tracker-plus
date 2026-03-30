import { memo } from 'react';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/irecycle-logo-premium-3d.webp';

type LogoVariant = 'icon-only' | 'full' | 'stacked';
type LogoTheme = 'light' | 'dark' | 'white';

interface IRecycleLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number;
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Professional iRecycle Logo — uses the official brand PNG.
 */
const IRecycleLogo = memo(({
  variant = 'full',
  theme = 'light',
  size = 40,
  className,
  showSubtitle = false,
}: IRecycleLogoProps) => {
  const colors = {
    light: {
      text: 'hsl(220, 20%, 10%)',
      subtext: 'hsl(220, 10%, 46%)',
    },
    dark: {
      text: 'hsl(210, 15%, 95%)',
      subtext: 'hsl(215, 8%, 68%)',
    },
    white: {
      text: '#ffffff',
      subtext: 'rgba(255,255,255,0.7)',
    },
  }[theme];

  const badgeSize = Math.max(14, size * 0.35);

  const IconImg = (
    <div className="relative inline-flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
      {/* Pearlescent blue glowing ring */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'conic-gradient(from 0deg, #60a5fa, #93c5fd, #bfdbfe, #dbeafe, #93c5fd, #60a5fa)',
          padding: 3,
          filter: 'blur(0.5px)',
          boxShadow: '0 0 12px 3px rgba(96,165,250,0.45), 0 0 24px 6px rgba(147,197,253,0.25), inset 0 0 8px rgba(191,219,254,0.3)',
        }}
      >
        <div className="w-full h-full rounded-full bg-background" />
      </div>
      {/* Logo image */}
      <img
        src={logoImg}
        alt="iRecycle"
        width={size}
        height={size}
        className="object-contain rounded-full relative z-10"
        style={{ width: size, height: size }}
      />
      {/* Verification shield badge */}
      <div
        className="absolute z-20 flex items-center justify-center rounded-full bg-blue-500 shadow-md border-2 border-background"
        style={{
          width: badgeSize,
          height: badgeSize,
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: badgeSize * 0.6, height: badgeSize * 0.6 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.2)" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={cn('inline-flex items-center justify-center', className)}>{IconImg}</div>;
  }

  const textScale = size / 40;
  const nameSize = Math.max(14, 16 * textScale);
  const arSize = Math.max(10, 12 * textScale);
  const subtitleSize = Math.max(9, 10 * textScale);

  if (variant === 'stacked') {
    return (
      <div className={cn('inline-flex flex-col items-center gap-1', className)}>
        {IconImg}
        <div className="flex flex-col items-center" style={{ gap: 1 }}>
          <span style={{ fontSize: nameSize, color: colors.text, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            iRecycle
          </span>
          <span style={{ fontSize: arSize, color: colors.subtext, fontWeight: 600, lineHeight: 1.1 }} dir="rtl">
            آي ريسايكل
          </span>
          {showSubtitle && (
            <span style={{ fontSize: subtitleSize, color: colors.subtext, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: 2, opacity: 0.7 }}>
              Waste Management Solution Platform
            </span>
          )}
        </div>
      </div>
    );
  }

  // variant === 'full' (horizontal)
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {IconImg}
      <div className="flex flex-col" style={{ gap: 0 }}>
        <span style={{ fontSize: nameSize, color: colors.text, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          iRecycle
        </span>
        <span style={{ fontSize: arSize, color: colors.subtext, fontWeight: 600, lineHeight: 1.15 }} dir="rtl">
          آي ريسايكل
        </span>
        {showSubtitle && (
          <span style={{ fontSize: subtitleSize, color: colors.subtext, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2, marginTop: 1, opacity: 0.7 }}>
            Waste Management Solution Platform
          </span>
        )}
      </div>
    </div>
  );
});

IRecycleLogo.displayName = 'IRecycleLogo';

export default IRecycleLogo;
