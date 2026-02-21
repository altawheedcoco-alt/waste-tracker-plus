import { memo } from 'react';
import irecycleLogo from '@/assets/irecycle-logo.png';
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
  /** Show subtitle "Waste Management System" */
  showSubtitle?: boolean;
}

const sizeMap: Record<LogoSize, { logoH: string; text: string; subtext: string; subtitle: string }> = {
  xs: { logoH: 'h-6', text: 'text-xs', subtext: 'text-[8px]', subtitle: 'text-[6px]' },
  sm: { logoH: 'h-8', text: 'text-sm', subtext: 'text-[10px]', subtitle: 'text-[7px]' },
  md: { logoH: 'h-10 sm:h-12', text: 'text-sm sm:text-base lg:text-lg', subtext: 'text-[10px] sm:text-xs', subtitle: 'text-[8px] sm:text-[9px]' },
  lg: { logoH: 'h-14', text: 'text-xl', subtext: 'text-sm', subtitle: 'text-[10px]' },
  xl: { logoH: 'h-20', text: 'text-2xl', subtext: 'text-base', subtitle: 'text-xs' },
  print: { logoH: 'h-10', text: 'text-sm', subtext: 'text-xs', subtitle: 'text-[8px]' },
};

/**
 * Unified platform logo component used across all pages, dashboards, and print documents.
 * Uses the official iRecycle logo image for consistent high-quality branding.
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
  showSubtitle = false,
}: PlatformLogoProps) => {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className={cn(s.logoH, 'aspect-square rounded-xl bg-white flex items-center justify-center p-1 shadow-sm', imgClassName)}>
        <img
          src={irecycleLogo}
          alt="iRecycle - Waste Management System"
          className="h-full w-full object-contain"
          loading="eager"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn(s.text, 'font-bold leading-tight', inverted ? 'text-white' : 'text-primary')}>
            iRecycle
          </span>
          <span className={cn(s.subtext, 'font-semibold leading-tight', inverted ? 'text-white/70' : 'text-muted-foreground')}>
            آي ريسايكل
          </span>
          {showSubtitle && (
            <span className={cn(s.subtitle, 'font-medium tracking-wider uppercase leading-tight mt-0.5', inverted ? 'text-white/50' : 'text-muted-foreground/70')}>
              Waste Management System
            </span>
          )}
        </div>
      )}
      {!showText && showSubtitle && (
        <div className="flex flex-col">
          <span className={cn(s.subtitle, 'font-medium tracking-wider uppercase leading-tight', inverted ? 'text-white/50' : 'text-muted-foreground/70')}>
            Waste Management System
          </span>
        </div>
      )}
    </div>
  );
});

PlatformLogo.displayName = 'PlatformLogo';

export default PlatformLogo;
