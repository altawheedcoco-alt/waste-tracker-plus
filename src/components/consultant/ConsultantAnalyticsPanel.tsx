import { memo, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart3, TrendingUp, FileText, Download, Loader2,
  Calendar, Users, Building2, Pen, ShieldCheck, MapPin,
  CheckCircle2, Clock, AlertTriangle, Target,
} from 'lucide-react';
import { format, parseISO, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface ConsultantAnalyticsPanelProps {
  consultantId?: string;
  officeId?: string;
  mode: 'individual' | 'office';
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const ConsultantAnalyticsPanel = memo(({ consultantId, officeId, mode }: ConsultantAnalyticsPanelProps) => {
  const [period, setPeriod] = useState('30');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subDays(end, parseInt(period));
    return { start: start.toISOString(), end: end.toISOString() };
  }, [period]);

  // Fetch signatures data
  const { data: signatures = [], isLoading: loadingSigs } = useQuery({
    queryKey: ['analytics-signatures', consultantId, officeId, mode, period],
    queryFn: async () => {
      let q = supabase
        .from('consultant_document_signatures')
        .select('*')
        .gte('signed_at', dateRange.start)
        .lte('signed_at', dateRange.end)
        .order('signed_at', { ascending: true });

      if (mode === 'individual' && consultantId) {
        q = q.eq('consultant_id', consultantId);
      } else if (mode === 'office' && officeId) {
        q = q.eq('office_id', officeId);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!(consultantId || officeId),
  });

  // Fetch field operations
  const { data: fieldOps = [], isLoading: loadingOps } = useQuery({
    queryKey: ['analytics-field-ops', consultantId, officeId, mode, period],
    queryFn: async () => {
      let q = supabase
        .from('consultant_field_operations')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (mode === 'individual' && consultantId) {
        q = q.eq('consultant_id', consultantId);
      }
      const { data } = await q;
      return data || [];
    },
    enabled: !!(consultantId || officeId),
  });

  // Compute analytics
  const analytics = useMemo(() => {
    const totalSigs = signatures.length;
    const approved = signatures.filter((s: any) => s.director_approval_status === 'approved' || !s.office_id).length;
    const pending = signatures.filter((s: any) => s.director_approval_status === 'pending').length;
    const rejected = signatures.filter((s: any) => s.director_approval_status === 'rejected').length;

    // Signatures by document type
    const byDocType: Record<string, number> = {};
    signatures.forEach((s: any) => {
      const type = s.document_type || 'غير محدد';
      byDocType[type] = (byDocType[type] || 0) + 1;
    });
    const docTypeChart = Object.entries(byDocType).map(([name, value]) => ({ name, value }));

    // Signatures over time (daily)
    const byDate: Record<string, number> = {};
    signatures.forEach((s: any) => {
      const day = format(parseISO(s.signed_at), 'MM/dd');
      byDate[day] = (byDate[day] || 0) + 1;
    });
    const timelineChart = Object.entries(byDate).map(([date, count]) => ({ date, count }));

    // Field ops by type
    const opsByType: Record<string, number> = {};
    fieldOps.forEach((op: any) => {
      const type = op.operation_type || 'أخرى';
      opsByType[type] = (opsByType[type] || 0) + 1;
    });

    const opLabels: Record<string, string> = {
      site_inspection: 'معاينة موقع',
      waste_classification: 'تصنيف مخلفات',
      hazard_assessment: 'تقييم خطورة',
      vehicle_inspection: 'فحص مركبة',
      load_matching: 'مطابقة حمولة',
    };
    const opsChart = Object.entries(opsByType).map(([key, value]) => ({ name: opLabels[key] || key, value }));

    // Field ops results
    const opsApproved = fieldOps.filter((o: any) => o.result === 'approved').length;
    const opsRejected = fieldOps.filter((o: any) => o.result === 'rejected').length;
    const opsReview = fieldOps.filter((o: any) => o.result === 'needs_review').length;

    // Approval rate
    const approvalRate = totalSigs > 0 ? Math.round((approved / totalSigs) * 100) : 0;
    const complianceRate = fieldOps.length > 0 ? Math.round((opsApproved / fieldOps.length) * 100) : 0;

    return {
      totalSigs, approved, pending, rejected,
      docTypeChart, timelineChart, opsChart,
      opsApproved, opsRejected, opsReview,
      approvalRate, complianceRate,
      totalFieldOps: fieldOps.length,
    };
  }, [signatures, fieldOps]);

  const isLoading = loadingSigs || loadingOps;

  const statusPieData = [
    { name: 'معتمد', value: analytics.approved },
    { name: 'قيد المراجعة', value: analytics.pending },
    { name: 'مرفوض', value: analytics.rejected },
  ].filter(d => d.value > 0);

  const exportReport = () => {
    const report = {
      period: `آخر ${period} يوم`,
      generated: new Date().toISOString(),
      summary: {
        totalSignatures: analytics.totalSigs,
        approved: analytics.approved,
        pending: analytics.pending,
        rejected: analytics.rejected,
        approvalRate: `${analytics.approvalRate}%`,
        totalFieldOps: analytics.totalFieldOps,
        complianceRate: `${analytics.complianceRate}%`,
      },
      signaturesByType: analytics.docTypeChart,
      fieldOperations: analytics.opsChart,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultant-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            {mode === 'office' ? 'تحليلات أداء المكتب' : 'تحليلات الأداء الشخصي'}
          </h2>
          <p className="text-sm text-muted-foreground">تقارير وإحصائيات تفصيلية</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">آخر 7 أيام</SelectItem>
              <SelectItem value="30">آخر 30 يوم</SelectItem>
              <SelectItem value="90">آخر 3 أشهر</SelectItem>
              <SelectItem value="365">آخر سنة</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportReport} className="gap-1.5">
            <Download className="w-4 h-4" />تصدير
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={Pen} label="التوقيعات" value={analytics.totalSigs} color="text-primary" />
            <KPICard icon={CheckCircle2} label="نسبة الاعتماد" value={`${analytics.approvalRate}%`} color="text-emerald-600" isText />
            <KPICard icon={MapPin} label="العمليات الميدانية" value={analytics.totalFieldOps} color="text-blue-600" />
            <KPICard icon={Target} label="نسبة المطابقة" value={`${analytics.complianceRate}%`} color="text-amber-600" isText />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signatures Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />التوقيعات عبر الزمن
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.timelineChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.timelineChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-[10px]" />
                      <YAxis className="text-[10px]" />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} name="التوقيعات" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* Approval Status Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />حالة الاعتمادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {statusPieData.map((_, i) => (
                          <Cell key={i} fill={['hsl(var(--chart-2))', 'hsl(var(--chart-4))', 'hsl(var(--destructive))'][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Types Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />التوقيعات حسب نوع المستند
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.docTypeChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.docTypeChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-[10px]" />
                      <YAxis type="category" dataKey="name" className="text-[10px]" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="العدد" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* Field Ops Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />العمليات الميدانية حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.opsChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.opsChart}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-[10px]" />
                      <YAxis className="text-[10px]" />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="العدد" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Field Ops Result Summary */}
          {analytics.totalFieldOps > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">ملخص نتائج العمليات الميدانية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-2xl font-bold text-emerald-600">{analytics.opsApproved}</p>
                    <p className="text-xs text-muted-foreground">مطابق</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-2xl font-bold text-amber-600">{analytics.opsReview}</p>
                    <p className="text-xs text-muted-foreground">يحتاج مراجعة</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <p className="text-2xl font-bold text-destructive">{analytics.opsRejected}</p>
                    <p className="text-xs text-muted-foreground">غير مطابق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
});

const KPICard = ({ icon: Icon, label, value, color, isText }: { icon: any; label: string; value: number | string; color: string; isText?: boolean }) => (
  <Card>
    <CardContent className="p-4 text-right">
      <div className="flex items-center justify-between">
        <Icon className={`w-8 h-8 ${color} opacity-60`} />
        <div>
          <p className={`${isText ? 'text-lg' : 'text-2xl'} font-bold`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

ConsultantAnalyticsPanel.displayName = 'ConsultantAnalyticsPanel';
export default ConsultantAnalyticsPanel;
