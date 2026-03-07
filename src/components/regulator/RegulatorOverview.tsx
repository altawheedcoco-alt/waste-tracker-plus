import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ClipboardCheck, AlertTriangle, Gavel, DollarSign, Shield, TrendingUp, Eye, FileCheck, Scale, Truck, Factory, Landmark, BarChart3 } from 'lucide-react';
import { useRegulatorStats, useRegulatorConfig, useRegulatorJurisdictions, useAllOrganizations, useFieldInspections, useRegulatoryViolations } from '@/hooks/useRegulatorData';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const LEVEL_META: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  wmra: { icon: Shield, color: 'text-primary', bg: 'bg-primary/10', label: 'WMRA' },
  eeaa: { icon: Landmark, color: 'text-emerald-700', bg: 'bg-emerald-500/10', label: 'EEAA' },
  ltra: { icon: Truck, color: 'text-blue-700', bg: 'bg-blue-500/10', label: 'LTRA' },
  ida: { icon: Factory, color: 'text-amber-700', bg: 'bg-amber-500/10', label: 'IDA' },
};

const PIE_COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6', '#ec4899'];

const RegulatorOverview = () => {
  const { data: stats, isLoading: statsLoading } = useRegulatorStats();
  const { data: config } = useRegulatorConfig();
  const { data: jurisdictions = [] } = useRegulatorJurisdictions();
  const { data: orgs = [] } = useAllOrganizations();
  const { data: inspections = [] } = useFieldInspections(100);
  const { data: violations = [] } = useRegulatoryViolations(100);

  const levelCode = config?.regulator_level_code || '';
  const meta = LEVEL_META[levelCode] || LEVEL_META.wmra;
  const LevelIcon = meta.icon;

  if (statsLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  // Organization type distribution for pie chart
  const orgTypeCounts = (orgs as any[]).reduce((acc: Record<string, number>, org: any) => {
    acc[org.organization_type] = (acc[org.organization_type] || 0) + 1;
    return acc;
  }, {});

  const ORG_TYPE_LABELS: Record<string, string> = {
    generator: 'مولد', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص',
    consultant: 'استشاري', consulting_office: 'مكتب استشاري', iso_body: 'أيزو', transport_office: 'مكتب نقل',
  };

  const orgTypeData = Object.entries(orgTypeCounts).map(([type, count]) => ({
    name: ORG_TYPE_LABELS[type] || type,
    value: count as number,
  }));

  // Inspection status distribution
  const inspStatusCounts = (inspections as any[]).reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const INSP_LABELS: Record<string, string> = {
    scheduled: 'مجدولة', in_progress: 'جارية', completed: 'مكتملة', cancelled: 'ملغية',
  };

  const inspStatusData = Object.entries(inspStatusCounts).map(([status, count]) => ({
    name: INSP_LABELS[status] || status,
    value: count as number,
  }));

  // Violation severity distribution
  const violationSeverity = (violations as any[]).reduce((acc: Record<string, number>, v: any) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1;
    return acc;
  }, {});

  const SEV_LABELS: Record<string, string> = { minor: 'بسيطة', major: 'جسيمة', critical: 'حرجة' };
  const SEV_COLORS: Record<string, string> = { minor: '#f59e0b', major: '#ef4444', critical: '#7f1d1d' };

  const violationData = Object.entries(violationSeverity).map(([sev, count]) => ({
    name: SEV_LABELS[sev] || sev,
    count: count as number,
    fill: SEV_COLORS[sev] || '#6366f1',
  }));

  // Verified vs unverified orgs
  const verifiedCount = (orgs as any[]).filter((o: any) => o.is_verified).length;
  const unverifiedCount = (orgs as any[]).length - verifiedCount;

  const cards = [
    { label: 'إجمالي المنظمات', value: stats.totalOrganizations, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'زيارات التفتيش', value: stats.totalInspections, icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-500/10', sub: `${stats.scheduledInspections} مجدولة` },
    { label: 'مخالفات مفتوحة', value: stats.openViolations, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', sub: `${stats.totalViolations} إجمالي` },
    { label: 'عقوبات نشطة', value: stats.activePenalties, icon: Gavel, color: 'text-amber-600', bg: 'bg-amber-500/10', sub: `${stats.totalPenalties} إجمالي` },
    { label: 'غرامات مُصدرة', value: `${stats.totalFines.toLocaleString()} ج.م`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'غرامات مُحصلة', value: `${stats.collectedFines.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10' },
    { label: 'مخالفات تم حلها', value: stats.resolvedViolations, icon: Shield, color: 'text-teal-600', bg: 'bg-teal-500/10' },
    { label: 'تفتيش مكتمل', value: stats.completedInspections, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Authority Header */}
      <Card className="border-primary/20 bg-gradient-to-l from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${meta.bg}`}>
              <LevelIcon className={`w-8 h-8 ${meta.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{(config as any)?.regulator_levels?.level_name_ar || levelCode}</h2>
              <p className="text-xs text-muted-foreground">{(config as any)?.regulator_levels?.level_name_en}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                📜 {config?.authority_reference}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(jurisdictions as any[]).slice(0, 4).map((j: any) => (
                <Badge key={j.id} variant={j.is_primary_authority ? 'default' : 'outline'} className="text-[9px]">
                  {j.is_primary_authority && '🔑 '}{ORG_TYPE_LABELS[j.supervised_org_type] || j.supervised_org_type}
                </Badge>
              ))}
              {(jurisdictions as any[]).length > 4 && (
                <Badge variant="outline" className="text-[9px]">+{(jurisdictions as any[]).length - 4}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{card.label}</p>
                  {card.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Organization Distribution */}
        {orgTypeData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> توزيع المنظمات
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orgTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {orgTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Compliance Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" /> حالة التحقق
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">منظمات مُتحقق منها</span>
                <Badge className="bg-emerald-500/10 text-emerald-700">{verifiedCount}</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${orgs.length ? (verifiedCount / orgs.length * 100) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">غير مُتحقق منها</span>
                <Badge variant="destructive" className="text-xs">{unverifiedCount}</Badge>
              </div>
              <div className="pt-2 border-t text-center">
                <p className="text-2xl font-bold text-primary">
                  {orgs.length ? Math.round(verifiedCount / orgs.length * 100) : 0}%
                </p>
                <p className="text-[10px] text-muted-foreground">نسبة الامتثال</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Violations by Severity */}
        {violationData.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> المخالفات حسب الخطورة
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={violationData}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {violationData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" /> المخالفات حسب الخطورة
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              لا توجد مخالفات ✅
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inspection Status Summary */}
      {inspStatusData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" /> ملخص التفتيش الميداني
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {inspStatusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                  <span className="text-2xl font-bold">{item.value}</span>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegulatorOverview;
