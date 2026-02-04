import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
  checkConnection: () => void;
}

/**
 * Hook لمراقبة حالة الشبكة والاتصال
 * يوفر معلومات عن الاتصال بالإنترنت وجودة الشبكة
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    effectiveType: null,
    downlink: null,
    rtt: null,
  }));

  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    const isSlowConnection = connection?.effectiveType === '2g' || 
                             connection?.effectiveType === 'slow-2g' ||
                             (connection?.downlink && connection.downlink < 1);

    setStatus({
      isOnline: navigator.onLine,
      isSlowConnection,
      connectionType: connection?.type || null,
      effectiveType: connection?.effectiveType || null,
      downlink: connection?.downlink || null,
      rtt: connection?.rtt || null,
    });
  }, []);

  useEffect(() => {
    // تحديث الحالة الأولية
    updateNetworkStatus();

    // مراقبة تغييرات الاتصال
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // مراقبة تغييرات جودة الاتصال
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  return status;
};

export default useNetworkStatus;
