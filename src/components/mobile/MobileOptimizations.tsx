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

  // Memory pressure handling
  useEffect(() => {
    if (!('onmemorywarning' in window)) return;
    
    const handleMemoryPressure = () => {
      // Clear image caches
      if ('caches' in window) {
        caches.open('images-cache').then(cache => {
          cache.keys().then(keys => {
            // Keep only recent 20 images
            keys.slice(20).forEach(key => cache.delete(key));
          });
        });
      }
      console.warn('⚠️ Memory pressure detected, cleaning caches');
    };

    (window as any).addEventListener('memorywarning', handleMemoryPressure);
    return () => (window as any).removeEventListener('memorywarning', handleMemoryPressure);
  }, []);

  // Prefetch critical routes on good connection
  useEffect(() => {
    if (!isOnline || isSlowConnection || device.isLowEnd) return;

    const timer = setTimeout(() => {
      const routes = [
        () => import('@/pages/Dashboard'),
        () => import('@/pages/dashboard/ShipmentManagement'),
      ];
      routes.forEach(r => r().catch(() => {}));
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOnline, isSlowConnection, device.isLowEnd]);

  // Register for background sync
  useEffect(() => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        (reg as any).sync?.register('background-sync').catch(() => {});
      });
    }
  }, []);

  return <>{children}</>;
});

MobileOptimizations.displayName = 'MobileOptimizations';

export default MobileOptimizations;
