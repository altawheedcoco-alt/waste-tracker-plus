import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Plus,
  Route,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DestinationPickerProps {
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

const DestinationPicker = ({ driverId, onDestinationAdded }: DestinationPickerProps) => {
  const { profile } = useAuth();
  const [fromAddress, setFromAddress] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [toCoords, setToCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [activeShipments, setActiveShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
          .in('status', ['new', 'approved', 'in_transit'])
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
        setFromAddress(shipment.pickup_address);
        setToAddress(shipment.delivery_address);
      }
    }
  }, [selectedShipmentId, activeShipments]);

  const handleFromChange = (address: string, coords?: { lat: number; lng: number }) => {
    setFromAddress(address);
    setFromCoords(coords || null);
  };

  const handleToChange = (address: string, coords?: { lat: number; lng: number }) => {
    setToAddress(address);
    setToCoords(coords || null);
  };

  const handleAddToShipment = async () => {
    if (!selectedShipmentId || !fromAddress || !toAddress) {
      toast.error('يرجى تحديد الشحنة والموقعين');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({
          pickup_address: fromAddress,
          delivery_address: toAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedShipmentId)
        .eq('driver_id', driverId);

      if (error) throw error;

      toast.success('تم تحديث عناوين الشحنة بنجاح');
      
      // Reset form
      setFromAddress('');
      setToAddress('');
      setFromCoords(null);
      setToCoords(null);
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
      in_transit: { label: 'في الطريق', variant: 'default' },
    };
    const config = statusConfig[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canSave = fromAddress && toAddress && selectedShipmentId;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-full bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          تحديد الوجهة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* From Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <MapPin className="h-3 w-3 text-green-600" />
            </div>
            من (نقطة الانطلاق)
          </Label>
          <SmartLocationSearch
            value={fromAddress}
            onChange={handleFromChange}
            placeholder="ابحث عن نقطة الاستلام..."
            showCurrentLocation={true}
          />
        </div>

        {/* Arrow indicator */}
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-muted">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* To Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <Navigation className="h-3 w-3 text-red-600" />
            </div>
            إلى (نقطة التسليم)
          </Label>
          <SmartLocationSearch
            value={toAddress}
            onChange={handleToChange}
            placeholder="ابحث عن نقطة التسليم..."
            showCurrentLocation={false}
          />
        </div>

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
          className="w-full gap-2"
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

export default DestinationPicker;
