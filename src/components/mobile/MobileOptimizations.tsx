/**
 * MobileOptimizations - تحسينات أداء الموبايل
 * يُغلف التطبيق ويطبق التحسينات تلقائياً
 */
import { memo, useEffect, ReactNode } from 'react';
import { useAdaptiveLoading } from '@/hooks/useAdaptiveLoading';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MobileOptimizationsProps {
  children: ReactNode;
}

const MobileOptimizations = memo(({ children }: MobileOptimizationsProps) => {
  const { enableAnimations, reduceData, imageQuality, device } = useAdaptiveLoading();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // Apply CSS classes for adaptive styling
  useEffect(() => {
    const root = document.documentElement;
    
    // Animation control
    if (!enableAnimations) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--animation-duration', '0.05s');
    } else {
      root.classList.remove('reduce-motion');
      root.style.removeProperty('--animation-duration');
    }

    // Data saver mode
    if (reduceData) {
      root.classList.add('data-saver');
    } else {
      root.classList.remove('data-saver');
    }

    // Image quality hint
    root.dataset.imageQuality = imageQuality;
    root.dataset.deviceTier = device.tier;

    // Viewport optimization for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover'
      );
    }

    return () => {
      root.classList.remove('reduce-motion', 'data-saver');
      root.style.removeProperty('--animation-duration');
      delete root.dataset.imageQuality;
      delete root.dataset.deviceTier;
    };
  }, [enableAnimations, reduceData, imageQuality, device.tier]);


  return <>{children}</>;
});

MobileOptimizations.displayName = 'MobileOptimizations';

export default MobileOptimizations;
