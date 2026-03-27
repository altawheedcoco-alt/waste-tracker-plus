import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Inbox, Check, X, Clock, ExternalLink, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import IdempotentButton from '@/components/ui/IdempotentButton';

interface IncomingRequest {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  pickup_address: string;
  generator_name: string;
}

const TransporterIncomingRequests = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['transporter-incoming-requests', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data: shipments } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, created_at, pickup_address, generator_id')
        .eq('transporter_id', orgId)
        .eq('status', 'new')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!shipments?.length) return [];

      const generatorIds = [...new Set(shipments.map(s => s.generator_id).filter(Boolean))];
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', generatorIds as string[]);

      const orgMap = new Map((orgs || []).map(o => [o.id, o.name]));

      return shipments.map(s => ({
        id: s.id,
        shipment_number: s.shipment_number,
        waste_type: s.waste_type,
        quantity: s.quantity,
        unit: s.unit,
        created_at: s.created_at,
        pickup_address: s.pickup_address,
        generator_name: s.generator_id ? orgMap.get(s.generator_id) || 'غير معروف' : 'غير معروف',
      }));
    },
    enabled: !!orgId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const handleAccept = async (id: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء قبول الشحنة');
      throw error;
    }
    toast.success('تم قبول الشحنة');
    queryClient.invalidateQueries({ queryKey: ['transporter-incoming-requests'] });
    queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
    queryClient.invalidateQueries({ queryKey: ['transporter-stats'] });
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء رفض الشحنة');
      return;
    }
    toast.success('تم رفض الشحنة');
    queryClient.invalidateQueries({ queryKey: ['transporter-incoming-requests'] });
    queryClient.invalidateQueries({ queryKey: ['transporter-shipments'] });
    queryClient.invalidateQueries({ queryKey: ['transporter-stats'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>طلبات واردة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-20 w-full" /></CardContent>
      </Card>
    );
  }

  if (requests.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="default" className="text-xs">{requests.length} جديدة</Badge>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Inbox className="w-5 h-5 text-primary" />
            طلبات شحن واردة
          </CardTitle>
        </div>
        <CardDescription className="text-right">شحنات جديدة تنتظر موافقتك</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-2">
              <IdempotentButton
                actionType="accept_shipment"
                resourceType="shipment"
                resourceId={req.id}
                actionValue="approved"
                variant="default"
                size="sm"
                className="text-xs h-7"
                onExecute={() => handleAccept(req.id)}
                duplicateMessage="تم قبول هذه الشحنة مسبقاً"
                executedLabel="تم القبول"
              >
                <Check className="ml-1 h-3 w-3" />
                قبول
              </IdempotentButton>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleReject(req.id)}
              >
                <X className="ml-1 h-3 w-3" />
                رفض
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => navigate(`/dashboard/shipments/${req.id}`)}
              >
                <ExternalLink className="ml-1 h-3 w-3" />
                تفاصيل
              </Button>
            </div>
            <div className="text-right flex-1">
              <div className="flex items-center gap-2 justify-end">
                <Badge variant="outline" className="text-[10px]">{req.waste_type}</Badge>
                <span className="font-medium text-sm">{req.shipment_number}</span>
                <Package className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {req.generator_name} • {req.quantity} {req.unit}
                {req.created_at && ` • ${format(new Date(req.created_at), 'dd MMM', { locale: ar })}`}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TransporterIncomingRequests;
