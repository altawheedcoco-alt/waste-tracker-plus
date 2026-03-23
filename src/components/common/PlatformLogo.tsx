import { memo } from 'react';
import IRecycleLogo from './IRecycleLogo';
import { cn } from '@/lib/utils';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'print';

interface PlatformLogoProps {
  size?: LogoSize;
  showText?: boolean;
  showRecycleIcon?: boolean;
  className?: string;
  iconClassName?: string;
  imgClassName?: string;
  inverted?: boolean;
  printMode?: boolean;
  showSubtitle?: boolean;
  priority?: boolean;
}

const sizeToPixels: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  print: 40,
};

/**
 * Unified platform logo — wraps IRecycleLogo SVG component.
 * Drop-in replacement for the old PNG-based logo.
 */
const PlatformLogo = memo(({
  size = 'md',
  showText = false,
  className,
  inverted = false,
  showSubtitle = false,
}: PlatformLogoProps) => {
  const px = sizeToPixels[size];
  const theme = inverted ? 'white' : 'light';
  const variant = showText ? 'full' : 'icon-only';

  return (
    <IRecycleLogo
      variant={variant}
      theme={theme}
      size={px}
      showSubtitle={showSubtitle}
      className={cn(className)}
    />
  );
});

PlatformLogo.displayName = 'PlatformLogo';

export default PlatformLogo;
