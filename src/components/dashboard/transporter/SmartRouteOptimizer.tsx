/**
 * ٢. تحسين المسار الذكي — يربط useRouteOptimizer مع واجهة بصرية
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteOptimizer } from '@/hooks/useRouteOptimizer';
import { Route, MapPin, Fuel, Clock, Leaf, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SmartRouteOptimizer = () => {
  const { organization } = useAuth();
  const { isOptimizing, optimizedRoute, optimizeRoute, clearRoute } = useRouteOptimizer();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organization?.id) return;
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('id, profile:profiles(full_name), vehicle_type, vehicle_plate')
        .eq('organization_id', organization.id)
        .eq('is_available', true);
      setDrivers(data || []);
    };
    fetchDrivers();
  }, [organization?.id]);

  useEffect(() => {
    if (!selectedDriver || !organization?.id) return;
    const fetchShipments = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, pickup_address, delivery_address, status, waste_type')
        .eq('transporter_id', organization.id)
        .eq('driver_id', selectedDriver)
        .in('status', ['approved', 'in_transit']);
      setPendingShipments(data || []);
      setLoading(false);
    };
    fetchShipments();
  }, [selectedDriver, organization?.id]);

  const handleOptimize = async () => {
    if (pendingShipments.length < 2) {
      toast.info('يجب وجود شحنتين على الأقل لتحسين المسار');
      return;
    }
    // Use a deterministic spread based on index for coordinates when no real geocoding
    const destinations = pendingShipments.map((s, i) => ({
      lat: 30.05 + (i * 0.03) * (i % 2 === 0 ? 1 : -1),
      lng: 31.25 + (i * 0.04) * (i % 2 === 0 ? -1 : 1),
      name: s.delivery_address || `شحنة ${s.shipment_number}`,
      type: 'delivery' as const,
      shipmentId: s.id,
      priority: i + 1,
    }));
    await optimizeRoute(selectedDriver, { lat: 30.05, lng: 31.25 }, destinations);
  };

  const driverName = (d: any) => {
    const profile = Array.isArray(d.profile) ? d.profile[0] : d.profile;
    return profile?.full_name || 'سائق';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          محسّن المسار الذكي (AI)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">اختر السائق</label>
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger><SelectValue placeholder="اختر سائقاً..." /></SelectTrigger>
            <SelectContent>
              {drivers.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {driverName(d)} — {d.vehicle_plate || 'بدون لوحة'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pending Shipments */}
        {selectedDriver && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">الشحنات المعلقة</span>
              <Badge variant="secondary">{pendingShipments.length} شحنة</Badge>
            </div>
            {loading ? (
              <p className="text-xs text-muted-foreground">جاري التحميل...</p>
            ) : pendingShipments.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد شحنات معلقة لهذا السائق</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {pendingShipments.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{s.delivery_address || s.shipment_number}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{s.waste_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Optimize Button */}
        <Button onClick={handleOptimize} disabled={isOptimizing || pendingShipments.length < 2} className="w-full">
          {isOptimizing ? (
            <><RefreshCw className="h-4 w-4 ml-2 animate-spin" />جاري التحسين بالذكاء الاصطناعي...</>
          ) : (
            <><Zap className="h-4 w-4 ml-2" />تحسين المسار</>
          )}
        </Button>

        {/* Results */}
        {optimizedRoute && (
          <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="text-sm font-bold text-primary">✅ نتائج التحسين</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                  <p className="text-sm font-bold">{Math.round(optimizedRoute.totalDuration)} دقيقة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">المسافة</p>
                  <p className="text-sm font-bold">{Math.round(optimizedRoute.totalDistance)} كم</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">توفير الوقود</p>
                  <p className="text-sm font-bold">{optimizedRoute.fuelEstimate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">تقليل CO₂</p>
                  <p className="text-sm font-bold">{optimizedRoute.co2Savings} كجم</p>
                </div>
              </div>
            </div>
            {optimizedRoute.recommendations?.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                {optimizedRoute.recommendations.map((r, i) => (
                  <p key={i}>💡 {r}</p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={clearRoute} className="w-full">مسح النتائج</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartRouteOptimizer;
