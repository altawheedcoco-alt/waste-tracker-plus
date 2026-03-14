import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useReportTemplates, ReportTemplate, getWasteCategoryFromType } from '@/hooks/useReportTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
// jsPDF & html2canvas loaded dynamically via usePDFExport / PDFService
import {
  FileText,
  Printer,
  Download,
  Loader2,
  Building2,
  Truck,
  Recycle,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Settings,
  Save,
  CheckCircle,
  Send,
  Eye,
  Package,
} from 'lucide-react';
import TransporterReceiptCertificatePrint from './TransporterReceiptCertificatePrint';
import RecyclingTemplatesLibrary from './RecyclingTemplatesLibrary';
import type { RecyclingReportTemplate } from '@/lib/recyclingReportTemplates';
import SignDocumentButton from '@/components/signature/SignDocumentButton';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
import SendForSigningButton from '@/components/documents/SendForSigningButton';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  waste_description?: string;
  disposal_method?: string;
  pickup_address?: string;
  delivery_address?: string;
  pickup_date?: string | null;
  expected_delivery_date?: string | null;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  generator?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    client_code?: string | null;
  } | null;
  transporter?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    logo_url?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    client_code?: string | null;
  } | null;
  recycler?: {
    name: string;
    name_en?: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    region?: string | null;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
    representative_position?: string | null;
    representative_phone?: string | null;
    representative_national_id?: string | null;
    stamp_url?: string | null;
    signature_url?: string | null;
    logo_url?: string | null;
    client_code?: string | null;
  } | null;
}

