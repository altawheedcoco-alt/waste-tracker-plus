import { useState, useEffect, useMemo } from 'react';
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
import SmartLocationSearch from '@/components/maps/SmartLocationSearch';
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
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
        {/* From Location - Talabat Style */}
        <div className="space-y-2">
          <div className={cn(
            "relative rounded-xl border-2 p-3 transition-all",
            fromLocation.address 
              ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" 
              : "border-border bg-muted/30"
          )}>
            <div className="flex items-center gap-3">
              {/* Green dot indicator */}
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                {fromLocation.address ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{fromLocation.address.split(',')[0]}</p>
                      {fromLocation.city && (
                        <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-200">
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
              ? "border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20" 
              : "border-border bg-muted/30"
          )}>
            <div className="flex items-center gap-3">
              {/* Orange dot indicator */}
              <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                {toLocation.address ? (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{toLocation.address.split(',')[0]}</p>
                      {toLocation.city && (
                        <Badge variant="outline" className="mt-1 text-xs bg-orange-100 text-orange-700 border-orange-200">
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
          </div>
        </div>

        {/* Warning when cities are different */}
        {citiesAreDifferent && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
              بعض العناوين التالية موجودة في دولة أو مدينة مختلفة.
              <br />
              يرجى تحديد العنوان بعناية
            </AlertDescription>
          </Alert>
        )}

        {/* Drop Pin on Map option */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground h-12 border border-dashed"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-4 w-4" />
          </div>
          ضع الدبوس على موقعك بالخريطة
        </Button>

        {/* Shipment Selection */}
        <div className="space-y-2 pt-2 border-t">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Truck className="h-3 w-3 text-blue-600" />
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
    </Card>
  );
};

export default EnhancedDestinationPicker;
