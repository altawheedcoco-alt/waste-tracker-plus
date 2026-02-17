import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, FileCheck2, AlertTriangle, ShieldCheck, TrendingUp, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInDays, isPast } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface KPIData {
  documentsTotal: number;
  documentsVerified: number;
  documentsRate: number;
  licensesTotal: number;
  licensesActive: number;
  licensesExpiring: number;
  licensesExpired: number;
  licensesRate: number;
  risksTotal: number;
  risksCritical: number;
  risksHigh: number;
  risksMitigated: number;
  carsTotal: number;
  carsOpen: number;
  carsOverdue: number;
  carsClosed: number;
  carsCloseRate: number;
  trainedMembers: number;
  totalMembers: number;
  trainingRate: number;
  shipmentsCompliant: number;
  shipmentsTotal: number;
  complianceRate: number;
  overallReadiness: number;
  auditSessions: number;
  auditCompleted: number;
  riskDistribution: { name: string; value: number; color: string }[];
  axisScores: { name: string; score: number }[];
}

const ConsultantKPIsWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: kpi, isLoading } = useQuery({
    queryKey: ['consultant-kpis', orgId],
    queryFn: async (): Promise<KPIData> => {
      if (!orgId) throw new Error('No org');

      // Parallel fetches
      const [docsRes, licensesRes, risksRes, carsRes, membersRes, shipmentsRes, auditsRes] = await Promise.all([
        (supabase.from('organization_documents') as any).select('id, verification_status').eq('organization_id', orgId),
        (supabase.from('legal_licenses') as any).select('id, expiry_date, status').eq('organization_id', orgId),
        (supabase.from('risk_register') as any).select('id, risk_level, status').eq('organization_id', orgId),
        (supabase.from('corrective_actions') as any).select('id, status, deadline').eq('organization_id', orgId),
        supabase.from('profiles').select('id').eq('organization_id', orgId),
        supabase.from('shipments').select('id, status, compliance_score').eq('generator_id', orgId).order('created_at', { ascending: false }).limit(100),
        (supabase.from('audit_sessions') as any).select('id, status').eq('organization_id', orgId),
      ]);

      const docs = docsRes.data || [];
      const licenses = licensesRes.data || [];
      const risks = risksRes.data || [];
      const cars = carsRes.data || [];
      const members = membersRes.data || [];
      const shipments = shipmentsRes.data || [];
      const audits = auditsRes.data || [];

      const now = new Date();
      const documentsVerified = docs.filter((d: any) => d.verification_status === 'verified').length;
      const licensesActive = licenses.filter((l: any) => !l.expiry_date || differenceInDays(new Date(l.expiry_date), now) > 30).length;
      const licensesExpiring = licenses.filter((l: any) => l.expiry_date && differenceInDays(new Date(l.expiry_date), now) <= 30 && differenceInDays(new Date(l.expiry_date), now) > 0).length;
      const licensesExpired = licenses.filter((l: any) => l.expiry_date && isPast(new Date(l.expiry_date))).length;

      const risksCritical = risks.filter((r: any) => r.risk_level === 'critical').length;
      const risksHigh = risks.filter((r: any) => r.risk_level === 'high').length;
      const risksMitigated = risks.filter((r: any) => r.status === 'mitigated' || r.status === 'closed').length;

      const carsOpen = cars.filter((c: any) => c.status === 'open').length;
      const carsOverdue = cars.filter((c: any) => c.deadline && isPast(new Date(c.deadline)) && c.status !== 'closed').length;
      const carsClosed = cars.filter((c: any) => c.status === 'closed').length;

      const shipmentsCompliant = shipments.filter((s: any) => (s.compliance_score || 0) >= 70).length;

      // Axis scores for readiness chart
      const docRate = docs.length > 0 ? Math.round((documentsVerified / docs.length) * 100) : 0;
      const licRate = licenses.length > 0 ? Math.round((licensesActive / licenses.length) * 100) : 0;
      const riskRate = risks.length > 0 ? Math.round((risksMitigated / risks.length) * 100) : 50;
      const carRate = cars.length > 0 ? Math.round((carsClosed / cars.length) * 100) : 100;
      const shipRate = shipments.length > 0 ? Math.round((shipmentsCompliant / shipments.length) * 100) : 50;

      const overallReadiness = Math.round((docRate * 0.15 + licRate * 0.25 + riskRate * 0.2 + carRate * 0.2 + shipRate * 0.2));

      return {
        documentsTotal: docs.length,
        documentsVerified,
        documentsRate: docRate,
        licensesTotal: licenses.length,
        licensesActive,
        licensesExpiring,
        licensesExpired,
        licensesRate: licRate,
        risksTotal: risks.length,
        risksCritical,
        risksHigh,
        risksMitigated,
        carsTotal: cars.length,
        carsOpen,
        carsOverdue,
        carsClosed,
        carsCloseRate: carRate,
        trainedMembers: 0, // Will be calculated if LMS data exists
        totalMembers: members.length,
        trainingRate: 0,
        shipmentsCompliant,
        shipmentsTotal: shipments.length,
        complianceRate: shipRate,
        overallReadiness,
        auditSessions: audits.length,
        auditCompleted: audits.filter((a: any) => a.status === 'completed').length,
        riskDistribution: [
          { name: 'حرج', value: risksCritical, color: '#ef4444' },
          { name: 'عالي', value: risksHigh, color: '#f97316' },
          { name: 'متوسط', value: risks.filter((r: any) => r.risk_level === 'medium').length, color: '#eab308' },
          { name: 'منخفض', value: risks.filter((r: any) => r.risk_level === 'low').length, color: '#22c55e' },
        ].filter(d => d.value > 0),
        axisScores: [
          { name: 'التراخيص', score: licRate },
          { name: 'التوثيق', score: docRate },
          { name: 'المخاطر', score: riskRate },
          { name: 'التصحيحية', score: carRate },
          { name: 'التشغيل', score: shipRate },
        ],
      };
    },
    enabled: !!orgId,
    staleTime: 120000,
  });

  if (isLoading) return <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><BarChart3 className="w-5 h-5" /> لوحة مؤشرات الاستشاري</CardTitle></CardHeader><CardContent><Skeleton className="h-60 w-full" /></CardContent></Card>;
  if (!kpi) return null;

  const readinessColor = kpi.overallReadiness >= 80 ? 'text-emerald-600' : kpi.overallReadiness >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base justify-end">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> لوحة مؤشرات جاهزية الاعتماد (KPIs)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall Readiness */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border">
          <p className="text-xs text-muted-foreground mb-1">الجاهزية الإجمالية للمراجعة</p>
          <div className={`text-5xl font-bold ${readinessColor}`}>{kpi.overallReadiness}%</div>
          <Progress value={kpi.overallReadiness} className="h-3 mt-3" />
          <p className="text-[10px] text-muted-foreground mt-2">
            {kpi.overallReadiness >= 80 ? '✅ جاهز للمراجعة الخارجية' : kpi.overallReadiness >= 60 ? '⚠️ يحتاج تحسينات قبل المراجعة' : '❌ غير جاهز - يجب معالجة الفجوات'}
          </p>
        </motion.div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <KPICard icon={FileCheck2} label="الوثائق الموثقة" value={`${kpi.documentsVerified}/${kpi.documentsTotal}`} rate={kpi.documentsRate} color="text-blue-600" />
          <KPICard icon={ShieldCheck} label="التراخيص السارية" value={`${kpi.licensesActive}/${kpi.licensesTotal}`} rate={kpi.licensesRate} color="text-emerald-600"
            alert={kpi.licensesExpiring > 0 ? `${kpi.licensesExpiring} تنتهي قريباً` : undefined} />
          <KPICard icon={AlertTriangle} label="المخاطر المفتوحة" value={`${kpi.risksTotal - kpi.risksMitigated}`} rate={kpi.risksTotal > 0 ? Math.round((kpi.risksMitigated / kpi.risksTotal) * 100) : 100} color="text-amber-600"
            alert={kpi.risksCritical > 0 ? `${kpi.risksCritical} حرج` : undefined} />
          <KPICard icon={Clock} label="التذاكر التصحيحية" value={`${kpi.carsOpen} مفتوحة`} rate={kpi.carsCloseRate} color="text-red-600"
            alert={kpi.carsOverdue > 0 ? `${kpi.carsOverdue} متأخرة` : undefined} />
          <KPICard icon={TrendingUp} label="امتثال الشحنات" value={`${kpi.shipmentsCompliant}/${kpi.shipmentsTotal}`} rate={kpi.complianceRate} color="text-purple-600" />
          <KPICard icon={CheckCircle2} label="جلسات المراجعة" value={`${kpi.auditCompleted}/${kpi.auditSessions}`} rate={kpi.auditSessions > 0 ? Math.round((kpi.auditCompleted / kpi.auditSessions) * 100) : 0} color="text-teal-600" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Axis Scores Bar Chart */}
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-xs font-semibold text-right mb-2">درجات محاور التقييم</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={kpi.axisScores} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'الدرجة']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {kpi.axisScores.map((entry, i) => (
                    <Cell key={i} fill={entry.score >= 80 ? '#22c55e' : entry.score >= 60 ? '#eab308' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Distribution Pie */}
          {kpi.riskDistribution.length > 0 && (
            <div className="p-3 rounded-lg border bg-card">
              <p className="text-xs font-semibold text-right mb-2">توزيع المخاطر</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={kpi.riskDistribution} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {kpi.riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Alerts Strip */}
        {(kpi.licensesExpired > 0 || kpi.carsOverdue > 0 || kpi.risksCritical > 0) && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-1">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 text-right flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3.5 h-3.5" /> تنبيهات عاجلة:
            </p>
            {kpi.licensesExpired > 0 && <p className="text-[10px] text-red-600 text-right">🔴 {kpi.licensesExpired} ترخيص منتهي الصلاحية</p>}
            {kpi.carsOverdue > 0 && <p className="text-[10px] text-red-600 text-right">🔴 {kpi.carsOverdue} تذكرة تصحيحية متأخرة</p>}
            {kpi.risksCritical > 0 && <p className="text-[10px] text-red-600 text-right">🔴 {kpi.risksCritical} خطر بمستوى حرج لم يُعالج</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Reusable KPI Card
const KPICard = ({ icon: Icon, label, value, rate, color, alert }: { icon: any; label: string; value: string; rate: number; color: string; alert?: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 rounded-lg border bg-card text-right space-y-1.5">
    <div className="flex items-center gap-1.5 justify-end">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
    <p className="text-lg font-bold">{value}</p>
    <Progress value={rate} className="h-1.5" />
    <p className="text-[9px] text-muted-foreground">{rate}% مكتمل</p>
    {alert && <Badge variant="destructive" className="text-[8px] px-1 py-0">{alert}</Badge>}
  </motion.div>
);

export default ConsultantKPIsWidget;
