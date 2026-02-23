import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search, MapPin, Navigation, ExternalLink, Loader2, LocateFixed,
  Truck, ArrowDown, Clock, Route, Play, RotateCcw, MapPinned, Copy, ArrowLeftRight
} from 'lucide-react';
import { geocodeAddress, fetchRoadRoute, formatDistance, formatDuration, calculateHaversineDistance } from '@/lib/mapUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DEFAULT_LAT = 30.0444;
const DEFAULT_LNG = 31.2357;
const DEFAULT_ZOOM = 12;

interface ShipmentOption {
  id: string;
  pickup_address: string | null;
  delivery_address: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  status: string | null;
  waste_type: string | null;
  quantity: number | null;
  unit: string | null;
  created_at: string | null;
}

interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: [number, number][];
}

const WazeLiveMap = () => {
  const { user } = useAuth();
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState('القاهرة، مصر');

  // Shipment route fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [activeView, setActiveView] = useState<'pickup' | 'delivery' | 'route'>('pickup');

  // Shipment selector
  const [shipments, setShipments] = useState<ShipmentOption[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentOption | null>(null);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [shipmentSearch, setShipmentSearch] = useState('');

  // Build Waze iframe URL based on active view
  const getWazeUrl = () => {
    if (activeView === 'route' && pickupCoords && deliveryCoords) {
      const midLat = (pickupCoords.lat + deliveryCoords.lat) / 2;
      const midLng = (pickupCoords.lng + deliveryCoords.lng) / 2;
      const dist = calculateHaversineDistance(pickupCoords.lat, pickupCoords.lng, deliveryCoords.lat, deliveryCoords.lng);
      const z = dist > 200 ? 7 : dist > 100 ? 8 : dist > 50 ? 9 : dist > 20 ? 10 : 12;
      return `https://embed.waze.com/iframe?zoom=${z}&lat=${midLat}&lon=${midLng}&ct=livemap&pin=1`;
    }
    if (activeView === 'delivery' && deliveryCoords) {
      return `https://embed.waze.com/iframe?zoom=14&lat=${deliveryCoords.lat}&lon=${deliveryCoords.lng}&ct=livemap&pin=1`;
    }
    if (activeView === 'pickup' && pickupCoords) {
      return `https://embed.waze.com/iframe?zoom=14&lat=${pickupCoords.lat}&lon=${pickupCoords.lng}&ct=livemap&pin=1`;
    }
    return `https://embed.waze.com/iframe?zoom=${zoom}&lat=${lat}&lon=${lng}&ct=livemap`;
  };

  // Load recent shipments
  useEffect(() => {
    if (!user) return;
    const loadShipments = async () => {
      setLoadingShipments(true);
      const { data } = await supabase
        .from('shipments')
        .select('id, pickup_address, delivery_address, pickup_latitude, pickup_longitude, delivery_latitude, delivery_longitude, status, waste_type, quantity, unit, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setShipments(data as ShipmentOption[]);
      setLoadingShipments(false);
    };
    loadShipments();
  }, [user]);

  // Load shipment into fields
  const loadShipment = useCallback((shipment: ShipmentOption) => {
    setSelectedShipment(shipment);
    setPickupAddress(shipment.pickup_address || '');
    setDeliveryAddress(shipment.delivery_address || '');

    if (shipment.pickup_latitude && shipment.pickup_longitude) {
      setPickupCoords({ lat: shipment.pickup_latitude, lng: shipment.pickup_longitude });
    } else {
      setPickupCoords(null);
    }

    if (shipment.delivery_latitude && shipment.delivery_longitude) {
      setDeliveryCoords({ lat: shipment.delivery_latitude, lng: shipment.delivery_longitude });
    } else {
      setDeliveryCoords(null);
    }

    setRouteInfo(null);

    // Center map on pickup
    if (shipment.pickup_latitude && shipment.pickup_longitude) {
      setLat(shipment.pickup_latitude);
      setLng(shipment.pickup_longitude);
      setZoom(13);
      setActiveView('pickup');
    }

    toast.success('تم تحميل بيانات الشحنة');
  }, []);

  // Search & set pickup
  const searchPickup = useCallback(async () => {
    if (!pickupAddress.trim()) return;
    setSearching(true);
    const result = await geocodeAddress(pickupAddress);
    if (result.success) {
      setPickupCoords({ lat: result.lat, lng: result.lng });
      setPickupAddress(result.displayName || pickupAddress);
      setLat(result.lat);
      setLng(result.lng);
      setZoom(14);
      setActiveView('pickup');
      toast.success('تم تحديد نقطة الاستلام');
    } else {
      toast.error('لم يتم العثور على العنوان');
    }
    setSearching(false);
  }, [pickupAddress]);

  // Search & set delivery
  const searchDelivery = useCallback(async () => {
    if (!deliveryAddress.trim()) return;
    setSearching(true);
    const result = await geocodeAddress(deliveryAddress);
    if (result.success) {
      setDeliveryCoords({ lat: result.lat, lng: result.lng });
      setDeliveryAddress(result.displayName || deliveryAddress);
      setLat(result.lat);
      setLng(result.lng);
      setZoom(14);
      setActiveView('delivery');
      toast.success('تم تحديد نقطة التسليم');
    } else {
      toast.error('لم يتم العثور على العنوان');
    }
    setSearching(false);
  }, [deliveryAddress]);

  // Calculate route
  const calculateRoute = useCallback(async () => {
    if (!pickupCoords || !deliveryCoords) {
      toast.error('يرجى تحديد نقطتي الاستلام والتسليم أولاً');
      return;
    }
    setLoadingRoute(true);
    const result = await fetchRoadRoute(pickupCoords, deliveryCoords);
    setRouteInfo({
      distance: result.distance,
      duration: result.duration,
      coordinates: result.coordinates,
    });
    setActiveView('route');
    setLoadingRoute(false);
    toast.success('تم حساب المسار بنجاح');
  }, [pickupCoords, deliveryCoords]);

  // Swap pickup/delivery
  const swapLocations = () => {
    const tmpAddr = pickupAddress;
    const tmpCoords = pickupCoords;
    setPickupAddress(deliveryAddress);
    setPickupCoords(deliveryCoords);
    setDeliveryAddress(tmpAddr);
    setDeliveryCoords(tmpCoords);
    setRouteInfo(null);
  };

  // Open in external apps
  const openInWaze = () => {
    if (pickupCoords && deliveryCoords) {
      window.open(`https://waze.com/ul?ll=${deliveryCoords.lat},${deliveryCoords.lng}&navigate=yes&from=${pickupCoords.lat},${pickupCoords.lng}`, '_blank');
    } else {
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    }
  };

  const openInGoogle = () => {
    if (pickupCoords && deliveryCoords) {
      window.open(`https://www.google.com/maps/dir/${pickupCoords.lat},${pickupCoords.lng}/${deliveryCoords.lat},${deliveryCoords.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  const copyCoords = (coords: { lat: number; lng: number }) => {
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    toast.success('تم نسخ الإحداثيات');
  };

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setZoom(15);
        setLocationName('موقعي الحالي');
        setSearching(false);
      },
      () => setSearching(false),
      { enableHighAccuracy: true }
    );
  }, []);

  const resetAll = () => {
    setPickupAddress('');
    setDeliveryAddress('');
    setPickupCoords(null);
    setDeliveryCoords(null);
    setRouteInfo(null);
    setSelectedShipment(null);
    setActiveView('pickup');
    setLat(DEFAULT_LAT);
    setLng(DEFAULT_LNG);
    setZoom(DEFAULT_ZOOM);
  };

  const filteredShipments = shipments.filter(s =>
    !shipmentSearch || 
    s.pickup_address?.includes(shipmentSearch) || 
    s.delivery_address?.includes(shipmentSearch) ||
    s.id.includes(shipmentSearch) ||
    s.waste_type?.includes(shipmentSearch)
  );

  const statusLabels: Record<string, string> = {
    new: 'جديدة', registered: 'مسجلة', delivered: 'تم التسليم',
    approved: 'معتمدة', cancelled: 'ملغاة',
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Navigation className="w-6 h-6 text-primary" />
            خريطة المسار المباشرة
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض توضيحي كامل لمسار الشحنة مع حركة المرور المباشرة
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={resetAll} variant="ghost" size="sm" className="gap-1">
            <RotateCcw className="w-4 h-4" />
            إعادة تعيين
          </Button>
          <Button onClick={handleMyLocation} variant="outline" size="sm" className="gap-1" disabled={searching}>
            <LocateFixed className="w-4 h-4" />
            موقعي
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Right sidebar - Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shipment Selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" />
                اختر شحنة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                placeholder="ابحث برقم الشحنة أو الموقع..."
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                className="text-sm"
              />
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {loadingShipments ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : filteredShipments.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">لا توجد شحنات</p>
                ) : (
                  filteredShipments.slice(0, 15).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadShipment(s)}
                      className={`w-full text-right p-2 rounded-lg border text-xs transition-colors hover:bg-accent/50 ${
                        selectedShipment?.id === s.id ? 'bg-primary/10 border-primary' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-[9px]">
                          {statusLabels[s.status] || s.status}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {s.id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3 text-green-500 shrink-0" />
                        <span className="truncate">{s.pickup_address || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="truncate">{s.delivery_address || 'غير محدد'}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Pickup / Delivery */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPinned className="w-4 h-4" />
                نقاط المسار
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Pickup */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  نقطة الاستلام
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="عنوان الاستلام..."
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPickup()}
                    className="text-sm flex-1"
                  />
                  <Button size="icon" variant="outline" onClick={searchPickup} disabled={searching} className="shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {pickupCoords && (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {pickupCoords.lat.toFixed(5)}, {pickupCoords.lng.toFixed(5)}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyCoords(pickupCoords)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setLat(pickupCoords.lat); setLng(pickupCoords.lng); setZoom(14); setActiveView('pickup'); }}>
                      <MapPin className="w-3 h-3 text-green-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Swap button */}
              <div className="flex justify-center">
                <Button size="icon" variant="ghost" onClick={swapLocations} className="h-7 w-7 rounded-full">
                  <ArrowLeftRight className="w-3.5 h-3.5 rotate-90" />
                </Button>
              </div>

              {/* Delivery */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  نقطة التسليم
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="عنوان التسليم..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchDelivery()}
                    className="text-sm flex-1"
                  />
                  <Button size="icon" variant="outline" onClick={searchDelivery} disabled={searching} className="shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {deliveryCoords && (
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {deliveryCoords.lat.toFixed(5)}, {deliveryCoords.lng.toFixed(5)}
                    </Badge>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyCoords(deliveryCoords)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setLat(deliveryCoords.lat); setLng(deliveryCoords.lng); setZoom(14); setActiveView('delivery'); }}>
                      <MapPin className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Calculate route */}
              <Button
                onClick={calculateRoute}
                disabled={!pickupCoords || !deliveryCoords || loadingRoute}
                className="w-full gap-2"
              >
                {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                عرض المسار الكامل
              </Button>
            </CardContent>
          </Card>

          {/* Route Info */}
          {routeInfo && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="w-4 h-4 text-primary" />
                  بيانات المسار
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <Route className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{formatDistance(routeInfo.distance)}</p>
                    <p className="text-[10px] text-muted-foreground">المسافة</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">{routeInfo.duration > 0 ? formatDuration(routeInfo.duration) : '—'}</p>
                    <p className="text-[10px] text-muted-foreground">الوقت المقدر</p>
                  </div>
                </div>

                {/* Shipment details */}
                {selectedShipment && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع المخلفات</span>
                        <span className="font-medium">{selectedShipment.waste_type || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الكمية</span>
                        <span className="font-medium">{selectedShipment.quantity || '—'} {selectedShipment.unit || ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الحالة</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {statusLabels[selectedShipment.status] || selectedShipment.status}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Visual route timeline */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">مسار الشحنة</p>
                  <div className="relative pr-4">
                    {/* Timeline line */}
                    <div className="absolute right-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-green-500 via-primary to-red-500" />
                    
                    {/* Pickup point */}
                    <div className="relative flex items-start gap-3 mb-4">
                      <div className="absolute right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background z-10" />
                      <div className="mr-4">
                        <p className="text-[10px] text-green-600 font-semibold">الاستلام</p>
                        <p className="text-xs truncate max-w-[200px]">{pickupAddress || 'غير محدد'}</p>
                      </div>
                    </div>

                    {/* Route info */}
                    <div className="relative flex items-start gap-3 mb-4">
                      <div className="absolute right-0 w-3 h-3 rounded-full bg-primary border-2 border-background z-10" />
                      <div className="mr-4">
                        <p className="text-[10px] text-primary font-semibold">المسار</p>
                        <p className="text-xs">{formatDistance(routeInfo.distance)} • {routeInfo.duration > 0 ? formatDuration(routeInfo.duration) : 'غير متاح'}</p>
                      </div>
                    </div>

                    {/* Delivery point */}
                    <div className="relative flex items-start gap-3">
                      <div className="absolute right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-background z-10" />
                      <div className="mr-4">
                        <p className="text-[10px] text-red-600 font-semibold">التسليم</p>
                        <p className="text-xs truncate max-w-[200px]">{deliveryAddress || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Navigation buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={openInWaze} variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Navigation className="w-3.5 h-3.5" />
                    فتح في Waze
                  </Button>
                  <Button onClick={openInGoogle} variant="outline" size="sm" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    فتح في Google
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map area */}
        <div className="lg:col-span-2 space-y-3">
          {/* View toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeView === 'pickup' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { if (pickupCoords) { setActiveView('pickup'); } }}
              disabled={!pickupCoords}
              className="gap-1.5 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              الاستلام
            </Button>
            <Button
              variant={activeView === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { if (deliveryCoords) { setActiveView('delivery'); } }}
              disabled={!deliveryCoords}
              className="gap-1.5 text-xs"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              التسليم
            </Button>
            <Button
              variant={activeView === 'route' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { if (routeInfo) { setActiveView('route'); } }}
              disabled={!routeInfo}
              className="gap-1.5 text-xs"
            >
              <Route className="w-3.5 h-3.5" />
              المسار الكامل
            </Button>
            {routeInfo && (
              <Badge variant="secondary" className="mr-auto text-xs">
                {formatDistance(routeInfo.distance)}
                {routeInfo.duration > 0 && ` • ${formatDuration(routeInfo.duration)}`}
              </Badge>
            )}
          </div>

          {/* Waze Map */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative w-full" style={{ height: 'calc(100vh - 220px)', minHeight: '450px' }}>
                <iframe
                  src={getWazeUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  title="Waze Live Map"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Cities */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'القاهرة', lat: 30.0444, lng: 31.2357 },
              { label: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
              { label: 'الجيزة', lat: 30.0131, lng: 31.2089 },
              { label: '6 أكتوبر', lat: 29.9553, lng: 30.9276 },
            ].map((city) => (
              <Button
                key={city.label}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => {
                  setLat(city.lat);
                  setLng(city.lng);
                  setLocationName(city.label);
                  setZoom(13);
                  setActiveView('pickup');
                }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {city.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WazeLiveMap;
