import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartLocationSearch from '@/components/maps/SmartLocationSearch';
import GooglePlacesSearch from '@/components/maps/GooglePlacesSearch';
import { 
  MapPin, 
  Navigation, 
  ArrowDown, 
  Truck, 
  Route,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Map,
  X,
  Search,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Lazy load map component
const InteractiveMapPicker = lazy(() => import('@/components/maps/InteractiveMapPicker'));

// Helper functions for external navigation
const openInGoogleMaps = (address: string, coords?: { lat: number; lng: number }) => {
  let url: string;
  if (coords) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      url = `google.navigation:q=${coords.lat},${coords.lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    }
  } else {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  window.open(url, '_blank');
};

const openInWaze = (address: string, coords?: { lat: number; lng: number }) => {
  let url: string;
  if (coords) {
    url = `https://waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
  } else {
    url = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  }
  window.open(url, '_blank');
};

const searchInGoogleMaps = (query: string) => {
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};

const searchInWaze = (query: string) => {
  const url = `https://waze.com/ul?q=${encodeURIComponent(query)}`;
  window.open(url, '_blank');
};

interface EnhancedDestinationPickerProps {
  driverId: string;
  onDestinationAdded?: () => void;
}

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
}

interface LocationData {
  address: string;
  coords?: { lat: number; lng: number };
  city?: string;
}

// Extract city from address
const extractCity = (address: string): string | undefined => {
  if (!address) return undefined;
  
  const egyptianCities = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'بورسعيد', 'السويس', 'دمياط', 
    'الدقهلية', 'الشرقية', 'القليوبية', 'كفر الشيخ', 'الغربية', 'المنوفية',
    'البحيرة', 'الإسماعيلية', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط',
    'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'مطروح',
    'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد',
    'بنها', 'طنطا', 'المنصورة', 'الزقازيق', 'شبين الكوم', 'دمنهور',
    'العاشر من رمضان', 'السادس من أكتوبر', 'العبور', 'بدر', 'السادات',
    'المحلة الكبرى', 'كفر الدوار', 'برج العرب', 'العامرية',
    'Cairo', 'Giza', 'Alexandria', 'Benha', 'Tanta', 'Mansoura'
  ];
  
  for (const city of egyptianCities) {
    if (address.includes(city)) {
      return city;
    }
  }
  
  // Try to extract from address parts
  const parts = address.split(/[،,\-]/);
  if (parts.length >= 2) {
    return parts[parts.length - 2]?.trim();
  }
  
  return undefined;
};

