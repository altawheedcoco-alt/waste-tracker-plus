import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck, Plus, Package, ClipboardCheck, DollarSign, AlertTriangle,
  CheckCircle2, Clock, XCircle, Eye, Edit, Trash2, Search,
  Users, Wrench, BarChart3, Shield, MapPin, CalendarDays, Building2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FleetVehicleDialog from '@/components/transport-office/FleetVehicleDialog';
import BookingRequestsPanel from '@/components/transport-office/BookingRequestsPanel';
import TransportOfficeContract from '@/components/transport-office/TransportOfficeContract';
import StoryCircles from '@/components/stories/StoryCircles';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';

const TransportOfficeDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
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

  const stats = useMemo(() => ({
    total: vehicles.length,
    available: vehicles.filter(v => v.is_available && v.status === 'active').length,
    rented: vehicles.filter(v => v.status === 'rented').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    activeBookings: bookings.filter(b => b.status === 'approved').length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.agreed_price || 0), 0),
  }), [vehicles, bookings]);

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

  // Vehicles nearing license/insurance expiry
  const expiringVehicles = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return vehicles.filter(v => {
      const licExpiry = v.license_expiry ? new Date(v.license_expiry) : null;
      const insExpiry = v.insurance_expiry ? new Date(v.insurance_expiry) : null;
      return (licExpiry && licExpiry <= thirtyDays) || (insExpiry && insExpiry <= thirtyDays);
    });
  }, [vehicles]);

  const quickActions = [
    { id: 'add-vehicle', title: 'إضافة مركبة', subtitle: 'تسجيل مركبة جديدة', icon: Plus, onClick: () => { setSelectedVehicle(null); setShowVehicleDialog(true); } },
    { id: 'view-bookings', title: 'طلبات الحجز', subtitle: 'إدارة الحجوزات', icon: Package, onClick: () => {}, badge: stats.pendingBookings > 0 ? `${stats.pendingBookings}` : undefined },
    { id: 'employees', title: 'الموظفين', subtitle: 'إدارة الفريق', icon: Users, onClick: () => navigate('/dashboard/employees') },
    { id: 'documents', title: 'المستندات', subtitle: 'البحث والتحقق', icon: Search, onClick: () => {} },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <StoryCircles />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">مكتب النقل</h1>
            <p className="text-sm text-muted-foreground">
              مرحباً {profile?.full_name} — {organization?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract ? (
            <Badge variant="default" className="text-sm px-3 py-1 gap-1">
              <CheckCircle2 className="w-4 h-4" /> عقد فعال
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-sm px-3 py-1 gap-1">
              <AlertTriangle className="w-4 h-4" /> لا يوجد عقد فعال
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي المركبات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{stats.available}</p>
            <p className="text-xs text-muted-foreground">متاحة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{stats.pendingBookings}</p>
            <p className="text-xs text-muted-foreground">طلبات معلقة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-7 h-7 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">الإيرادات (ج.م)</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid
        actions={quickActions}
        title="الإجراءات السريعة"
        subtitle="أدوات مكتب النقل"
      />

      {/* Alerts for expiring documents */}
      {expiringVehicles.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              تنبيهات — مستندات تنتهي قريباً ({expiringVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringVehicles.slice(0, 3).map(v => (
              <div key={v.id} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                <span className="font-medium">{v.plate_number}</span>
                <div className="flex gap-2">
                  {v.license_expiry && (
                    <Badge variant="outline" className="text-xs">
                      <CalendarDays className="w-3 h-3 ml-1" />
                      الرخصة: {new Date(v.license_expiry).toLocaleDateString('ar-EG')}
                    </Badge>
                  )}
                  {v.insurance_expiry && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 ml-1" />
                      التأمين: {new Date(v.insurance_expiry).toLocaleDateString('ar-EG')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="vehicles" className="gap-1 text-xs sm:text-sm">
            <Truck className="w-3.5 h-3.5" /> الأسطول ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5" /> الحجوزات ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1 text-xs sm:text-sm">
            <Wrench className="w-3.5 h-3.5" /> الصيانة ({stats.maintenance})
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="w-3.5 h-3.5" /> المالية
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1 text-xs sm:text-sm">
            <ClipboardCheck className="w-3.5 h-3.5" /> المستندات
          </TabsTrigger>
          <TabsTrigger value="contract" className="gap-1 text-xs sm:text-sm">
            <ClipboardCheck className="w-3.5 h-3.5" /> العقد
          </TabsTrigger>
        </TabsList>

        {/* === Vehicles Tab === */}
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
                      {v.service_areas?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <MapPin className="w-3 h-3" />
                          {v.service_areas.map((area: string) => (
                            <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => { setSelectedVehicle(v); setShowVehicleDialog(true); }}>
                        <Edit className="w-3 h-3 ml-1" /> تعديل
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteVehicle(v.id)}>
                        <Trash2 className="w-3 h-3 ml-1" /> حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* === Bookings Tab === */}
        <TabsContent value="bookings" className="mt-4">
          <BookingRequestsPanel bookings={bookings} onRefresh={fetchAll} isOwner />
        </TabsContent>

        {/* === Maintenance Tab === */}
        <TabsContent value="maintenance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                المركبات في الصيانة
              </CardTitle>
              <CardDescription>المركبات المتوقفة حالياً للصيانة أو الإصلاح</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicles.filter(v => v.status === 'maintenance').length === 0 ? (
                <p className="text-center text-muted-foreground py-6">لا توجد مركبات في الصيانة حالياً ✅</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.filter(v => v.status === 'maintenance').map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{v.plate_number}</p>
                        <p className="text-xs text-muted-foreground">{vehicleTypeLabel(v.vehicle_type)} — {v.brand} {v.model}</p>
                        {v.notes && <p className="text-xs text-muted-foreground mt-1">ملاحظات: {v.notes}</p>}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedVehicle(v); setShowVehicleDialog(true); }}>
                        <Edit className="w-3 h-3 ml-1" /> تحديث
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* === Financials Tab === */}
        <TabsContent value="financials" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">إجمالي الإيرادات (ج.م)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.completedBookings}</p>
                <p className="text-xs text-muted-foreground">حجوزات مكتملة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {stats.completedBookings > 0 ? Math.round(stats.totalRevenue / stats.completedBookings).toLocaleString() : 0}
                </p>
                <p className="text-xs text-muted-foreground">متوسط سعر الرحلة</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent completed bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">آخر المعاملات المكتملة</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.filter(b => b.status === 'completed').length === 0 ? (
                <p className="text-center text-muted-foreground py-4">لا توجد معاملات مكتملة بعد</p>
              ) : (
                <div className="space-y-2">
                  {bookings.filter(b => b.status === 'completed').slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                      <div>
                        <span className="font-medium">{b.fleet_vehicles?.plate_number}</span>
                        <span className="text-muted-foreground mx-2">←</span>
                        <span>{b.requester?.name}</span>
                      </div>
                      <Badge variant="outline">{(b.agreed_price || 0).toLocaleString()} ج.م</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/accounts')}>
            <BarChart3 className="w-4 h-4 ml-2" />
            الذهاب للحسابات التفصيلية
          </Button>
        </TabsContent>

        {/* === Documents Tab === */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <UnifiedDocumentSearch />
          <PendingApprovalsWidget />
        </TabsContent>

        {/* === Contract Tab === */}
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
