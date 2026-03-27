import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { showSystemNotification } from '@/lib/systemNotifications';
import { soundEngine } from '@/lib/soundEngine';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  shipment_id?: string | null;
  request_id?: string | null;
  pdf_url?: string | null;
  user_id?: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

interface NotificationsActions {
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

interface NotificationsContextType extends NotificationsState, NotificationsActions {}

const NotificationsStateContext = createContext<NotificationsState | undefined>(undefined);
const NotificationsActionsContext = createContext<NotificationsActions | undefined>(undefined);
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Optimized hooks - components can subscribe to only what they need
export const useNotificationsState = () => {
  const context = useContext(NotificationsStateContext);
  if (context === undefined) {
    throw new Error('useNotificationsState must be used within a NotificationsProvider');
  }
  return context;
};

export const useNotificationsActions = () => {
  const context = useContext(NotificationsActionsContext);
  if (context === undefined) {
    throw new Error('useNotificationsActions must be used within a NotificationsProvider');
  }
  return context;
};

// Combined hook for convenience
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

// Hook for just the unread count (most common use case)
export const useUnreadCount = () => {
  const { unreadCount } = useNotificationsState();
  return unreadCount;
};

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel(getTabChannelName('notifications-changes'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchNotifications]);

  // Memoized context values
  const stateValue = useMemo<NotificationsState>(() => ({
    notifications,
    unreadCount,
    loading,
  }), [notifications, unreadCount, loading]);

  const actionsValue = useMemo<NotificationsActions>(() => ({
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  }), [markAsRead, markAllAsRead, deleteNotification, fetchNotifications]);

  const combinedValue = useMemo<NotificationsContextType>(() => ({
    ...stateValue,
    ...actionsValue,
  }), [stateValue, actionsValue]);

  return (
    <NotificationsContext.Provider value={combinedValue}>
      <NotificationsStateContext.Provider value={stateValue}>
        <NotificationsActionsContext.Provider value={actionsValue}>
          {children}
        </NotificationsActionsContext.Provider>
      </NotificationsStateContext.Provider>
    </NotificationsContext.Provider>
  );
};
