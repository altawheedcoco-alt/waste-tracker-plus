import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package, Eye, Search, Filter, RefreshCw, Building2, Truck, Recycle, Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import UnifiedShipmentPrint from '@/components/shipments/unified-print/UnifiedShipmentPrint';
import ShipmentDetailsDialog from './shipments/ShipmentDetailsDialog';
import { STATUS_CONFIG, WASTE_TYPE_LABELS, HAZARD_LEVELS } from './shipments/shipmentConstants';

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
  generator?: { id: string; name: string; organization_type: string; city: string; address: string } | null;
  transporter?: { id: string; name: string; organization_type: string; city: string } | null;
  recycler?: { id: string; name: string; organization_type: string; city: string; address: string } | null;
  driver?: {
    id: string;
    license_number: string;
    vehicle_type: string;
    vehicle_plate: string;
    profile?: { full_name: string; phone: string };
  } | null;
  created_by_profile?: { full_name: string; email: string } | null;
}

const AdminShipmentsView = () => {
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printShipmentData, setPrintShipmentData] = useState<any>(null);
  const [filterWasteType, setFilterWasteType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchShipments(); }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const { data: shipmentsRaw, error } = await supabase
        .from('shipments').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const { data: orgsData } = await supabase.from('organizations').select('id, name, organization_type, city, address');
      const orgsMap: Record<string, any> = {};
      orgsData?.forEach(o => { orgsMap[o.id] = o; });

      const { data: driversData } = await supabase.from('drivers').select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)');
      const driversMap: Record<string, any> = {};
      driversData?.forEach(d => { driversMap[d.id] = { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile }; });

      const enriched = (shipmentsRaw || []).map(s => ({
        ...s,
        generator: s.generator_id ? orgsMap[s.generator_id] || null : null,
        transporter: s.transporter_id ? orgsMap[s.transporter_id] || null : null,
        recycler: s.recycler_id ? orgsMap[s.recycler_id] || null : null,
        driver: s.driver_id ? driversMap[s.driver_id] || null : null,
      }));
      setShipments(enriched as unknown as Shipment[]);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({ title: 'خطأ', description: 'فشل في تحميل الشحنات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintShipment = async (shipment: Shipment) => {
    try {
      const { data: rawData, error } = await supabase.from('shipments').select('*').eq('id', shipment.id).single();
      if (error) throw error;

      const orgIds = [rawData.generator_id, rawData.transporter_id, rawData.recycler_id].filter(Boolean) as string[];
      const { data: orgsData } = await supabase.from('organizations').select('id, name, email, phone, address, city, representative_name, client_code, commercial_register, environmental_license, activity_type').in('id', orgIds);
      const orgsMap: Record<string, any> = {};
      orgsData?.forEach(o => { orgsMap[o.id] = o; });

      let driver = null;
      if (rawData.driver_id) {
        const { data: driverData } = await supabase.from('drivers').select('license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)').eq('id', rawData.driver_id).maybeSingle();
        if (driverData) driver = { ...driverData, profile: Array.isArray(driverData.profile) ? driverData.profile[0] : driverData.profile };
      }

      setPrintShipmentData({
        ...rawData,
        generator: rawData.generator_id ? orgsMap[rawData.generator_id] || null : null,
        transporter: rawData.transporter_id ? orgsMap[rawData.transporter_id] || null : null,
        recycler: rawData.recycler_id ? orgsMap[rawData.recycler_id] || null : null,
        driver,
      });
      setShowPrintDialog(true);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل بيانات الطباعة', variant: 'destructive' });
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = activeTab === 'all' || s.status === activeTab;
    const matchesWasteType = filterWasteType === 'all' || s.waste_type === filterWasteType;
    const matchesSearch = searchTerm === '' ||
      s.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.generator?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.transporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.recycler?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesWasteType && matchesSearch;
  });

  const statusCounts: Record<string, number> = { all: shipments.length, new: 0, approved: 0, in_transit: 0, delivered: 0, confirmed: 0 };
  shipments.forEach((s) => { if (s.status && statusCounts[s.status] !== undefined) statusCounts[s.status]++; });

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
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">الإجمالي</p>
              <p className="text-xl font-bold text-primary">{statusCounts.all}</p>
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
                <Input placeholder="بحث برقم الشحنة أو اسم الجهة..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10" />
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

      {/* Shipments Table */}
      <Card>
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all" className="gap-1"><Package className="h-4 w-4" />الكل</TabsTrigger>
              <TabsTrigger value="new" className="gap-1">
                جديدة
                {statusCounts.new > 0 && <Badge variant="secondary" className="mr-1 h-5 px-1">{statusCounts.new}</Badge>}
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
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-mono font-bold">{shipment.shipment_number}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[shipment.status]?.color || 'bg-muted'}>
                          <span className="flex items-center gap-1">
                            {STATUS_CONFIG[shipment.status]?.icon}
                            {STATUS_CONFIG[shipment.status]?.label || shipment.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{WASTE_TYPE_LABELS[shipment.waste_type] || shipment.waste_type}</Badge>
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
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-primary" />
                          <span className="truncate max-w-[120px]">{shipment.generator?.name || 'غير محدد'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-3 w-3 text-primary" />
                          <span className="truncate max-w-[120px]">{shipment.transporter?.name || 'غير محدد'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Recycle className="h-3 w-3 text-primary" />
                          <span className="truncate max-w-[120px]">{shipment.recycler?.name || 'غير محدد'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(shipment.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedShipment(shipment); setShowDetailsDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePrintShipment(shipment)}>
                            <Printer className="h-4 w-4" />
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

      {/* Extracted Dialog */}
      <ShipmentDetailsDialog
        shipment={selectedShipment}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        onPrint={handlePrintShipment}
      />

      {/* Print View */}
      <UnifiedShipmentPrint
        isOpen={showPrintDialog}
        onClose={() => { setShowPrintDialog(false); setPrintShipmentData(null); }}
        shipment={printShipmentData}
      />
    </div>
  );
};

export default AdminShipmentsView;
