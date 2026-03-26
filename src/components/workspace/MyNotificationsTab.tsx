import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Loader2, Inbox, Filter, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationChannelPreferences from '@/components/notifications/NotificationChannelPreferences';

const priorityConfig: Record<string, { label: string; className: string }> = {
  urgent: { label: 'عاجل', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  high: { label: 'مهم', className: 'bg-primary/10 text-primary border-primary/20' },
  normal: { label: 'عادي', className: 'bg-secondary text-secondary-foreground' },
  low: { label: 'منخفض', className: 'bg-muted text-muted-foreground' },
};

const MyNotificationsTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['my-workspace-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-workspace-notifications'] });
      toast.success('تم تعليم الكل كمقروء');
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-workspace-notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof notifications>>((acc, n) => {
    const date = new Date(n.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(n);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <span className="font-semibold">الإشعارات</span>
          {unreadCount > 0 && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">
              {unreadCount} غير مقروء
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs transition-colors ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs transition-colors ${filter === 'unread' ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              غير مقروء ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs h-8"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-3 h-3" />
              تعليم الكل
            </Button>
          )}
          <Button
            size="sm"
            variant={showPrefs ? "default" : "outline"}
            className="gap-1 text-xs h-8"
            onClick={() => setShowPrefs(!showPrefs)}
          >
            <Settings2 className="w-3.5 h-3.5" />
            القنوات
          </Button>
        </div>
      </div>

      {/* Channel Preferences Panel */}
      {showPrefs && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <NotificationChannelPreferences />
        </motion.div>
      )}

      {/* Notifications grouped by date */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Inbox className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">{filter === 'unread' ? 'لا توجد إشعارات غير مقروءة 🎉' : 'لا توجد إشعارات'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-medium mb-2 px-1">{date}</p>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((n, i) => {
                    const priority = priorityConfig[n.priority || 'normal'] || priorityConfig.normal;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        <Card
                          className={`border-border/30 transition-all cursor-pointer hover:shadow-sm ${
                            !n.is_read ? 'bg-primary/5 border-primary/20 hover:bg-primary/8' : 'hover:bg-muted/30'
                          }`}
                          onClick={() => !n.is_read && markOneRead.mutate(n.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {!n.is_read && (
                                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold truncate">{n.title}</p>
                                  <Badge className={`text-[9px] px-1.5 py-0 h-4 ${priority.className}`}>
                                    {priority.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                                  {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                  {n.type && <span className="mr-2">• {n.type}</span>}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyNotificationsTab;
