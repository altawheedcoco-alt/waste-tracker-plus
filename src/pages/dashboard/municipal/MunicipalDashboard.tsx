import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  MapPin, Truck, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  MessageSquareWarning, Scale, BarChart3, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

const MunicipalDashboard = () => {
  const { organization } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: zones = [] } = useQuery({
    queryKey: ['dash-zones', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('service_zones').select('id, zone_name, bin_count, status')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: bins = [] } = useQuery({
    queryKey: ['dash-bins', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('street_bins').select('id, status, fill_level_percent, has_sensor')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['dash-trips', organization?.id, today],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_trips').select('id, status, bins_collected, total_bins, weight_tons')
        .eq('organization_id', organization!.id).eq('trip_date', today);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: complaints = [] } = useQuery({
    queryKey: ['dash-complaints', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('citizen_complaints').select('id, status, priority, created_at')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['dash-routes', organization?.id],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_routes').select('id, status')
        .eq('organization_id', organization!.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // KPIs
  const totalBins = bins.length;
  const activeBins = bins.filter((b: any) => b.status === 'active').length;
  const overflowBins = bins.filter((b: any) => b.fill_level_percent >= 80).length;
  const sensorBins = bins.filter((b: any) => b.has_sensor).length;
  const todayTrips = trips.length;
  const completedTrips = trips.filter((t: any) => t.status === 'completed').length;
  const todayWeight = trips.reduce((s: number, t: any) => s + (t.weight_tons || 0), 0);
  const openComplaints = complaints.filter((c: any) => c.status === 'open').length;
  const urgentComplaints = complaints.filter((c: any) => c.priority === 'urgent' && c.status !== 'resolved' && c.status !== 'closed').length;
  const completionRate = todayTrips > 0 ? Math.round((completedTrips / todayTrips) * 100) : 0;

  const statCards = [
    { icon: MapPin, label: 'المناطق', value: zones.length, color: 'text-blue-600' },
    { icon: Trash2, label: 'الصناديق', value: `${activeBins}/${totalBins}`, color: 'text-emerald-600' },
    { icon: AlertTriangle, label: 'ممتلئة (>80%)', value: overflowBins, color: overflowBins > 0 ? 'text-red-600' : 'text-emerald-600' },
    { icon: Truck, label: 'رحلات اليوم', value: `${completedTrips}/${todayTrips}`, color: 'text-primary' },
    { icon: Scale, label: 'أطنان اليوم', value: todayWeight.toFixed(1), color: 'text-purple-600' },
    { icon: MessageSquareWarning, label: 'شكاوى مفتوحة', value: openComplaints, color: openComplaints > 0 ? 'text-amber-600' : 'text-emerald-600' },
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

        {/* KPI Grid */}
        <div className="grid grid-cols-3 gap-2">
          {statCards.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-3 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              نسبة إنجاز اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Progress value={completionRate} className="flex-1" />
              <span className="text-lg font-bold text-primary">{completionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTrips} رحلة مكتملة من {todayTrips} مخططة
            </p>
          </CardContent>
        </Card>

        {/* Urgent Alerts */}
        {(urgentComplaints > 0 || overflowBins > 0) && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <h3 className="font-bold text-sm text-destructive flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> تنبيهات عاجلة
              </h3>
              <div className="space-y-1 text-xs">
                {urgentComplaints > 0 && (
                  <p>⚠️ {urgentComplaints} شكوى عاجلة تحتاج تدخل فوري</p>
                )}
                {overflowBins > 0 && (
                  <p>🗑️ {overflowBins} صندوق ممتلئ بنسبة تفوق 80%</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Routes & IoT Summary */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">المسارات</h3>
              <p className="text-2xl font-bold text-primary">{routes.filter((r: any) => r.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">مسار نشط</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2">حساسات IoT</h3>
              <p className="text-2xl font-bold text-primary">{sensorBins}</p>
              <p className="text-xs text-muted-foreground">صندوق ذكي</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MunicipalDashboard;
