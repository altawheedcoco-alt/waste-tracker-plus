import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ListTodo, Clock, AlertCircle, Loader2, Inbox, Package, ChevronLeft,
  Bell, FileText, CheckCircle2, Timer, Flame, ArrowUpRight,
  Filter, BarChart3, TrendingUp, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

const statusMap: Record<string, { label: string; className: string; icon: typeof Package }> = {
  confirmed: { label: 'مؤكدة', className: 'bg-primary/10 text-primary border-primary/20', icon: CheckCircle2 },
  in_transit: { label: 'في الطريق', className: 'bg-secondary text-secondary-foreground', icon: Timer },
  pending: { label: 'معلقة', className: 'bg-muted text-muted-foreground', icon: Clock },
};

type TaskFilter = 'all' | 'urgent' | 'shipments' | 'notifications';

const MyTasksTab = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TaskFilter>('all');

  const { data: pendingShipments = [], isLoading } = useQuery({
    queryKey: ['my-pending-shipments', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];
      const { data } = await (supabase.from('shipments') as any)
        .select('id, shipment_number, status, created_at, shipment_type, pickup_city, delivery_city')
        .eq('organization_id', organization.id)
        .in('status', ['confirmed', 'in_transit', 'pending'])
        .order('created_at', { ascending: false })
        .limit(20);
      return (data as any[]) || [];
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['my-task-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at, type, priority')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['my-recent-activity', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, action_type, created_at, resource_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3,
  });

  // Mark notification as read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-task-notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-task-notifications'] });
      toast.success('تم تعليم الكل كمقروء');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const urgentNotifs = recentNotifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
  const normalNotifs = recentNotifications.filter(n => n.priority !== 'urgent' && n.priority !== 'high');

  const totalTasks = pendingShipments.length + recentNotifications.length;
  const completionRate = totalTasks > 0 ? Math.round(((recentActivity.length) / Math.max(totalTasks, 1)) * 100) : 100;

  const filters: { key: TaskFilter; label: string; count: number; icon: typeof ListTodo }[] = [
    { key: 'all', label: 'الكل', count: totalTasks, icon: ListTodo },
    { key: 'urgent', label: 'عاجل', count: urgentNotifs.length, icon: Flame },
    { key: 'shipments', label: 'شحنات', count: pendingShipments.length, icon: Package },
    { key: 'notifications', label: 'تنبيهات', count: normalNotifs.length, icon: Bell },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Overview Strip ─── */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-border/30 col-span-1">
          <CardContent className="p-3 text-center">
            <Package className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xl font-bold mt-1">{pendingShipments.length}</p>
            <p className="text-[10px] text-muted-foreground">شحنات نشطة</p>
          </CardContent>
        </Card>
        <Card className={`border-border/30 col-span-1 ${urgentNotifs.length > 0 ? 'border-destructive/20 bg-destructive/5' : ''}`}>
          <CardContent className="p-3 text-center">
            <AlertCircle className={`w-5 h-5 mx-auto ${urgentNotifs.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <p className="text-xl font-bold mt-1">{urgentNotifs.length}</p>
            <p className="text-[10px] text-muted-foreground">عاجل</p>
          </CardContent>
        </Card>
        <Card className="border-border/30 col-span-1">
          <CardContent className="p-3 text-center">
            <Bell className="w-5 h-5 text-muted-foreground mx-auto" />
            <p className="text-xl font-bold mt-1">{normalNotifs.length}</p>
            <p className="text-[10px] text-muted-foreground">تنبيهات</p>
          </CardContent>
        </Card>
        <Card className="border-border/30 col-span-1 bg-gradient-to-br from-primary/5 to-card">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xl font-bold mt-1">{recentActivity.length}</p>
            <p className="text-[10px] text-muted-foreground">إجراء اليوم</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
              {f.count > 0 && (
                <span className={`text-[9px] px-1.5 rounded-full ${filter === f.key ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {recentNotifications.length > 0 && (
          <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCircle2 className="w-3 h-3" /> تعليم الكل مقروء
          </Button>
        )}
      </div>

      {/* ─── Urgent Section ─── */}
      {(filter === 'all' || filter === 'urgent') && urgentNotifs.length > 0 && (
        <Card className="border-destructive/20 bg-gradient-to-l from-destructive/5 to-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <Flame className="w-4 h-4" />
              يتطلب انتباهك فوراً
              <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">{urgentNotifs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence>
              {urgentNotifs.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-card border border-destructive/15 hover:bg-destructive/5 transition-colors cursor-pointer"
                  onClick={() => markRead.mutate(n.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative rounded-full h-2 w-2 bg-destructive" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      {n.message && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* ─── Notifications Section ─── */}
      {(filter === 'all' || filter === 'notifications') && normalNotifs.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-primary" />
              مطلوب منك
              <Badge variant="secondary" className="text-[10px]">{normalNotifs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {normalNotifs.slice(0, 12).map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/20 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() => markRead.mutate(n.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0 h-5">{n.type || 'تنبيه'}</Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ─── Shipments Section ─── */}
      {(filter === 'all' || filter === 'shipments') && pendingShipments.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-primary" />
              شحنات تحتاج متابعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pendingShipments.map((s: any, i: number) => {
              const st = statusMap[s.status] || statusMap.pending;
              const StatusIcon = st.icon;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-3 hover:bg-primary/5 rounded-lg"
                    onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${st.className}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="text-right min-w-0">
                        <p className="text-sm font-semibold">{s.shipment_number}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.pickup_city && s.delivery_city ? `${s.pickup_city} → ${s.delivery_city}` : s.shipment_type || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${st.className}`}>{st.label}</Badge>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ─── Empty State ─── */}
      {totalTasks === 0 && (
        <Card className="border-border/30">
          <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-accent-foreground" />
            </div>
            <p className="font-semibold text-foreground">لا توجد مهام معلقة 🎉</p>
            <p className="text-sm mt-1">جميع مهامك مكتملة، أحسنت!</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Activity Timeline ─── */}
      {recentActivity.length > 0 && (
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-primary" />
              سجل نشاطاتك الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pr-4 border-r-2 border-primary/15 space-y-3">
              {recentActivity.slice(0, 6).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <div className="absolute -right-[1.35rem] top-1.5 w-2.5 h-2.5 rounded-full bg-primary/50 border-2 border-background" />
                  <p className="text-xs font-medium">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {a.resource_type && <span className="mr-2">• {a.resource_type}</span>}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTasksTab;
