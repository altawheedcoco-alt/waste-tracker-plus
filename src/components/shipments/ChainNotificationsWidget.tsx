import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, CheckCheck, Info, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Props {
  organizationId: string;
  shipmentId?: string;
  maxItems?: number;
}

const typeIcons: Record<string, any> = {
  info: Info,
  action_required: Zap,
  warning: AlertTriangle,
  success: CheckCircle2,
};

const typeColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800',
  action_required: 'bg-orange-100 text-orange-800',
  warning: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
};

export default function ChainNotificationsWidget({ organizationId, shipmentId, maxItems = 10 }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('chain-notifications-' + organizationId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chain_notifications',
        filter: `target_organization_id=eq.${organizationId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev].slice(0, maxItems));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, shipmentId]);

  const fetchNotifications = async () => {
    let query = supabase
      .from('chain_notifications')
      .select('*')
      .eq('target_organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(maxItems);

    if (shipmentId) query = query.eq('shipment_id', shipmentId);

    const { data } = await query;
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('chain_notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  if (notifications.length === 0) return null;

  return (
    <Card>
      <CardHeader className="text-right pb-3">
        <div className="flex items-center justify-between">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck className="w-4 h-4 ml-1" /> قراءة الكل
            </Button>
          )}
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="relative">
              <Bell className="w-5 h-5 text-primary" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            إشعارات سلسلة الشحنة
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {notifications.map(n => {
            const Icon = typeIcons[n.notification_type] || Info;
            return (
              <div key={n.id} className={`p-3 rounded-lg border text-right transition-colors ${!n.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-sm font-medium">{n.title}</span>
                      <Badge className={`${typeColors[n.notification_type]} text-xs`}>
                        <Icon className="w-3 h-3 ml-0.5" />
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
