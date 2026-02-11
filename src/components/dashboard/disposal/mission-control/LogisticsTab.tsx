import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Truck, Car, User, Play, CheckCircle, MapPin, DollarSign, Plus, Wrench, AlertTriangle, Navigation, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LogisticsTabProps {
  facilityId?: string | null;
  organizationId?: string | null;
  searchQuery?: string;
}

const LogisticsTab = ({ facilityId, organizationId, searchQuery }: LogisticsTabProps) => {
  const queryClient = useQueryClient();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate_number: '', vehicle_type: 'truck', model: '', capacity_tons: '', hazmat_license_number: '', hazmat_license_expiry: '' });
  const [tripForm, setTripForm] = useState({ client_name: '', client_address: '', vehicle_id: '', driver_id: '', distance_km: '', transport_cost: '', disposal_cost: '' });

  // Fleet vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['disposal-fleet', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('disposal_fleet_vehicles')
        .select('*, driver:drivers(full_name, phone)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Drivers
  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ['disposal-drivers', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await (supabase as any).from('drivers').select('id, full_name, phone, vehicle_plate').eq('organization_id', organizationId).eq('status', 'active');
      return result.data || [];
    },
    enabled: !!organizationId,
  });

  // Active trips
  const { data: trips = [] } = useQuery({
    queryKey: ['disposal-trips', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase
        .from('disposal_trips')
        .select('*, vehicle:disposal_fleet_vehicles(plate_number, vehicle_type), driver:drivers(full_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!organizationId,
  });

  // Add vehicle
  const addVehicleMutation = useMutation({
    mutationFn: async (form: typeof vehicleForm) => {
      const { error } = await supabase.from('disposal_fleet_vehicles').insert({
        organization_id: organizationId!, disposal_facility_id: facilityId,
        plate_number: form.plate_number, vehicle_type: form.vehicle_type, model: form.model,
        capacity_tons: Number(form.capacity_tons) || 0, hazmat_license_number: form.hazmat_license_number,
        hazmat_license_expiry: form.hazmat_license_expiry || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إضافة المركبة بنجاح');
      setShowAddVehicle(false);
      setVehicleForm({ plate_number: '', vehicle_type: 'truck', model: '', capacity_tons: '', hazmat_license_number: '', hazmat_license_expiry: '' });
      queryClient.invalidateQueries({ queryKey: ['disposal-fleet'] });
    },
  });

  // Create trip
  const createTripMutation = useMutation({
    mutationFn: async (form: typeof tripForm) => {
      const transportCost = Number(form.transport_cost) || 0;
      const disposalCost = Number(form.disposal_cost) || 0;
      const { error } = await supabase.from('disposal_trips').insert({
        organization_id: organizationId!, disposal_facility_id: facilityId,
        client_name: form.client_name, client_address: form.client_address,
        vehicle_id: form.vehicle_id || null, driver_id: form.driver_id || null,
        distance_km: Number(form.distance_km) || 0, transport_cost: transportCost,
        disposal_cost: disposalCost, total_cost: transportCost + disposalCost,
        status: 'planned',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم إنشاء الرحلة بنجاح');
      setShowNewTrip(false);
      setTripForm({ client_name: '', client_address: '', vehicle_id: '', driver_id: '', distance_km: '', transport_cost: '', disposal_cost: '' });
      queryClient.invalidateQueries({ queryKey: ['disposal-trips'] });
    },
  });

  // Trip status updates
  const updateTripStatus = useMutation({
    mutationFn: async ({ tripId, status, field }: { tripId: string; status: string; field?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (field) update[field] = new Date().toISOString();
      const { error } = await supabase.from('disposal_trips').update(update).eq('id', tripId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = {
        en_route: '🚛 الرحلة بدأت — المركبة في الطريق للعميل',
        picking_up: '📦 تأكيد الاستلام من العميل',
        returning: '🏭 المركبة في طريق العودة للمنشأة',
        arrived: '✅ الوصول للمنشأة — جاهز للوزن',
        completed: '✅ الرحلة مكتملة',
      };
      toast.success(labels[vars.status] || 'تم التحديث');
      queryClient.invalidateQueries({ queryKey: ['disposal-trips'] });
    },
  });

  const availableVehicles = vehicles.filter((v: any) => v.status === 'available');
  const activeTrips = trips.filter((t: any) => !['completed', 'cancelled'].includes(t.status));
  const completedTrips = trips.filter((t: any) => t.status === 'completed');
  const totalTransportRevenue = trips.reduce((s: number, t: any) => s + (t.transport_cost || 0), 0);
  const totalCombinedRevenue = trips.reduce((s: number, t: any) => s + (t.total_cost || 0), 0);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: string }> = {
      planned: { label: 'مخطط', variant: 'outline' },
      en_route: { label: 'في الطريق', variant: 'default' },
      picking_up: { label: 'جاري الاستلام', variant: 'secondary' },
      returning: { label: 'عائد للمنشأة', variant: 'default' },
      arrived: { label: 'وصل المنشأة', variant: 'secondary' },
      completed: { label: 'مكتمل', variant: 'default' },
    };
    const s = map[status] || { label: status, variant: 'outline' };
    return <Badge variant={s.variant as any} className="text-xs">{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 3 Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 dark:border-blue-800/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAddVehicle(true)}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 mx-auto mb-3 flex items-center justify-center">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">إضافة مركبة</h3>
            <p className="text-xs text-muted-foreground">تسجيل سيارة جديدة في الأسطول</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowNewTrip(true)}>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-3 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">بدء رحلة جديدة</h3>
            <p className="text-xs text-muted-foreground">تعيين سائق ومركبة لاستلام شحنة</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 dark:border-purple-800/40">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 mx-auto mb-3 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">فوترة موحدة</h3>
            <p className="text-xs text-muted-foreground">نقل + تخلص في فاتورة واحدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'مركبات الأسطول', value: vehicles.length, icon: Car, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
          { label: 'مركبات متاحة', value: availableVehicles.length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'رحلات نشطة', value: activeTrips.length, icon: Navigation, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
          { label: 'إيراد النقل (ج.م)', value: totalTransportRevenue.toLocaleString(), icon: DollarSign, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-right flex-1">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Trips */}
      {activeTrips.length > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              الرحلات النشطة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTrips.map((trip: any) => (
              <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 flex-wrap">
                  {trip.status === 'planned' && (
                    <Button size="sm" className="text-xs h-8 gap-1" onClick={() => updateTripStatus.mutate({ tripId: trip.id, status: 'en_route', field: 'departed_at' })}>
                      <Play className="w-3 h-3" /> بدء الرحلة
                    </Button>
                  )}
                  {trip.status === 'en_route' && (
                    <Button size="sm" className="text-xs h-8 gap-1" onClick={() => updateTripStatus.mutate({ tripId: trip.id, status: 'picking_up', field: 'picked_up_at' })}>
                      <Package className="w-3 h-3" /> تأكيد الاستلام
                    </Button>
                  )}
                  {trip.status === 'picking_up' && (
                    <Button size="sm" className="text-xs h-8 gap-1" onClick={() => updateTripStatus.mutate({ tripId: trip.id, status: 'returning' })}>
                      <Truck className="w-3 h-3" /> العودة للمنشأة
                    </Button>
                  )}
                  {trip.status === 'returning' && (
                    <Button size="sm" className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => updateTripStatus.mutate({ tripId: trip.id, status: 'arrived', field: 'arrived_at' })}>
                      <CheckCircle className="w-3 h-3" /> الوصول
                    </Button>
                  )}
                  {trip.status === 'arrived' && (
                    <Button size="sm" className="text-xs h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={() => updateTripStatus.mutate({ tripId: trip.id, status: 'completed' })}>
                      <CheckCircle className="w-3 h-3" /> إتمام الرحلة
                    </Button>
                  )}
                  {getStatusBadge(trip.status)}
                </div>
                <div className="text-right flex-1 mr-3">
                  <p className="font-medium text-sm">{trip.client_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">
                    {trip.vehicle?.plate_number && <span>🚛 {trip.vehicle.plate_number}</span>}
                    {trip.driver?.full_name && <span className="mr-2">👤 {trip.driver.full_name}</span>}
                    {trip.distance_km > 0 && <span className="mr-2">📏 {trip.distance_km} كم</span>}
                    {trip.total_cost > 0 && <span className="mr-2">💰 {trip.total_cost.toLocaleString()} ج.م</span>}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fleet Vehicles */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowAddVehicle(true)}>
              <Plus className="w-3 h-3" /> إضافة مركبة
            </Button>
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              أسطول المركبات
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">لم يتم تسجيل مركبات بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <Badge variant={v.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                      {v.status === 'available' ? '✅ متاحة' : v.status === 'on_trip' ? '🚛 في رحلة' : '🔧 صيانة'}
                    </Badge>
                    {v.hazmat_license_expiry && new Date(v.hazmat_license_expiry) < new Date() && (
                      <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" /> ترخيص منتهي</Badge>
                    )}
                    {v.maintenance_due_date && new Date(v.maintenance_due_date) < new Date() && (
                      <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300"><Wrench className="w-3 h-3" /> صيانة متأخرة</Badge>
                    )}
                  </div>
                  <div className="text-right flex-1 mr-3">
                    <p className="font-medium text-sm">{v.plate_number} — {v.model || v.vehicle_type}</p>
                    <p className="text-xs text-muted-foreground">
                      سعة: {v.capacity_tons} طن
                      {v.driver?.full_name && <span className="mr-2">• سائق: {v.driver.full_name}</span>}
                      {v.hazmat_license_number && <span className="mr-2">• ترخيص خطرة: {v.hazmat_license_number}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddVehicle} onOpenChange={setShowAddVehicle}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Car className="w-5 h-5" /> إضافة مركبة للأسطول</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>رقم اللوحة *</Label>
                <Input placeholder="مثال: أ ب ج 1234" value={vehicleForm.plate_number} onChange={(e) => setVehicleForm(p => ({ ...p, plate_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>نوع المركبة</Label>
                <Select value={vehicleForm.vehicle_type} onValueChange={(v) => setVehicleForm(p => ({ ...p, vehicle_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">شاحنة</SelectItem>
                    <SelectItem value="tanker">صهريج</SelectItem>
                    <SelectItem value="compactor">ضاغطة</SelectItem>
                    <SelectItem value="pickup">بيك أب</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الموديل</Label>
                <Input placeholder="مثال: Isuzu NPR" value={vehicleForm.model} onChange={(e) => setVehicleForm(p => ({ ...p, model: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>السعة (طن)</Label>
                <Input type="number" placeholder="0" value={vehicleForm.capacity_tons} onChange={(e) => setVehicleForm(p => ({ ...p, capacity_tons: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ترخيص نقل مواد خطرة</Label>
                <Input placeholder="رقم الترخيص" value={vehicleForm.hazmat_license_number} onChange={(e) => setVehicleForm(p => ({ ...p, hazmat_license_number: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>انتهاء ترخيص الخطرة</Label>
                <Input type="date" value={vehicleForm.hazmat_license_expiry} onChange={(e) => setVehicleForm(p => ({ ...p, hazmat_license_expiry: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full gap-2" onClick={() => addVehicleMutation.mutate(vehicleForm)} disabled={!vehicleForm.plate_number || addVehicleMutation.isPending}>
              <Plus className="w-4 h-4" /> {addVehicleMutation.isPending ? 'جاري الإضافة...' : 'إضافة المركبة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Trip Dialog */}
      <Dialog open={showNewTrip} onOpenChange={setShowNewTrip}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Navigation className="w-5 h-5" /> إنشاء رحلة جديدة</DialogTitle>
            <DialogDescription>تعيين سائق ومركبة لاستلام شحنة من العميل — فاتورة موحدة (نقل + تخلص)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم العميل *</Label>
                <Input placeholder="اسم الجهة المولدة" value={tripForm.client_name} onChange={(e) => setTripForm(p => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>عنوان الاستلام</Label>
                <Input placeholder="العنوان" value={tripForm.client_address} onChange={(e) => setTripForm(p => ({ ...p, client_address: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المركبة</Label>
                <Select value={tripForm.vehicle_id} onValueChange={(v) => setTripForm(p => ({ ...p, vehicle_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر مركبة" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.plate_number} — {v.model || v.vehicle_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السائق</Label>
                <Select value={tripForm.driver_id} onValueChange={(v) => setTripForm(p => ({ ...p, driver_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر سائق" /></SelectTrigger>
                  <SelectContent>
                    {drivers.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>المسافة (كم)</Label>
                <Input type="number" placeholder="0" value={tripForm.distance_km} onChange={(e) => setTripForm(p => ({ ...p, distance_km: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>رسوم النقل (ج.م)</Label>
                <Input type="number" placeholder="0" value={tripForm.transport_cost} onChange={(e) => setTripForm(p => ({ ...p, transport_cost: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>رسوم التخلص (ج.م)</Label>
                <Input type="number" placeholder="0" value={tripForm.disposal_cost} onChange={(e) => setTripForm(p => ({ ...p, disposal_cost: e.target.value }))} />
              </div>
            </div>
            {(tripForm.transport_cost || tripForm.disposal_cost) && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">إجمالي الفاتورة الموحدة</p>
                <p className="text-2xl font-bold text-primary">{((Number(tripForm.transport_cost) || 0) + (Number(tripForm.disposal_cost) || 0)).toLocaleString()} ج.م</p>
                <p className="text-xs text-muted-foreground">نقل: {Number(tripForm.transport_cost || 0).toLocaleString()} + تخلص: {Number(tripForm.disposal_cost || 0).toLocaleString()}</p>
              </div>
            )}
            <Button className="w-full gap-2" onClick={() => createTripMutation.mutate(tripForm)} disabled={!tripForm.client_name || createTripMutation.isPending}>
              <Navigation className="w-4 h-4" /> {createTripMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الرحلة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticsTab;
