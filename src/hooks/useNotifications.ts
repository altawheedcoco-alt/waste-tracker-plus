import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTabChannelName } from '@/lib/tabSession';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound, mapNotificationTypeToSound } from '@/hooks/useNotificationSound';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
  shipment_id: string | null;
  request_id: string | null;
  pdf_url: string | null;
  organization_id?: string | null;
  document_id?: string | null;
  priority: string | null;
  metadata: Record<string, any> | null;
  user_id: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get all shipment IDs for recycling_report notifications without pdf_url
      const recyclingReportShipmentIds = (data || [])
        .filter((n: Notification) => n.type === 'recycling_report' && !n.pdf_url && n.shipment_id)
        .map((n: Notification) => n.shipment_id);

      let pdfUrlMap: Record<string, string> = {};

      // Fetch pdf_urls from recycling_reports table
      if (recyclingReportShipmentIds.length > 0) {
        const { data: reports } = await supabase
          .from('recycling_reports')
          .select('shipment_id, pdf_url')
          .in('shipment_id', recyclingReportShipmentIds)
          .not('pdf_url', 'is', null);

        if (reports) {
          reports.forEach((report: { shipment_id: string; pdf_url: string }) => {
            pdfUrlMap[report.shipment_id] = report.pdf_url;
          });
        }
      }

      // Get organization IDs for document_uploaded notifications
      const documentNotifications = (data || [])
        .filter((n: Notification) => n.type === 'document_uploaded');

      let documentOrgMap: Record<string, { org_id: string; doc_id?: string }> = {};

      // For document notifications, extract org info from approval_requests
      if (documentNotifications.length > 0) {
        const requestIds = documentNotifications
          .filter((n: Notification) => n.request_id)
          .map((n: Notification) => n.request_id);

        if (requestIds.length > 0) {
          const { data: requests } = await supabase
            .from('approval_requests')
            .select('id, requester_organization_id, target_resource_id')
            .in('id', requestIds);

          if (requests) {
            requests.forEach((req: { id: string; requester_organization_id: string; target_resource_id?: string }) => {
              documentOrgMap[req.id] = {
                org_id: req.requester_organization_id,
                doc_id: req.target_resource_id,
              };
            });
          }
        }
      }

      // Merge pdf_urls and org info into notifications
      const enrichedNotifications = (data || []).map((n: Notification) => {
        let enriched = { ...n };
        
        // Add pdf_url for recycling reports
        if (n.type === 'recycling_report' && !n.pdf_url && n.shipment_id && pdfUrlMap[n.shipment_id]) {
          enriched.pdf_url = pdfUrlMap[n.shipment_id];
        }
        
        // Add organization_id for document notifications
        if (n.type === 'document_uploaded' && n.request_id && documentOrgMap[n.request_id]) {
          enriched.organization_id = documentOrgMap[n.request_id].org_id;
          enriched.document_id = documentOrgMap[n.request_id].doc_id;
        }
        
        return enriched;
      });

      setNotifications(enrichedNotifications as Notification[]);
      setUnreadCount(enrichedNotifications?.filter((n: Notification) => !n.is_read).length || 0);
    } catch (error: any) {
      if (!error?.message?.includes('AbortError') && error?.name !== 'AbortError') {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Subscribe to ALL notification changes (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel(getTabChannelName('notifications-realtime'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Play notification sound based on type
          const soundType = mapNotificationTypeToSound(newNotification.type);
          playNotificationSound(soundType);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });

          // Add to notifications list
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n => n.id === updated.id ? { ...n, ...updated } : n)
          );
          // Recalculate unread count
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deleted = payload.old as Notification;
          setNotifications(prev => {
            const next = prev.filter(n => n.id !== deleted.id);
            setUnreadCount(next.filter(n => !n.is_read).length);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
