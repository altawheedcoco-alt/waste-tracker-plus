import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, FileCheck, FileX, Loader2, Shield, Camera, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

const DocumentVerification = () => {
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

    // Add SHP- prefix if not already present
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

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Shield className="w-5 h-5" />
            <span className="font-medium">التحقق من صحة الوثائق</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">تحقق من صحة وثيقة الشحنة</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            يمكنك التحقق من صحة أي وثيقة شحنة من خلال إدخال رقم الوثيقة أو مسح رمز QR
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                التحقق من الوثيقة
              </CardTitle>
              <CardDescription>
                أدخل رقم الوثيقة للتحقق من صحتها ومعرفة تفاصيلها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="number" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="number" className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    رقم الوثيقة
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    مسح QR
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="number" className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <Button
                      onClick={handleVerify}
                      disabled={isLoading}
                      size="lg"
                      className="h-12 px-6"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-5 h-5 ml-2" />
                          تحقق
                        </>
                      )}
                    </Button>
                    <div className="flex-1 flex items-center gap-0 h-12">
                      <Input
                        placeholder="أدخل الرقم (مثال: 20260128-4098)"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 text-lg h-12 rounded-l-none border-l-0"
                        dir="ltr"
                      />
                      <div className="bg-muted border border-input h-12 px-3 flex items-center rounded-l-md text-sm font-medium text-muted-foreground">
                        SHP-
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
                    <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground mb-4">
                      امسح رمز QR الموجود على أي مستند للتحقق من صحته
                    </p>
                    <Button 
                      size="lg" 
                      onClick={() => navigate('/scan')}
                      className="gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      فتح الماسح الضوئي
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      يدعم: الشحنات، شهادات التدوير، إيصالات الاستلام، العقود
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Verification Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-6"
                >
                  {result.found && result.shipment ? (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-700 dark:text-green-300">
                            وثيقة صحيحة ✓
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            رقم الوثيقة: {result.shipment.shipment_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">نوع النفايات:</span>
                          <p className="font-medium">
                            {wasteTypeLabels[result.shipment.waste_type] || result.shipment.waste_type}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الكمية:</span>
                          <p className="font-medium">
                            {result.shipment.quantity} {result.shipment.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الحالة:</span>
                          <p className="font-medium">
                            {statusLabels[result.shipment.status] || result.shipment.status}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                          <p className="font-medium">
                            {new Date(result.shipment.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">الجهة المولدة:</span>
                          <p className="font-medium">{result.shipment.generator_name}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">شركة النقل:</span>
                          <p className="font-medium">{result.shipment.transporter_name}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">جهة التدوير:</span>
                          <p className="font-medium">{result.shipment.recycler_name}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <FileX className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-700 dark:text-red-300">
                            وثيقة غير موجودة ✗
                          </h3>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            لم يتم العثور على وثيقة بهذا الرقم في النظام
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default DocumentVerification;
