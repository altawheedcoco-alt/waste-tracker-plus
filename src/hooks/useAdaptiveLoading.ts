/**
 * useAdaptiveLoading - تحميل متكيّف حسب قدرات الجهاز والشبكة
 */
import { useState, useEffect, useMemo } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface DeviceCapabilities {
  tier: 'low' | 'mid' | 'high';
  cores: number;
  memory: number | null;
  isLowEnd: boolean;
}

interface AdaptiveConfig {
  /** عدد العناصر في الصفحة */
  pageSize: number;
  /** تفعيل الحركات */
  enableAnimations: boolean;
  /** جودة الصور */
  imageQuality: 'low' | 'medium' | 'high';
  /** تفعيل التحميل المسبق */
  enablePrefetch: boolean;
  /** مهلة الشبكة */
  networkTimeout: number;
  /** staleTime لـ React Query */
  queryStaleTime: number;
  /** تحديث تلقائي */
  refetchInterval: number | false;
  /** تقليل البيانات */
  reduceData: boolean;
}

const getDeviceCapabilities = (): DeviceCapabilities => {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || null;
  
  let tier: 'low' | 'mid' | 'high' = 'mid';
  if (cores <= 2 || (memory && memory <= 2)) {
    tier = 'low';
  } else if (cores >= 8 && (!memory || memory >= 8)) {
    tier = 'high';
  }

  return { tier, cores, memory, isLowEnd: tier === 'low' };
};

export const useAdaptiveLoading = (): AdaptiveConfig & { device: DeviceCapabilities } => {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();
  const [device] = useState(getDeviceCapabilities);

  const config = useMemo<AdaptiveConfig>(() => {
    const isSlow = isSlowConnection || effectiveType === '2g' || effectiveType === 'slow-2g';
    const isMedium = effectiveType === '3g';

    if (!isOnline) {
      return {
        pageSize: 20,
        enableAnimations: true,
        imageQuality: 'low',
        enablePrefetch: false,
        networkTimeout: 30000,
        queryStaleTime: Infinity,
        refetchInterval: false,
        reduceData: true,
      };
    }

    if (isSlow || device.isLowEnd) {
      return {
        pageSize: 15,
        enableAnimations: true,
        imageQuality: 'low',
        enablePrefetch: false,
        networkTimeout: 20000,
        queryStaleTime: 10 * 60 * 1000,
        refetchInterval: 60000,
        reduceData: true,
      };
    }

    if (isMedium || device.tier === 'mid') {
      return {
        pageSize: 20,
        enableAnimations: true,
        imageQuality: 'medium',
        enablePrefetch: true,
        networkTimeout: 10000,
        queryStaleTime: 5 * 60 * 1000,
        refetchInterval: 30000,
        reduceData: false,
      };
    }

    return {
      pageSize: 50,
      enableAnimations: true,
      imageQuality: 'high',
      enablePrefetch: true,
      networkTimeout: 8000,
      queryStaleTime: 2 * 60 * 1000,
      refetchInterval: 15000,
      reduceData: false,
    };
  }, [isOnline, isSlowConnection, effectiveType, device]);

  return { ...config, device };
};

export default useAdaptiveLoading;
