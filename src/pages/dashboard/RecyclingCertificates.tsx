import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  FileCheck,
  Search,
  Eye,
  Download,
  Recycle,
  Package,
  Building2,
  Calendar,
  Printer,
  Filter,
  FileText,
  Share2,
  Send,
  Truck,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import AggregateReportPrint from '@/components/reports/AggregateReportPrint';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RecyclingReport {
  id: string;
  report_number: string;
  waste_category: string;
  processing_details: string | null;
  opening_declaration: string | null;
  closing_declaration: string | null;
  custom_notes: string | null;
  created_at: string;
  shipment: {
    id: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string;
    pickup_address: string;
    delivery_address: string;
    delivered_at: string | null;
    confirmed_at: string | null;
    generator: { name: string } | null;
    transporter: { name: string } | null;
    recycler: { name: string } | null;
  } | null;
  recycler_organization: {
    id: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
  } | null;
}

const wasteCategoryLabels: Record<string, string> = {
  hazardous: 'خطرة',
  non_hazardous: 'غير خطرة',
  all: 'الكل',
};

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'بناء',
  other: 'أخرى',
};

const RecyclingCertificates = () => {
  const { organization, roles, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<RecyclingReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<RecyclingReport | null>(null);
  const { toast } = useToast();
  
  // Aggregate Report States
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('certificates');
  const [aggregateShipments, setAggregateShipments] = useState<any[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [aggregateSearchQuery, setAggregateSearchQuery] = useState('');
  const [includeStamps, setIncludeStamps] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSavingToStorage, setIsSavingToStorage] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [partnerOrganizations, setPartnerOrganizations] = useState<any[]>([]);

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';

  useEffect(() => {
    fetchRecyclingReports();
  }, [organization?.id, isAdmin]);

  const fetchRecyclingReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('recycling_reports')
        .select(`
          id,
          report_number,
          waste_category,
          processing_details,
          opening_declaration,
          closing_declaration,
          custom_notes,
          created_at,
          shipment:shipments!recycling_reports_shipment_id_fkey(
            id,
            shipment_number,
            waste_type,
            quantity,
            unit,
            pickup_address,
            delivery_address,
            delivered_at,
            confirmed_at,
            generator:organizations!shipments_generator_id_fkey(name),
            transporter:organizations!shipments_transporter_id_fkey(name),
            recycler:organizations!shipments_recycler_id_fkey(name)
          ),
          recycler_organization:organizations!recycling_reports_recycler_organization_id_fkey(
            id,
            name,
            logo_url,
            stamp_url,
            signature_url
          )
        `)
        .order('created_at', { ascending: false });

      // For transporter, filter by shipments where they are the transporter
      if (isTransporter && organization?.id) {
        // First get shipment IDs where this org is the transporter
        const { data: transporterShipments } = await supabase
          .from('shipments')
          .select('id')
          .eq('transporter_id', organization.id);

        if (transporterShipments && transporterShipments.length > 0) {
          const shipmentIds = transporterShipments.map(s => s.id);
          query = query.in('shipment_id', shipmentIds);
        } else {
          // No shipments for this transporter
          setReports([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports((data as unknown as RecyclingReport[]) || []);
    } catch (error) {
      console.error('Error fetching recycling reports:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تقارير إعادة التدوير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch shipments for aggregate report
  const fetchAggregateShipments = async () => {
    setLoadingShipments(true);
    try {
      let query = supabase
        .from('shipments')
        .select(`
          id,
          shipment_number,
          waste_type,
          quantity,
          unit,
          status,
          pickup_address,
          delivery_address,
          created_at,
          pickup_date,
          delivered_at,
          generator:organizations!shipments_generator_id_fkey(id, name, logo_url, stamp_url, signature_url, client_code, email),
          transporter:organizations!shipments_transporter_id_fkey(id, name, logo_url, stamp_url, signature_url, client_code, email),
          recycler:organizations!shipments_recycler_id_fkey(id, name, logo_url, stamp_url, signature_url, client_code, email)
        `)
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', `${endDate}T23:59:59`);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter as any);
      if (wasteTypeFilter !== 'all') query = query.eq('waste_type', wasteTypeFilter as any);

      // Filter based on organization role
      if (!isAdmin && organization?.id) {
        if (organization.organization_type === 'generator') {
          query = query.eq('generator_id', organization.id);
        } else if (organization.organization_type === 'transporter') {
          query = query.eq('transporter_id', organization.id);
        } else if (organization.organization_type === 'recycler') {
          query = query.eq('recycler_id', organization.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setAggregateShipments(data || []);

      // Extract unique partner organizations
      const partners = new Map();
      (data || []).forEach((s: any) => {
        if (s.generator?.id) partners.set(s.generator.id, { ...s.generator, type: 'generator' });
        if (s.transporter?.id) partners.set(s.transporter.id, { ...s.transporter, type: 'transporter' });
        if (s.recycler?.id) partners.set(s.recycler.id, { ...s.recycler, type: 'recycler' });
      });
      setPartnerOrganizations(Array.from(partners.values()).filter(p => p.id !== organization?.id));
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل بيانات الشحنات', variant: 'destructive' });
    } finally {
      setLoadingShipments(false);
    }
  };

  // Filter aggregate shipments
  const filteredAggregateShipments = aggregateShipments.filter(s => {
    if (!aggregateSearchQuery) return true;
    const q = aggregateSearchQuery.toLowerCase();
    return (
      s.shipment_number?.toLowerCase().includes(q) ||
      s.generator?.name?.toLowerCase().includes(q) ||
      s.transporter?.name?.toLowerCase().includes(q) ||
      s.recycler?.name?.toLowerCase().includes(q) ||
      wasteTypeLabels[s.waste_type]?.toLowerCase().includes(q)
    );
  });

  // Generate PDF
  const generatePDF = useCallback(async (): Promise<Blob | null> => {
    const element = printRef.current;
    if (!element) {
      toast({ title: 'خطأ', description: 'لا يوجد محتوى للتصدير', variant: 'destructive' });
      return null;
    }

    try {
      const canvas = await html2canvas(element, {
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
  }, [toast]);

  // Download PDF
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const pdfBlob = await generatePDF();
      if (pdfBlob) {
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `تقرير-مجمع-الشحنات-${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'نجاح', description: 'تم تحميل التقرير بنجاح' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء تحميل التقرير', variant: 'destructive' });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print report
  const handlePrintReport = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  // Save and share report
  const handleSaveAndShare = async () => {
    if (selectedPartners.length === 0) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار جهة واحدة على الأقل للمشاركة', variant: 'destructive' });
      return;
    }

    setIsSavingToStorage(true);
    try {
      const pdfBlob = await generatePDF();
      if (!pdfBlob) throw new Error('Failed to generate PDF');

      const reportNumber = `AGR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const fileName = `${reportNumber}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('recycling-certificates')
        .upload(`aggregate-reports/${fileName}`, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('recycling-certificates')
        .getPublicUrl(`aggregate-reports/${fileName}`);

      const pdfUrl = urlData?.publicUrl;

      const { data: partnerProfiles } = await supabase
        .from('profiles')
        .select('user_id, organization_id')
        .in('organization_id', selectedPartners)
        .eq('is_active', true);

      if (partnerProfiles && partnerProfiles.length > 0) {
        const notifications = partnerProfiles.map(p => ({
          user_id: p.user_id,
          title: 'تقرير مجمع للشحنات',
          message: `شاركت ${organization?.name} تقريرًا مجمعًا للشحنات يتضمن ${filteredAggregateShipments.length} شحنة`,
          type: 'aggregate_report',
          pdf_url: pdfUrl,
        }));

        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) throw notifError;
      }

      const selectedPartnersData = partnerOrganizations.filter(p => selectedPartners.includes(p.id));
      toast({ title: 'نجاح', description: `تم حفظ التقرير ومشاركته مع ${selectedPartnersData.map(p => p.name).join('، ')}` });
      setShowShareDialog(false);
      setSelectedPartners([]);
    } catch (error) {
      console.error('Error saving and sharing report:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ ومشاركة التقرير', variant: 'destructive' });
    } finally {
      setIsSavingToStorage(false);
    }
  };

  const filteredReports = reports.filter(report => {
    const searchLower = searchQuery.toLowerCase();
    return (
      report.report_number.toLowerCase().includes(searchLower) ||
      report.shipment?.shipment_number.toLowerCase().includes(searchLower) ||
      report.recycler_organization?.name.toLowerCase().includes(searchLower) ||
      report.shipment?.generator?.name?.toLowerCase().includes(searchLower)
    );
  });

  const handlePrint = (report: RecyclingReport) => {
    setSelectedReport(report);
  };

  // Load shipments when tab changes to aggregate
  useEffect(() => {
    if (activeTab === 'aggregate') {
      fetchAggregateShipments();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <BackButton />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <FileCheck className="w-8 h-8 text-primary" />
              شهادات إعادة التدوير
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? 'جميع تقارير وشهادات إعادة التدوير من جهات التدوير المختلفة'
                : 'تقارير وشهادات إعادة التدوير للشحنات التي تم نقلها'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Recycle className="w-3 h-3" />
              {reports.length} شهادة
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="certificates" className="gap-2">
              <FileCheck className="w-4 h-4" />
              شهادات التدوير
            </TabsTrigger>
            <TabsTrigger value="aggregate" className="gap-2">
              <FileText className="w-4 h-4" />
              تقرير مجمع
            </TabsTrigger>
          </TabsList>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6 mt-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث برقم التقرير أو رقم الشحنة أو اسم الجهة..."
                    className="pr-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reports Table */}
            <Card>
              <CardHeader className="text-right">
                <CardTitle className="flex items-center gap-2 justify-end">
                  <FileCheck className="w-5 h-5" />
                  قائمة الشهادات والتقارير
                </CardTitle>
                <CardDescription>
                  تقارير إعادة التدوير أو التخلص النهائي من جهات التدوير
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Recycle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">لا توجد تقارير حتى الآن</p>
                    <p className="text-sm mt-2">
                      ستظهر هنا تقارير إعادة التدوير عندما تصدرها جهات التدوير
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم التقرير</TableHead>
                          <TableHead className="text-right">رقم الشحنة</TableHead>
                          <TableHead className="text-right">جهة التدوير</TableHead>
                          <TableHead className="text-right">الجهة المولدة</TableHead>
                          <TableHead className="text-right">نوع المخلفات</TableHead>
                          <TableHead className="text-right">التصنيف</TableHead>
                          <TableHead className="text-right">التاريخ</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-mono text-sm">
                              {report.report_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {report.shipment?.shipment_number || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Recycle className="w-4 h-4 text-green-500" />
                                {report.recycler_organization?.name || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                {report.shipment?.generator?.name || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {wasteTypeLabels[report.shipment?.waste_type || ''] || report.shipment?.waste_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={report.waste_category === 'hazardous' ? 'destructive' : 'default'}
                              >
                                {wasteCategoryLabels[report.waste_category] || report.waste_category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ar })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => setSelectedReport(report)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="text-right">
                                        شهادة إعادة التدوير - {report.report_number}
                                      </DialogTitle>
                                    </DialogHeader>
                                    {selectedReport && (
                                      <div className="p-6 bg-white text-black" dir="rtl">
                                        <div className="text-center mb-6 border-b pb-4">
                                          <h2 className="text-2xl font-bold text-emerald-700">شهادة إعادة التدوير</h2>
                                          <p className="text-sm text-gray-600 mt-1">رقم التقرير: {selectedReport.report_number}</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <span className="font-semibold">رقم الشحنة:</span>
                                              <span className="mr-2">{selectedReport.shipment?.shipment_number}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold">التصنيف:</span>
                                              <span className="mr-2">{wasteCategoryLabels[selectedReport.waste_category]}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold">الكمية:</span>
                                              <span className="mr-2">{selectedReport.shipment?.quantity} {selectedReport.shipment?.unit}</span>
                                            </div>
                                            <div>
                                              <span className="font-semibold">نوع المخلفات:</span>
                                              <span className="mr-2">{wasteTypeLabels[selectedReport.shipment?.waste_type || '']}</span>
                                            </div>
                                          </div>
                                          
                                          <div className="border-t pt-4">
                                            <h3 className="font-semibold mb-2">الأطراف</h3>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                              <div>
                                                <p className="text-gray-600">الجهة المولدة</p>
                                                <p className="font-medium">{selectedReport.shipment?.generator?.name}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-600">جهة النقل</p>
                                                <p className="font-medium">{selectedReport.shipment?.transporter?.name}</p>
                                              </div>
                                              <div>
                                                <p className="text-gray-600">جهة التدوير</p>
                                                <p className="font-medium">{selectedReport.recycler_organization?.name}</p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {selectedReport.opening_declaration && (
                                            <div className="border-t pt-4">
                                              <h3 className="font-semibold mb-2">الإقرار الافتتاحي</h3>
                                              <p className="text-sm">{selectedReport.opening_declaration}</p>
                                            </div>
                                          )}
                                          
                                          {selectedReport.processing_details && (
                                            <div className="border-t pt-4">
                                              <h3 className="font-semibold mb-2">تفاصيل المعالجة</h3>
                                              <p className="text-sm">{selectedReport.processing_details}</p>
                                            </div>
                                          )}
                                          
                                          {selectedReport.closing_declaration && (
                                            <div className="border-t pt-4">
                                              <h3 className="font-semibold mb-2">الإقرار الختامي</h3>
                                              <p className="text-sm">{selectedReport.closing_declaration}</p>
                                            </div>
                                          )}
                                          
                                          {selectedReport.custom_notes && (
                                            <div className="border-t pt-4">
                                              <h3 className="font-semibold mb-2">ملاحظات</h3>
                                              <p className="text-sm">{selectedReport.custom_notes}</p>
                                            </div>
                                          )}
                                          
                                          <div className="border-t pt-4 flex justify-between items-end">
                                            <div>
                                              <p className="text-xs text-gray-500">تاريخ الإصدار</p>
                                              <p className="text-sm">{format(new Date(selectedReport.created_at), 'dd/MM/yyyy', { locale: ar })}</p>
                                            </div>
                                            <div className="text-center">
                                              {selectedReport.recycler_organization?.stamp_url && (
                                                <img src={selectedReport.recycler_organization.stamp_url} alt="الختم" className="h-16 mx-auto" />
                                              )}
                                              {selectedReport.recycler_organization?.signature_url && (
                                                <img src={selectedReport.recycler_organization.signature_url} alt="التوقيع" className="h-12 mx-auto mt-2" />
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    setSelectedReport(report);
                                    setTimeout(() => window.print(), 100);
                                  }}
                                >
                                  <Printer className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{reports.length}</div>
                  <p className="text-sm text-muted-foreground">إجمالي الشهادات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-500">
                    {reports.filter(r => r.waste_category === 'non_hazardous').length}
                  </div>
                  <p className="text-sm text-muted-foreground">مخلفات غير خطرة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-amber-500">
                    {reports.filter(r => r.waste_category === 'hazardous').length}
                  </div>
                  <p className="text-sm text-muted-foreground">مخلفات خطرة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-500">
                    {new Set(reports.map(r => r.recycler_organization?.id)).size}
                  </div>
                  <p className="text-sm text-muted-foreground">جهات التدوير</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aggregate Report Tab */}
          <TabsContent value="aggregate" className="space-y-6 mt-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  تصفية الشحنات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>من تاريخ</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>إلى تاريخ</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الحالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="confirmed">مؤكدة</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="in_transit">في الطريق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>نوع المخلفات</Label>
                    <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="جميع الأنواع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأنواع</SelectItem>
                        {Object.entries(wasteTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={aggregateSearchQuery}
                      onChange={(e) => setAggregateSearchQuery(e.target.value)}
                      placeholder="بحث سريع..."
                      className="pr-10"
                    />
                  </div>
                  <Button onClick={fetchAggregateShipments} disabled={loadingShipments}>
                    {loadingShipments ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
                    تحديث البيانات
                  </Button>
                </div>

                {/* Options */}
                <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeStamps"
                      checked={includeStamps}
                      onCheckedChange={(c) => setIncludeStamps(!!c)}
                    />
                    <Label htmlFor="includeStamps">تضمين الأختام</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeSignatures"
                      checked={includeSignatures}
                      onCheckedChange={(c) => setIncludeSignatures(!!c)}
                    />
                    <Label htmlFor="includeSignatures">تضمين التوقيعات</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            {filteredAggregateShipments.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <span className="font-bold text-lg">{filteredAggregateShipments.length}</span>
                        <span className="text-muted-foreground">شحنة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-lg">
                          {filteredAggregateShipments.reduce((sum, s) => sum + (s.quantity || 0), 0).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">كجم</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setShowPreviewDialog(true)} variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        معاينة
                      </Button>
                      <Button onClick={handlePrintReport} disabled={isPrinting} className="gap-2">
                        {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        طباعة
                      </Button>
                      <Button onClick={handleDownloadPDF} disabled={isExportingPDF} variant="secondary" className="gap-2">
                        {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        تحميل PDF
                      </Button>
                      <Button onClick={() => setShowShareDialog(true)} variant="outline" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        مشاركة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipments Preview */}
            {loadingShipments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredAggregateShipments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">لا توجد شحنات تطابق معايير البحث</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    الشحنات المحددة ({filteredAggregateShipments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">#</TableHead>
                          <TableHead className="text-right">رقم الشحنة</TableHead>
                          <TableHead className="text-right">النوع</TableHead>
                          <TableHead className="text-right">الكمية</TableHead>
                          <TableHead className="text-right">المولد</TableHead>
                          <TableHead className="text-right">الناقل</TableHead>
                          <TableHead className="text-right">المدور</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAggregateShipments.slice(0, 10).map((s, i) => (
                          <TableRow key={s.id}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell className="font-mono">{s.shipment_number}</TableCell>
                            <TableCell>{wasteTypeLabels[s.waste_type] || s.waste_type}</TableCell>
                            <TableCell>{s.quantity} {s.unit || 'كجم'}</TableCell>
                            <TableCell>{s.generator?.name || '-'}</TableCell>
                            <TableCell>{s.transporter?.name || '-'}</TableCell>
                            <TableCell>{s.recycler?.name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredAggregateShipments.length > 10 && (
                      <p className="text-center text-muted-foreground mt-4">
                        +{filteredAggregateShipments.length - 10} شحنة أخرى
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                معاينة التقرير المجمع
              </DialogTitle>
              <DialogDescription>
                معاينة التقرير قبل الطباعة أو التحميل
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg overflow-hidden">
              <div ref={printRef}>
                <AggregateReportPrint
                  shipments={filteredAggregateShipments}
                  organization={organization}
                  includeStamps={includeStamps}
                  includeSignatures={includeSignatures}
                  dateRange={{ start: startDate, end: endDate }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                إغلاق
              </Button>
              <Button onClick={handlePrintReport} disabled={isPrinting} className="gap-2">
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                طباعة
              </Button>
              <Button onClick={handleDownloadPDF} disabled={isExportingPDF} variant="secondary" className="gap-2">
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                تحميل PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                مشاركة التقرير المجمع
              </DialogTitle>
              <DialogDescription>
                اختر الجهات التي تريد مشاركة التقرير معها
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {partnerOrganizations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  لا توجد جهات شريكة في الشحنات المحددة
                </p>
              ) : (
                partnerOrganizations.map((partner) => (
                  <div key={partner.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      id={partner.id}
                      checked={selectedPartners.includes(partner.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPartners([...selectedPartners, partner.id]);
                        } else {
                          setSelectedPartners(selectedPartners.filter(id => id !== partner.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{partner.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {partner.type === 'generator' && <><Building2 className="w-3 h-3 ml-1" />مولد</>}
                        {partner.type === 'transporter' && <><Truck className="w-3 h-3 ml-1" />ناقل</>}
                        {partner.type === 'recycler' && <><Recycle className="w-3 h-3 ml-1" />مدور</>}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleSaveAndShare} 
                disabled={selectedPartners.length === 0 || isSavingToStorage}
                className="gap-2"
              >
                {isSavingToStorage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                حفظ وإرسال
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default RecyclingCertificates;
