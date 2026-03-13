import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListTodo, Clock, CheckCircle2, AlertCircle, Loader2, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  in_progress: { label: 'جاري التنفيذ', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: AlertCircle },
  completed: { label: 'مكتمل', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
};

const MyTasksTab = () => {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-workspace-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];
      
      // Get employee tasks
      const { data } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      return data || [];
    },
    enabled: !!user?.id && !!organization?.id,
    staleTime: 1000 * 60 * 2,
  });

  // Also get pending shipments assigned to this user
  const { data: pendingShipments = [] } = useQuery({
    queryKey: ['my-pending-shipments', user?.id],
    queryFn: async () => {
      if (!user?.id || !organization?.id) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, tracking_number, status, created_at, waste_type')
        .eq('organization_id', organization.id)
        .in('status', ['pending', 'confirmed', 'in_transit'])
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id && !!organization?.id,
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
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = tasks.filter(t => t.status === key).length;
          return (
            <Card key={key} className="border-border/30">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                  <config.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tasks list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="w-5 h-5 text-primary" />
            المهام المسندة إليّ
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mb-3 opacity-40" />
              <p>لا توجد مهام حالياً</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const status = statusConfig[task.status] || statusConfig.pending;
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <status.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending shipments */}
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
                    <span className="text-sm font-medium">{s.tracking_number}</span>
                    <span className="text-xs text-muted-foreground">{s.waste_type}</span>
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
