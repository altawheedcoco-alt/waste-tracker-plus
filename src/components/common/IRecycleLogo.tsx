import { memo } from 'react';
import { cn } from '@/lib/utils';
import logoImg from '@/assets/irecycle-logo-final.png';

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

  const IconImg = (
    <img
      src={logoImg}
      alt="iRecycle"
      width={size}
      height={size}
      className="object-contain rounded-full"
      style={{ width: size, height: size }}
    />
  );

  if (variant === 'icon-only') {
    return <div className={cn('inline-flex items-center justify-center', className)}>{IconImg}</div>;
  }

  const textScale = size / 40;
  const nameSize = Math.max(14, 16 * textScale);
  const arSize = Math.max(10, 12 * textScale);
  const subtitleSize = Math.max(7, 8 * textScale);

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
              Waste Management System
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
            Waste Management System
          </span>
        )}
      </div>
    </div>
  );
});

IRecycleLogo.displayName = 'IRecycleLogo';

export default IRecycleLogo;
