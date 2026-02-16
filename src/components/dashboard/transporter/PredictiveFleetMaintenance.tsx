import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp, 
  Car, Calendar, Fuel, Activity, Plus, RefreshCw 
} from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  vehicle_plate: string;
  maintenance_type: string;
  status: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  odometer_km: number;
  next_due_km?: number;
  next_due_date?: string;
  notes?: string;
}

interface VehicleHealth {
  vehicle_plate: string;
  total_km: number;
  total_trips: number;
  health_score: number;
  risk_level: string;
  last_maintenance_date?: string;
  alerts: any[];
}

const maintenanceTypes = [
  { value: 'oil_change', label: '🛢️ تغيير زيت', interval_km: 5000 },
  { value: 'tire_rotation', label: '🔄 تبديل إطارات', interval_km: 10000 },
  { value: 'brake_inspection', label: '🔧 فحص فرامل', interval_km: 15000 },
  { value: 'engine_check', label: '⚙️ فحص محرك', interval_km: 20000 },
  { value: 'full_service', label: '🔩 صيانة شاملة', interval_km: 30000 },
  { value: 'ac_service', label: '❄️ صيانة مكيف', interval_km: 25000 },
  { value: 'filter_change', label: '🌬️ تغيير فلاتر', interval_km: 10000 },
];

const PredictiveFleetMaintenance = () => {
  const { organization } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vehicle_plate: '',
    maintenance_type: 'oil_change',
    scheduled_date: new Date().toISOString().split('T')[0],
    cost: '',
    odometer_km: '',
    notes: '',
  });

  useEffect(() => {
    if (organization?.id) {
      fetchData();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [maintenanceRes, telemetryRes] = await Promise.all([
        supabase.from('vehicle_maintenance')
          .select('*')
          .eq('organization_id', organization!.id)
          .order('scheduled_date', { ascending: false })
          .limit(50),
        supabase.from('vehicle_telemetry')
          .select('*')
          .eq('organization_id', organization!.id),
      ]);

      if (maintenanceRes.data) setRecords(maintenanceRes.data as any);
      if (telemetryRes.data) setVehicles(telemetryRes.data as any);
    } catch (e) {
      console.error('Error fetching maintenance data:', e);
    } finally {
      setLoading(false);
    }
  };

  const addMaintenance = async () => {
    if (!newRecord.vehicle_plate || !newRecord.scheduled_date) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      const typeInfo = maintenanceTypes.find(t => t.value === newRecord.maintenance_type);
      const odometerKm = parseFloat(newRecord.odometer_km) || 0;

      const { error } = await supabase.from('vehicle_maintenance').insert({
        organization_id: organization!.id,
        vehicle_plate: newRecord.vehicle_plate,
        maintenance_type: newRecord.maintenance_type,
        scheduled_date: newRecord.scheduled_date,
        cost: parseFloat(newRecord.cost) || 0,
        odometer_km: odometerKm,
        next_due_km: typeInfo ? odometerKm + typeInfo.interval_km : null,
        notes: newRecord.notes,
      });

      if (error) throw error;

      // Update vehicle telemetry
      await supabase.from('vehicle_telemetry').upsert({
        organization_id: organization!.id,
        vehicle_plate: newRecord.vehicle_plate,
        last_maintenance_km: odometerKm,
        last_maintenance_date: newRecord.scheduled_date,
        total_km: odometerKm,
      }, { onConflict: 'organization_id,vehicle_plate' });

      toast.success('تم إضافة سجل الصيانة بنجاح');
      setShowAddForm(false);
      setNewRecord({ vehicle_plate: '', maintenance_type: 'oil_change', scheduled_date: new Date().toISOString().split('T')[0], cost: '', odometer_km: '', notes: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ');
    }
  };

  const completeMaintenance = async (id: string) => {
    try {
      await supabase.from('vehicle_maintenance').update({
        status: 'completed',
        completed_date: new Date().toISOString().split('T')[0],
      }).eq('id', id);
      toast.success('تم تحديث حالة الصيانة');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge variant="outline" className="text-blue-600"><Clock className="w-3 h-3 ml-1" />مجدولة</Badge>;
      case 'completed': return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 ml-1" />مكتملة</Badge>;
      case 'overdue': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 ml-1" />متأخرة</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const overdueCount = records.filter(r => r.status === 'overdue' || (r.status === 'scheduled' && new Date(r.scheduled_date) < new Date())).length;
  const scheduledCount = records.filter(r => r.status === 'scheduled' && new Date(r.scheduled_date) >= new Date()).length;
  const totalCost = records.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Car className="w-6 h-6 mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold">{vehicles.length}</div>
          <div className="text-xs text-muted-foreground">مركبات مراقبة</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-1" />
          <div className="text-2xl font-bold">{scheduledCount}</div>
          <div className="text-xs text-muted-foreground">صيانة مجدولة</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto text-destructive mb-1" />
          <div className="text-2xl font-bold">{overdueCount}</div>
          <div className="text-xs text-muted-foreground">صيانة متأخرة</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Fuel className="w-6 h-6 mx-auto text-orange-500 mb-1" />
          <div className="text-2xl font-bold">{totalCost.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">إجمالي التكاليف (ريال)</div>
        </CardContent></Card>
      </div>

      {/* Vehicle Health Overview */}
      {vehicles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              صحة الأسطول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {vehicles.map(v => (
                <div key={v.vehicle_plate} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold">{v.vehicle_plate}</span>
                    <span className={`text-xl font-bold ${getHealthColor(v.health_score)}`}>
                      {v.health_score}%
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{v.total_km?.toLocaleString()} كم</span>
                    <span>•</span>
                    <span>{v.total_trips} رحلة</span>
                  </div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        v.health_score >= 80 ? 'bg-green-500' : v.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${v.health_score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions & Records */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="w-4 h-4 ml-1" />
          إضافة صيانة
        </Button>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 ml-1" />
          تحديث
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="رقم المركبة *" value={newRecord.vehicle_plate} onChange={e => setNewRecord(p => ({ ...p, vehicle_plate: e.target.value }))} />
              <Select value={newRecord.maintenance_type} onValueChange={v => setNewRecord(p => ({ ...p, maintenance_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={newRecord.scheduled_date} onChange={e => setNewRecord(p => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input type="number" placeholder="عداد الكيلومتر" value={newRecord.odometer_km} onChange={e => setNewRecord(p => ({ ...p, odometer_km: e.target.value }))} />
              <Input type="number" placeholder="التكلفة (ريال)" value={newRecord.cost} onChange={e => setNewRecord(p => ({ ...p, cost: e.target.value }))} />
              <Input placeholder="ملاحظات" value={newRecord.notes} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <Button onClick={addMaintenance} size="sm">حفظ</Button>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Records */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            سجل الصيانة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد سجلات صيانة بعد. أضف أول سجل صيانة لمركباتك.
            </div>
          ) : (
            <div className="space-y-2">
              {records.slice(0, 20).map(record => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm">{record.vehicle_plate}</span>
                    <span className="text-sm">{maintenanceTypes.find(t => t.value === record.maintenance_type)?.label || record.maintenance_type}</span>
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{record.scheduled_date}</span>
                    {record.cost > 0 && <span>{record.cost} ريال</span>}
                    {record.status === 'scheduled' && (
                      <Button variant="ghost" size="sm" onClick={() => completeMaintenance(record.id)}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveFleetMaintenance;
