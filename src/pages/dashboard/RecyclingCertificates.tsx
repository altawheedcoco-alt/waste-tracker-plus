import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  FileCheck,
  Search,
  Eye,
  Download,
  Recycle,
  Building2,
  Calendar,
  Printer,
  Filter,
  MoreHorizontal,
  FileText,
  ChevronDown,
  AlertTriangle,
  Leaf,
  Biohazard,
  RefreshCw,
  Share2,
  Truck,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import RecyclingCertificatePrint from '@/components/reports/RecyclingCertificatePrint';
import SignDocumentButton from '@/components/signature/SignDocumentButton';
import ShareDocumentButton from '@/components/documents/ShareDocumentButton';
// jsPDF & html2canvas loaded dynamically
import { usePDFExport } from '@/hooks/usePDFExport';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

interface RecyclingReport {
  id: string;
  report_number: string;
  waste_category: string;
  processing_details: string | null;
  opening_declaration: string | null;
  closing_declaration: string | null;
  custom_notes: string | null;
  pdf_url: string | null;
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
    waste_description?: string;
    disposal_method?: string;
    generator: { 
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      commercial_register?: string;
      environmental_license?: string;
      representative_name?: string | null;
    } | null;
    transporter: { 
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      commercial_register?: string;
      environmental_license?: string;
      representative_name?: string | null;
    } | null;
    recycler: { 
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      commercial_register?: string;
      environmental_license?: string;
      representative_name?: string | null;
      stamp_url?: string | null;
      signature_url?: string | null;
    } | null;
  } | null;
  recycler_organization: {
    id: string;
    name: string;
    logo_url: string | null;
    stamp_url: string | null;
    signature_url: string | null;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    commercial_register?: string;
    environmental_license?: string;
    representative_name?: string | null;
  } | null;
}

