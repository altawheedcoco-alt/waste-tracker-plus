import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useReportTemplates, ReportTemplate, getWasteCategoryFromType, systemTemplates } from '@/hooks/useReportTemplates';
import { useRecyclingReports } from '@/hooks/useRecyclingReports';
import { supabase } from '@/integrations/supabase/client';
import { calculateShipmentCarbon, type ShipmentCarbonResult } from '@/lib/carbonEngine';
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
  Plus,
  AlertTriangle,
  Biohazard,
  Leaf,
  Settings,
  Save,
  CheckCircle,
  Send,
  Eye,
} from 'lucide-react';
import RecyclingCertificatePrint from './RecyclingCertificatePrint';
import CreateTemplateDialog from './CreateTemplateDialog';
import RecyclingTemplatesLibrary from './RecyclingTemplatesLibrary';
import type { RecyclingReportTemplate } from '@/lib/recyclingReportTemplates';

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

interface RecyclingCertificateDialogProps {
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

const wasteCategoryLabels: Record<string, { label: string; icon: any; color: string }> = {
  hazardous: { label: 'مخلفات خطرة', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
  non_hazardous: { label: 'مخلفات غير خطرة', icon: Leaf, color: 'text-green-600 bg-green-100' },
  medical_hazardous: { label: 'مخلفات طبية خطرة', icon: Biohazard, color: 'text-purple-600 bg-purple-100' },
  all: { label: 'جميع الأنواع', icon: Recycle, color: 'text-blue-600 bg-blue-100' },
};

const RecyclingCertificateDialog = ({
  isOpen,
  onClose,
  shipment,
}: RecyclingCertificateDialogProps) => {
  const { organization } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const { exportToPDF, printContent: printContentFn, isExporting } = usePDFExport({
    filename: `recycling-certificate-${shipment.shipment_number}`,
    orientation: 'portrait',
  });
  
  const { templates, loading: templatesLoading, getApplicableTemplates, incrementUsage } = useReportTemplates();
  const { saveReport, loading: savingReport, getReportByShipmentId, updateReportPdfUrl } = useRecyclingReports();
  const [isSendingPdf, setIsSendingPdf] = useState(false);
  const [carbonData, setCarbonData] = useState<ShipmentCarbonResult | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customNotes, setCustomNotes] = useState('');
  const [processingDetails, setProcessingDetails] = useState('');
  const [openingDeclaration, setOpeningDeclaration] = useState('');
  const [closingDeclaration, setClosingDeclaration] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isSaved, setIsSaved] = useState(false);
  const [existingReportId, setExistingReportId] = useState<string | null>(null);

  // Check if report already exists and load carbon data
  useEffect(() => {
    const checkExistingReport = async () => {
      const existing = await getReportByShipmentId(shipment.id);
      if (existing) {
        setExistingReportId(existing.id);
        setOpeningDeclaration(existing.opening_declaration || '');
        setProcessingDetails(existing.processing_details || '');
        setClosingDeclaration(existing.closing_declaration || '');
        setCustomNotes(existing.custom_notes || '');
        setIsSaved(true);
      }
    };
    const loadCarbon = async () => {
      const result = await calculateShipmentCarbon(shipment.id);
      setCarbonData(result);
    };
    if (isOpen) {
      checkExistingReport();
      loadCarbon();
    }
  }, [isOpen, shipment.id, getReportByShipmentId]);

  // Get applicable templates for this shipment's waste type
  const wasteCategory = getWasteCategoryFromType(shipment.waste_type);
  const applicableTemplates = getApplicableTemplates(shipment.waste_type);

  // Filter templates by category
  const filteredTemplates = categoryFilter === 'all' 
    ? applicableTemplates 
    : applicableTemplates.filter(t => t.waste_category === categoryFilter);

