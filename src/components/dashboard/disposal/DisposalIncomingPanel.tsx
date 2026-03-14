import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowDownToLine, CheckCircle2, Clock, Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface DisposalIncomingPanelProps {
  facilityId?: string | null;
}

const DisposalIncomingPanel = ({ facilityId }: DisposalIncomingPanelProps) => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch pending incoming requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['disposal-incoming-pending', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const { data, error } = await supabase
        .from('disposal_incoming_requests')
        .select(`
          *,
          requesting_organization:organizations!disposal_incoming_requests_requesting_organization_id_fkey(name)
        `)
        .eq('disposal_facility_id', facilityId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!facilityId,
    refetchInterval: 30_000,
  });

  // Fetch processing operations
  const { data: processingOps = [] } = useQuery({
    queryKey: ['disposal-processing-ops', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('disposal_operations')
        .select('id, operation_number, waste_type, quantity, unit, status, created_at')
        .eq('organization_id', organization.id)
        .eq('status', 'processing')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const handleAcceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('disposal_incoming_requests')
      .update({ status: 'accepted', reviewed_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error('حدث خطأ أثناء قبول الطلب');
      return;
    }

    // Audit log
    try {
      await supabase.from('activity_logs').insert({
        action: 'disposal_request_accepted',
        action_type: 'update',
        resource_type: 'disposal_incoming_request',
        resource_id: requestId,
        organization_id: organization?.id,
        details: { status: 'accepted' },
      });
    } catch (e) {
      console.error('Audit log error (non-blocking):', e);
    }

    toast.success('تم قبول طلب التخلص');
    queryClient.invalidateQueries({ queryKey: ['disposal-incoming-pending'] });
  };

  if (loadingRequests) {
    return (
      <Card>
        <CardHeader><CardTitle>الطلبات الواردة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  if (pendingRequests.length === 0 && processingOps.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Processing Operations */}
      {processingOps.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">{processingOps.length}</Badge>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="w-5 h-5 text-amber-600" />
                عمليات قيد المعالجة
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {processingOps.map((op: any) => (
              <div key={op.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => navigate(`/dashboard/disposal/operations`)}>
                  عرض
                </Button>
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 justify-end">
                    <Badge variant="outline" className="text-[10px]">{op.waste_type}</Badge>
                    <span className="font-medium text-sm">{op.operation_number || op.id.slice(0, 8)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {op.quantity} {op.unit} • {formatDistanceToNow(new Date(op.created_at), { locale: ar, addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Incoming Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-red-200 dark:border-red-800/40 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="text-xs">{pendingRequests.length} بانتظار الموافقة</Badge>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <ArrowDownToLine className="w-5 h-5 text-red-600" />
                طلبات تخلص واردة
              </CardTitle>
            </div>
            <CardDescription className="text-right">طلبات جديدة من الجهات المرتبطة تنتظر الموافقة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingRequests.map((request: any) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={
                    request.priority === 'urgent' ? 'destructive' :
                    request.priority === 'high' ? 'default' : 'secondary'
                  } className="text-xs">
                    {request.priority === 'urgent' ? 'عاجل' :
                     request.priority === 'high' ? 'مهم' : 'عادي'}
                  </Badge>
                  <Button size="sm" className="text-xs h-7" onClick={() => handleAcceptRequest(request.id)}>
                    <CheckCircle2 className="ml-1 h-3 w-3" />
                    قبول
                  </Button>
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-right flex-1">
                    <p className="font-medium text-sm">{request.waste_description || request.waste_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.requesting_organization?.name} • {request.estimated_quantity} {request.unit}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => navigate('/dashboard/disposal/incoming-requests')}
            >
              عرض جميع الطلبات
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DisposalIncomingPanel;
