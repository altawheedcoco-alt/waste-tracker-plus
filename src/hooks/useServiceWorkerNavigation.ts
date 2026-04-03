/**
 * useServiceWorkerNavigation — Listens for NOTIFICATION_CLICK messages from
 * the Firebase service worker and navigates within the SPA without page reload.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useServiceWorkerNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        const url = event.data.url;
        console.log('[SW-Nav] Navigating to:', url, event.data?.data || {});

        window.dispatchEvent(new CustomEvent('irecycle-notification-click', {
          detail: {
            url,
            data: event.data?.data || {},
          },
        }));

        navigate(url);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handler);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
    };
  }, [navigate]);
}