const wasteCategoryLabels: Record<string, { label: string; icon: any; color: string }> = {
  hazardous: { label: 'خطرة', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  non_hazardous: { label: 'غير خطرة', icon: Leaf, color: 'bg-green-100 text-green-800' },
  medical_hazardous: { label: 'طبية خطرة', icon: Biohazard, color: 'bg-purple-100 text-purple-800' },
  all: { label: 'الكل', icon: Recycle, color: 'bg-blue-100 text-blue-800' },
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
  const { organization, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<RecyclingReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<RecyclingReport | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { printContent } = usePDFExport({ filename: 'recycling-certificate' });

  const isAdmin = roles.includes('admin');
  const isTransporter = organization?.organization_type === 'transporter';
  const isGenerator = organization?.organization_type === 'generator';

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
          pdf_url,
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
            waste_description,
            disposal_method,
            generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name),
            transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name),
            recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name, stamp_url, signature_url)
          ),
          recycler_organization:organizations!recycling_reports_recycler_organization_id_fkey(
            id,
            name,
            logo_url,
            stamp_url,
            signature_url,
            email,
            phone,
            address,
            city,
            commercial_register,
            environmental_license,
            representative_name
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (isTransporter && organization?.id) {
        const { data: transporterShipments } = await supabase
          .from('shipments')
          .select('id')
          .eq('transporter_id', organization.id);

        if (transporterShipments && transporterShipments.length > 0) {
          const shipmentIds = transporterShipments.map(s => s.id);
          query = query.in('shipment_id', shipmentIds);
        } else {
          setReports([]);
          setLoading(false);
          return;
        }
      } else if (isGenerator && organization?.id) {
        const { data: generatorShipments } = await supabase
          .from('shipments')
          .select('id')
          .eq('generator_id', organization.id);

        if (generatorShipments && generatorShipments.length > 0) {
          const shipmentIds = generatorShipments.map(s => s.id);
          query = query.in('shipment_id', shipmentIds);
        } else {
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

  // Filtered reports based on all filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Text search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        report.report_number.toLowerCase().includes(searchLower) ||
        report.shipment?.shipment_number.toLowerCase().includes(searchLower) ||
        report.recycler_organization?.name.toLowerCase().includes(searchLower) ||
        report.shipment?.generator?.name?.toLowerCase().includes(searchLower) ||
        report.shipment?.transporter?.name?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = categoryFilter === 'all' || report.waste_category === categoryFilter;

      // Waste type filter
      const matchesWasteType = wasteTypeFilter === 'all' || report.shipment?.waste_type === wasteTypeFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const reportDate = new Date(report.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'week') matchesDate = diffDays <= 7;
        else if (dateFilter === 'month') matchesDate = diffDays <= 30;
        else if (dateFilter === 'quarter') matchesDate = diffDays <= 90;
        else if (dateFilter === 'year') matchesDate = diffDays <= 365;
      }

      return matchesSearch && matchesCategory && matchesWasteType && matchesDate;
    });
  }, [reports, searchQuery, categoryFilter, wasteTypeFilter, dateFilter]);

  // Stats for filtered results
  const totalQuantity = useMemo(() => {
    return filteredReports.reduce((sum, r) => sum + (r.shipment?.quantity || 0), 0);
  }, [filteredReports]);

  const handlePreview = (report: RecyclingReport) => {
    setSelectedReport(report);
    setShowPreviewDialog(true);
  };

  const handleDownloadPDF = async (report: RecyclingReport) => {
    // If PDF URL exists, download directly
    if (report.pdf_url) {
      const link = document.createElement('a');
      link.href = report.pdf_url;
      link.download = `شهادة-اعادة-تدوير-${report.report_number}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Otherwise generate PDF
    setSelectedReport(report);
    setIsExporting(true);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      if (!printRef.current) {
        toast({ title: 'خطأ', description: 'لا يمكن إنشاء ملف PDF', variant: 'destructive' });
        return;
      }

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

      pdf.save(`شهادة-اعادة-تدوير-${report.report_number}.pdf`);
      toast({ title: 'تم التحميل', description: 'تم تحميل ملف PDF بنجاح' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'خطأ', description: 'فشل في إنشاء ملف PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = (report: RecyclingReport) => {
    setSelectedReport(report);
    setTimeout(() => {
      if (printRef.current) {
        printContent(printRef.current);
      }
    }, 300);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setWasteTypeFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || wasteTypeFilter !== 'all' || dateFilter !== 'all';

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

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchRecyclingReports}>
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث
            </Button>
            <Badge variant="outline" className="gap-1">
              <Recycle className="w-3 h-3" />
              {reports.length} شهادة
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث برقم التقرير أو رقم الشحنة أو اسم الجهة..."
                  className="pr-10"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap gap-3 items-end">
                {/* Category Filter */}
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">التصنيف</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع التصنيفات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      <SelectItem value="hazardous">مخلفات خطرة</SelectItem>
                      <SelectItem value="non_hazardous">مخلفات غير خطرة</SelectItem>
                      <SelectItem value="medical_hazardous">مخلفات طبية خطرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Waste Type Filter */}
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">نوع المخلفات</Label>
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

                {/* Date Filter */}
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs text-muted-foreground mb-1 block">الفترة الزمنية</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الفترات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفترات</SelectItem>
                      <SelectItem value="week">آخر أسبوع</SelectItem>
                      <SelectItem value="month">آخر شهر</SelectItem>
                      <SelectItem value="quarter">آخر 3 أشهر</SelectItem>
                      <SelectItem value="year">آخر سنة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <Filter className="w-4 h-4 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>

              {/* Results Counter */}
              {(hasActiveFilters || filteredReports.length !== reports.length) && (
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <FileText className="w-3 h-3" />
                      {filteredReports.length} شهادة مطابقة
                    </Badge>
                    <span className="text-sm text-muted-foreground">من أصل {reports.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Package className="w-3 h-3" />
                      {totalQuantity.toLocaleString()} كجم إجمالي
                    </Badge>
                  </div>
                </div>
              )}
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
                <p className="text-lg font-medium">
                  {hasActiveFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد تقارير حتى الآن'}
                </p>
                <p className="text-sm mt-2">
                  {hasActiveFilters 
                    ? 'جرب تغيير معايير البحث أو الفلاتر'
                    : 'ستظهر هنا تقارير إعادة التدوير عندما تصدرها جهات التدوير'
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    مسح الفلاتر
                  </Button>
                )}
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
                      <TableHead className="text-right">جهة النقل</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => {
                      const CategoryIcon = wasteCategoryLabels[report.waste_category]?.icon || Recycle;
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-sm">
                            <Badge variant="outline">{report.report_number}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono">
                              {report.shipment?.shipment_number || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Recycle className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{report.recycler_organization?.name || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              {report.shipment?.generator?.name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-amber-500" />
                              {report.shipment?.transporter?.name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">
                              {report.shipment?.quantity} {report.shipment?.unit || 'كجم'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={wasteCategoryLabels[report.waste_category]?.color}>
                              <CategoryIcon className="w-3 h-3 ml-1" />
                              {wasteCategoryLabels[report.waste_category]?.label || report.waste_category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ar })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* Quick Actions */}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePreview(report)}
                                title="معاينة"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadPDF(report)}
                                disabled={isExporting}
                                title="تحميل PDF"
                              >
                                {isExporting && selectedReport?.id === report.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handlePrint(report)}
                                title="طباعة"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>

                              {/* More Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handlePreview(report)}>
                                    <Eye className="w-4 h-4 ml-2" />
                                    معاينة الشهادة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadPDF(report)}>
                                    <Download className="w-4 h-4 ml-2" />
                                    تحميل PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrint(report)}>
                                    <Printer className="w-4 h-4 ml-2" />
                                    طباعة
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {report.pdf_url && (
                                    <DropdownMenuItem asChild>
                                      <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                                        <Share2 className="w-4 h-4 ml-2" />
                                        فتح الرابط المباشر
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <div className="text-3xl font-bold text-purple-500">
                {reports.filter(r => r.waste_category === 'medical_hazardous').length}
              </div>
              <p className="text-sm text-muted-foreground">مخلفات طبية</p>
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
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                شهادة إعادة التدوير - {selectedReport?.report_number}
              </span>
              <div className="flex items-center gap-2">
                <ShareDocumentButton
                  referenceId={selectedReport?.id || ''}
                  referenceType="certificate"
                  documentTitle={`شهادة إعادة التدوير - ${selectedReport?.report_number}`}
                  size="sm"
                />
                <SignDocumentButton
                  documentType="certificate"
                  documentId={selectedReport?.id || ''}
                  documentTitle={`شهادة إعادة التدوير - ${selectedReport?.report_number}`}
                  variant="outline"
                  size="sm"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectedReport && handleDownloadPDF(selectedReport)}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 ml-1" />
                  )}
                  تحميل PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => selectedReport && handlePrint(selectedReport)}
                >
                  <Printer className="w-4 h-4 ml-1" />
                  طباعة
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && selectedReport.shipment && (
            <div ref={printRef}>
              <RecyclingCertificatePrint
                shipment={{
                  id: selectedReport.shipment.id,
                  shipment_number: selectedReport.shipment.shipment_number,
                  waste_type: selectedReport.shipment.waste_type,
                  quantity: selectedReport.shipment.quantity,
                  unit: selectedReport.shipment.unit,
                  waste_description: selectedReport.shipment.waste_description,
                  disposal_method: selectedReport.shipment.disposal_method,
                  pickup_address: selectedReport.shipment.pickup_address,
                  delivery_address: selectedReport.shipment.delivery_address,
                  delivered_at: selectedReport.shipment.delivered_at,
                  confirmed_at: selectedReport.shipment.confirmed_at,
                  generator: selectedReport.shipment.generator,
                  transporter: selectedReport.shipment.transporter,
                  recycler: selectedReport.shipment.recycler,
                }}
                template="standard"
                customNotes={selectedReport.custom_notes || ''}
                processingDetails={selectedReport.processing_details || ''}
                openingDeclaration={selectedReport.opening_declaration || undefined}
                closingDeclaration={selectedReport.closing_declaration || undefined}
                recyclerOrg={selectedReport.recycler_organization}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print element for PDF generation outside dialog */}
      {selectedReport && selectedReport.shipment && !showPreviewDialog && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', background: '#fff' }}>
          <div ref={printRef}>
            <RecyclingCertificatePrint
              shipment={{
                id: selectedReport.shipment.id,
                shipment_number: selectedReport.shipment.shipment_number,
                waste_type: selectedReport.shipment.waste_type,
                quantity: selectedReport.shipment.quantity,
                unit: selectedReport.shipment.unit,
                waste_description: selectedReport.shipment.waste_description,
                disposal_method: selectedReport.shipment.disposal_method,
                pickup_address: selectedReport.shipment.pickup_address,
                delivery_address: selectedReport.shipment.delivery_address,
                delivered_at: selectedReport.shipment.delivered_at,
                confirmed_at: selectedReport.shipment.confirmed_at,
                generator: selectedReport.shipment.generator,
                transporter: selectedReport.shipment.transporter,
                recycler: selectedReport.shipment.recycler,
              }}
              template="standard"
              customNotes={selectedReport.custom_notes || ''}
              processingDetails={selectedReport.processing_details || ''}
              openingDeclaration={selectedReport.opening_declaration || undefined}
              closingDeclaration={selectedReport.closing_declaration || undefined}
              recyclerOrg={selectedReport.recycler_organization}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RecyclingCertificates;