  // Group templates by type
  const systemTemplatesList = filteredTemplates.filter(t => t.template_type === 'system');
  const customTemplatesList = filteredTemplates.filter(t => t.template_type === 'custom');

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setOpeningDeclaration(template.opening_declaration || '');
        setProcessingDetails(template.processing_details_template || '');
        setClosingDeclaration(template.closing_declaration || '');
        incrementUsage(template.id);
      }
    }
  }, [selectedTemplateId]);

  // Set default declarations based on waste category
  useEffect(() => {
    if (!selectedTemplateId && !openingDeclaration) {
      const defaultTemplate = systemTemplates.find(t => 
        t.waste_category === wasteCategory || t.waste_category === 'all'
      );
      if (defaultTemplate) {
        setOpeningDeclaration(defaultTemplate.opening_declaration || '');
        setClosingDeclaration(defaultTemplate.closing_declaration || '');
      }
    }
  }, [wasteCategory, selectedTemplateId]);

  const handlePrint = () => {
    if (printRef.current) {
      printContentFn(printRef.current);
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) {
      toast.error('لا يوجد محتوى للتصدير');
      return;
    }

    try {
      // Generate PDF blob
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        toast.error('فشل في إنشاء ملف PDF');
        return;
      }

      // Create download link
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = blobUrl;
      link.download = `شهادة-اعادة-تدوير-${shipment.shipment_number}-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after download
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      toast.success('تم تحميل ملف PDF بنجاح');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('حدث خطأ أثناء تحميل PDF');
    }
  };

  const handlePreviewPDF = async () => {
    if (!printRef.current) {
      toast.error('لا يوجد محتوى للمعاينة');
      return;
    }

    try {
      // Generate PDF blob
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        toast.error('فشل في إنشاء ملف PDF');
        return;
      }

      // Open PDF in new tab for preview
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('حدث خطأ أثناء معاينة PDF');
    }
  };

  const handleSaveReport = async () => {
    if (isSaved) {
      toast.info('تم حفظ هذا التقرير مسبقاً');
      return;
    }

    const finalClosing = closingDeclaration || `نقر نحن ${organization?.name || 'جهة التدوير'} بأنه قد تم استلام الشحنة رقم ${shipment.shipment_number} بكامل محتوياتها وبحالة سليمة، وقد تمت إعادة تدويرها بالكامل وفقاً للمعايير والمتطلبات البيئية والقانونية والصناعية المنظمة لنشاط إعادة تدوير المخلفات، وذلك طبقاً للأنظمة واللوائح المعمول بها.`;

    const result = await saveReport({
      shipment_id: shipment.id,
      template_id: selectedTemplateId || undefined,
      opening_declaration: openingDeclaration,
      processing_details: processingDetails,
      closing_declaration: finalClosing,
      custom_notes: customNotes,
      waste_type: shipment.waste_type,
      report_data: {
        generator: shipment.generator?.name,
        transporter: shipment.transporter?.name,
        recycler: shipment.recycler?.name,
        quantity: shipment.quantity,
        unit: shipment.unit,
      },
    });

    if (result) {
      setIsSaved(true);
      setExistingReportId(result.id);
    }
  };

  // Generate PDF blob and upload to storage
  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!printRef.current) {
      toast.error('لا يوجد محتوى للتصدير');
      return null;
    }

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

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

  // Save PDF and send notification
  const handleSaveAndSendPdf = async () => {
    if (!existingReportId && !isSaved) {
      toast.error('يرجى حفظ التقرير أولاً');
      return;
    }

    setIsSendingPdf(true);
    try {
      // Generate PDF blob
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        toast.error('فشل في إنشاء ملف PDF');
        return;
      }

      // Upload to storage
      const fileName = `${shipment.shipment_number}-${Date.now()}.pdf`;
      const filePath = `${shipment.id}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recycling-certificates')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('فشل في رفع ملف PDF');
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('recycling-certificates')
        .getPublicUrl(filePath);

      const pdfUrl = publicUrlData.publicUrl;

      // Update report with PDF URL
      if (existingReportId) {
        await updateReportPdfUrl(existingReportId, pdfUrl);
      }

      // Update existing notifications with PDF URL for this shipment
      const { error: notifyError } = await supabase
        .from('notifications')
        .update({ pdf_url: pdfUrl } as any)
        .eq('shipment_id', shipment.id)
        .eq('type', 'recycling_report');

      if (notifyError) {
        console.error('Error updating notifications:', notifyError);
      }

      toast.success('تم حفظ وإرسال ملف PDF بنجاح');
    } catch (error) {
      console.error('Error saving PDF:', error);
      toast.error('حدث خطأ أثناء حفظ ملف PDF');
    } finally {
      setIsSendingPdf(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const renderTemplateCard = (template: ReportTemplate | typeof systemTemplates[0] & { id?: string }, isSystem: boolean = false) => {
    const categoryInfo = wasteCategoryLabels[template.waste_category];
    const CategoryIcon = categoryInfo?.icon || Recycle;
    const isSelected = 'id' in template && selectedTemplateId === template.id;
    
    return (
      <Card 
        key={'id' in template ? template.id : template.name}
        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
        onClick={() => {
          if ('id' in template && template.id) {
            setSelectedTemplateId(template.id);
            setActiveTab('write');
          }
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
            <Badge variant="outline" className={`text-xs ${categoryInfo?.color || ''}`}>
              <CategoryIcon className="w-3 h-3 ml-1" />
              {categoryInfo?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description || 'بدون وصف'}
          </p>
          {isSystem && (
            <Badge variant="secondary" className="mt-2 text-xs">
              قالب النظام
            </Badge>
          )}
          {'usage_count' in template && template.usage_count > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              استخدم {template.usage_count} مرة
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[96vw] md:w-[90vw] max-h-[90vh] p-0 z-[60]" dir="rtl">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6 text-primary" />
                إنشاء تقرير إعادة التدوير
              </DialogTitle>
              <Badge className={wasteCategoryLabels[wasteCategory]?.color}>
                {React.createElement(wasteCategoryLabels[wasteCategory]?.icon, { className: "w-4 h-4 ml-1" })}
                {wasteCategoryLabels[wasteCategory]?.label}
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
                  كتابة التقرير
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <FileText className="w-4 h-4" />
                  معاينة وطباعة
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="templates" className="mt-0">
              <ScrollArea className="h-[60vh] px-6 py-4">
                <div className="space-y-6">
                  {/* مكتبة القوالب الجاهزة (100+ قالب) */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Recycle className="w-5 h-5 text-primary" />
                      مكتبة القوالب الجاهزة
                      <Badge variant="secondary" className="mr-2">100+ قالب</Badge>
                    </h3>
                    
                    <RecyclingTemplatesLibrary
                      wasteType={shipment.waste_type}
                      onSelectTemplate={(template: RecyclingReportTemplate) => {
                        setOpeningDeclaration(template.opening_declaration || '');
                        setProcessingDetails(template.processing_details_template || '');
                        setClosingDeclaration(template.closing_declaration || '');
                        setActiveTab('write');
                        toast.success(`تم تحميل قالب: ${template.name}`);
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Custom Templates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        القوالب المخصصة
                      </h3>
                      <Button size="sm" variant="outline" onClick={() => setShowCreateTemplate(true)} className="gap-1">
                        <Plus className="w-4 h-4" />
                        إنشاء قالب جديد
                      </Button>
                    </div>
                    
                    {templatesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : customTemplatesList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {customTemplatesList.map(t => renderTemplateCard(t))}
                      </div>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                          <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            لم يتم إنشاء قوالب مخصصة بعد
                          </p>
                          <Button 
                            size="sm" 
                            variant="link" 
                            onClick={() => setShowCreateTemplate(true)}
                            className="mt-2"
                          >
                            إنشاء قالب جديد
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t flex justify-between items-center">
                <Button variant="outline" onClick={onClose}>
                  إلغاء
                </Button>
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
                  {/* Selected Template Info */}
                  {selectedTemplate && (
                    <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">القالب المحدد: {selectedTemplate.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setActiveTab('templates')}
                        className="mr-auto"
                      >
                        تغيير
                      </Button>
                    </div>
                  )}

                  {/* Shipment Info Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Recycle className="w-5 h-5 text-primary" />
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
                        <p>{shipment.delivered_at ? format(new Date(shipment.delivered_at), 'PP', { locale: ar }) : '-'}</p>
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
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Truck className="w-4 h-4" />
                        جهة النقل
                      </h4>
                      <p className="text-sm font-medium">{shipment.transporter?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{shipment.transporter?.city}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Recycle className="w-4 h-4" />
                        جهة التدوير
                      </h4>
                      <p className="text-sm font-medium">{shipment.recycler?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{shipment.recycler?.city}</p>
                    </div>
                  </div>

                  {/* Opening Declaration */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4" />
                      الإقرار الافتتاحي
                    </Label>
                    <Textarea
                      value={openingDeclaration}
                      onChange={(e) => setOpeningDeclaration(e.target.value)}
                      placeholder="نص الإقرار الذي يظهر في بداية التقرير..."
                      className="min-h-[80px] text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Processing Details */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Recycle className="w-4 h-4" />
                      تفاصيل عملية المعالجة والتدوير
                    </Label>
                    <Textarea
                      value={processingDetails}
                      onChange={(e) => setProcessingDetails(e.target.value)}
                      placeholder="اذكر تفاصيل عملية إعادة التدوير، الطرق المستخدمة، نسبة الاسترداد، المخرجات..."
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
                      placeholder="أي ملاحظات أو تعليقات إضافية تود إضافتها للتقرير..."
                      className="min-h-[80px] text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Carbon Impact Preview */}
                  {carbonData && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                        <Leaf className="w-5 h-5" />
                        البصمة الكربونية (محسوبة تلقائياً)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-2 bg-white dark:bg-background rounded">
                          <p className="text-xs text-muted-foreground">إجمالي الانبعاثات</p>
                          <p className="font-bold text-lg text-destructive">{carbonData.totalEmissions.toFixed(3)}</p>
                          <p className="text-xs">طن CO₂</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-background rounded">
                          <p className="text-xs text-muted-foreground">CO₂ تم توفيره</p>
                          <p className="font-bold text-lg text-emerald-600">{carbonData.co2Saved.toFixed(3)}</p>
                          <p className="text-xs">طن CO₂</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-background rounded">
                          <p className="text-xs text-muted-foreground">يعادل زراعة</p>
                          <p className="font-bold text-lg text-emerald-600">{carbonData.treesEquivalent}</p>
                          <p className="text-xs">🌳 شجرة/سنة</p>
                        </div>
                        <div className="text-center p-2 bg-white dark:bg-background rounded">
                          <p className="text-xs text-muted-foreground">مسافة النقل</p>
                          <p className="font-bold text-lg">{carbonData.distanceKm}</p>
                          <p className="text-xs">كم</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Closing Declaration Preview */}
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      الإقرار الختامي
                    </h4>
                    <Textarea
                      value={closingDeclaration || `نقر نحن ${organization?.name || 'جهة التدوير'} بأنه قد تم استلام الشحنة رقم ${shipment.shipment_number} بكامل محتوياتها وبحالة سليمة، وقد تمت إعادة تدويرها بالكامل وفقاً للمعايير والمتطلبات البيئية والقانونية والصناعية المنظمة لنشاط إعادة تدوير المخلفات، وذلك طبقاً للأنظمة واللوائح المعمول بها.`}
                      onChange={(e) => setClosingDeclaration(e.target.value)}
                      className="min-h-[100px] text-right bg-transparent border-none resize-none text-emerald-700 dark:text-emerald-400"
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
                  معاينة التقرير
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <ScrollArea className="h-[60vh]">
                <div ref={printRef} className="bg-white">
                  <RecyclingCertificatePrint
                    shipment={shipment}
                    template={selectedTemplateId || 'custom'}
                    customNotes={customNotes}
                    processingDetails={processingDetails}
                    openingDeclaration={openingDeclaration}
                    closingDeclaration={closingDeclaration || `نقر نحن ${organization?.name || 'جهة التدوير'} بأنه قد تم استلام الشحنة رقم ${shipment.shipment_number} بكامل محتوياتها وبحالة سليمة، وقد تمت إعادة تدويرها بالكامل وفقاً للمعايير والمتطلبات البيئية والقانونية والصناعية المنظمة لنشاط إعادة تدوير المخلفات، وذلك طبقاً للأنظمة واللوائح المعمول بها.`}
                    recyclerOrg={organization}
                    carbonData={carbonData}
                  />
                </div>
              </ScrollArea>

              <div className="p-6 pt-4 border-t flex justify-between items-center">
                <Button variant="outline" onClick={() => setActiveTab('write')}>
                  العودة للتعديل
                </Button>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={isSaved ? "secondary" : "default"}
                    onClick={handleSaveReport} 
                    disabled={savingReport || isSaved} 
                    className="gap-2"
                  >
                    {savingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSaved ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaved ? 'تم الحفظ' : 'حفظ التقرير'}
                  </Button>
                  {isSaved && (
                    <Button 
                      variant="default"
                      onClick={handleSaveAndSendPdf} 
                      disabled={isSendingPdf} 
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSendingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      حفظ وإرسال PDF
                    </Button>
                  )}
                  <Button variant="outline" onClick={handlePreviewPDF} className="gap-2">
                    <Eye className="w-4 h-4" />
                    معاينة PDF
                  </Button>
                  <Button variant="outline" onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" />
                    طباعة الوثيقة
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

      <CreateTemplateDialog
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
      />
    </>
  );
};

export default RecyclingCertificateDialog;