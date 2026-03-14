import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateDocumentIdentity } from '@/utils/documentIdentityGenerator';
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
  delivery_address: string;
  generator_id: string;
  generator: { name: string } | null;
  driver_id: string | null;
  status: string;
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
    deliveryLocation: '',
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
        actualWeight: shipment.quantity?.toString() || '', // Pre-fill with declared weight
        unit: shipment.unit || 'kg',
        pickupLocation: shipment.pickup_address || '',
        deliveryLocation: shipment.delivery_address || '',
        notes: '',
      });
      setSelectedShipmentId(shipment.id);
    }
  }, [shipment]);

  const loadShipments = async () => {
    try {
      // Fetch all shipments where this organization is the transporter
      // Include all statuses that can have receipts issued
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          pickup_address,
          delivery_address,
          generator_id,
          driver_id,
          status,
          generator:organizations!shipments_generator_id_fkey(name)
        `)
        .eq('transporter_id', organization?.id)
        .in('status', ['new', 'approved', 'in_transit', 'delivered', 'confirmed'])
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
        actualWeight: selected.quantity?.toString() || '', // Pre-fill with declared weight
        unit: selected.unit || 'kg',
        pickupLocation: selected.pickup_address || '',
        deliveryLocation: selected.delivery_address || '',
        notes: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentId || !organization?.id || !profile?.user_id) {
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
        created_by: profile.user_id,
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
      deliveryLocation: '',
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
                  {shipments.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      لا توجد شحنات متاحة
                    </div>
                  ) : (
                    shipments.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <span>{s.shipment_number}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-muted-foreground">{s.generator?.name || 'غير محدد'}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            s.status === 'delivered' || s.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : s.status === 'in_transit' 
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {s.status === 'new' ? 'جديدة' : 
                             s.status === 'approved' ? 'معتمدة' : 
                             s.status === 'in_transit' ? 'قيد النقل' : 
                             s.status === 'delivered' ? 'تم التسليم' : 
                             s.status === 'confirmed' ? 'مؤكدة' : s.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Waste Type - Auto-filled from shipment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              نوع المخلفات
              {selectedShipmentId && (
                <span className="text-xs text-muted-foreground">(من الشحنة)</span>
              )}
            </Label>
            <Input
              value={formData.wasteType || 'غير محدد'}
              readOnly
              className="bg-muted/50 cursor-not-allowed"
              placeholder="سيتم تحديده من الشحنة"
            />
            {!selectedShipmentId && (
              <p className="text-xs text-muted-foreground">اختر شحنة لتحديد نوع المخلفات تلقائياً</p>
            )}
          </div>

          {/* Weight Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                الوزن المصرح
                {selectedShipmentId && (
                  <span className="text-xs text-green-600">(من الشحنة - قابل للتعديل)</span>
                )}
              </Label>
              <Input
                type="number"
                value={formData.declaredWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, declaredWeight: e.target.value }))}
                placeholder="0"
                className={selectedShipmentId ? "border-green-200 bg-green-50/50" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                الوزن الفعلي
                {selectedShipmentId && formData.actualWeight && (
                  <span className="text-xs text-blue-600">(تم الملء تلقائياً)</span>
                )}
              </Label>
              <Input
                type="number"
                value={formData.actualWeight}
                onChange={(e) => setFormData(prev => ({ ...prev, actualWeight: e.target.value }))}
                placeholder="0"
                className={selectedShipmentId ? "border-blue-200 bg-blue-50/50" : ""}
              />
            </div>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              الوحدة
              {selectedShipmentId && (
                <span className="text-xs text-green-600">(من الشحنة - قابل للتعديل)</span>
              )}
            </Label>
            <Select 
              value={formData.unit} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
            >
              <SelectTrigger className={selectedShipmentId ? "border-green-200 bg-green-50/50" : ""}>
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

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                موقع الاستلام
                {selectedShipmentId && formData.pickupLocation && (
                  <span className="text-xs text-green-600">(تلقائي)</span>
                )}
              </Label>
              <Input
                value={formData.pickupLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))}
                placeholder="عنوان موقع الاستلام"
                className={selectedShipmentId && formData.pickupLocation ? "border-green-200 bg-green-50/50" : ""}
              />
            </div>

            {/* Delivery Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                موقع التسليم
                {selectedShipmentId && formData.deliveryLocation && (
                  <span className="text-xs text-blue-600">(تلقائي)</span>
                )}
              </Label>
              <Input
                value={formData.deliveryLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                placeholder="عنوان موقع التسليم"
                className={selectedShipmentId && formData.deliveryLocation ? "border-blue-200 bg-blue-50/50" : ""}
              />
            </div>
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
