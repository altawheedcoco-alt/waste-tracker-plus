import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Building2, AlertTriangle, ClipboardCheck, FileCheck, Gavel, Shield, PieChart as PieChartIcon } from 'lucide-react';
import { useRegulatorStats, useAllOrganizations, useRegulatorJurisdictions, useFieldInspections, useRegulatoryViolations, useRegulatoryPenalties } from '@/hooks/useRegulatorData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { differenceInDays, format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6'];

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص',
  consultant: 'استشاري', consulting_office: 'مكتب استشاري', iso_body: 'أيزو',
};

const RegulatoryReportsPanel = () => {
  const { data: stats, isLoading: statsLoading } = useRegulatorStats();
  const { data: jurisdictions = [] } = useRegulatorJurisdictions();
  const supervisedTypes = [...new Set((jurisdictions as any[]).map((j: any) => j.supervised_org_type))];
  const { data: orgs = [] } = useAllOrganizations(supervisedTypes.length > 0 ? supervisedTypes : undefined);
  const { data: inspections = [] } = useFieldInspections(200);
  const { data: violations = [] } = useRegulatoryViolations(200);
  const { data: penalties = [] } = useRegulatoryPenalties(200);

  // Fetch licenses for compliance analysis
  const { data: allLicenses = [] } = useQuery({
    queryKey: ['reports-all-licenses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('legal_licenses')
        .select('organization_id, license_category, expiry_date, status, created_at')
        .limit(1000);
      return data || [];
    },
  });

  const isLoading = statsLoading;

  // Organization type distribution
  const orgTypeData = useMemo(() => {
    const counts = (orgs as any[]).reduce((acc: Record<string, number>, org: any) => {
      acc[org.organization_type] = (acc[org.organization_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => ({
      name: ORG_TYPE_LABELS[type] || type,
      value: count as number,
    }));
  }, [orgs]);

  // Monthly inspection trend (last 6 months)
  const inspectionTrend = useMemo(() => {
    const months: { month: string; count: number; completed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthInsp = (inspections as any[]).filter((ins: any) => {
        const d = new Date(ins.inspection_date);
        return d >= start && d <= end;
      });
      months.push({
        month: format(date, 'MM/yyyy'),
        count: monthInsp.length,
        completed: monthInsp.filter((i: any) => i.status === 'completed').length,
      });
    }
    return months;
  }, [inspections]);

  // Violations by type
  const violationsByType = useMemo(() => {
    const counts = (violations as any[]).reduce((acc: Record<string, number>, v: any) => {
      acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
      return acc;
    }, {});
    const typeLabels: Record<string, string> = {
      license_expired: 'ترخيص منتهي', illegal_dumping: 'تخلص غير قانوني',
      unsafe_transport: 'نقل غير آمن', missing_documents: 'مستندات ناقصة',
      environmental_breach: 'خرق بيئي', weight_tampering: 'تلاعب بالأوزان',
      route_deviation: 'انحراف مسار', unauthorized_waste: 'مخلفات غير مصرح',
    };
    return Object.entries(counts).map(([type, count]) => ({
      name: typeLabels[type] || type,
      count: count as number,
    })).sort((a, b) => b.count - a.count);
  }, [violations]);

  // License compliance across orgs
  const licenseCompliance = useMemo(() => {
    const now = new Date();
    let active = 0, expired = 0, expiring = 0;
    allLicenses.forEach((l: any) => {
      if (!l.expiry_date) { active++; return; }
      const days = differenceInDays(new Date(l.expiry_date), now);
      if (days < 0) expired++;
      else if (days <= 30) expiring++;
      else active++;
    });
    return [
      { name: 'سارية', value: active, fill: '#10b981' },
      { name: 'تنتهي قريباً', value: expiring, fill: '#f59e0b' },
      { name: 'منتهية', value: expired, fill: '#ef4444' },
    ];
  }, [allLicenses]);

  // Penalty types distribution
  const penaltyTypes = useMemo(() => {
    const counts = (penalties as any[]).reduce((acc: Record<string, number>, p: any) => {
      acc[p.penalty_type] = (acc[p.penalty_type] || 0) + 1;
      return acc;
    }, {});
    const labels: Record<string, string> = {
      warning: 'إنذار', fine: 'غرامة', license_suspension: 'تعليق ترخيص',
      license_revocation: 'إلغاء ترخيص', temporary_ban: 'حظر مؤقت',
      permanent_ban: 'حظر نهائي', corrective_action: 'إجراء تصحيحي',
    };
    return Object.entries(counts).map(([type, count]) => ({
      name: labels[type] || type,
      value: count as number,
    }));
  }, [penalties]);

  // Verification status
  const verifiedCount = (orgs as any[]).filter((o: any) => o.is_verified).length;
  const verificationRate = orgs.length > 0 ? Math.round((verifiedCount / orgs.length) * 100) : 0;

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'المنظمات', value: orgs.length, icon: Building2, color: 'text-primary' },
          { label: 'التفتيشات', value: inspections.length, icon: ClipboardCheck, color: 'text-blue-600' },
          { label: 'المخالفات', value: violations.length, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'العقوبات', value: penalties.length, icon: Gavel, color: 'text-amber-600' },
          { label: 'التراخيص', value: allLicenses.length, icon: FileCheck, color: 'text-emerald-600' },
          { label: 'نسبة التحقق', value: `${verificationRate}%`, icon: Shield, color: 'text-indigo-600' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-3 text-center">
              <kpi.icon className={`w-5 h-5 mx-auto mb-1 ${kpi.color}`} />
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Inspection Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              اتجاه التفتيش الميداني (6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={inspectionTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="إجمالي" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="completed" name="مكتملة" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Organization Distribution */}
        {orgTypeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-primary" />
                توزيع المنظمات حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={orgTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {orgTypeData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Violations by Type */}
        {violationsByType.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                المخالفات حسب النوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={violationsByType} layout="vertical">
                  <XAxis type="number" fontSize={10} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* License Compliance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              حالة التراخيص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={licenseCompliance} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {licenseCompliance.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Penalty Distribution */}
        {penaltyTypes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-600" />
                أنواع العقوبات المُصدرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={penaltyTypes}>
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="value" name="عدد" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        {stats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                ملخص الغرامات المالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">غرامات مُصدرة</span>
                  <span className="font-bold text-lg">{stats.totalFines.toLocaleString()} ج.م</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">غرامات مُحصلة</span>
                  <span className="font-bold text-lg text-emerald-600">{stats.collectedFines.toLocaleString()} ج.م</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${stats.totalFines > 0 ? (stats.collectedFines / stats.totalFines * 100) : 0}%` }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  نسبة التحصيل: {stats.totalFines > 0 ? Math.round(stats.collectedFines / stats.totalFines * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RegulatoryReportsPanel;
