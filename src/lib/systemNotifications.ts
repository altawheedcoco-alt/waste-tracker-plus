export interface SystemNotificationOptions extends NotificationOptions {
  url?: string;
}

const DEFAULT_ICON = '/favicon.png';

export async function showSystemNotification(
  title: string,
  options: SystemNotificationOptions = {}
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const payload: NotificationOptions = {
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    dir: 'rtl',
    lang: 'ar',
    ...options,
    data: {
      ...(options.data || {}),
      url: options.url || (options.data as Record<string, unknown> | undefined)?.url || '/',
    },
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, payload);
      return true;
    }

    new Notification(title, payload);
    return true;
  } catch (error) {
    try {
      new Notification(title, payload);
      return true;
    } catch {
      console.warn('[SystemNotification] Failed to show notification', error);
      return false;
    }
  }
}