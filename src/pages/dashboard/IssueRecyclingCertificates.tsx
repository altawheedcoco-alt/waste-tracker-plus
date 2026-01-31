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
  Loader2,
  FileText,
  Search,
  CheckCircle,
  Clock,
  Package,
  Building2,
  Truck,
  Calendar,
  FileCheck,
  AlertCircle,
  Recycle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import RecyclingCertificateDialog from '@/components/reports/RecyclingCertificateDialog';

interface Shipment {
  id: string;
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
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
  has_report?: boolean;
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

const statusLabels: Record<string, { label: string; color: string }> = {
  delivered: { label: 'تم التسليم', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'مؤكد', color: 'bg-green-100 text-green-800' },
};

const IssueRecyclingCertificates = () => {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (organization?.id) {
      fetchShipments();
    }
  }, [organization?.id]);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      // Fetch shipments where this recycler is the recipient (delivered or confirmed status)
      const { data: shipmentsData, error: shipmentsError } = await supabase
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
          pickup_date,
          expected_delivery_date,
          delivered_at,
          confirmed_at,
          created_at,
          waste_description,
          hazard_level,
          packaging_method,
          disposal_method,
          generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name),
          transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name),
          recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, commercial_register, environmental_license, representative_name, stamp_url, signature_url)
        `)
        .eq('recycler_id', organization?.id)
        .in('status', ['delivered', 'confirmed'])
        .order('delivered_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;

      // Fetch existing reports to mark which shipments already have reports
      const { data: reportsData } = await supabase
        .from('recycling_reports')
        .select('shipment_id')
        .eq('recycler_organization_id', organization?.id);

      const reportedShipmentIds = new Set(reportsData?.map(r => r.shipment_id) || []);

      const shipmentsWithReportStatus = (shipmentsData || []).map(s => ({
        ...s,
        has_report: reportedShipmentIds.has(s.id),
      }));

      setShipments(shipmentsWithReportStatus as Shipment[]);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الشحنات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      shipment.shipment_number.toLowerCase().includes(searchLower) ||
      shipment.generator?.name.toLowerCase().includes(searchLower) ||
      shipment.transporter?.name.toLowerCase().includes(searchLower)
    );
  });

  const pendingShipments = filteredShipments.filter(s => !s.has_report);
  const completedShipments = filteredShipments.filter(s => s.has_report);

  const handleIssueCertificate = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowCertificateDialog(true);
  };

  const handleDialogClose = () => {
    setShowCertificateDialog(false);
    setSelectedShipment(null);
    // Refresh the list to update report status
    fetchShipments();
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
              إصدار شهادات إعادة التدوير
            </h1>
            <p className="text-muted-foreground mt-1">
              إصدار تقارير وشهادات إعادة التدوير أو التخلص النهائي للشحنات المستلمة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {pendingShipments.length} بانتظار التقرير
            </Badge>
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle className="w-3 h-3" />
              {completedShipments.length} تم إصدار التقرير
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
                placeholder="البحث برقم الشحنة أو اسم الجهة المولدة أو الناقلة..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Shipments - Need Certificate */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <Clock className="w-5 h-5 text-amber-500" />
              شحنات بانتظار إصدار التقرير
            </CardTitle>
            <CardDescription>
              الشحنات التي تم تسليمها ولم يتم إصدار تقرير إعادة التدوير لها بعد
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">تم إصدار جميع التقارير</p>
                <p className="text-sm mt-1">لا توجد شحنات بانتظار إصدار تقرير</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الشحنة</TableHead>
                      <TableHead className="text-right">الجهة المولدة</TableHead>
                      <TableHead className="text-right">جهة النقل</TableHead>
                      <TableHead className="text-right">نوع المخلفات</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">تاريخ التسليم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">{shipment.shipment_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            {shipment.generator?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-500" />
                            {shipment.transporter?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.quantity} {shipment.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {shipment.delivered_at 
                              ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy', { locale: ar })
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusLabels[shipment.status]?.color}>
                            {statusLabels[shipment.status]?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleIssueCertificate(shipment)}
                            className="gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            إصدار التقرير
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Shipments - Already have Certificate */}
        <Card>
          <CardHeader className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end">
              <CheckCircle className="w-5 h-5 text-green-500" />
              شحنات تم إصدار التقرير لها
            </CardTitle>
            <CardDescription>
              الشحنات التي تم إصدار تقرير إعادة التدوير لها
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">لا توجد تقارير صادرة</p>
                <p className="text-sm mt-1">لم يتم إصدار أي تقارير بعد</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الشحنة</TableHead>
                      <TableHead className="text-right">الجهة المولدة</TableHead>
                      <TableHead className="text-right">جهة النقل</TableHead>
                      <TableHead className="text-right">نوع المخلفات</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">تاريخ التسليم</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-sm">
                          <Badge variant="outline">{shipment.shipment_number}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            {shipment.generator?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-amber-500" />
                            {shipment.transporter?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.quantity} {shipment.unit}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {shipment.delivered_at 
                              ? format(new Date(shipment.delivered_at), 'dd/MM/yyyy', { locale: ar })
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              تم إصدار التقرير
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleIssueCertificate(shipment)}
                            className="gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            عرض التقرير
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{shipments.length}</div>
              <p className="text-sm text-muted-foreground">إجمالي الشحنات المستلمة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-500">{pendingShipments.length}</div>
              <p className="text-sm text-muted-foreground">بانتظار إصدار التقرير</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{completedShipments.length}</div>
              <p className="text-sm text-muted-foreground">تم إصدار التقرير</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Certificate Dialog */}
      {selectedShipment && (
        <RecyclingCertificateDialog
          isOpen={showCertificateDialog}
          onClose={handleDialogClose}
          shipment={selectedShipment as any}
        />
      )}
    </DashboardLayout>
  );
};

export default IssueRecyclingCertificates;