interface TransporterReceiptCertificateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
}

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const TransporterReceiptCertificateDialog = ({
  isOpen,
  onClose,
  shipment,
}: TransporterReceiptCertificateDialogProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent, isExporting } = usePDFExport({
    filename: `transport-receipt-${shipment.shipment_number}`,
    orientation: 'portrait',
  });

  const [customNotes, setCustomNotes] = useState('');
  const [transportDetails, setTransportDetails] = useState('');
  const [openingDeclaration, setOpeningDeclaration] = useState('');
  const [closingDeclaration, setClosingDeclaration] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [isSaved, setIsSaved] = useState(false);

  // Set default declarations
  useEffect(() => {
    if (isOpen && !openingDeclaration) {
      setOpeningDeclaration(
        `نفيدكم بأن شركة ${organization?.name || 'جهة النقل'} قد استلمت الشحنة رقم ${shipment.shipment_number} من الجهة المولدة (${shipment.generator?.name || 'غير محدد'}) وتم نقلها بنجاح وتسليمها إلى جهة الاستلام (${shipment.recycler?.name || 'غير محدد'}) وفقاً للإجراءات والاشتراطات البيئية والقانونية المعتمدة.`
      );
    }
  }, [isOpen]);

  const handlePrint = () => {
    if (printRef.current) {
      printContent(printRef.current);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) { toast.error('لا يوجد محتوى للتصدير'); return; }
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) { toast.error('فشل في إنشاء ملف PDF'); return; }
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = blobUrl;
      link.download = `شهادة-استلام-نقل-${shipment.shipment_number}-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('حدث خطأ أثناء تحميل PDF');
    }
  };

  const handlePreviewPDF = async () => {
    if (!printRef.current) { toast.error('لا يوجد محتوى للمعاينة'); return; }
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) { toast.error('فشل في إنشاء ملف PDF'); return; }
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('حدث خطأ أثناء معاينة PDF');
    }
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!printRef.current) return null;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Truck className="w-6 h-6 text-primary" />
              شهادة استلام ونقل الشحنة
            </DialogTitle>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Package className="w-4 h-4 ml-1" />
              شهادة نقل
            </Badge>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="templates" className="gap-2">
                <Settings className="w-4 h-4" />
                القوالب
              </TabsTrigger>
              <TabsTrigger value="write" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                كتابة الشهادة
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <FileText className="w-4 h-4" />
                معاينة وطباعة
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-0">
            <ScrollArea className="h-[60vh] px-6 py-4">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    مكتبة قوالب النقل
                    <Badge variant="secondary" className="mr-2">قوالب جاهزة</Badge>
                  </h3>
                  
                  <RecyclingTemplatesLibrary
                    wasteType={shipment.waste_type}
                    onSelectTemplate={(template: RecyclingReportTemplate) => {
                      setOpeningDeclaration(template.opening_declaration || '');
                      setTransportDetails(template.processing_details_template || '');
                      setClosingDeclaration(template.closing_declaration || '');
                      setActiveTab('write');
                      toast.success(`تم تحميل قالب: ${template.name}`);
                    }}
                  />
                </div>

                <Separator />

                {/* Quick templates specific to transport */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    قوالب سريعة للناقل
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card 
                      className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30"
                      onClick={() => {
                        setOpeningDeclaration(`نفيدكم بأن شركة ${organization?.name || 'جهة النقل'} قد استلمت الشحنة رقم ${shipment.shipment_number} من ${shipment.generator?.name || 'الجهة المولدة'} وتم نقلها بالكامل وفقاً للاشتراطات البيئية المعتمدة.`);
                        setTransportDetails(`تم النقل بمركبة مرخصة ومطابقة لنوع المخلفات المنقولة. تم الالتزام بالمسار المحدد ومعايير السلامة طوال فترة النقل.`);
                        setClosingDeclaration(`نقر نحن ${organization?.name || 'جهة النقل'} بأنه تم استلام ونقل وتسليم الشحنة رقم ${shipment.shipment_number} بكامل محتوياتها دون نقص أو تلاعب وفقاً للمتطلبات القانونية والبيئية المعتمدة.`);
                        setActiveTab('write');
                        toast.success('تم تحميل القالب القياسي');
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">القالب القياسي للنقل</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">شهادة استلام ونقل قياسية تتضمن إقرار الاستلام والنقل والتسليم</p>
                        <Badge variant="secondary" className="mt-2 text-xs">الأكثر استخداماً</Badge>
                      </CardContent>
                    </Card>

                    <Card 
                      className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/30"
                      onClick={() => {
                        setOpeningDeclaration(`إشارة إلى عقد النقل المبرم بين ${organization?.name || 'جهة النقل'} و${shipment.generator?.name || 'الجهة المولدة'}، نفيدكم بأنه تم استلام الشحنة رقم ${shipment.shipment_number} المحتوية على ${wasteTypeLabels[shipment.waste_type] || shipment.waste_type} بوزن ${shipment.quantity} ${shipment.unit || 'كجم'} وتم نقلها بنجاح.`);
                        setTransportDetails(`تم النقل بمركبة مرخصة ومجهزة لنقل هذا النوع من المخلفات. تم التحقق من التعبئة والتغليف ومطابقتها للاشتراطات. تم الالتزام بالمسار والجدول الزمني المحدد. لم تُسجل أي حوادث أو انسكابات أثناء عملية النقل.`);
                        setClosingDeclaration(`نقر نحن ${organization?.name || 'جهة النقل'} بأنه تم استلام الشحنة من المصدر ونقلها وتسليمها بالكامل إلى الوجهة المحددة (${shipment.recycler?.name || 'جهة الاستلام'}) بكامل محتوياتها ووفقاً لسلسلة الحيازة (Chain of Custody) دون أي انتهاك أو تلاعب.`);
                        setActiveTab('write');
                        toast.success('تم تحميل القالب التفصيلي');
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">القالب التفصيلي للنقل</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">شهادة مفصلة تتضمن تفاصيل المركبة والمسار وسلسلة الحيازة</p>
                        <Badge variant="outline" className="mt-2 text-xs">تفصيلي</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t flex justify-between items-center">
              <Button variant="outline" onClick={onClose}>إلغاء</Button>
              <Button onClick={() => setActiveTab('write')} className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                متابعة للكتابة
              </Button>
            </div>
          </TabsContent>

          {/* Write Tab */}
          <TabsContent value="write" className="mt-0">
            <ScrollArea className="h-[60vh] px-6 py-4">
              <div className="space-y-6">
                {/* Shipment Info Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    بيانات الشحنة
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">رقم الشحنة:</span>
                      <p className="font-mono font-bold">{shipment.shipment_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">نوع المخلفات:</span>
                      <p>{wasteTypeLabels[shipment.waste_type] || shipment.waste_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الكمية:</span>
                      <p>{shipment.quantity} {shipment.unit || 'كجم'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تاريخ الاستلام:</span>
                      <p>{shipment.pickup_date ? format(new Date(shipment.pickup_date), 'PP', { locale: ar }) : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Parties Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <Building2 className="w-4 h-4" />
                      الجهة المولدة
                    </h4>
                    <p className="text-sm font-medium">{shipment.generator?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{shipment.generator?.city}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 ring-2 ring-purple-200 dark:ring-purple-800">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                      <Truck className="w-4 h-4" />
                      جهة النقل (المُصدِر)
                    </h4>
                    <p className="text-sm font-medium">{organization?.name || shipment.transporter?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{(organization as any)?.city || shipment.transporter?.city}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Recycle className="w-4 h-4" />
                      جهة الاستلام
                    </h4>
                    <p className="text-sm font-medium">{shipment.recycler?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{shipment.recycler?.city}</p>
                  </div>
                </div>

                {/* Opening Declaration */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" />
                    إقرار الاستلام والنقل
                  </Label>
                  <Textarea
                    value={openingDeclaration}
                    onChange={(e) => setOpeningDeclaration(e.target.value)}
                    placeholder="نص الإقرار الافتتاحي لاستلام ونقل الشحنة..."
                    className="min-h-[80px] text-right"
                    dir="rtl"
                  />
                </div>

                {/* Transport Details */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    تفاصيل عملية النقل
                  </Label>
                  <Textarea
                    value={transportDetails}
                    onChange={(e) => setTransportDetails(e.target.value)}
                    placeholder="تفاصيل المركبة المستخدمة، المسار، مدة النقل، حالة الشحنة عند الاستلام والتسليم..."
                    className="min-h-[100px] text-right"
                    dir="rtl"
                  />
                </div>

                {/* Custom Notes */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    ملاحظات إضافية
                  </Label>
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية تود إضافتها للشهادة..."
                    className="min-h-[80px] text-right"
                    dir="rtl"
                  />
                </div>

                {/* Closing Declaration */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    الإقرار الختامي
                  </h4>
                  <Textarea
                    value={closingDeclaration || `نقر نحن ${organization?.name || 'جهة النقل'} بأنه تم استلام الشحنة رقم ${shipment.shipment_number} من الجهة المولدة ونقلها وتسليمها بالكامل إلى جهة الاستلام بكامل محتوياتها دون نقص أو تلاعب، وذلك وفقاً للاشتراطات البيئية والقانونية المعتمدة.`}
                    onChange={(e) => setClosingDeclaration(e.target.value)}
                    className="min-h-[100px] text-right bg-transparent border-none resize-none text-blue-700 dark:text-blue-400"
                    dir="rtl"
                  />
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t flex justify-between items-center">
              <Button variant="outline" onClick={() => setActiveTab('templates')}>
                العودة للقوالب
              </Button>
              <Button onClick={() => setActiveTab('preview')} className="gap-2">
                <FileText className="w-4 h-4" />
                معاينة الشهادة
              </Button>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-0">
            <ScrollArea className="h-[60vh]">
              <div ref={printRef} className="bg-white">
                <TransporterReceiptCertificatePrint
                  shipment={shipment}
                  template="custom"
                  customNotes={customNotes}
                  transportDetails={transportDetails}
                  openingDeclaration={openingDeclaration}
                  closingDeclaration={closingDeclaration || `نقر نحن ${organization?.name || 'جهة النقل'} بأنه تم استلام الشحنة رقم ${shipment.shipment_number} من الجهة المولدة ونقلها وتسليمها بالكامل إلى جهة الاستلام بكامل محتوياتها دون نقص أو تلاعب، وذلك وفقاً للاشتراطات البيئية والقانونية المعتمدة.`}
                  transporterOrg={organization}
                />
              </div>
            </ScrollArea>

            <div className="p-6 pt-4 border-t flex justify-between items-center">
              <Button variant="outline" onClick={() => setActiveTab('write')}>
                العودة للتعديل
              </Button>
              <div className="flex gap-2 flex-wrap">
                <ShareDocumentButton
                  referenceId={shipment.id}
                  referenceType="receipt"
                  documentTitle={`شهادة استلام ونقل - ${shipment.shipment_number}`}
                />
                <SendForSigningButton
                  documentTitle={`شهادة استلام ونقل - ${shipment.shipment_number}`}
                  documentType="receipt"
                  documentId={shipment.id}
                  relatedShipmentId={shipment.id}
                />
                <SignDocumentButton
                  documentType="receipt"
                  documentId={shipment.id}
                  documentTitle={`شهادة استلام ونقل - ${shipment.shipment_number}`}
                  variant="outline"
                  size="default"
                />
                <Button variant="outline" onClick={handlePreviewPDF} className="gap-2">
                  <Eye className="w-4 h-4" />
                  معاينة PDF
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
                <Button onClick={handleDownloadPDF} className="gap-2">
                  <Download className="w-4 h-4" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default TransporterReceiptCertificateDialog;
