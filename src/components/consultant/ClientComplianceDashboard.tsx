import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, FileCheck2, AlertTriangle, Clock,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, 
  FileText, TrendingUp, Loader2,
} from 'lucide-react';
import { differenceInDays, isPast, format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ClientComplianceData {
  orgId: string;
  orgName: string;
  orgType: string;
  city?: string;
  overallScore: number;
  licenses: { total: number; active: number; expiring: number; expired: number; rate: number };
  documents: { total: number; verified: number; rate: number };
  risks: { total: number; critical: number; high: number; mitigated: number };
  cars: { total: number; open: number; overdue: number };
  shipments: { total: number; compliant: number; rate: number };
  alerts: string[];
}

const trafficLight = (score: number) => {
  if (score >= 80) return { color: 'bg-emerald-500', text: 'text-emerald-700', label: 'ممتاز', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
  if (score >= 60) return { color: 'bg-amber-500', text: 'text-amber-700', label: 'يحتاج تحسين', bg: 'bg-amber-50 dark:bg-amber-950/20' };
  return { color: 'bg-red-500', text: 'text-red-700', label: 'خطر', bg: 'bg-red-50 dark:bg-red-950/20' };
};

const orgTypeLabels: Record<string, string> = {
  generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر', disposal: 'تخلص نهائي',
};

const ClientComplianceDashboard = memo(({ assignments }: { assignments: any[] }) => {
  const navigate = useNavigate();
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ['consultant-clients-compliance', assignments.map((a: any) => a.organization?.id).join(',')],
    queryFn: async (): Promise<ClientComplianceData[]> => {
      const results: ClientComplianceData[] = [];
      
      for (const assignment of assignments) {
        const orgId = assignment.organization?.id;
        if (!orgId) continue;

        const [docsRes, licensesRes, risksRes, carsRes, shipmentsRes] = await Promise.all([
          supabase.from('organization_documents').select('id, verification_status').eq('organization_id', orgId),
          (supabase.from('legal_licenses') as any).select('id, expiry_date, status').eq('organization_id', orgId),
          (supabase.from('risk_register') as any).select('id, risk_level, status').eq('organization_id', orgId),
          (supabase.from('corrective_actions') as any).select('id, status, deadline').eq('organization_id', orgId),
          supabase.from('shipments').select('id, status').eq('generator_id', orgId).limit(100),
        ]);

        const docs = docsRes.data || [];
        const licenses = licensesRes.data || [];
        const risks = risksRes.data || [];
        const cars = carsRes.data || [];
        const shipments = shipmentsRes.data || [];
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
        const shipmentsCompliant = shipments.filter((s: any) => ['delivered', 'recycled', 'completed'].includes(s.status)).length;

        const docRate = docs.length > 0 ? Math.round((documentsVerified / docs.length) * 100) : 0;
        const licRate = licenses.length > 0 ? Math.round((licensesActive / licenses.length) * 100) : 0;
        const riskRate = risks.length > 0 ? Math.round((risksMitigated / risks.length) * 100) : 50;
        const carRate = cars.length > 0 ? Math.round((cars.filter((c: any) => c.status === 'closed').length / cars.length) * 100) : 100;
        const shipRate = shipments.length > 0 ? Math.round((shipmentsCompliant / shipments.length) * 100) : 50;
        const overallScore = Math.round(docRate * 0.15 + licRate * 0.25 + riskRate * 0.2 + carRate * 0.2 + shipRate * 0.2);

        const alerts: string[] = [];
        if (licensesExpired > 0) alerts.push(`${licensesExpired} ترخيص منتهي`);
        if (licensesExpiring > 0) alerts.push(`${licensesExpiring} ترخيص ينتهي قريباً`);
        if (risksCritical > 0) alerts.push(`${risksCritical} خطر حرج`);
        if (carsOverdue > 0) alerts.push(`${carsOverdue} تذكرة تصحيحية متأخرة`);

        results.push({
          orgId,
          orgName: assignment.organization?.name || 'جهة',
          orgType: assignment.organization?.organization_type || '',
          city: assignment.organization?.city,
          overallScore,
          licenses: { total: licenses.length, active: licensesActive, expiring: licensesExpiring, expired: licensesExpired, rate: licRate },
          documents: { total: docs.length, verified: documentsVerified, rate: docRate },
          risks: { total: risks.length, critical: risksCritical, high: risksHigh, mitigated: risksMitigated },
          cars: { total: cars.length, open: carsOpen, overdue: carsOverdue },
          shipments: { total: shipments.length, compliant: shipmentsCompliant, rate: shipRate },
          alerts,
        });
      }

      return results.sort((a, b) => a.overallScore - b.overallScore);
    },
    enabled: assignments.length > 0,
    staleTime: 120000,
  });

  if (isLoading) {
    return <Card><CardContent className="p-8"><div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div></CardContent></Card>;
  }

  if (clientsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>لا توجد جهات مرتبطة لعرض بيانات الامتثال</p>
        </CardContent>
      </Card>
    );
  }

  const criticalClients = clientsData.filter(c => c.overallScore < 60).length;
  const warningClients = clientsData.filter(c => c.overallScore >= 60 && c.overallScore < 80).length;
  const healthyClients = clientsData.filter(c => c.overallScore >= 80).length;

  return (
    <div className="space-y-4">
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-emerald-200">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 mx-auto mb-1 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-emerald-700">{healthyClients}</p>
            <p className="text-[10px] text-muted-foreground">ممتاز (&ge;80%)</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-amber-500 mx-auto mb-1 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-amber-700">{warningClients}</p>
            <p className="text-[10px] text-muted-foreground">يحتاج تحسين</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-full bg-red-500 mx-auto mb-1 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-red-700">{criticalClients}</p>
            <p className="text-[10px] text-muted-foreground">خطر (&lt;60%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Cards */}
      {clientsData.map((client) => {
        const tl = trafficLight(client.overallScore);
        const isExpanded = expandedOrg === client.orgId;

        return (
          <motion.div key={client.orgId} layout>
            <Card className={`border-l-4 ${client.overallScore >= 80 ? 'border-l-emerald-500' : client.overallScore >= 60 ? 'border-l-amber-500' : 'border-l-red-500'}`}>
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedOrg(isExpanded ? null : client.orgId)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${tl.bg} flex items-center justify-center`}>
                      <span className={`text-2xl font-bold ${tl.text}`}>{client.overallScore}</span>
                    </div>
                    <div>
                      <p className="font-bold">{client.orgName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{orgTypeLabels[client.orgType] || client.orgType}</Badge>
                        {client.city && <span className="text-[10px] text-muted-foreground">{client.city}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.alerts.length > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {client.alerts.length} تنبيه
                      </Badge>
                    )}
                    <Badge className={`${tl.color} text-white text-[10px]`}>{tl.label}</Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          <MiniMetric icon={ShieldCheck} label="التراخيص" value={`${client.licenses.active}/${client.licenses.total}`} rate={client.licenses.rate} />
                          <MiniMetric icon={FileCheck2} label="المستندات" value={`${client.documents.verified}/${client.documents.total}`} rate={client.documents.rate} />
                          <MiniMetric icon={AlertTriangle} label="المخاطر" value={`${client.risks.total - client.risks.mitigated} مفتوحة`} rate={client.risks.total > 0 ? Math.round((client.risks.mitigated / client.risks.total) * 100) : 100} />
                          <MiniMetric icon={Clock} label="التصحيحية" value={`${client.cars.open} مفتوحة`} rate={client.cars.total > 0 ? Math.round(((client.cars.total - client.cars.open) / client.cars.total) * 100) : 100} />
                          <MiniMetric icon={TrendingUp} label="الشحنات" value={`${client.shipments.compliant}/${client.shipments.total}`} rate={client.shipments.rate} />
                        </div>

                        {/* Alerts */}
                        {client.alerts.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">⚠️ تنبيهات:</p>
                            {client.alerts.map((alert, i) => (
                              <p key={i} className="text-[11px] text-red-600 dark:text-red-400">• {alert}</p>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(`/dashboard/organization/${client.orgId}`)}>
                            <Eye className="w-3.5 h-3.5" />
                            عرض الجهة
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => navigate('/dashboard/reports')}>
                            <FileText className="w-3.5 h-3.5" />
                            إعداد تقرير
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});

const MiniMetric = ({ icon: Icon, label, value, rate }: { icon: any; label: string; value: string; rate: number }) => (
  <div className="text-center p-2 rounded-lg border bg-card">
    <Icon className={`w-4 h-4 mx-auto mb-1 ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`} />
    <p className="text-xs font-bold">{value}</p>
    <p className="text-[9px] text-muted-foreground">{label}</p>
    <Progress value={rate} className="h-1 mt-1" />
  </div>
);

ClientComplianceDashboard.displayName = 'ClientComplianceDashboard';
export default ClientComplianceDashboard;
