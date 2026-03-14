import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Clock, ExternalLink, ArrowDownToLine, Package, CheckCircle2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import ShipmentTimeline from '@/components/shipments/ShipmentTimeline';
import QuickCertificateButton from '@/components/reports/QuickCertificateButton';
import { ShipmentsRepository } from '@/repositories/ShipmentsRepository';

const RecyclerIncomingPanel = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const { data: incoming = [], isLoading } = useQuery({
    queryKey: ['recycler-incoming', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const incomingStatuses = ['approved', 'collecting', 'in_transit'] as const;
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, created_at, approved_at, in_transit_at, expected_delivery_date, pickup_address, generator_id, transporter_id, driver_id')
        .eq('recycler_id', orgId)
        .in('status', incomingStatuses)
        .order('expected_delivery_date', { ascending: true, nullsFirst: false })
        .limit(8);

      if (error) throw error;
      if (!shipments?.length) return [];

      // Fetch org names
      const allOrgIds = [...new Set([
        ...shipments.map(s => s.generator_id),
        ...shipments.map(s => s.transporter_id),
      ].filter(Boolean))] as string[];

      const orgMap = new Map<string, string>();
      if (allOrgIds.length > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', allOrgIds);
        orgs?.forEach(o => orgMap.set(o.id, o.name));
      }

      return shipments.map(s => ({
        ...s,
        generator_name: s.generator_id ? orgMap.get(s.generator_id) || 'غير معروف' : 'غير معروف',
        transporter_name: s.transporter_id ? orgMap.get(s.transporter_id) || 'غير معين' : 'غير معين',
      }));
    },
    enabled: !!orgId,
    refetchInterval: 30_000,
  });

  // Also fetch recently delivered (awaiting confirmation)
  const { data: awaitingConfirmation = [] } = useQuery({
    queryKey: ['recycler-awaiting-confirm', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, delivered_at, generator_id')
        .eq('recycler_id', orgId)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!data?.length) return [];

      const genIds = [...new Set(data.map(s => s.generator_id).filter(Boolean))] as string[];
      const genMap = new Map<string, string>();
      if (genIds.length > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', genIds);
        orgs?.forEach(o => genMap.set(o.id, o.name));
      }

      return data.map(s => ({
        ...s,
        generator_name: s.generator_id ? genMap.get(s.generator_id) || 'غير معروف' : 'غير معروف',
      }));
    },
    enabled: !!orgId,
  });

  const handleConfirm = async (id: string) => {
    const { error } = await supabase
      .from('shipments')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('حدث خطأ أثناء تأكيد الاستلام');
      return;
    }
    toast.success('تم تأكيد استلام الشحنة');
    queryClient.invalidateQueries({ queryKey: ['recycler-incoming'] });
    queryClient.invalidateQueries({ queryKey: ['recycler-awaiting-confirm'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>الشحنات القادمة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  if (incoming.length === 0 && awaitingConfirmation.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Awaiting Confirmation - highest priority */}
      {awaitingConfirmation.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="destructive" className="text-xs">{awaitingConfirmation.length}</Badge>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                بانتظار تأكيد الاستلام
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {awaitingConfirmation.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
                <div className="flex items-center gap-1">
                  <QuickCertificateButton
                    shipment={{ id: s.id, shipment_number: s.shipment_number, waste_type: s.waste_type, quantity: s.quantity, unit: s.unit }}
                    variant="ghost"
                    size="sm"
                    showLabel={false}
                  />
                  <Button size="sm" className="text-xs h-7" onClick={() => handleConfirm(s.id)}>
                    <CheckCircle2 className="ml-1 h-3 w-3" />
                    تأكيد الاستلام
                  </Button>
                </div>
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 justify-end">
                    <Badge variant="outline" className="text-[10px]">{s.waste_type}</Badge>
                    <span className="font-medium text-sm">{s.shipment_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.generator_name} • {s.quantity} {s.unit}
                    {s.delivered_at && ` • وصلت ${formatDistanceToNow(new Date(s.delivered_at), { locale: ar, addSuffix: true })}`}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Incoming Shipments */}
      {incoming.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge className="text-xs bg-blue-100 text-blue-800">{incoming.length} في الطريق</Badge>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <ArrowDownToLine className="w-5 h-5 text-blue-600" />
                شحنات قادمة إليك
              </CardTitle>
            </div>
            <CardDescription className="text-right">شحنات في طريقها إلى منشأتك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {incoming.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/shipments/${s.id}`)}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {s.expected_delivery_date
                      ? `متوقع ${format(new Date(s.expected_delivery_date), 'dd MMM', { locale: ar })}`
                      : 'غير محدد'}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant={s.status === 'in_transit' ? 'default' : 'outline'} className="text-[10px]">
                        {s.status === 'in_transit' ? 'قيد النقل' : s.status === 'approved' ? 'تمت الموافقة' : 'بدأ التجميع'}
                      </Badge>
                      <span className="font-medium text-sm">{s.shipment_number}</span>
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      من: {s.generator_name} • نقل: {s.transporter_name}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <ShipmentTimeline shipment={s} compact />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-right">
                  {s.waste_type} • {s.quantity} {s.unit}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecyclerIncomingPanel;
