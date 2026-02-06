import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileCheck,
  Loader2,
  Package,
  Scale,
  MapPin,
  Building2,
  Truck,
  Calendar,
  Recycle,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  generator_id: string;
  generator: { name: string } | null;
  recycler?: { name: string } | null;
  driver_id: string | null;
  driver?: { profile: { full_name: string } | null } | null;
  created_at: string;
}

interface QuickReceiptButtonProps {
  shipment: Shipment;
  onSuccess?: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default' | 'lg';
}

const QuickReceiptButton = ({ 
  shipment, 
  onSuccess,
  variant = 'ghost',
  size = 'sm'
}: QuickReceiptButtonProps) => {
  const { profile, organization } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actualWeight, setActualWeight] = useState(shipment.quantity?.toString() || '');
  const [notes, setNotes] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [checkingReceipt, setCheckingReceipt] = useState(false);

  const checkExistingReceipt = async () => {
    setCheckingReceipt(true);
    try {
      const { data } = await supabase
        .from('shipment_receipts')
        .select('id')
        .eq('shipment_id', shipment.id)
        .maybeSingle();
      
      setHasReceipt(!!data);
    } catch (error) {
      console.error('Error checking receipt:', error);
    } finally {
      setCheckingReceipt(false);
    }
  };

  const handleOpenDialog = async () => {
    await checkExistingReceipt();
    setOpen(true);
    setActualWeight(shipment.quantity?.toString() || '');
    setNotes('');
  };

  const handleCreateReceipt = async () => {
    if (!organization?.id || !profile?.id) {
      toast.error('خطأ في البيانات');
      return;
    }

    setLoading(true);
    try {
      const insertData = {
        shipment_id: shipment.id,
        transporter_id: organization.id,
        generator_id: shipment.generator_id,
        driver_id: shipment.driver_id,
        waste_type: shipment.waste_type,
        declared_weight: shipment.quantity || null,
        actual_weight: parseFloat(actualWeight) || null,
        unit: shipment.unit || 'kg',
        pickup_location: shipment.pickup_address,
        notes: notes || null,
        created_by: profile.id,
      };

      const { error } = await supabase
        .from('shipment_receipts')
        .insert(insertData as any);

      if (error) throw error;

      toast.success('تم إنشاء شهادة الاستلام بنجاح', {
        description: `شهادة استلام للشحنة ${shipment.shipment_number}`,
      });
      
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      toast.error(error.message || 'فشل في إنشاء الشهادة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenDialog}
        disabled={checkingReceipt}
        className="gap-1"
        title="إنشاء شهادة استلام"
      >
        <FileCheck className="w-4 h-4 text-primary" />
        {size !== 'sm' && <span>شهادة استلام</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              إنشاء شهادة استلام شحنة
            </DialogTitle>
            <DialogDescription>
              شهادة استلام رسمية للشحنة من الجهة المولدة
            </DialogDescription>
          </DialogHeader>

          {hasReceipt ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-green-600">تم إصدار شهادة استلام لهذه الشحنة مسبقاً</p>
              <p className="text-sm text-muted-foreground mt-2">
                يمكنك مراجعة الشهادات من صفحة "شهادات استلام الشحنات"
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Shipment Info Card */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="gap-1">
                    <Package className="w-3 h-3" />
                    {shipment.shipment_number}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    <Calendar className="w-3 h-3 inline ml-1" />
                    {format(new Date(shipment.created_at), 'dd MMM yyyy', { locale: ar })}
                  </span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      الجهة المولدة
                    </p>
                    <p className="font-medium">{shipment.generator?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Recycle className="w-3 h-3" />
                      المُدوّر
                    </p>
                    <p className="font-medium">{shipment.recycler?.name || '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">نوع المخلفات</p>
                    <p className="font-medium">{shipment.waste_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">الكمية المصرحة</p>
                    <p className="font-medium">{shipment.quantity} {shipment.unit}</p>
                  </div>
                </div>

                {shipment.pickup_address && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        موقع الاستلام
                      </p>
                      <p className="font-medium text-sm">{shipment.pickup_address}</p>
                    </div>
                  </>
                )}

                {shipment.driver?.profile?.full_name && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1 text-sm">
                        <Truck className="w-3 h-3" />
                        السائق
                      </p>
                      <p className="font-medium text-sm">{shipment.driver.profile.full_name}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actual Weight */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  الوزن الفعلي عند الاستلام
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    placeholder="أدخل الوزن الفعلي"
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="px-4">
                    {shipment.unit || 'kg'}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات على حالة الشحنة عند الاستلام..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              إغلاق
            </Button>
            {!hasReceipt && (
              <Button onClick={handleCreateReceipt} disabled={loading}>
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickReceiptButton;
