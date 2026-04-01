/**
 * لوحة إرسال الشحنات للسائقين المستقلين (نموذج أوبر/ديدي)
 * الناقل يختار شحنة ويطلب سائق مستقل
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Send, MapPin, Package, Truck, Users, Zap,
  Loader2, Search, Clock, DollarSign, Navigation,
  Radio, CheckCircle2, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NearbyDriversRadar from '@/components/maps/NearbyDriversRadar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DispatchToDriverPanel = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const qc = useQueryClient();
  const [dispatchDialog, setDispatchDialog] = useState<any>(null);
  const [offeredPrice, setOfferedPrice] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'smart' | 'broadcast' | 'manual'>('smart');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch approved shipments without driver assigned
  const { data: unassignedShipments = [], isLoading: loadingShipments } = useQuery({
    queryKey: ['unassigned-shipments', orgId],
    enabled: !!orgId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, waste_type, quantity, unit, pickup_address, delivery_address, created_at, status, price_per_unit, actual_weight')
        .eq('transporter_id', orgId!)
        .is('driver_id', null)
        .in('status', ['approved', 'new'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active offers sent by this transporter
  const { data: activeOffers = [] } = useQuery({
    queryKey: ['transporter-active-offers', orgId],
    enabled: !!orgId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_mission_offers')
        .select(`
          id, shipment_id, driver_id, offered_price, status, created_at, expires_at, distance_km,
          driver:driver_id(id, license_number, vehicle_plate, rating, total_trips)
        `)
        .eq('offered_by_org_id', orgId!)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch bids from drivers on our shipments
  const { data: driverBids = [] } = useQuery({
    queryKey: ['driver-bids-on-our-shipments', orgId],
    enabled: !!orgId,
    refetchInterval: 15_000,
    queryFn: async () => {
      // Get our shipment IDs first
      const shipmentIds = unassignedShipments.map(s => s.id);
      if (shipmentIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('driver_shipment_bids')
        .select(`
          id, shipment_id, driver_id, bid_amount, estimated_arrival_minutes, note, status, created_at,
          driver:driver_id(id, license_number, vehicle_plate, rating, total_trips)
        `)
        .in('shipment_id', shipmentIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Smart dispatch mutation - sends to nearest available drivers
  const dispatchMutation = useMutation({
    mutationFn: async ({ shipmentId, price, mode }: { shipmentId: string; price: number; mode: string }) => {
      // Get available independent drivers (verified, not bound to any org)
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_plate, rating')
        .eq('driver_type', 'independent')
        .eq('is_available', true)
        .eq('is_verified', true)
        .is('organization_id', null)
        .limit(mode === 'smart' ? 5 : 20);

      if (driversError) throw driversError;
      if (!drivers?.length) throw new Error('لا يوجد سائقون متاحون حالياً');

      // Create mission offers for each driver
      const offers = drivers.map(driver => ({
        shipment_id: shipmentId,
        driver_id: driver.id,
        offered_by_org_id: orgId!,
        offered_price: price,
        offer_type: mode === 'smart' ? 'smart_dispatch' : 'broadcast',
        status: 'pending',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
      }));

      const { error } = await supabase
        .from('driver_mission_offers')
        .insert(offers);

      if (error) throw error;
      return { driversNotified: drivers.length };
    },
    onSuccess: (result) => {
      toast.success(`تم إرسال الطلب لـ ${result.driversNotified} سائق`, {
        description: 'سيتم إشعارك فور قبول أحدهم',
      });
      qc.invalidateQueries({ queryKey: ['unassigned-shipments'] });
      qc.invalidateQueries({ queryKey: ['transporter-active-offers'] });
      setDispatchDialog(null);
      setOfferedPrice('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'فشل في إرسال الطلب');
    },
  });

  // Accept a driver's bid
  const acceptBidMutation = useMutation({
    mutationFn: async ({ bidId, shipmentId, driverId }: { bidId: string; shipmentId: string; driverId: string }) => {
      // Verify driver is independent (prevent assigning company drivers from other orgs)
      const { data: driverCheck } = await supabase
        .from('drivers')
        .select('id, driver_type, organization_id')
        .eq('id', driverId)
        .single();
      
      if (!driverCheck) throw new Error('السائق غير موجود');
      if (driverCheck.driver_type !== 'independent') {
        throw new Error('لا يمكن قبول عرض من سائق تابع لجهة أخرى');
      }

      // Accept the bid
      const { error: bidError } = await supabase
        .from('driver_shipment_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);
      if (bidError) throw bidError;

      // Assign driver to shipment — only if it belongs to this transporter
      const { error: shipError } = await supabase
        .from('shipments')
        .update({ driver_id: driverId, status: 'approved' })
        .eq('id', shipmentId)
        .eq('transporter_id', orgId!);
      if (shipError) throw shipError;

      // Reject other bids on same shipment
      await supabase
        .from('driver_shipment_bids')
        .update({ status: 'rejected' })
        .eq('shipment_id', shipmentId)
        .neq('id', bidId);
    },
    onSuccess: () => {
      toast.success('تم قبول عرض السائق وتعيينه');
      qc.invalidateQueries({ queryKey: ['driver-bids-on-our-shipments'] });
      qc.invalidateQueries({ queryKey: ['unassigned-shipments'] });
    },
    onError: () => toast.error('فشل في قبول العرض'),
  });

  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: string) => {
      const { error } = await supabase
        .from('driver_shipment_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.info('تم رفض العرض');
      qc.invalidateQueries({ queryKey: ['driver-bids-on-our-shipments'] });
    },
  });

  const filteredShipments = unassignedShipments.filter((s: any) => {
    if (!searchQuery) return true;
    return (s.shipment_number || '').includes(searchQuery) ||
      (s.pickup_address || '').includes(searchQuery) ||
      (s.waste_type || '').includes(searchQuery);
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Nearby Drivers Radar Map */}
      <ErrorBoundary fallbackTitle="خطأ في رادار السائقين">
        <NearbyDriversRadar pickupLat={30.0444} pickupLng={31.2357} />
      </ErrorBoundary>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            طلب سائق مستقل
          </h2>
          <p className="text-xs text-muted-foreground">أرسل طلبات نقل للسائقين المستقلين — نموذج أوبر</p>
        </div>
        <div className="flex items-center gap-2">
          {activeOffers.length > 0 && (
            <Badge variant="secondary" className="animate-pulse gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {activeOffers.length} عرض نشط
            </Badge>
          )}
          {driverBids.length > 0 && (
            <Badge variant="default" className="animate-pulse gap-1">
              <Zap className="w-3 h-3" />
              {driverBids.length} عرض وارد
            </Badge>
          )}
        </div>
      </div>

      {/* Driver Bids Section */}
      {driverBids.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              عروض واردة من سائقين ({driverBids.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence>
              {driverBids.map((bid: any) => (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => acceptBidMutation.mutate({
                        bidId: bid.id,
                        shipmentId: bid.shipment_id,
                        driverId: bid.driver_id,
                      })}
                      disabled={acceptBidMutation.isPending}
                    >
                      <CheckCircle2 className="w-3 h-3" /> قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs gap-1"
                      onClick={() => rejectBidMutation.mutate(bid.id)}
                      disabled={rejectBidMutation.isPending}
                    >
                      <XCircle className="w-3 h-3" /> رفض
                    </Button>
                  </div>
                  <div className="text-right flex-1">
                    <div className="flex items-center gap-2 justify-end">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <DollarSign className="w-3 h-3" />
                        {bid.bid_amount} ج.م
                      </Badge>
                      {bid.estimated_arrival_minutes && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Clock className="w-3 h-3" />
                          {bid.estimated_arrival_minutes} دقيقة
                        </Badge>
                      )}
                      <span className="text-sm font-medium">
                        🚛 {(bid.driver as any)?.vehicle_plate || 'سائق'}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      تقييم: ⭐ {(bid.driver as any)?.rating?.toFixed(1) || '—'} • رحلات: {(bid.driver as any)?.total_trips || 0}
                      {bid.note && ` • "${bid.note}"`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث بالرقم أو العنوان..."
          className="pr-9 text-sm"
        />
      </div>

      {/* Unassigned Shipments */}
      {loadingShipments ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filteredShipments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-semibold text-sm mb-1">لا توجد شحنات بدون سائق</h3>
            <p className="text-xs text-muted-foreground">كل الشحنات مُعيّن لها سائقون</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredShipments.map((shipment: any) => {
            const hasPendingOffers = activeOffers.some((o: any) => o.shipment_id === shipment.id);
            const bidCount = driverBids.filter((b: any) => b.shipment_id === shipment.id).length;

            return (
              <Card key={shipment.id} className={`border ${hasPendingOffers ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/50'}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {hasPendingOffers ? (
                        <Badge variant="secondary" className="text-[10px] gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" /> بانتظار الرد
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setDispatchDialog(shipment)}
                        >
                          <Send className="w-3 h-3" /> اطلب سائق
                        </Button>
                      )}
                      {bidCount > 0 && (
                        <Badge variant="default" className="text-[10px]">
                          {bidCount} عرض
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Badge variant="outline" className="text-[10px]">{shipment.waste_type}</Badge>
                        <span className="text-sm font-medium">{shipment.shipment_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground truncate">{shipment.pickup_address || 'موقع الاستلام'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground truncate">{shipment.delivery_address || 'موقع التسليم'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>{shipment.quantity} {shipment.unit}</span>
                    {shipment.price_per_unit > 0 && <span>{shipment.price_per_unit} ج.م/طن</span>}
                    <span>{format(new Date(shipment.created_at), 'dd MMM', { locale: ar })}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dispatch Dialog */}
      <Dialog open={!!dispatchDialog} onOpenChange={() => setDispatchDialog(null)}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="w-5 h-5 text-primary" />
              طلب سائق مستقل
            </DialogTitle>
          </DialogHeader>

          {dispatchDialog && (
            <div className="space-y-4 py-2">
              {/* Shipment info */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{dispatchDialog.waste_type}</Badge>
                  <span className="text-sm font-bold">{dispatchDialog.shipment_number}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span className="truncate">{dispatchDialog.pickup_address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Navigation className="w-3 h-3 text-red-500" />
                  <span className="truncate">{dispatchDialog.delivery_address}</span>
                </div>
              </div>

              {/* Dispatch mode */}
              <div>
                <Label className="text-sm font-medium">نوع الإرسال</Label>
                <Select value={dispatchMode} onValueChange={(v: any) => setDispatchMode(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smart">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        توزيع ذكي (أقرب 5 سائقين)
                      </span>
                    </SelectItem>
                    <SelectItem value="broadcast">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-primary" />
                        بث عام (كل المتاحين)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price */}
              <div>
                <Label className="text-sm font-medium">السعر المعروض (ج.م) *</Label>
                <Input
                  type="number"
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  placeholder="مثال: 500"
                  className="mt-1"
                  min="1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  السعر الذي ستدفعه للسائق مقابل هذه الرحلة
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDispatchDialog(null)}>إلغاء</Button>
            <Button
              onClick={() => {
                if (!offeredPrice || !dispatchDialog) return;
                dispatchMutation.mutate({
                  shipmentId: dispatchDialog.id,
                  price: parseFloat(offeredPrice),
                  mode: dispatchMode,
                });
              }}
              disabled={!offeredPrice || parseFloat(offeredPrice) <= 0 || dispatchMutation.isPending}
              className="gap-1.5"
            >
              {dispatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchToDriverPanel;
