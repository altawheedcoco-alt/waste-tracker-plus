import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Clock, ExternalLink, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import ShipmentTimeline from '@/components/shipments/ShipmentTimeline';

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'تمت الموافقة',
  collection_started: 'بدأ التجميع',
  in_transit: 'قيد النقل',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  approved: 'bg-amber-100 text-amber-800',
  collection_started: 'bg-orange-100 text-orange-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  confirmed: 'bg-green-100 text-green-800',
};

const AdminActiveTracking = () => {
  const navigate = useNavigate();

  const { data: activeShipments = [], isLoading } = useQuery({
    queryKey: ['admin-active-tracking'],
    queryFn: async () => {
      const activeStatuses = ['approved', 'collecting', 'in_transit'] as const;
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, status, created_at, approved_at, collection_started_at, in_transit_at, delivered_at, confirmed_at, expected_delivery_date, delivery_address, transporter_id, generator_id, driver_id')
        .in('status', activeStatuses)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (!shipments?.length) return [];

      // Fetch org names
      const orgIds = new Set<string>();
      shipments.forEach(s => {
        if (s.transporter_id) orgIds.add(s.transporter_id);
        if (s.generator_id) orgIds.add(s.generator_id);
      });
      const orgMap = new Map<string, string>();
      if (orgIds.size > 0) {
        const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', Array.from(orgIds));
        orgs?.forEach(o => orgMap.set(o.id, o.name));
      }

      // Fetch driver info
      const driverIds = [...new Set(shipments.map(s => s.driver_id).filter(Boolean))] as string[];
      const driverMap = new Map<string, { name: string; plate: string | null }>();
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, vehicle_plate, profile:profiles(full_name)')
          .in('id', driverIds);
        drivers?.forEach(d => {
          const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
          driverMap.set(d.id, { name: profile?.full_name || 'غير معروف', plate: d.vehicle_plate });
        });
      }

      return shipments.map(s => ({
        ...s,
        transporter_name: s.transporter_id ? orgMap.get(s.transporter_id) || 'غير معروف' : 'غير معين',
        generator_name: s.generator_id ? orgMap.get(s.generator_id) || 'غير معروف' : 'غير معين',
        driver: s.driver_id ? driverMap.get(s.driver_id) || null : null,
      }));
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Navigation className="w-5 h-5" /> تتبع جميع الشحنات النشطة</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  if (activeShipments.length === 0) return null;

  return (
    <Card className="border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')} className="text-xs">
            عرض الكل
            <ExternalLink className="mr-1 h-3 w-3" />
          </Button>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Navigation className="w-5 h-5 text-purple-600" />
            تتبع جميع الشحنات النشطة
          </CardTitle>
        </div>
        <CardDescription className="text-right">{activeShipments.length} شحنات نشطة عبر جميع الجهات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {activeShipments.map((shipment) => (
          <div
            key={shipment.id}
            className="p-2.5 sm:p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <Badge className={`text-[10px] shrink-0 ${statusColors[shipment.status] || ''}`}>
                {statusLabels[shipment.status] || shipment.status}
              </Badge>
              <div className="text-right min-w-0">
                <span className="font-semibold text-xs sm:text-sm">{shipment.shipment_number}</span>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{shipment.waste_type} • {shipment.quantity} {shipment.unit}</p>
              </div>
            </div>

            <div className="my-2">
              <ShipmentTimeline shipment={shipment} compact />
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between text-[10px] sm:text-xs text-muted-foreground mt-2 gap-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{shipment.expected_delivery_date
                  ? formatDistanceToNow(new Date(shipment.expected_delivery_date), { locale: ar, addSuffix: true })
                  : 'غير محدد'}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                {shipment.driver && (
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[80px] sm:max-w-none">{shipment.driver.name}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-none">{shipment.transporter_name}</span>
                </span>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-right mt-1 truncate">
              المولّد: {shipment.generator_name}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminActiveTracking;
