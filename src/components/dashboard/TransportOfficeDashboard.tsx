import { useState, useMemo, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTransportOfficeData } from '@/hooks/useTransportOfficeData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Truck, Plus, Package, ClipboardCheck, DollarSign, AlertTriangle,
  CheckCircle2, Clock, Eye, Edit, Trash2, Search,
  Users, Wrench, BarChart3, Shield, MapPin, CalendarDays, Building2, Loader2, Leaf
} from 'lucide-react';

const GeofenceAlertsPanel = lazy(() => import('@/components/tracking/GeofenceAlertsPanel'));
const ESGReportPanel = lazy(() => import('@/components/reports/ESGReportPanel'));
const DigitalIdentityCard = lazy(() => import('./shared/DigitalIdentityCard'));
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import FleetVehicleDialog from '@/components/transport-office/FleetVehicleDialog';
import BookingRequestsPanel from '@/components/transport-office/BookingRequestsPanel';
import TransportOfficeContract from '@/components/transport-office/TransportOfficeContract';
import TransportOfficeKPIs from '@/components/transport-office/TransportOfficeKPIs';
import TransportOfficeDriversTab from '@/components/transport-office/TransportOfficeDriversTab';
import TransportOfficeMaintenanceTab from '@/components/transport-office/TransportOfficeMaintenanceTab';
import TransportOfficeFinancialsTab from '@/components/transport-office/TransportOfficeFinancialsTab';
import StoryCircles from '@/components/stories/StoryCircles';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import PendingApprovalsWidget from '@/components/shipments/PendingApprovalsWidget';
import UnifiedDocumentSearch from '@/components/verification/UnifiedDocumentSearch';

const TransportOfficeDashboard = () => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useTransportOfficeData();
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const vehicles = data?.vehicles || [];
  const bookings = data?.bookings || [];
  const stats = data?.stats;
  const contract = data?.contract;
  const expiringVehicles = data?.expiringVehicles || [];

  const handleDeleteVehicle = async (id: string) => {
    const { error } = await supabase.from('fleet_vehicles').delete().eq('id', id);
    if (error) { toast.error('خطأ في الحذف'); return; }
    toast.success('تم حذف المركبة');
    refetch();
  };

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

  const quickActions = [
    { id: 'add-vehicle', title: 'إضافة مركبة', subtitle: 'تسجيل مركبة جديدة', icon: Plus, onClick: () => { setSelectedVehicle(null); setShowVehicleDialog(true); } },
    { id: 'view-bookings', title: 'طلبات الحجز', subtitle: 'إدارة الحجوزات', icon: Package, onClick: () => {}, badge: stats?.pendingBookings ? `${stats.pendingBookings}` : undefined },
    { id: 'employees', title: 'الموظفين', subtitle: 'إدارة الفريق', icon: Users, onClick: () => navigate('/dashboard/employees') },
    { id: 'documents', title: 'المستندات', subtitle: 'البحث والتحقق', icon: Search, onClick: () => {} },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <StoryCircles />

      {/* بطاقة الهوية التعريفية الرقمية */}
      <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
        <DigitalIdentityCard />
      </Suspense>

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

      {/* KPI Cards */}
      {stats && <TransportOfficeKPIs stats={stats} />}

      {/* Quick Actions */}
      <QuickActionsGrid actions={quickActions} title="الإجراءات السريعة" subtitle="أدوات مكتب النقل" />

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
            {expiringVehicles.slice(0, 5).map(v => (
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
            <Truck className="w-3.5 h-3.5" /> الأسطول ({stats?.totalVehicles || 0})
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1 text-xs sm:text-sm">
            <Users className="w-3.5 h-3.5" /> السائقين ({stats?.totalDrivers || 0})
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1 text-xs sm:text-sm">
            <Package className="w-3.5 h-3.5" /> الحجوزات ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1 text-xs sm:text-sm">
            <Wrench className="w-3.5 h-3.5" /> الصيانة
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
          <TabsTrigger value="geofence" className="gap-1 text-xs sm:text-sm">
            <MapPin className="w-3.5 h-3.5" /> الجيوفنس
          </TabsTrigger>
          <TabsTrigger value="esg" className="gap-1 text-xs sm:text-sm">
            <Leaf className="w-3.5 h-3.5" /> تقارير ESG
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

          {filteredVehicles.length === 0 ? (
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

        {/* === Drivers Tab === */}
        <TabsContent value="drivers" className="mt-4">
          <TransportOfficeDriversTab drivers={data?.drivers || []} />
        </TabsContent>

        {/* === Bookings Tab === */}
        <TabsContent value="bookings" className="mt-4">
          <BookingRequestsPanel bookings={bookings} onRefresh={() => refetch()} isOwner />
        </TabsContent>

        {/* === Maintenance Tab === */}
        <TabsContent value="maintenance" className="mt-4">
          <TransportOfficeMaintenanceTab records={data?.maintenanceRecords || []} vehicles={vehicles} />
        </TabsContent>

        {/* === Financials Tab === */}
        <TabsContent value="financials" className="mt-4">
          {stats && <TransportOfficeFinancialsTab stats={stats} bookings={bookings} />}
        </TabsContent>

        {/* === Documents Tab === */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <UnifiedDocumentSearch />
          <PendingApprovalsWidget />
        </TabsContent>

        {/* === Contract Tab === */}
        <TabsContent value="contract" className="mt-4">
          <TransportOfficeContract contract={contract} onRefresh={() => refetch()} />
        </TabsContent>

        {/* Geofence Tab */}
        <TabsContent value="geofence" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <GeofenceAlertsPanel />
          </Suspense>
        </TabsContent>

        {/* ESG Tab */}
        <TabsContent value="esg" className="mt-4 space-y-4">
          <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
            <ESGReportPanel />
          </Suspense>
        </TabsContent>
      </Tabs>

      {/* Vehicle Dialog */}
      <FleetVehicleDialog
        open={showVehicleDialog}
        onOpenChange={setShowVehicleDialog}
        vehicle={selectedVehicle}
        onSaved={() => refetch()}
      />
    </div>
  );
};

export default TransportOfficeDashboard;
