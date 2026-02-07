import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FileCheck, FileX, Loader2, Shield, QrCode, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerificationResult {
  found: boolean;
  shipment?: {
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    status: string;
    created_at: string;
    generator_name: string;
    transporter_name: string;
    recycler_name: string;
  };
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوي',
  chemical: 'كيميائي',
  medical: 'طبي',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  new: 'جديدة',
  approved: 'معتمدة',
  collecting: 'قيد التجميع',
  in_transit: 'قيد النقل',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
};

interface DocumentVerificationWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DocumentVerificationWidget = ({ open, onOpenChange }: DocumentVerificationWidgetProps) => {
  const navigate = useNavigate();
  const [documentNumber, setDocumentNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!documentNumber.trim()) {
      toast.error('يرجى إدخال رقم الوثيقة');
      return;
    }

    setIsLoading(true);
    setResult(null);

    const fullDocNumber = documentNumber.trim().toUpperCase().startsWith('SHP-') 
      ? documentNumber.trim().toUpperCase() 
      : `SHP-${documentNumber.trim().toUpperCase()}`;

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          shipment_number,
          waste_type,
          quantity,
          unit,
          status,
          created_at,
          generator:organizations!shipments_generator_id_fkey(name),
          transporter:organizations!shipments_transporter_id_fkey(name),
          recycler:organizations!shipments_recycler_id_fkey(name)
        `)
        .eq('shipment_number', fullDocNumber)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult({
          found: true,
          shipment: {
            shipment_number: data.shipment_number,
            waste_type: data.waste_type,
            quantity: data.quantity,
            unit: data.unit || 'كجم',
            status: data.status || 'new',
            created_at: data.created_at || '',
            generator_name: (data.generator as any)?.name || 'غير محدد',
            transporter_name: (data.transporter as any)?.name || 'غير محدد',
            recycler_name: (data.recycler as any)?.name || 'غير محدد',
          },
        });
        toast.success('تم التحقق من الوثيقة بنجاح');
      } else {
        setResult({ found: false });
        toast.error('لم يتم العثور على وثيقة بهذا الرقم');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('حدث خطأ أثناء التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleClear = () => {
    setDocumentNumber('');
    setResult(null);
  };

  const handleClose = () => {
    handleClear();
    onOpenChange?.(false);
  };

  const verificationContent = (
    <div className="space-y-4">
      <Tabs defaultValue="number" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="number" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            رقم الوثيقة
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            مسح QR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="number" className="space-y-4 mt-4">
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleVerify}
              disabled={isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 ml-2" />
                  تحقق
                </>
              )}
            </Button>
            <div className="flex-1 flex items-center gap-0">
              <Input
                placeholder="أدخل الرقم (مثال: 20260128-4098)"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 rounded-l-none border-l-0"
                dir="ltr"
              />
              <div className="bg-muted border border-input h-10 px-3 flex items-center rounded-l-md text-sm font-medium text-muted-foreground">
                SHP-
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/50">
            <QrCode className="w-12 h-12 mx-auto text-primary mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              امسح رمز QR للتحقق من أي مستند
            </p>
            <Button 
              onClick={() => {
                onOpenChange?.(false);
                navigate('/scan');
              }}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              فتح الماسح الضوئي
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              يدعم: الشحنات، الشهادات، الإيصالات، العقود
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {result.found && result.shipment ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-700 dark:text-green-300">
                  وثيقة صحيحة ✓
                </span>
                <span className="text-sm text-green-600 dark:text-green-400 mr-auto" dir="ltr">
                  {result.shipment.shipment_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-right">
                  <span className="text-muted-foreground">نوع النفايات:</span>
                  <p className="font-medium">
                    {wasteTypeLabels[result.shipment.waste_type] || result.shipment.waste_type}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">الكمية:</span>
                  <p className="font-medium">
                    {result.shipment.quantity} {result.shipment.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">الحالة:</span>
                  <p className="font-medium">
                    {statusLabels[result.shipment.status] || result.shipment.status}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <p className="font-medium">
                    {new Date(result.shipment.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-muted-foreground">الجهات:</span>
                  <p className="font-medium text-xs mt-1">
                    {result.shipment.generator_name} → {result.shipment.transporter_name} → {result.shipment.recycler_name}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="mt-3 w-full"
              >
                بحث جديد
              </Button>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileX className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-bold text-red-700 dark:text-red-300">
                  وثيقة غير موجودة ✗
                </span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                لم يتم العثور على وثيقة بهذا الرقم في النظام
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="mt-3 w-full"
              >
                حاول مرة أخرى
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );

  // If open/onOpenChange props are provided, render as Dialog
  if (open !== undefined && onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              التحقق من صحة الوثيقة
            </DialogTitle>
          </DialogHeader>
          {verificationContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise render as Card
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-right">
          <Shield className="w-5 h-5 text-primary" />
          التحقق من صحة الوثائق
        </CardTitle>
        <CardDescription className="text-right">
          تحقق من صحة وثيقة شحنة عبر إدخال رقم الوثيقة
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verificationContent}
      </CardContent>
    </Card>
  );
};

export default DocumentVerificationWidget;