const EnhancedDestinationPicker = ({ driverId, onDestinationAdded }: EnhancedDestinationPickerProps) => {
  const [fromLocation, setFromLocation] = useState<LocationData>({ address: '' });
  const [toLocation, setToLocation] = useState<LocationData>({ address: '' });
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'from' | 'to'>('from');
  const [searchMode, setSearchMode] = useState<'google' | 'smart'>('google');

  // Check if cities are different
  const citiesAreDifferent = useMemo(() => {
    const fromCity = extractCity(fromLocation.address);
    const toCity = extractCity(toLocation.address);
    
    if (!fromCity || !toCity) return false;
    
    return fromCity.toLowerCase() !== toCity.toLowerCase();
  }, [fromLocation.address, toLocation.address]);

  // Fetch active shipments for this driver
  useEffect(() => {
    const fetchActiveShipments = async () => {
      if (!driverId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select('id, shipment_number, status, pickup_address, delivery_address')
          .eq('driver_id', driverId)
          .in('status', ['new', 'approved', 'collecting', 'in_transit'])
          .order('created_at', { ascending: false });

        if (error) throw error;
        setActiveShipments(data || []);
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveShipments();
  }, [driverId]);

  // When shipment is selected, auto-fill addresses
  useEffect(() => {
    if (selectedShipmentId) {
      const shipment = activeShipments.find(s => s.id === selectedShipmentId);
      if (shipment) {
        setFromLocation({ 
          address: shipment.pickup_address,
          city: extractCity(shipment.pickup_address)
        });
        setToLocation({ 
          address: shipment.delivery_address,
          city: extractCity(shipment.delivery_address)
        });
      }
    }
  }, [selectedShipmentId, activeShipments]);

  const handleFromChange = (address: string, coords?: { lat: number; lng: number }) => {
    setFromLocation({
      address,
      coords,
      city: extractCity(address)
    });
  };

  const handleToChange = (address: string, coords?: { lat: number; lng: number }) => {
    setToLocation({
      address,
      coords,
      city: extractCity(address)
    });
  };

  const handleClearFrom = () => {
    setFromLocation({ address: '' });
  };

  const handleClearTo = () => {
    setToLocation({ address: '' });
  };

  const handleAddToShipment = async () => {
    if (!selectedShipmentId || !fromLocation.address || !toLocation.address) {
      toast.error('يرجى تحديد الشحنة والموقعين');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          pickup_address: fromLocation.address,
          delivery_address: toLocation.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedShipmentId)
        .eq('driver_id', driverId);

      if (error) throw error;

      toast.success('تم تحديث عناوين الشحنة بنجاح');
      
      // Reset form
      setFromLocation({ address: '' });
      setToLocation({ address: '' });
      setSelectedShipmentId('');
      
      onDestinationAdded?.();
    } catch (error) {
      console.error('Error updating shipment:', error);
      toast.error('حدث خطأ أثناء تحديث الشحنة');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      new: { label: 'جديدة', variant: 'secondary' },
      approved: { label: 'معتمدة', variant: 'default' },
      collecting: { label: 'جاري التجميع', variant: 'default' },
      in_transit: { label: 'في الطريق', variant: 'default' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canSave = fromLocation.address && toLocation.address && selectedShipmentId;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-l from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-full bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          حدد العنوان
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Search Mode Tabs with External Search Options */}
        <div className="flex items-center gap-2">
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as 'google' | 'smart')} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="google" className="flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google Maps
              </TabsTrigger>
              <TabsTrigger value="smart" className="flex items-center gap-1.5 text-xs">
                <Search className="w-3.5 h-3.5" />
                بحث ذكي
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* External Search Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 px-2.5">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">بحث خارجي</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-right">ابحث عن مكان في</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  const query = prompt('أدخل اسم المكان للبحث في Google Maps:');
                  if (query) searchInGoogleMaps(query);
                }}
                className="gap-2 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                البحث في Google Maps
                <ExternalLink className="w-3 h-3 mr-auto opacity-50" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  const query = prompt('أدخل اسم المكان للبحث في Waze:');
                  if (query) searchInWaze(query);
                }}
                className="gap-2 cursor-pointer"
              >
                <img 
                  src="https://www.waze.com/favicon.ico" 
                  alt="Waze" 
                  className="w-5 h-5"
                />
                البحث في Waze
                <ExternalLink className="w-3 h-3 mr-auto opacity-50" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* From Location - Talabat Style */}
        <div className="space-y-2">
          <div className={cn(
            "relative rounded-xl border-2 p-3 transition-all",
            fromLocation.address 
              ? "border-primary/30 bg-primary/5" 
              : "border-border bg-muted/30"
          )}>
            <div className="flex items-center gap-3">
              {/* Green dot indicator */}
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                {fromLocation.address ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{fromLocation.address.split(',')[0]}</p>
                      {fromLocation.city && (
                        <Badge variant="outline" className="mt-1 text-xs bg-primary/10 text-primary border-primary/30">
                          {fromLocation.city}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleClearFrom}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1">
                      {searchMode === 'google' ? (
                        <GooglePlacesSearch
                          value=""
                          onChange={handleFromChange}
                          placeholder="من أين؟ (نقطة الاستلام)"
                          showCurrentLocation={true}
                          className="border-0 shadow-none"
                        />
                      ) : (
                        <SmartLocationSearch
                          value=""
                          onChange={handleFromChange}
                          placeholder="من أين؟ (نقطة الاستلام)"
                          showCurrentLocation={true}
                          className="border-0 shadow-none"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* View in external app button when location is set */}
              {fromLocation.address && fromLocation.coords && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openInGoogleMaps(fromLocation.address, fromLocation.coords)}>
                      <Navigation className="w-4 h-4 ml-2 text-green-600" />
                      فتح في Google Maps
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInWaze(fromLocation.address, fromLocation.coords)}>
                      <Navigation className="w-4 h-4 ml-2 text-blue-600" />
                      فتح في Waze
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Add stop button */}
        <div className="flex items-center gap-2 pr-4">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-border" />
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
            <div className="w-0.5 h-3 bg-border" />
          </div>
        </div>

        {/* To Location - Talabat Style */}
        <div className="space-y-2">
          <div className={cn(
            "relative rounded-xl border-2 p-3 transition-all",
            toLocation.address 
              ? "border-destructive/30 bg-destructive/5" 
              : "border-border bg-muted/30"
          )}>
            <div className="flex items-center gap-3">
              {/* Red dot indicator */}
              <div className="w-3 h-3 rounded-full bg-destructive flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                {toLocation.address ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{toLocation.address.split(',')[0]}</p>
                      {toLocation.city && (
                        <Badge variant="outline" className="mt-1 text-xs bg-destructive/10 text-destructive border-destructive/30">
                          {toLocation.city}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleClearTo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1">
                      {searchMode === 'google' ? (
                        <GooglePlacesSearch
                          value=""
                          onChange={handleToChange}
                          placeholder="إلى أين؟ (نقطة التسليم)"
                          showCurrentLocation={false}
                          className="border-0 shadow-none"
                        />
                      ) : (
                        <SmartLocationSearch
                          value=""
                          onChange={handleToChange}
                          placeholder="إلى أين؟ (نقطة التسليم)"
                          showCurrentLocation={false}
                          className="border-0 shadow-none"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* View in external app button when location is set */}
              {toLocation.address && toLocation.coords && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openInGoogleMaps(toLocation.address, toLocation.coords)}>
                      <Navigation className="w-4 h-4 ml-2 text-green-600" />
                      فتح في Google Maps
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openInWaze(toLocation.address, toLocation.coords)}>
                      <Navigation className="w-4 h-4 ml-2 text-blue-600" />
                      فتح في Waze
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Warning when cities are different */}
        {citiesAreDifferent && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground text-sm">
              بعض العناوين التالية موجودة في دولة أو مدينة مختلفة.
              <br />
              يرجى تحديد العنوان بعناية
            </AlertDescription>
          </Alert>
        )}

        {/* Drop Pin on Map options */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground h-11 border-dashed hover:border-primary/50"
            onClick={() => {
              setMapPickerTarget('from');
              setShowMapPicker(true);
            }}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs">حدد نقطة الاستلام</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground h-11 border-dashed hover:border-primary/50"
            onClick={() => {
              setMapPickerTarget('to');
              setShowMapPicker(true);
            }}
          >
            <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <Map className="h-3 w-3 text-destructive" />
            </div>
            <span className="text-xs">حدد نقطة التسليم</span>
          </Button>
        </div>

        {/* Shipment Selection */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
              <Truck className="h-3 w-3 text-secondary-foreground" />
            </div>
            ربط بشحنة
          </Label>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeShipments.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>لا توجد شحنات نشطة</p>
            </div>
          ) : (
            <Select value={selectedShipmentId} onValueChange={setSelectedShipmentId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر شحنة لتحديث عناوينها..." />
              </SelectTrigger>
              <SelectContent>
                {activeShipments.map((shipment) => (
                  <SelectItem key={shipment.id} value={shipment.id}>
                    <div className="flex items-center gap-2">
                      <span>{shipment.shipment_number}</span>
                      {getStatusBadge(shipment.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Action Button */}
        <Button
          className="w-full gap-2 h-12"
          onClick={handleAddToShipment}
          disabled={!canSave || saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              تحديث عناوين الشحنة
            </>
          )}
        </Button>

        {/* Quick tip */}
        <p className="text-xs text-muted-foreground text-center">
          💡 اختر شحنة نشطة ثم حدد نقطتي الانطلاق والوصول
        </p>
      </CardContent>

      {/* Map Picker Dialog */}
      <Dialog open={showMapPicker} onOpenChange={setShowMapPicker}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {mapPickerTarget === 'from' ? 'تحديد نقطة الاستلام' : 'تحديد نقطة التسليم'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-4">
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            }>
              <InteractiveMapPicker
                value={mapPickerTarget === 'from' ? fromLocation.coords : toLocation.coords}
                onChange={(coords, address) => {
                  if (mapPickerTarget === 'from') {
                    setFromLocation({
                      address: address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                      coords,
                      city: extractCity(address || '')
                    });
                  } else {
                    setToLocation({
                      address: address || `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
                      coords,
                      city: extractCity(address || '')
                    });
                  }
                }}
                height="100%"
                showSearch={true}
                markerColor={mapPickerTarget === 'from' ? 'green' : 'red'}
                label={mapPickerTarget === 'from' ? 'اضغط على الخريطة لتحديد نقطة الاستلام' : 'اضغط على الخريطة لتحديد نقطة التسليم'}
              />
            </Suspense>
          </div>
          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowMapPicker(false)}
            >
              إلغاء
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                setShowMapPicker(false);
                toast.success(mapPickerTarget === 'from' ? 'تم تحديد نقطة الاستلام' : 'تم تحديد نقطة التسليم');
              }}
              disabled={mapPickerTarget === 'from' ? !fromLocation.address : !toLocation.address}
            >
              <CheckCircle2 className="h-4 w-4" />
              تأكيد الموقع
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EnhancedDestinationPicker;
