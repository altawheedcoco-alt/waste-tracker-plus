import { useThemeSettings } from '@/contexts/ThemeSettingsContext';

/**
 * Hook to get responsive classes based on the user's display mode preference
 * Returns utility functions and the current effective display mode
 */
export const useDisplayMode = () => {
  const { settings, effectiveDisplayMode } = useThemeSettings();

  const isMobile = effectiveDisplayMode === 'mobile';
  const isTablet = effectiveDisplayMode === 'tablet';
  const isDesktop = effectiveDisplayMode === 'desktop';

  // Get responsive class based on display mode
  const getResponsiveClass = (config: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }) => {
    if (isMobile && config.mobile) return config.mobile;
    if (isTablet && config.tablet) return config.tablet;
    if (isDesktop && config.desktop) return config.desktop;
    return config.desktop || config.tablet || config.mobile || '';
  };

  // Get responsive value based on display mode
  const getResponsiveValue = <T>(config: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  }): T | undefined => {
    if (isMobile && config.mobile !== undefined) return config.mobile;
    if (isTablet && config.tablet !== undefined) return config.tablet;
    if (isDesktop && config.desktop !== undefined) return config.desktop;
    return config.desktop ?? config.tablet ?? config.mobile;
  };

  // Check if we should show mobile layout
  const shouldShowMobileLayout = isMobile;
  
  // Check if we should show tablet layout
  const shouldShowTabletLayout = isTablet;

  // Check if we should collapse sidebar
  const shouldCollapseSidebar = isMobile || isTablet;

  // Get grid columns based on display mode
  const getGridCols = (config: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  }) => {
    const cols = getResponsiveValue(config) || 1;
    return `grid-cols-${cols}`;
  };

  return {
    displayMode: settings.displayMode,
    effectiveDisplayMode,
    isMobile,
    isTablet,
    isDesktop,
    getResponsiveClass,
    getResponsiveValue,
    shouldShowMobileLayout,
    shouldShowTabletLayout,
    shouldCollapseSidebar,
    getGridCols,
  };
};
