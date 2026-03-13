import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo, Clock, AlertCircle, Loader2, Inbox, Package, ChevronLeft, Bell, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'مؤكدة', className: 'bg-primary/10 text-primary border-primary/20' },
  in_transit: { label: 'في الطريق', className: 'bg-secondary text-secondary-foreground' },
  pending: { label: 'معلقة', className: 'bg-muted text-muted-foreground' },
};

const MyTasksTab = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const { data: pendingShipments = [], isLoading } = useQuery({
    queryKey: ['my-pending-shipments', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];
      const { data } = await (supabase.from('shipments') as any)
        .select('id, shipment_number, status, created_at, shipment_type, pickup_city, delivery_city')
        .eq('organization_id', organization.id)
        .in('status', ['confirmed', 'in_transit'])
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
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Recent activity
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const urgentNotifs = recentNotifications.filter(n => n.priority === 'urgent' || n.priority === 'high');
  const normalNotifs = recentNotifications.filter(n => n.priority !== 'urgent' && n.priority !== 'high');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto" />
            <p className="text-2xl font-bold mt-2">{pendingShipments.length}</p>
            <p className="text-[11px] text-muted-foreground">شحنات نشطة</p>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-destructive mx-auto" />
            <p className="text-2xl font-bold mt-2">{urgentNotifs.length}</p>
            <p className="text-[11px] text-muted-foreground">تنبيهات عاجلة</p>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <Bell className="w-6 h-6 text-muted-foreground mx-auto" />
            <p className="text-2xl font-bold mt-2">{normalNotifs.length}</p>
            <p className="text-[11px] text-muted-foreground">تنبيهات عادية</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent alerts */}
      {urgentNotifs.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertCircle className="w-5 h-5" />
              تنبيهات عاجلة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentNotifs.map(n => (
              <div key={n.id} className="p-3 rounded-xl bg-card border border-destructive/20">
                <p className="text-sm font-semibold">{n.title}</p>
                {n.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="w-5 h-5 text-primary" />
            مطلوب منك
            {recentNotifications.length > 0 && (
              <Badge variant="secondary" className="text-xs">{recentNotifications.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {normalNotifs.length === 0 && urgentNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Inbox className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">لا توجد مهام معلقة 🎉</p>
            </div>
          ) : (
            <div className="space-y-2">
              {normalNotifs.slice(0, 10).map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{n.type || 'تنبيه'}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active shipments */}
      {pendingShipments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary" />
              شحنات تحتاج متابعة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingShipments.map((s: any, i: number) => {
              const st = statusMap[s.status] || statusMap.pending;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-3 px-4 hover:bg-primary/5"
                    onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-right min-w-0">
                        <p className="text-sm font-semibold">{s.shipment_number}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {s.pickup_city && s.delivery_city ? `${s.pickup_city} → ${s.delivery_city}` : s.shipment_type || ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] ${st.className}`}>{st.label}</Badge>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent activity timeline */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              آخر نشاطاتك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pr-4 border-r-2 border-border/40 space-y-4">
              {recentActivity.slice(0, 6).map((a, i) => (
                <div key={a.id} className="relative">
                  <div className="absolute -right-[1.35rem] top-1 w-2.5 h-2.5 rounded-full bg-primary/60 border-2 border-background" />
                  <p className="text-sm">{a.action}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {a.resource_type && <span className="mr-2">• {a.resource_type}</span>}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTasksTab;
