import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Truck,
  Recycle,
  MapPin,
  Calendar,
  Scale,
  AlertTriangle,
  User,
  FileText,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import ShipmentPrintView from '@/components/shipments/ShipmentPrintView';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  waste_description: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  approved_at: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  generator?: { id: string; name: string; organization_type: string; city: string; address: string };
  transporter?: { id: string; name: string; organization_type: string; city: string };
  recycler?: { id: string; name: string; organization_type: string; city: string; address: string };
  driver?: { 
    id: string; 
    license_number: string; 
    vehicle_type: string; 
    vehicle_plate: string;
    profile?: { full_name: string; phone: string };
  };
  created_by_profile?: { full_name: string; email: string };
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  new: { color: 'bg-blue-100 text-blue-800', label: 'جديدة', icon: <Clock className="h-4 w-4" /> },
  approved: { color: 'bg-green-100 text-green-800', label: 'معتمدة', icon: <CheckCircle className="h-4 w-4" /> },
  in_transit: { color: 'bg-orange-100 text-orange-800', label: 'في الطريق', icon: <Truck className="h-4 w-4" /> },
  delivered: { color: 'bg-purple-100 text-purple-800', label: 'تم التسليم', icon: <CheckCircle className="h-4 w-4" /> },
  confirmed: { color: 'bg-emerald-100 text-emerald-800', label: 'مكتمل', icon: <CheckCircle className="h-4 w-4" /> },
};

const WASTE_TYPE_LABELS: Record<string, string> = {
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

const HAZARD_LEVELS: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-green-100 text-green-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'عالي', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'حرج', color: 'bg-red-100 text-red-800' },
};

