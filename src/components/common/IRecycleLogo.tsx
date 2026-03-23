import { memo } from 'react';
import { cn } from '@/lib/utils';

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
 * Professional iRecycle SVG Logo — vector-based, scales perfectly at any size.
 * Combines a recycling arrows motif with "i" lettermark in a modern circular badge.
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
      primary: 'hsl(160, 68%, 40%)',
      secondary: 'hsl(160, 75%, 28%)',
      accent: 'hsl(178, 60%, 38%)',
      text: 'hsl(220, 20%, 10%)',
      subtext: 'hsl(220, 10%, 46%)',
    },
    dark: {
      primary: 'hsl(160, 64%, 48%)',
      secondary: 'hsl(160, 70%, 36%)',
      accent: 'hsl(178, 55%, 44%)',
      text: 'hsl(210, 15%, 95%)',
      subtext: 'hsl(215, 8%, 68%)',
    },
    white: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.85)',
      accent: 'rgba(255,255,255,0.7)',
      text: '#ffffff',
      subtext: 'rgba(255,255,255,0.7)',
      inner: 'hsl(160, 68%, 40%)',
    },
  }[theme];

  const innerColor = (colors as any).inner || '#fff';

  const iconSize = size;

  const IconSVG = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill={colors.primary} />
      <circle cx="32" cy="32" r="28" fill="none" stroke={colors.secondary} strokeWidth="0.5" opacity="0.3" />

      {/* Recycling arrows — 3 curved arrows forming a triangle */}
      <g opacity="0.2" fill="#fff">
        {/* Top arrow */}
        <path d="M32 14 L40 26 L36 26 L36 30 L28 30 L28 26 L24 26 Z" />
        {/* Bottom-left arrow */}
        <path d="M18 42 L22 30 L25 33 L29 31 L25 38 L21 36 Z" transform="rotate(-2 22 36)" />
        {/* Bottom-right arrow */}
        <path d="M46 42 L42 30 L39 33 L35 31 L39 38 L43 36 Z" transform="rotate(2 42 36)" />
      </g>

      {/* Modern recycling ring */}
      <circle cx="32" cy="32" r="16" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.35" strokeDasharray="8 4" />

      {/* Center "i" lettermark */}
      <circle cx="32" cy="22" r="3" fill="#fff" />
      <rect x="29.5" y="28" width="5" height="16" rx="2.5" fill="#fff" />

      {/* Subtle inner glow */}
      <circle cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.15" />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={cn('inline-flex items-center justify-center', className)}>{IconSVG}</div>;
  }

  const textScale = size / 40;
  const nameSize = Math.max(14, 16 * textScale);
  const arSize = Math.max(10, 12 * textScale);
  const subtitleSize = Math.max(7, 8 * textScale);

  if (variant === 'stacked') {
    return (
      <div className={cn('inline-flex flex-col items-center gap-1', className)}>
        {IconSVG}
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
      {IconSVG}
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
