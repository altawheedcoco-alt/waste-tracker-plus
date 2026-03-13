import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo, Clock, CheckCircle2, AlertCircle, Loader2, Inbox, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MyTasksTab = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  // Get pending shipments for this org
  const { data: pendingShipments = [], isLoading } = useQuery({
    queryKey: ['my-pending-shipments', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, created_at, shipment_type')
        .eq('organization_id', organization.id)
        .in('status', ['confirmed', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Get notifications as tasks proxy
  const { data: recentNotifications = [] } = useQuery({
    queryKey: ['my-task-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at, type')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(15);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingShipments.length}</p>
              <p className="text-xs text-muted-foreground">شحنات نشطة</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentNotifications.length}</p>
              <p className="text-xs text-muted-foreground">تنبيهات معلقة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending notifications as tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="w-5 h-5 text-primary" />
            مطلوب منك
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mb-3 opacity-40" />
              <p>لا توجد مهام معلقة حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{n.type || 'تنبيه'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active shipments */}
      {pendingShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">شحنات تحتاج متابعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingShipments.map(s => (
                <Button
                  key={s.id}
                  variant="ghost"
                  className="w-full justify-between h-auto py-3 px-4"
                  onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{s.shipment_number}</span>
                    <span className="text-xs text-muted-foreground">{s.shipment_type}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{s.status}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyTasksTab;