const AdminShipmentsView = () => {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printShipmentData, setPrintShipmentData] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterWasteType, setFilterWasteType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          generator:organizations!shipments_generator_id_fkey(id, name, organization_type, city, address),
          transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type, city),
          recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type, city, address),
          driver:drivers(id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)),
          created_by_profile:profiles!shipments_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShipments((data as unknown as Shipment[]) || []);
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

  // Prepare shipment data for print view
  const handlePrintShipment = async (shipment: Shipment) => {
    // Fetch complete shipment data for printing
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        generator:organizations!shipments_generator_id_fkey(name, email, phone, address, city, representative_name, client_code, commercial_register, environmental_license, activity_type),
        transporter:organizations!shipments_transporter_id_fkey(name, email, phone, address, city, representative_name, client_code, commercial_register, environmental_license, activity_type),
        recycler:organizations!shipments_recycler_id_fkey(name, email, phone, address, city, representative_name, client_code, commercial_register, environmental_license, activity_type),
        driver:drivers(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
      `)
      .eq('id', shipment.id)
      .single();

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات الطباعة',
        variant: 'destructive',
      });
      return;
    }

    setPrintShipmentData(data);
    setShowPrintDialog(true);
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesStatus = activeTab === 'all' ? true : shipment.status === activeTab;
    const matchesWasteType = filterWasteType === 'all' || shipment.waste_type === filterWasteType;
    const matchesSearch =
      searchTerm === '' ||
      shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.generator?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.transporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.recycler?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesWasteType && matchesSearch;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: shipments.length,
      new: 0,
      approved: 0,
      in_transit: 0,
      delivered: 0,
      confirmed: 0,
    };
    shipments.forEach((s) => {
      if (s.status && counts[s.status] !== undefined) {
        counts[s.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const renderShipmentRow = (shipment: Shipment) => (
    <TableRow key={shipment.id} className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold">{shipment.shipment_number}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={STATUS_CONFIG[shipment.status]?.color || 'bg-gray-100'}>
          <span className="flex items-center gap-1">
            {STATUS_CONFIG[shipment.status]?.icon}
            {STATUS_CONFIG[shipment.status]?.label || shipment.status}
          </span>
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {WASTE_TYPE_LABELS[shipment.waste_type] || shipment.waste_type}
        </Badge>
        {shipment.hazard_level && (
          <Badge className={`mr-1 ${HAZARD_LEVELS[shipment.hazard_level]?.color || ''}`}>
            {HAZARD_LEVELS[shipment.hazard_level]?.label || shipment.hazard_level}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="font-medium">{shipment.quantity}</span>
        <span className="text-muted-foreground text-sm mr-1">{shipment.unit || 'كجم'}</span>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-blue-500" />
            <span className="truncate max-w-[120px]">{shipment.generator?.name || 'غير محدد'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-orange-500" />
            <span className="truncate max-w-[120px]">{shipment.transporter?.name || 'غير محدد'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Recycle className="h-3 w-3 text-green-500" />
            <span className="truncate max-w-[120px]">{shipment.recycler?.name || 'غير محدد'}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedShipment(shipment);
              setShowDetailsDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handlePrintShipment(shipment)}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">جميع شحنات النظام</h2>
          <p className="text-muted-foreground">عرض وإدارة جميع الشحنات بكافة بياناتها</p>
        </div>
        <Button onClick={fetchShipments} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">الإجمالي</p>
              <p className="text-xl font-bold text-blue-600">{statusCounts.all}</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <Card key={key} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(key)}>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{config.label}</p>
                <p className="text-xl font-bold">{statusCounts[key] || 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشحنة أو اسم الجهة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterWasteType} onValueChange={setFilterWasteType}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="نوع النفايات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(WASTE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table with Tabs */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all" className="gap-1">
                <Package className="h-4 w-4" />
                الكل
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1">
                جديدة
                {statusCounts.new > 0 && (
                <Badge variant="secondary" className="mr-1 h-5 px-1">
                    {statusCounts.new}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">معتمدة</TabsTrigger>
              <TabsTrigger value="in_transit">في الطريق</TabsTrigger>
              <TabsTrigger value="delivered">تم التسليم</TabsTrigger>
              <TabsTrigger value="confirmed">مكتملة</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد شحنات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>الكمية</TableHead>
                    <TableHead>المولد</TableHead>
                    <TableHead>الناقل</TableHead>
                    <TableHead>المدور</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{filteredShipments.map(renderShipmentRow)}</TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              تفاصيل الشحنة {selectedShipment?.shipment_number}
            </DialogTitle>
            <DialogDescription>
              جميع بيانات الشحنة والأطراف المعنية
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm text-muted-foreground">الحالة</label>
                  <Badge className={STATUS_CONFIG[selectedShipment.status]?.color || ''}>
                    {STATUS_CONFIG[selectedShipment.status]?.label}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">نوع النفايات</label>
                  <p className="font-medium">{WASTE_TYPE_LABELS[selectedShipment.waste_type]}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">الكمية</label>
                  <p className="font-medium">{selectedShipment.quantity} {selectedShipment.unit}</p>
                </div>
                {selectedShipment.hazard_level && (
                  <div>
                    <label className="text-sm text-muted-foreground">مستوى الخطورة</label>
                    <Badge className={HAZARD_LEVELS[selectedShipment.hazard_level]?.color}>
                      {HAZARD_LEVELS[selectedShipment.hazard_level]?.label}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Organizations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Generator */}
                <Card className="border-blue-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      الجهة المولدة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 text-sm">
                    <p className="font-medium">{selectedShipment.generator?.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedShipment.generator?.city}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">{selectedShipment.pickup_address}</p>
                  </CardContent>
                </Card>

                {/* Transporter */}
                <Card className="border-orange-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4 text-orange-500" />
                      الجهة الناقلة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 text-sm">
                    <p className="font-medium">{selectedShipment.transporter?.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedShipment.transporter?.city}
                    </p>
                    {selectedShipment.driver && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <p className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          السائق: {selectedShipment.driver.profile?.full_name || 'غير محدد'}
                        </p>
                        <p>المركبة: {selectedShipment.driver.vehicle_type} - {selectedShipment.driver.vehicle_plate}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recycler */}
                <Card className="border-green-200">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Recycle className="h-4 w-4 text-green-500" />
                      الجهة المدورة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 text-sm">
                    <p className="font-medium">{selectedShipment.recycler?.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {selectedShipment.recycler?.city}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">{selectedShipment.delivery_address}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedShipment.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>
                {selectedShipment.pickup_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ الاستلام</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedShipment.pickup_date), 'dd MMM yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                )}
                {selectedShipment.approved_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ الاعتماد</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedShipment.approved_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                )}
                {selectedShipment.delivered_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">تاريخ التسليم</p>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedShipment.delivered_at), 'dd MMM yyyy HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedShipment.packaging_method && (
                  <div>
                    <label className="text-sm text-muted-foreground">طريقة التعبئة</label>
                    <p className="font-medium">{selectedShipment.packaging_method}</p>
                  </div>
                )}
                {selectedShipment.disposal_method && (
                  <div>
                    <label className="text-sm text-muted-foreground">طريقة التخلص</label>
                    <p className="font-medium">{selectedShipment.disposal_method}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {(selectedShipment.waste_description || selectedShipment.notes || selectedShipment.generator_notes || selectedShipment.recycler_notes) && (
                <div className="space-y-3">
                  {selectedShipment.waste_description && (
                    <div>
                      <label className="text-sm text-muted-foreground">وصف النفايات</label>
                      <p className="bg-muted p-2 rounded text-sm mt-1">{selectedShipment.waste_description}</p>
                    </div>
                  )}
                  {selectedShipment.notes && (
                    <div>
                      <label className="text-sm text-muted-foreground">ملاحظات عامة</label>
                      <p className="bg-muted p-2 rounded text-sm mt-1">{selectedShipment.notes}</p>
                    </div>
                  )}
                  {selectedShipment.generator_notes && (
                    <div>
                      <label className="text-sm text-muted-foreground">ملاحظات المولد</label>
                      <p className="bg-blue-50 p-2 rounded text-sm mt-1">{selectedShipment.generator_notes}</p>
                    </div>
                  )}
                  {selectedShipment.recycler_notes && (
                    <div>
                      <label className="text-sm text-muted-foreground">ملاحظات المدور</label>
                      <p className="bg-green-50 p-2 rounded text-sm mt-1">{selectedShipment.recycler_notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Creator Info */}
              {selectedShipment.created_by_profile && (
                <div className="text-xs text-muted-foreground border-t pt-3">
                  <p>
                    تم الإنشاء بواسطة: {selectedShipment.created_by_profile.full_name} ({selectedShipment.created_by_profile.email})
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  إغلاق
                </Button>
                <Button variant="outline" onClick={() => {
                  if (selectedShipment) {
                    handlePrintShipment(selectedShipment);
                    setShowDetailsDialog(false);
                  }
                }}>
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print View Dialog */}
      <ShipmentPrintView
        isOpen={showPrintDialog}
        onClose={() => {
          setShowPrintDialog(false);
          setPrintShipmentData(null);
        }}
        shipment={printShipmentData}
      />
    </div>
  );
};

export default AdminShipmentsView;
