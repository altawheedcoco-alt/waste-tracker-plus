import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';

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
  const { organization, roles } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<RecyclingReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<RecyclingReport | null>(null);
  const { toast } = useToast();

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
      </motion.div>
    </DashboardLayout>
  );
};

export default RecyclingCertificates;
