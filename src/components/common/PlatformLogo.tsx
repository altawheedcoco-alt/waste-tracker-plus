import { memo } from 'react';
import { Recycle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'print';

interface PlatformLogoProps {
  size?: LogoSize;
  showText?: boolean;
  showRecycleIcon?: boolean;
  className?: string;
  iconClassName?: string;
  imgClassName?: string;
  /** Invert colors for dark backgrounds */
  inverted?: boolean;
  /** For print documents - use simpler rendering */
  printMode?: boolean;
}

const sizeMap: Record<LogoSize, { icon: string; img: string; text: string; subtext: string }> = {
  xs: { icon: 'h-5 w-5', img: 'h-5 w-5', text: 'text-xs', subtext: 'text-[8px]' },
  sm: { icon: 'h-6 w-6', img: 'h-6 w-6', text: 'text-sm', subtext: 'text-[10px]' },
  md: { icon: 'h-8 w-8 sm:h-10 sm:w-10', img: 'h-8 w-8 sm:h-10 sm:w-10', text: 'text-sm sm:text-base lg:text-lg', subtext: 'text-[10px] sm:text-xs lg:text-sm' },
  lg: { icon: 'h-12 w-12', img: 'h-12 w-12', text: 'text-xl', subtext: 'text-sm' },
  xl: { icon: 'h-14 w-14', img: 'h-14 w-14', text: 'text-2xl', subtext: 'text-base' },
  print: { icon: 'h-6 w-6', img: 'h-6 w-6', text: 'text-sm', subtext: 'text-xs' },
};

/**
 * Unified platform logo component used across all pages, dashboard, and print documents.
 * Combines the Recycle icon + logo.png image for consistent branding.
 */
const PlatformLogo = memo(({
  size = 'md',
  showText = false,
  showRecycleIcon = true,
  className,
  iconClassName,
  imgClassName,
  inverted = false,
  printMode = false,
}: PlatformLogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {showRecycleIcon && (
        <Recycle className={cn(s.icon, inverted ? 'text-white' : 'text-primary', iconClassName)} />
      )}
      <img
        src={logo}
        alt="iRecycle"
        className={cn(
          s.img,
          'object-contain',
          inverted && 'brightness-0 invert',
          imgClassName
        )}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn(s.text, 'font-bold leading-tight', inverted ? 'text-white' : 'text-primary')}>
            iRecycle
          </span>
          <span className={cn(s.subtext, 'font-semibold leading-tight', inverted ? 'text-white/70' : 'text-muted-foreground')}>
            آي ريسايكل
          </span>
        </div>
      )}
    </div>
  );
});

PlatformLogo.displayName = 'PlatformLogo';

export default PlatformLogo;
