import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, FileCheck, FileX, Loader2, Shield, Camera, Package, FileText, Receipt, Scale, Award, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQRVerification } from '@/hooks/useQRVerification';
import { DOCUMENT_TYPE_LABELS, DocumentQRType } from '@/lib/documentQR';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', collecting: 'قيد التجميع',
  in_transit: 'قيد النقل', delivered: 'تم التسليم', confirmed: 'مؤكدة',
  cancelled: 'ملغية', active: 'نشط', expired: 'منتهي', draft: 'مسودة',
  paid: 'مدفوعة', unpaid: 'غير مدفوعة', partial: 'مدفوعة جزئياً',
};

const docTypeIcons: Record<string, React.ReactNode> = {
  shipment: <Package className="w-4 h-4" />,
  certificate: <FileCheck className="w-4 h-4" />,
  receipt: <Receipt className="w-4 h-4" />,
  contract: <FileText className="w-4 h-4" />,
  invoice: <FileText className="w-4 h-4" />,
  disposal: <Shield className="w-4 h-4" />,
  award_letter: <Award className="w-4 h-4" />,
  statement: <Scale className="w-4 h-4" />,
  report: <FileText className="w-4 h-4" />,
  entity_certificate: <Building2 className="w-4 h-4" />,
};

const DocumentVerification = () => {
  const navigate = useNavigate();
  const [documentNumber, setDocumentNumber] = useState('');
  const { loading, result, verify, reset } = useQRVerification();

  const handleVerify = async () => {
    if (!documentNumber.trim()) {
      toast.error('يرجى إدخال رقم أو كود الوثيقة');
      return;
    }
    reset();
    await verify(documentNumber.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const typeLabel = result?.type
    ? DOCUMENT_TYPE_LABELS[result.type as DocumentQRType]?.ar || result.type
    : '';

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
          <h2 className="text-3xl font-bold mb-4">تحقق من صحة أي وثيقة</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            أدخل رقم أي مستند — شحنة، شهادة تدوير، إيصال، فاتورة، عقد، خطاب ترسية — أو امسح رمز QR للتحقق الفوري
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
                التحقق الشامل من الوثائق
              </CardTitle>
              <CardDescription>
                أدخل رقم الوثيقة (مثل SHP-xxx، INV-xxx، CNT-xxx، AWL-xxx...) أو أي كود تحقق
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
                    <Button onClick={handleVerify} disabled={loading} size="lg" className="h-12 px-6">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <><Search className="w-5 h-5 ml-2" />تحقق</>
                      )}
                    </Button>
                    <Input
                      placeholder="أدخل رقم الوثيقة أو كود التحقق..."
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 text-lg h-12"
                      dir="ltr"
                    />
                  </div>
                  {/* Supported types hints */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['shipment', 'certificate', 'receipt', 'contract', 'invoice', 'disposal', 'award_letter'].map(t => (
                      <Badge key={t} variant="outline" className="text-[10px] gap-1">
                        {docTypeIcons[t]}
                        {DOCUMENT_TYPE_LABELS[t as DocumentQRType]?.ar}
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
                    <QrCode className="w-16 h-16 mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground mb-4">
                      امسح رمز QR الموجود على أي مستند للتحقق من صحته
                    </p>
                    <Button size="lg" onClick={() => navigate('/scan')} className="gap-2">
                      <Camera className="w-5 h-5" />
                      فتح الماسح الضوئي
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      يدعم جميع أنواع المستندات: شحنات، شهادات، إيصالات، عقود، فواتير، خطابات ترسية
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
                  {result.isValid ? (
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-700 dark:text-green-300">
                            وثيقة صحيحة ✓
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                              {docTypeIcons[result.type] || <FileText className="w-3 h-3" />}
                              {typeLabel}
                            </Badge>
                            <span className="text-sm text-green-600 dark:text-green-400 font-mono">
                              {result.reference}
                            </span>
                          </div>
                        </div>
                      </div>

                      {result.status && (
                        <div className="mb-3">
                          <span className="text-muted-foreground text-sm">الحالة: </span>
                          <Badge variant="secondary">{statusLabels[result.status] || result.status}</Badge>
                        </div>
                      )}

                      {result.data && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(result.data as Record<string, any>)
                            .filter(([k, v]) => v && typeof v !== 'object' && !['id', 'generator_id', 'transporter_id', 'recycler_id', 'organization_id', 'created_by'].includes(k))
                            .slice(0, 8)
                            .map(([key, value]) => (
                              <div key={key}>
                                <span className="text-muted-foreground text-xs">{key.replace(/_/g, ' ')}: </span>
                                <p className="font-medium truncate">{String(value)}</p>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {result.verifiedAt && (
                        <p className="text-xs text-green-500 mt-3">
                          تم التحقق في: {new Date(result.verifiedAt).toLocaleString('ar-SA')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <FileX className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-red-700 dark:text-red-300">وثيقة غير موجودة ✗</h3>
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {result.message || 'لم يتم العثور على وثيقة بهذا الرقم في النظام'}
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
