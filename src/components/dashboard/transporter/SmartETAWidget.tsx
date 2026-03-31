/**
 * ٨. ETA الذكي الحي — يتتبع الشحنات النشطة ويحسب وقت الوصول
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, MapPin, Truck, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ActiveShipmentETA {
  id: string;
  shipmentNumber: string;
  destination: string;
  driver: string;
  estimatedMinutes: number;
  status: 'on_time' | 'delayed' | 'critical';
  distance: number;
}

const SmartETAWidget = () => {
  const { organization } = useAuth();
  const [shipments, setShipments] = useState<ActiveShipmentETA[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveETAs = async () => {
    if (!organization?.id) return;
    try {
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, delivery_address, status, expected_delivery_date, in_transit_at, driver_id')
        .eq('transporter_id', organization.id)
        .in('status', ['in_transit', 'approved'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!data?.length) { setShipments([]); setLoading(false); return; }

      const driverIds = [...new Set(data.map(s => s.driver_id).filter(Boolean))] as string[];
      let driversMap: Record<string, string> = {};
      if (driverIds.length > 0) {
        const { data: drivers } = await supabase
          .from('drivers')
          .select('id, profile:profiles(full_name)')
          .in('id', driverIds);
        (drivers || []).forEach(d => {
          const p = Array.isArray(d.profile) ? d.profile[0] : d.profile;
          driversMap[d.id] = p?.full_name || 'سائق';
        });
      }

      const now = new Date();
      const etas: ActiveShipmentETA[] = data.map(s => {
        const expected = s.expected_delivery_date ? new Date(s.expected_delivery_date) : null;
        const started = s.in_transit_at ? new Date(s.in_transit_at) : null;

        let estimatedMinutes = 0;
        let etaStatus: 'on_time' | 'delayed' | 'critical' = 'on_time';

        if (expected) {
          estimatedMinutes = Math.max(0, Math.round((expected.getTime() - now.getTime()) / 60000));
          if (estimatedMinutes <= 0) etaStatus = 'critical';
          else if (estimatedMinutes < 30) etaStatus = 'delayed';
        } else if (started) {
          const elapsed = Math.round((now.getTime() - started.getTime()) / 60000);
          estimatedMinutes = Math.max(0, 120 - elapsed);
          if (elapsed > 180) etaStatus = 'critical';
          else if (elapsed > 120) etaStatus = 'delayed';
        } else {
          estimatedMinutes = 60;
        }

        // Estimate distance from remaining time (avg ~40 km/h in urban Egypt)
        const estimatedDistance = estimatedMinutes > 0 ? Math.round((estimatedMinutes / 60) * 40) : 0;

        return {
          id: s.id,
          shipmentNumber: s.shipment_number,
          destination: s.delivery_address || 'غير محدد',
          driver: s.driver_id ? (driversMap[s.driver_id] || 'غير معين') : 'غير معين',
          estimatedMinutes,
          status: etaStatus,
          distance: estimatedDistance,
        };
      });

      setShipments(etas);
    } catch (err) {
      console.error('ETA error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveETAs();
    const interval = setInterval(fetchActiveETAs, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [organization?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertTriangle className="h-3 w-3 text-destructive" />;
      case 'delayed': return <Clock className="h-3 w-3 text-amber-500" />;
      default: return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical': return 'متأخر';
      case 'delayed': return 'قريب';
      default: return 'في الوقت';
    }
  };

  const formatETA = (minutes: number) => {
    if (minutes <= 0) return 'وصلت/متأخرة';
    if (minutes < 60) return `${minutes} دقيقة`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} ساعة ${m > 0 ? `و ${m} دقيقة` : ''}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-primary" />
            وقت الوصول الذكي (ETA)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">تحديث تلقائي</Badge>
            <Button variant="ghost" size="sm" onClick={fetchActiveETAs} disabled={loading}>
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground animate-pulse py-3">جاري تحديث ETAs...</p>
        ) : shipments.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-3">لا توجد شحنات نشطة حالياً</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {shipments.map(s => (
              <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg border ${
                s.status === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                s.status === 'delayed' ? 'border-amber-500/30 bg-amber-500/5' :
                'border-border'
              }`}>
                {getStatusIcon(s.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium truncate">{s.shipmentNumber}</span>
                    <Badge variant="outline" className="text-[9px] shrink-0">{getStatusLabel(s.status)}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-2.5 w-2.5" />
                    <span className="truncate">{s.destination}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-bold text-foreground">{formatETA(s.estimatedMinutes)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.driver}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartETAWidget;
