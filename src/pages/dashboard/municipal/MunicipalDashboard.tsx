import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Truck, AlertTriangle, CheckCircle2, TrendingUp,
  MessageSquareWarning, Scale, BarChart3, Trash2, Users, HardHat,
  Package, Building, UserCheck, UserX, Clock, Wrench,
} from 'lucide-react';
import { format } from 'date-fns';

const MunicipalDashboard = () => {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: zones = [] } = useQuery({
    queryKey: ['dash-zones', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name, bin_count, status, streets_count, daily_waste_estimate_tons, assigned_crews_count')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: bins = [] } = useQuery({
    queryKey: ['dash-bins', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('street_bins').select('id, status, fill_level_percent, has_sensor, condition, needs_replacement')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['dash-trips', organization?.id, today],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_trips').select('id, status, bins_collected, total_bins, weight_tons, bags_count')
        .eq('organization_id', organization!.id).eq('trip_date', today);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ['dash-complaints', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('citizen_complaints').select('id, status, priority')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: crews = [] } = useQuery({
    queryKey: ['dash-crews', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('sweeping_crews').select('id, status, worker_count, crew_type')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['dash-attendance', organization?.id, today],
    queryFn: async () => {
      const { data } = await (supabase as any).from('daily_attendance').select('id, status, daily_rate')
        .eq('organization_id', organization!.id).eq('attendance_date', today);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['dash-equipment', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('sweeping_equipment').select('id, condition, equipment_type, next_maintenance_date, status')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: stations = [] } = useQuery({
    queryKey: ['dash-stations', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('transfer_stations').select('id, status, capacity_tons_per_day, current_load_tons')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // KPIs
  const totalBins = bins.length;
  const activeBins = bins.filter((b: any) => b.status === 'active').length;
  const overflowBins = bins.filter((b: any) => b.fill_level_percent >= 80).length;
  const damagedBins = bins.filter((b: any) => b.condition === 'poor' || b.condition === 'broken' || b.needs_replacement).length;
  const sensorBins = bins.filter((b: any) => b.has_sensor).length;
  const todayTrips = trips.length;
  const completedTrips = trips.filter((t: any) => t.status === 'completed').length;
  const todayWeight = trips.reduce((s: number, t: any) => s + (t.weight_tons || 0), 0);
  const todayBags = trips.reduce((s: number, t: any) => s + (t.bags_count || 0), 0);
  const openComplaints = complaints.filter((c: any) => c.status === 'open').length;
  const urgentComplaints = complaints.filter((c: any) => c.priority === 'urgent' && c.status !== 'resolved' && c.status !== 'closed').length;
  const completionRate = todayTrips > 0 ? Math.round((completedTrips / todayTrips) * 100) : 0;

  const activeCrews = crews.filter((c: any) => c.status === 'active').length;
  const totalWorkers = crews.reduce((s: number, c: any) => s + (c.worker_count || 0), 0);
  const presentToday = attendance.filter((a: any) => a.status === 'present' || a.status === 'late').length;
  const absentToday = attendance.filter((a: any) => a.status === 'absent').length;
  const todayLabourCost = attendance.reduce((s: number, a: any) => a.status !== 'absent' ? s + (a.daily_rate || 0) : s, 0);

  const activeEquipment = equipment.filter((e: any) => e.status === 'active').length;
  const maintenanceOverdue = equipment.filter((e: any) => e.next_maintenance_date && new Date(e.next_maintenance_date) <= new Date()).length;
  const manualTypes = ['broom', 'hand_cart', 'wheelbarrow', 'shovel', 'trash_picker', 'uniform_set', 'safety_gear'];
  const mechanicalEquip = equipment.filter((e: any) => !manualTypes.includes(e.equipment_type)).length;

  const activeStations = stations.filter((s: any) => s.status === 'active').length;
  const totalStationCapacity = stations.reduce((s: number, st: any) => s + (st.capacity_tons_per_day || 0), 0);

  const quickLinks = [
    { label: 'المناطق', path: '/dashboard/service-zones', icon: MapPin },
    { label: 'الصناديق', path: '/dashboard/street-bins', icon: Trash2 },
    { label: 'رحلات الجمع', path: '/dashboard/collection-trips', icon: Truck },
    { label: 'الطواقم', path: '/dashboard/sweeping-crews', icon: HardHat },
    { label: 'الحضور', path: '/dashboard/daily-attendance', icon: UserCheck },
    { label: 'المعدات', path: '/dashboard/sweeping-equipment', icon: Package },
    { label: 'المحطات', path: '/dashboard/transfer-stations', icon: Building },
    { label: 'الشكاوى', path: '/dashboard/citizen-complaints', icon: MessageSquareWarning },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            لوحة مراقبة العمليات البلدية
          </h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>

        {/* Quick Links */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quickLinks.map(ql => (
            <Button key={ql.path} size="sm" variant="outline" className="text-[10px] whitespace-nowrap h-7 px-2"
              onClick={() => navigate(ql.path)}>
              <ql.icon className="w-3 h-3 me-1" />{ql.label}
            </Button>
          ))}
        </div>

        {/* Operations KPIs */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">📊 مؤشرات العمليات</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <MapPin className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold">{zones.length}</p>
                <p className="text-[9px] text-muted-foreground">منطقة خدمة</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Trash2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <p className="text-lg font-bold">{activeBins}<span className="text-xs text-muted-foreground">/{totalBins}</span></p>
                <p className="text-[9px] text-muted-foreground">صندوق نشط</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Truck className="w-4 h-4 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{completedTrips}<span className="text-xs text-muted-foreground">/{todayTrips}</span></p>
                <p className="text-[9px] text-muted-foreground">رحلة اليوم</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-lg">
                <Scale className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                <p className="text-lg font-bold">{todayWeight.toFixed(1)}</p>
                <p className="text-[9px] text-muted-foreground">أطنان اليوم</p>
              </div>
              <div className={`text-center p-2 rounded-lg ${overflowBins > 0 ? 'bg-red-50' : 'bg-muted/50'}`}>
                <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${overflowBins > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                <p className="text-lg font-bold">{overflowBins}</p>
                <p className="text-[9px] text-muted-foreground">ممتلئ {'>'}80%</p>
              </div>
              <div className={`text-center p-2 rounded-lg ${openComplaints > 0 ? 'bg-amber-50' : 'bg-muted/50'}`}>
                <MessageSquareWarning className={`w-4 h-4 mx-auto mb-1 ${openComplaints > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
                <p className="text-lg font-bold">{openComplaints}</p>
                <p className="text-[9px] text-muted-foreground">شكوى مفتوحة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />نسبة إنجاز اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={completionRate} className="flex-1" />
              <span className="text-lg font-bold text-primary">{completionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTrips} رحلة مكتملة من {todayTrips} • {todayBags > 0 ? `${todayBags} كيس • ` : ''}{todayWeight.toFixed(1)} طن
            </p>
          </CardContent>
        </Card>

        {/* Workforce */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">👷 القوى العاملة</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <HardHat className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-sm">{activeCrews} طاقم</p>
                  <p className="text-[10px] text-muted-foreground">{totalWorkers} عامل مسجل</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-sm">{presentToday} حاضر</p>
                  <p className="text-[10px] text-muted-foreground">{absentToday > 0 ? `${absentToday} غائب` : 'لا غياب'}</p>
                </div>
              </div>
            </div>
            {todayLabourCost > 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">💰 تكلفة يومية العمالة: {todayLabourCost.toLocaleString()} ج.م</p>
            )}
          </CardContent>
        </Card>

        {/* Equipment & Stations */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <Package className="w-5 h-5 text-primary mb-1" />
              <p className="text-xl font-bold">{activeEquipment}</p>
              <p className="text-[10px] text-muted-foreground">معدة نشطة</p>
              {mechanicalEquip > 0 && <p className="text-[10px] text-primary mt-0.5">⚡ {mechanicalEquip} آلية</p>}
              {maintenanceOverdue > 0 && <p className="text-[10px] text-destructive mt-0.5">🔧 {maintenanceOverdue} تحتاج صيانة</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <Building className="w-5 h-5 text-primary mb-1" />
              <p className="text-xl font-bold">{activeStations}</p>
              <p className="text-[10px] text-muted-foreground">محطة ترحيل</p>
              {totalStationCapacity > 0 && <p className="text-[10px] text-primary mt-0.5">⚖️ {totalStationCapacity} طن/يوم</p>}
            </CardContent>
          </Card>
        </div>

        {/* Bin Health */}
        {damagedBins > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-3">
              <h3 className="font-bold text-sm text-amber-800 flex items-center gap-2 mb-1">
                <Wrench className="w-4 h-4" /> صيانة الصناديق
              </h3>
              <p className="text-xs text-amber-700">🗑️ {damagedBins} صندوق بحاجة لصيانة أو استبدال</p>
              {sensorBins > 0 && <p className="text-xs text-muted-foreground mt-0.5">📡 {sensorBins} صندوق ذكي (IoT)</p>}
            </CardContent>
          </Card>
        )}

        {/* Urgent Alerts */}
        {(urgentComplaints > 0 || overflowBins > 0 || maintenanceOverdue > 0) && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm text-destructive flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> تنبيهات عاجلة
              </h3>
              <div className="space-y-1 text-xs">
                {urgentComplaints > 0 && <p>⚠️ {urgentComplaints} شكوى عاجلة تحتاج تدخل فوري</p>}
                {overflowBins > 0 && <p>🗑️ {overflowBins} صندوق ممتلئ بنسبة تفوق 80%</p>}
                {maintenanceOverdue > 0 && <p>🔧 {maintenanceOverdue} معدة تأخرت صيانتها</p>}
                {absentToday > 3 && <p>👷 نسبة غياب مرتفعة: {absentToday} عامل غائب اليوم</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MunicipalDashboard;
