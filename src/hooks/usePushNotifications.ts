import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('المتصفح لا يدعم الإشعارات');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast.success('تم تفعيل الإشعارات بنجاح');
      return true;
    } else if (result === 'denied') {
      toast.error('تم رفض إذن الإشعارات');
      return false;
    }
    return false;
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    try {
      new Notification(title, {
        icon: '/favicon.png',
        badge: '/favicon.png',
        dir: 'rtl',
        lang: 'ar',
        ...options,
      });
    } catch {
      // Fallback for mobile
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            dir: 'rtl',
            lang: 'ar',
            ...options,
          });
        });
      }
    }
  }, [permission]);

  // Listen for new messages and show notifications
  useEffect(() => {
    if (!user || permission !== 'granted') return;

    const channel = supabase
      .channel('push-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_organization_id=eq.${user.id}`,
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id === user.id) return;
        if (document.hasFocus()) return; // Don't notify if app is focused

        // Get sender info
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', msg.sender_id)
          .single();

        const senderName = sender?.full_name || 'مستخدم';
        let body = msg.content;
        try {
          const parsed = JSON.parse(msg.content);
          body = parsed.text || msg.content;
        } catch { /* use raw */ }

        if (msg.message_type === 'image') body = '📷 صورة';
        if (msg.message_type === 'file') body = '📎 ملف';

        showNotification(`رسالة من ${senderName}`, {
          body,
          tag: `msg-${msg.id}`,
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, permission, showNotification]);

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    showNotification,
  };
}
