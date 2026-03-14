import { useState, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Printer,
  FileText,
  Loader2,
  Calendar,
  Package,
  Building2,
  Truck,
  Recycle,
  Stamp,
  PenTool,
  Download,
  Filter,
  RefreshCw,
  Search,
  Share2,
  CheckCircle2,
  Send,
  X,
  Eye,
  Save
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { usePDFExport } from '@/hooks/usePDFExport';
import { motion, AnimatePresence } from 'framer-motion';
import AggregateReportPrint from '@/components/reports/AggregateReportPrint';
// jsPDF & html2canvas loaded dynamically

interface ShipmentData {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  created_at: string;
  pickup_date: string | null;
  delivered_at: string | null;
  generator: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
  transporter: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
  recycler: {
    id?: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    client_code: string | null;
    email?: string;
  };
}

interface PartnerOrg {
  id: string;
  name: string;
  organization_type: string;
  email: string;
}

const AggregateShipmentReport = () => {
  const { organization, profile } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeStamps, setIncludeStamps] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSavingToStorage, setIsSavingToStorage] = useState(false);
  const { printContent } = usePDFExport({ filename: 'تقرير-الشحنات-التجميعي' });

  // Generate PDF from the print component
  const generatePDF = useCallback(async (): Promise<Blob | null> => {
    const element = printRef.current;
    if (!element) {
      toast.error('لا يوجد محتوى للتصدير');
      return null;
    }

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(element, {
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
  }, []);

  // Download PDF directly
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
        toast.success('تم تحميل التقرير بنجاح');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('حدث خطأ أثناء تحميل التقرير');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Save PDF to storage and share
  const handleSaveAndShare = async () => {
    if (selectedPartners.length === 0) {
      toast.error('يرجى اختيار جهة واحدة على الأقل للمشاركة');
      return;
    }

    setIsSavingToStorage(true);
    try {
      // Generate PDF
      const pdfBlob = await generatePDF();
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF');
      }

      // Generate unique filename
      const reportNumber = `AGR-${format(new Date(), 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const fileName = `${reportNumber}.pdf`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('recycling-certificates')
        .upload(`aggregate-reports/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('recycling-certificates')
        .getPublicUrl(`aggregate-reports/${fileName}`);

      const pdfUrl = urlData?.publicUrl;

      // Get user IDs for selected partner organizations
      const { data: partnerProfiles } = await supabase
        .from('profiles')
        .select('user_id, organization_id')
        .in('organization_id', selectedPartners)
        .eq('is_active', true);

      if (partnerProfiles && partnerProfiles.length > 0) {
        await sendBulkDualNotification({
          user_ids: partnerProfiles.map(p => p.user_id),
          title: 'تقرير مجمع للشحنات',
          message: `شاركت ${organization?.name} تقريرًا مجمعًا للشحنات يتضمن ${filteredShipments.length} شحنة`,
          type: 'aggregate_report',
        });
      }

      const selectedPartnersData = partnerOrganizations.filter(p => selectedPartners.includes(p.id));
      toast.success(`تم حفظ التقرير ومشاركته مع ${selectedPartnersData.map(p => p.name).join('، ')}`);
      setShowShareDialog(false);
      setSelectedPartners([]);
    } catch (error) {
      console.error('Error saving and sharing report:', error);
      toast.error('حدث خطأ أثناء حفظ ومشاركة التقرير');
    } finally {
      setIsSavingToStorage(false);
    }
  };

  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['aggregate-shipments', organization?.id, startDate, endDate, statusFilter, wasteTypeFilter],
    queryFn: async () => {
      if (!organization?.id) return [];

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
          generator:generator_id(
            id, name, name_en, logo_url, stamp_url, signature_url, client_code, email, phone,
            address, city, region, commercial_register, environmental_license,
            representative_name, representative_position, representative_phone, representative_national_id
          ),
          transporter:transporter_id(
            id, name, name_en, logo_url, stamp_url, signature_url, client_code, email, phone,
            address, city, region, commercial_register, environmental_license,
            representative_name, representative_position, representative_phone, representative_national_id
          ),
          recycler:recycler_id(
            id, name, name_en, logo_url, stamp_url, signature_url, client_code, email, phone,
            address, city, region, commercial_register, environmental_license,
            representative_name, representative_position, representative_phone, representative_national_id
          )
        `)
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'new' | 'approved' | 'in_transit' | 'delivered' | 'confirmed');
      }
      if (wasteTypeFilter !== 'all') {
        query = query.eq('waste_type', wasteTypeFilter as 'plastic' | 'paper' | 'metal' | 'glass' | 'electronic' | 'organic' | 'chemical' | 'medical' | 'construction' | 'other');
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      return (data || []) as unknown as ShipmentData[];
    },
    enabled: !!organization?.id,
  });

  // Filter shipments based on search query
  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    
    const query = searchQuery.toLowerCase();
    return shipments.filter(s => 
      s.shipment_number.toLowerCase().includes(query) ||
      s.generator?.name?.toLowerCase().includes(query) ||
      s.transporter?.name?.toLowerCase().includes(query) ||
      s.recycler?.name?.toLowerCase().includes(query) ||
      s.waste_type.toLowerCase().includes(query) ||
      s.pickup_address?.toLowerCase().includes(query) ||
      s.delivery_address?.toLowerCase().includes(query)
    );
  }, [shipments, searchQuery]);

  // Get unique partner organizations from shipments
  const partnerOrganizations = useMemo(() => {
    const partners = new Map<string, PartnerOrg>();
    
    filteredShipments.forEach(s => {
      if (s.generator?.id && s.generator.id !== organization?.id) {
        partners.set(s.generator.id, {
          id: s.generator.id,
          name: s.generator.name,
          organization_type: 'generator',
          email: s.generator.email || ''
        });
      }
      if (s.transporter?.id && s.transporter.id !== organization?.id) {
        partners.set(s.transporter.id, {
          id: s.transporter.id,
          name: s.transporter.name,
          organization_type: 'transporter',
          email: s.transporter.email || ''
        });
      }
      if (s.recycler?.id && s.recycler.id !== organization?.id) {
        partners.set(s.recycler.id, {
          id: s.recycler.id,
          name: s.recycler.name,
          organization_type: 'recycler',
          email: s.recycler.email || ''
        });
      }
    });
    
    return Array.from(partners.values());
  }, [filteredShipments, organization?.id]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'جديدة',
      approved: 'معتمدة',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      confirmed: 'مؤكدة',
    };
    return labels[status] || status;
  };

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
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
    return labels[type] || type;
  };

  const getOrgTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      generator: 'مولد',
      transporter: 'ناقل',
      recycler: 'مدور',
    };
    return labels[type] || type;
  };

  const totalQuantity = filteredShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handleSearch = () => {
    setHasSearched(true);
    refetch();
  };

  const handlePrint = () => {
    const el = printRef.current;
    if (el) {
      setIsPrinting(true);
      printContent(el);
      setTimeout(() => setIsPrinting(false), 500);
    } else {
      toast.error('لا يوجد محتوى للطباعة. يرجى الانتظار حتى يتم تحميل البيانات.');
    }
  };

  // Legacy handleShare kept for backward compatibility (redirects to new method)
  const handleShare = handleSaveAndShare;

  const togglePartnerSelection = (partnerId: string) => {
    setSelectedPartners(prev => 
      prev.includes(partnerId) 
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    } catch {
      return '-';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <BackButton />

        {/* Filters Card - Hidden when printing */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              فلترة التقرير المجمع
            </CardTitle>
            <CardDescription>حدد معايير التصفية لإنشاء التقرير المجمع للشحنات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                بحث سريع
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="ابحث برقم الشحنة، اسم الجهة، العنوان..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button onClick={handleSearch} className="gap-2">
                  <Search className="w-4 h-4" />
                  بحث
                </Button>
              </div>
            </div>

            {/* Search Results Counter */}
            <AnimatePresence>
              {hasSearched && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {filteredShipments.length} نتيجة متطابقة
                      </p>
                      <p className="text-sm text-muted-foreground">
                        من إجمالي {shipments.length} شحنة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{totalQuantity.toLocaleString()} كجم</Badge>
                    {searchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setHasSearched(false);
                        }}
                      >
                        <X className="w-4 h-4" />
                        مسح البحث
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date Filters */}
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
                <Label>حالة الشحنة</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="new">جديدة</SelectItem>
                    <SelectItem value="approved">معتمدة</SelectItem>
                    <SelectItem value="in_transit">في الطريق</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع النفايات</Label>
                <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأنواع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="plastic">بلاستيك</SelectItem>
                    <SelectItem value="paper">ورق</SelectItem>
                    <SelectItem value="metal">معادن</SelectItem>
                    <SelectItem value="glass">زجاج</SelectItem>
                    <SelectItem value="electronic">إلكترونيات</SelectItem>
                    <SelectItem value="organic">عضوي</SelectItem>
                    <SelectItem value="chemical">كيميائي</SelectItem>
                    <SelectItem value="medical">طبي</SelectItem>
                    <SelectItem value="construction">مخلفات بناء</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Print Options */}
            <div className="space-y-4">
              <h4 className="font-medium">خيارات الطباعة</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-stamps"
                    checked={includeStamps}
                    onCheckedChange={(checked) => setIncludeStamps(checked as boolean)}
                  />
                  <Label htmlFor="include-stamps" className="flex items-center gap-2 cursor-pointer">
                    <Stamp className="w-4 h-4" />
                    تضمين الأختام
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-signatures"
                    checked={includeSignatures}
                    onCheckedChange={(checked) => setIncludeSignatures(checked as boolean)}
                  />
                  <Label htmlFor="include-signatures" className="flex items-center gap-2 cursor-pointer">
                    <PenTool className="w-4 h-4" />
                    تضمين التوقيعات
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                تحديث البيانات
              </Button>
              <Button 
                onClick={() => setShowPreviewDialog(true)} 
                disabled={filteredShipments.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                معاينة التقرير
              </Button>
              <Button onClick={handlePrint} disabled={filteredShipments.length === 0 || isPrinting} className="gap-2">
                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                طباعة التقرير
              </Button>
              <Button onClick={handleDownloadPDF} disabled={filteredShipments.length === 0 || isExportingPDF} variant="secondary" className="gap-2">
                {isExportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                تحميل PDF
              </Button>
              <Button 
                onClick={() => setShowShareDialog(true)} 
                disabled={filteredShipments.length === 0}
                variant="outline"
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                مشاركة وإرسال
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Preview / Print Area */}
        <div ref={printRef} className="print:p-0">
          <Card className="print:shadow-none print:border-0">
            <CardHeader className="print:pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <FileText className="w-6 h-6" />
                    التقرير المجمع للشحنات
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {organization?.name} | تاريخ التقرير: {format(new Date(), 'dd/MM/yyyy', { locale: ar })}
                  </CardDescription>
                </div>
                <div className="text-left print:block hidden">
                  <p className="text-sm text-muted-foreground">عدد الشحنات: {filteredShipments.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الكميات: {totalQuantity.toLocaleString()} كجم</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredShipments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد شحنات تطابق معايير البحث</p>
                  <p className="text-sm mt-2">جرب تغيير معايير البحث أو التصفية</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="p-4 rounded-lg bg-primary/10 text-center">
                      <p className="text-2xl font-bold text-primary">{filteredShipments.length}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الشحنات</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 text-center">
                      <p className="text-2xl font-bold text-emerald-600">{totalQuantity.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الكميات (كجم)</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {filteredShipments.filter(s => s.status === 'confirmed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">شحنات مؤكدة</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {filteredShipments.filter(s => s.status === 'in_transit').length}
                      </p>
                      <p className="text-sm text-muted-foreground">في الطريق</p>
                    </div>
                  </div>

                  {/* Shipments Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border p-2 text-right">#</th>
                          <th className="border p-2 text-right">رقم الشحنة</th>
                          <th className="border p-2 text-right">نوع النفايات</th>
                          <th className="border p-2 text-right">الكمية</th>
                          <th className="border p-2 text-right">الحالة</th>
                          <th className="border p-2 text-right">الجهة المولدة</th>
                          <th className="border p-2 text-right">الجهة الناقلة</th>
                          <th className="border p-2 text-right">الجهة المدورة</th>
                          <th className="border p-2 text-right">تاريخ الإنشاء</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShipments.map((shipment, index) => (
                          <tr key={shipment.id} className="hover:bg-muted/30">
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2 font-mono text-xs">{shipment.shipment_number}</td>
                            <td className="border p-2">{getWasteTypeLabel(shipment.waste_type)}</td>
                            <td className="border p-2">{shipment.quantity} {shipment.unit || 'كجم'}</td>
                            <td className="border p-2">
                              <Badge variant="outline" className="text-xs">
                                {getStatusLabel(shipment.status)}
                              </Badge>
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.generator?.name || '-'}
                              {shipment.generator?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.generator.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.transporter?.name || '-'}
                              {shipment.transporter?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.transporter.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">
                              {shipment.recycler?.name || '-'}
                              {shipment.recycler?.client_code && (
                                <span className="block text-muted-foreground font-mono">
                                  {shipment.recycler.client_code}
                                </span>
                              )}
                            </td>
                            <td className="border p-2 text-xs">{formatDate(shipment.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Stamps and Signatures Section */}
                  {(includeStamps || includeSignatures) && filteredShipments.length > 0 && (
                    <div className="mt-8 pt-6 border-t print:break-inside-avoid">
                      <h4 className="font-semibold mb-4 text-center">التوثيق والاعتماد</h4>
                      <div className="grid grid-cols-3 gap-6">
                        {/* Generator */}
                        <div className="text-center space-y-3 border rounded-lg p-4">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700">
                            <Building2 className="w-4 h-4" />
                            الجهة المولدة
                          </div>
                          <p className="text-sm font-medium">{filteredShipments[0]?.generator?.name || organization?.name || '-'}</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && (
                              <div className="text-center">
                                {filteredShipments[0]?.generator?.stamp_url ? (
                                  <img 
                                    src={filteredShipments[0].generator.stamp_url} 
                                    alt="ختم الجهة المولدة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                {filteredShipments[0]?.generator?.signature_url ? (
                                  <img 
                                    src={filteredShipments[0].generator.signature_url} 
                                    alt="توقيع الجهة المولدة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Transporter */}
                        <div className="text-center space-y-3 border rounded-lg p-4">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-700">
                            <Truck className="w-4 h-4" />
                            الجهة الناقلة
                          </div>
                          <p className="text-sm font-medium">{filteredShipments[0]?.transporter?.name || '-'}</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && (
                              <div className="text-center">
                                {filteredShipments[0]?.transporter?.stamp_url ? (
                                  <img 
                                    src={filteredShipments[0].transporter.stamp_url} 
                                    alt="ختم الجهة الناقلة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                {filteredShipments[0]?.transporter?.signature_url ? (
                                  <img 
                                    src={filteredShipments[0].transporter.signature_url} 
                                    alt="توقيع الجهة الناقلة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recycler */}
                        <div className="text-center space-y-3 border rounded-lg p-4 bg-emerald-50/50">
                          <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                            <Recycle className="w-4 h-4" />
                            الجهة المدورة
                          </div>
                          <p className="text-sm font-medium">{filteredShipments[0]?.recycler?.name || '-'}</p>
                          <div className="flex justify-center gap-4 min-h-[80px]">
                            {includeStamps && (
                              <div className="text-center">
                                {filteredShipments[0]?.recycler?.stamp_url ? (
                                  <img 
                                    src={filteredShipments[0].recycler.stamp_url} 
                                    alt="ختم الجهة المدورة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <Stamp className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">الختم</p>
                              </div>
                            )}
                            {includeSignatures && (
                              <div className="text-center">
                                {filteredShipments[0]?.recycler?.signature_url ? (
                                  <img 
                                    src={filteredShipments[0].recycler.signature_url} 
                                    alt="توقيع الجهة المدورة" 
                                    className="w-20 h-20 object-contain border rounded"
                                    crossOrigin="anonymous"
                                  />
                                ) : (
                                  <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center bg-muted/20">
                                    <PenTool className="w-8 h-8 text-muted-foreground/30" />
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">التوقيع</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground print:mt-8">
                    <p>تم إنشاء هذا التقرير بواسطة نظام آي ريسايكل لإدارة النفايات</p>
                    <p className="mt-1">تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy hh:mm a', { locale: ar })}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              مشاركة التقرير مع الجهات
            </DialogTitle>
            <DialogDescription>
              اختر الجهات التي تريد مشاركة التقرير المجمع معها
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {partnerOrganizations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>لا توجد جهات شريكة في الشحنات المحددة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {partnerOrganizations.map((partner) => (
                  <div 
                    key={partner.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPartners.includes(partner.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => togglePartnerSelection(partner.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedPartners.includes(partner.id)}
                        onCheckedChange={() => togglePartnerSelection(partner.id)}
                      />
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getOrgTypeLabel(partner.organization_type)}
                        </Badge>
                      </div>
                    </div>
                    {partner.organization_type === 'generator' && <Building2 className="w-4 h-4 text-blue-500" />}
                    {partner.organization_type === 'transporter' && <Truck className="w-4 h-4 text-amber-500" />}
                    {partner.organization_type === 'recycler' && <Recycle className="w-4 h-4 text-emerald-500" />}
                  </div>
                ))}
              </div>
            )}

            {selectedPartners.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1">سيتم إرسال إشعار للجهات المختارة ({selectedPartners.length})</p>
                <p className="text-muted-foreground">سيتمكنون من الاطلاع على التقرير المجمع</p>
              </div>
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
              حفظ وإرسال التقرير
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div>
              <AggregateReportPrint
                shipments={filteredShipments}
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
            <Button onClick={handlePrint} disabled={isPrinting} className="gap-2">
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

      {/* Off-screen printable content - always rendered */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '794px' }}>
        <div ref={printRef}>
          <AggregateReportPrint
            shipments={filteredShipments}
            organization={organization}
            includeStamps={includeStamps}
            includeSignatures={includeSignatures}
            dateRange={{ start: startDate, end: endDate }}
          />
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          #root > div > div > div > main > div > div:last-child,
          #root > div > div > div > main > div > div:last-child * {
            visibility: visible;
          }
          #root > div > div > div > main > div > div:last-child {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default AggregateShipmentReport;
