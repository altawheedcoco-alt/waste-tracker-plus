import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileCheck, Package, Scale, MapPin } from 'lucide-react';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  generator_id: string;
  generator: { name: string } | null;
  driver_id: string | null;
}

interface CreateReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment?: Shipment | null;
  onSuccess: () => void;
}

const wasteTypes = [
  { value: 'plastic', label: 'بلاستيك' },
  { value: 'paper', label: 'ورق' },
  { value: 'metal', label: 'معادن' },
  { value: 'glass', label: 'زجاج' },
  { value: 'electronic', label: 'إلكترونيات' },
  { value: 'organic', label: 'عضوية' },
  { value: 'chemical', label: 'كيميائية' },
  { value: 'medical', label: 'طبية' },
  { value: 'construction', label: 'مخلفات بناء' },
  { value: 'wood', label: 'أخشاب' },
  { value: 'hazardous', label: 'خطرة' },
  { value: 'other', label: 'أخرى' },
];

const CreateReceiptDialog = ({ 
  open, 
  onOpenChange, 
  shipment,
  onSuccess 
}: CreateReceiptDialogProps) => {
  const { profile, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  
  const [formData, setFormData] = useState({
    wasteType: '',
    declaredWeight: '',
    actualWeight: '',
    unit: 'kg',
    pickupLocation: '',
    notes: '',
  });

  // Load shipments if no shipment provided
  useEffect(() => {
    if (open && !shipment && organization?.id) {
      loadShipments();
    }
  }, [open, shipment, organization?.id]);

  // Pre-fill form when shipment is provided
  useEffect(() => {
    if (shipment) {
      setFormData({
        wasteType: shipment.waste_type || '',
        declaredWeight: shipment.quantity?.toString() || '',
        actualWeight: '',
        unit: shipment.unit || 'kg',
        pickupLocation: shipment.pickup_address || '',
        notes: '',
      });
      setSelectedShipmentId(shipment.id);
    }
  }, [shipment]);

  const loadShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          pickup_address,
          generator_id,
          driver_id,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('transporter_id', organization?.id)
        .in('status', ['approved', 'collecting', 'in_transit'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments(data as unknown as Shipment[]);
    } catch (error) {
      console.error('Error loading shipments:', error);
    }
  };

  const handleShipmentSelect = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const selected = shipments.find(s => s.id === shipmentId);
    if (selected) {
      setFormData({
        wasteType: selected.waste_type || '',
        declaredWeight: selected.quantity?.toString() || '',
        actualWeight: '',
        unit: selected.unit || 'kg',
        pickupLocation: selected.pickup_address || '',
        notes: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId || !organization?.id || !profile?.id) {
      toast.error('يرجى اختيار شحنة');
      return;
    }

    setLoading(true);
    try {
      const selectedShipment = shipment || shipments.find(s => s.id === selectedShipmentId);
      if (!selectedShipment) throw new Error('الشحنة غير موجودة');

      const insertData = {
        shipment_id: selectedShipmentId,
        transporter_id: organization.id,
        generator_id: selectedShipment.generator_id,
        driver_id: selectedShipment.driver_id,
        waste_type: formData.wasteType,
        declared_weight: parseFloat(formData.declaredWeight) || null,
        actual_weight: parseFloat(formData.actualWeight) || null,
        unit: formData.unit,
        pickup_location: formData.pickupLocation,
        notes: formData.notes || null,
        created_by: profile.id,
      };

      const { error } = await supabase
        .from('shipment_receipts')
        .insert(insertData as any);

      if (error) throw error;

      toast.success('تم إنشاء شهادة الاستلام بنجاح');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      toast.error(error.message || 'فشل في إنشاء الشهادة');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      wasteType: '',
      declaredWeight: '',
      actualWeight: '',
      unit: 'kg',
      pickupLocation: '',
      notes: '',
    });
    setSelectedShipmentId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            إنشاء شهادة استلام شحنة
          </DialogTitle>
          <DialogDescription>
            أنشئ شهادة استلام للشحنة عند استلامها من الجهة المولدة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipment Selection */}
          {!shipment && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                اختر الشحنة
              </Label>
              <Select value={selectedShipmentId} onValueChange={handleShipmentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر شحنة..." />
                </SelectTrigger>
                <SelectContent>
                  {shipments.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipment_number} - {s.generator?.name || 'غير محدد'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Waste Type */}
          <div className="space-y-2">
            <Label>نوع النفايات</Label>
            <Select 
              value={formData.wasteType} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, wasteType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع النفايات" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                الوزن المصرح
              </Label>
              <Input
                type="number"
                value={formData.declaredWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, declaredWeight: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>الوزن الفعلي</Label>
              <Input
                type="number"
                value={formData.actualWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, actualWeight: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label>الوحدة</Label>
            <Select 
              value={formData.unit} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">كيلوجرام</SelectItem>
                <SelectItem value="ton">طن</SelectItem>
                <SelectItem value="m3">متر مكعب</SelectItem>
                <SelectItem value="unit">وحدة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pickup Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              موقع الاستلام
            </Label>
            <Input
              value={formData.pickupLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
              placeholder="أدخل عنوان موقع الاستلام"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading || !selectedShipmentId}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 ml-2" />
                  إنشاء الشهادة
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReceiptDialog;
