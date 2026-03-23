import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, FileText, TrendingUp, Users, Truck, Scale, AlertTriangle, Shield } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ar } from 'date-fns/locale';

const MunicipalReports = () => {
  const { organization } = useAuth();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(today, { weekStartsOn: 6 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 6 }), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  const { data: dailyTrips = [] } = useQuery({
    queryKey: ['report-daily-trips', organization?.id, todayStr],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_trips')
        .select('id, status, weight_tons, bins_collected, total_bins')
        .eq('organization_id', organization!.id).eq('trip_date', todayStr);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: dailyAttendance = [] } = useQuery({
    queryKey: ['report-daily-attendance', organization?.id, todayStr],
    queryFn: async () => {
      const { data } = await (supabase as any).from('daily_attendance')
        .select('id, status').eq('organization_id', organization!.id).eq('attendance_date', todayStr);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: weeklyComplaints = [] } = useQuery({
    queryKey: ['report-weekly-complaints', organization?.id, weekStart, weekEnd],
    queryFn: async () => {
      const { data } = await (supabase as any).from('citizen_complaints')
        .select('id, status, priority')
        .eq('organization_id', organization!.id)
        .gte('created_at', weekStart).lte('created_at', weekEnd);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: monthlyPenalties = [] } = useQuery({
    queryKey: ['report-monthly-penalties', organization?.id, monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await (supabase as any).from('contract_penalties')
        .select('id, amount, penalty_type, status')
        .eq('organization_id', organization!.id)
        .gte('penalty_date', monthStart).lte('penalty_date', monthEnd);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: monthlyIncidents = [] } = useQuery({
    queryKey: ['report-monthly-incidents', organization?.id, monthStart, monthEnd],
    queryFn: async () => {
      const { data } = await (supabase as any).from('worker_incidents')
        .select('id, severity, days_lost')
        .eq('organization_id', organization!.id)
        .gte('incident_date', monthStart).lte('incident_date', monthEnd);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Daily stats
  const completedTrips = dailyTrips.filter((t: any) => t.status === 'completed').length;
  const totalTons = dailyTrips.reduce((s: number, t: any) => s + (t.weight_tons || 0), 0);
  const presentWorkers = dailyAttendance.filter((a: any) => a.status === 'present').length;
  const absentWorkers = dailyAttendance.filter((a: any) => a.status === 'absent').length;
  const attendanceRate = dailyAttendance.length > 0 ? Math.round((presentWorkers / dailyAttendance.length) * 100) : 0;

  // Weekly
  const resolvedComplaints = weeklyComplaints.filter((c: any) => c.status === 'resolved').length;
  const complaintResolutionRate = weeklyComplaints.length > 0 ? Math.round((resolvedComplaints / weeklyComplaints.length) * 100) : 0;

  // Monthly
  const totalPenaltyAmount = monthlyPenalties.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalDaysLost = monthlyIncidents.reduce((s: number, i: any) => s + (i.days_lost || 0), 0);

  const ReportSection = ({ title, icon: Icon, items }: { title: string; icon: any; items: { label: string; value: string | number; color?: string }[] }) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-sm py-1 border-b last:border-0">
            <span className="text-muted-foreground">{item.label}</span>
            <span className={`font-bold ${item.color || ''}`}>{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-xl font-bold text-foreground">التقارير الدورية</h1>
        </div>

        <Tabs defaultValue="daily" dir="rtl">
          <TabsList className="w-full">
            <TabsTrigger value="daily" className="flex-1">يومي</TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">أسبوعي</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1">شهري</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3 mt-3">
            <div className="text-sm text-muted-foreground text-center">
              تقرير يوم {format(today, 'EEEE dd MMMM yyyy', { locale: ar })}
            </div>
            <ReportSection title="رحلات الجمع" icon={Truck} items={[
              { label: 'رحلات مكتملة', value: `${completedTrips} / ${dailyTrips.length}` },
              { label: 'أطنان مجموعة', value: `${totalTons.toFixed(1)} طن` },
              { label: 'معدل الإنجاز', value: dailyTrips.length > 0 ? `${Math.round((completedTrips / dailyTrips.length) * 100)}%` : '—' },
            ]} />
            <ReportSection title="حضور العمال" icon={Users} items={[
              { label: 'حاضرون', value: presentWorkers },
              { label: 'غائبون', value: absentWorkers, color: absentWorkers > 0 ? 'text-destructive' : '' },
              { label: 'نسبة الحضور', value: `${attendanceRate}%` },
            ]} />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-3 mt-3">
            <div className="text-sm text-muted-foreground text-center">
              أسبوع {format(new Date(weekStart), 'dd/MM')} — {format(new Date(weekEnd), 'dd/MM/yyyy')}
            </div>
            <ReportSection title="شكاوى المواطنين" icon={AlertTriangle} items={[
              { label: 'إجمالي الشكاوى', value: weeklyComplaints.length },
              { label: 'تم حلها', value: resolvedComplaints },
              { label: 'نسبة الحل', value: `${complaintResolutionRate}%` },
              { label: 'عاجلة', value: weeklyComplaints.filter((c: any) => c.priority === 'high').length, color: 'text-destructive' },
            ]} />
          </TabsContent>

          <TabsContent value="monthly" className="space-y-3 mt-3">
            <div className="text-sm text-muted-foreground text-center">
              تقرير شهر {format(today, 'MMMM yyyy', { locale: ar })}
            </div>
            <ReportSection title="الأداء مقابل SLA" icon={TrendingUp} items={[
              { label: 'إجمالي الغرامات', value: `${totalPenaltyAmount.toLocaleString()} ج.م`, color: totalPenaltyAmount > 0 ? 'text-destructive' : '' },
              { label: 'عدد المخالفات', value: monthlyPenalties.length },
            ]} />
            <ReportSection title="السلامة المهنية" icon={Shield} items={[
              { label: 'حوادث هذا الشهر', value: monthlyIncidents.length },
              { label: 'حوادث خطيرة', value: monthlyIncidents.filter((i: any) => ['severe', 'fatal'].includes(i.severity)).length, color: 'text-destructive' },
              { label: 'أيام عمل مفقودة', value: totalDaysLost },
            ]} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MunicipalReports;
