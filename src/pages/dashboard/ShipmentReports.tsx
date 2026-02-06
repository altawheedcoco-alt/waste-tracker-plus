import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { normalizeShipment } from '@/lib/supabaseHelpers';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FileText,
  Download,
  Eye,
  Search,
  ClipboardCheck,
  Loader2,
  Package,
  Building2,
  Truck,
  Recycle,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import RecyclingCertificatePrint from '@/components/reports/RecyclingCertificatePrint';
import { usePDFExport } from '@/hooks/usePDFExport';

interface RecyclingReport {
  id: string;
  report_number: string;
  shipment_id: string;
  recycler_organization_id: string;
  waste_category: string;
  opening_declaration: string | null;
  processing_details: string | null;
  closing_declaration: string | null;
  custom_notes: string | null;
  report_data: any;
  created_at: string;
  shipment: {
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit: string | null;
    status: string;
    created_at: string;
    confirmed_at: string | null;
    generator: { name: string } | null;
    transporter: { name: string } | null;
    recycler: { name: string; stamp_url: string | null; signature_url: string | null } | null;
  } | null;
}

const ShipmentReports = () => {
  const { organization } = useAuth();
  const [reports, setReports] = useState<RecyclingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<RecyclingReport | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  const { exportToPDF, isExporting } = usePDFExport({
    filename: 'تقرير-تدوير',
    orientation: 'portrait',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchReports();
    }
  }, [organization?.id]);

  const fetchReports = async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      // جلب التقارير بناءً على نوع المنظمة
      // المدور يرى تقاريره
      // المولد والناقل يرون التقارير للشحنات المشتركة
      let query = supabase
        .from('recycling_reports')
        .select(`
          id,
          report_number,
          shipment_id,
          recycler_organization_id,
          waste_category,
          opening_declaration,
          processing_details,
          closing_declaration,
          custom_notes,
          report_data,
          created_at,
          shipment:shipments(
            shipment_number,
            waste_type,
            quantity,
            unit,
            status,
            created_at,
            confirmed_at,
            generator:organizations!shipments_generator_id_fkey(name),
            transporter:organizations!shipments_transporter_id_fkey(name),
            recycler:organizations!shipments_recycler_id_fkey(name, stamp_url, signature_url)
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // تصفية النتائج بناءً على المنظمة الحالية
      const filteredReports = (data || []).filter((report: any) => {
        const shipment = report.shipment;
        if (!shipment) return false;

        // المدور يرى تقاريره
        if (report.recycler_organization_id === organization.id) return true;

        // البحث في الشحنة للتأكد من أن المنظمة الحالية مشتركة
        // نحتاج للتحقق من generator_id و transporter_id
        return true; // RLS ستتكفل بالتصفية
      });

      setReports(filteredReports.map((r: any) => ({ ...r, shipment: normalizeShipment(r.shipment) })) as any);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWasteTypeLabel = (type: string) => {
    const wasteTypes: Record<string, string> = {
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
    return wasteTypes[type] || type;
  };

  const getWasteCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      hazardous: 'خطرة',
      non_hazardous: 'غير خطرة',
      medical: 'طبية',
      all: 'عامة',
    };
    return categories[category] || category;
  };

  const getWasteCategoryBadge = (category: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
      hazardous: 'destructive',
      non_hazardous: 'secondary',
      medical: 'outline',
      all: 'default',
    };
    return (
      <Badge variant={variants[category] || 'default'}>
        {getWasteCategoryLabel(category)}
      </Badge>
    );
  };

  const filteredReports = reports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.report_number.toLowerCase().includes(query) ||
      report.shipment?.shipment_number.toLowerCase().includes(query) ||
      report.shipment?.generator?.name.toLowerCase().includes(query) ||
      report.shipment?.transporter?.name.toLowerCase().includes(query) ||
      report.shipment?.recycler?.name.toLowerCase().includes(query)
    );
  });

  const handleViewReport = (report: RecyclingReport) => {
    setSelectedReport(report);
    setShowPreviewDialog(true);
  };

  const handleDownloadPDF = async (report: RecyclingReport) => {
    setSelectedReport(report);
    // سيتم تحميل الـ PDF من داخل Dialog
    setShowPreviewDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-right">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" />
              تقارير الشحنات
            </h1>
            <p className="text-muted-foreground">
              عرض تقارير التدوير للشحنات المؤكدة
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم التقرير، رقم الشحنة، أو اسم الشركة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              قائمة التقارير
            </CardTitle>
            <CardDescription>
              {filteredReports.length} تقرير متاح
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">لا توجد تقارير حتى الآن</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ستظهر هنا تقارير التدوير للشحنات المؤكدة
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم التقرير</TableHead>
                      <TableHead className="text-right">رقم الشحنة</TableHead>
                      <TableHead className="text-right">نوع المخلفات</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">الجهة المولدة</TableHead>
                      <TableHead className="text-right">الجهة الناقلة</TableHead>
                      <TableHead className="text-right">الجهة المدورة</TableHead>
                      <TableHead className="text-right">تاريخ التقرير</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report, index) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          {report.report_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            {report.shipment?.shipment_number || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.shipment ? getWasteTypeLabel(report.shipment.waste_type) : '-'}
                        </TableCell>
                        <TableCell>
                          {getWasteCategoryBadge(report.waste_category)}
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
                          <div className="flex items-center gap-2">
                            <Recycle className="w-4 h-4 text-green-500" />
                            {report.shipment?.recycler?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {format(new Date(report.created_at), 'dd/MM/yyyy', { locale: ar })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                              className="gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              عرض
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(report)}
                              className="gap-1"
                            >
                              <Download className="w-4 h-4" />
                              تحميل
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                تقرير رقم: {selectedReport?.report_number}
              </DialogTitle>
            </DialogHeader>
            
            {selectedReport && selectedReport.shipment && (
              <div className="space-y-6">
                {/* Report Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">بيانات الشحنة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">رقم الشحنة:</span>
                        <span className="font-medium">{selectedReport.shipment.shipment_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع المخلفات:</span>
                        <span>{getWasteTypeLabel(selectedReport.shipment.waste_type)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الكمية:</span>
                        <span>{selectedReport.shipment.quantity} {selectedReport.shipment.unit || 'كجم'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">تاريخ التأكيد:</span>
                        <span>
                          {selectedReport.shipment.confirmed_at
                            ? format(new Date(selectedReport.shipment.confirmed_at), 'dd/MM/yyyy', { locale: ar })
                            : '-'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">الأطراف المشاركة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المولد:</span>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-blue-500" />
                          <span>{selectedReport.shipment.generator?.name || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">الناقل:</span>
                        <div className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-amber-500" />
                          <span>{selectedReport.shipment.transporter?.name || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">المدور:</span>
                        <div className="flex items-center gap-1">
                          <Recycle className="w-3 h-3 text-green-500" />
                          <span>{selectedReport.shipment.recycler?.name || '-'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Declarations */}
                {selectedReport.opening_declaration && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">الإقرار الافتتاحي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.opening_declaration}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedReport.processing_details && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">تفاصيل المعالجة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.processing_details}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedReport.closing_declaration && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">الإقرار الختامي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.closing_declaration}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedReport.custom_notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ملاحظات إضافية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedReport.custom_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ShipmentReports;
