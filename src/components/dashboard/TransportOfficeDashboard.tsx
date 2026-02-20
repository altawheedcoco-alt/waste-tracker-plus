import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Plus, Package, ClipboardCheck, DollarSign, AlertTriangle, CheckCircle2, Clock, XCircle, Eye, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import FleetVehicleDialog from '@/components/transport-office/FleetVehicleDialog';
import BookingRequestsPanel from '@/components/transport-office/BookingRequestsPanel';
import TransportOfficeContract from '@/components/transport-office/TransportOfficeContract';

const TransportOfficeDashboard = () => {
  const { organization } = useAuth();
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (organization?.id) fetchAll();
  }, [organization?.id]);

  const fetchAll = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const [vRes, bRes, cRes] = await Promise.all([
        supabase.from('fleet_vehicles').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }),
        supabase.from('vehicle_bookings').select('*, fleet_vehicles(plate_number, vehicle_type), requester:organizations!vehicle_bookings_requester_org_id_fkey(name)').eq('fleet_owner_org_id', organization.id).order('created_at', { ascending: false }),
        supabase.from('transport_office_contracts').select('*').eq('organization_id', organization.id).eq('status', 'active').maybeSingle(),
      ]);
      setVehicles(vRes.data || []);
      setBookings(bRes.data || []);
      setContract(cRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const { error } = await supabase.from('fleet_vehicles').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    toast.success('تم حذف المركبة');
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const availableCount = vehicles.filter(v => v.is_available && v.status === 'active').length;
  const rentedCount = vehicles.filter(v => v.status === 'rented').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.agreed_price || 0), 0);

  const filteredVehicles = vehicles.filter(v =>
    !searchQuery || v.plate_number?.includes(searchQuery) || v.brand?.includes(searchQuery) || v.model?.includes(searchQuery)
  );

  const vehicleTypeLabel = (type: string) => {
    const map: Record<string, string> = { truck: 'شاحنة', pickup: 'بيك أب', tanker: 'صهريج', trailer: 'مقطورة' };
    return map[type] || type;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'متاحة', variant: 'default' },
      maintenance: { label: 'صيانة', variant: 'secondary' },
      rented: { label: 'مؤجرة', variant: 'outline' },
      inactive: { label: 'غير نشطة', variant: 'destructive' },
    };
    const s = map[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary" />
            لوحة تحكم مكتب النقل
          </h1>
          <p className="text-muted-foreground">إدارة أسطول المركبات وطلبات الحجز</p>
        </div>
        {contract ? (
          <Badge variant="default" className="text-sm px-3 py-1">
            <CheckCircle2 className="w-4 h-4 mr-1" /> عقد فعال
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            <AlertTriangle className="w-4 h-4 mr-1" /> لا يوجد عقد فعال
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{vehicles.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي المركبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{availableCount}</p>
            <p className="text-xs text-muted-foreground">متاحة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{pendingBookings}</p>
            <p className="text-xs text-muted-foreground">طلبات معلقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">الإيرادات (ج.م)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles" className="gap-1">
            <Truck className="w-4 h-4" /> المركبات ({vehicles.length})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1">
            <Package className="w-4 h-4" /> الحجوزات ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="contract" className="gap-1">
            <ClipboardCheck className="w-4 h-4" /> العقد
          </TabsTrigger>
        </TabsList>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث بالرقم أو الماركة..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10" />
            </div>
            <Button onClick={() => { setSelectedVehicle(null); setShowVehicleDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> إضافة مركبة
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredVehicles.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">لا توجد مركبات مسجلة. أضف مركبتك الأولى!</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map(v => (
                <Card key={v.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg">{v.plate_number}</h3>
                      {statusBadge(v.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>النوع: {vehicleTypeLabel(v.vehicle_type)}</p>
                      {v.brand && <p>الماركة: {v.brand} {v.model || ''}</p>}
                      {v.capacity_tons && <p>الحمولة: {v.capacity_tons} طن</p>}
                      {v.driver_name && <p>السائق: {v.driver_name}</p>}
                      {v.per_trip_rate && <p>سعر الرحلة: {v.per_trip_rate} ج.م</p>}
                      {v.daily_rate && <p>السعر اليومي: {v.daily_rate} ج.م</p>}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedVehicle(v); setShowVehicleDialog(true); }}>
                        <Edit className="w-3 h-3 mr-1" /> تعديل
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteVehicle(v.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-4">
          <BookingRequestsPanel bookings={bookings} onRefresh={fetchAll} isOwner />
        </TabsContent>

        {/* Contract Tab */}
        <TabsContent value="contract" className="mt-4">
          <TransportOfficeContract contract={contract} onRefresh={fetchAll} />
        </TabsContent>
      </Tabs>

      {/* Vehicle Dialog */}
      <FleetVehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        vehicle={selectedVehicle}
        onSaved={fetchAll}
      />
    </div>
  );
};

export default TransportOfficeDashboard;
