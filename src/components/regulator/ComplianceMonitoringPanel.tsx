import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, CheckCircle, XCircle, Search, TrendingUp, TrendingDown, Clock, Building2, FileCheck, Filter, Eye } from 'lucide-react';
import { useAllOrganizations, useRegulatorJurisdictions } from '@/hooks/useRegulatorData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface OrgCompliance {
  orgId: string;
  orgName: string;
  orgType: string;
  isVerified: boolean;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringLicenses: number;
  violationCount: number;
  openViolations: number;
  inspectionCount: number;
  lastInspectionDate: string | null;
  lastInspectionRating: string | null;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

const ORG_TYPE_MAP: Record<string, string> = {
  generator: 'مولد مخلفات', transporter: 'ناقل', recycler: 'مدوّر',
  disposal: 'تخلص نهائي', consultant: 'استشاري', consulting_office: 'مكتب استشاري',
  iso_body: 'جهة أيزو', transport_office: 'مكتب نقل',
};

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  low: { label: 'منخفض', color: 'text-emerald-700', bg: 'bg-emerald-500/10', icon: CheckCircle },
  medium: { label: 'متوسط', color: 'text-amber-700', bg: 'bg-amber-500/10', icon: Clock },
  high: { label: 'مرتفع', color: 'text-orange-700', bg: 'bg-orange-500/10', icon: AlertTriangle },
  critical: { label: 'حرج', color: 'text-destructive', bg: 'bg-destructive/10', icon: XCircle },
};

const RATING_LABELS: Record<string, string> = {
  excellent: 'ممتاز', good: 'جيد', acceptable: 'مقبول', poor: 'ضعيف', critical: 'حرج',
};

const ComplianceMonitoringPanel = () => {
  const { organization } = useAuth();
  const { data: jurisdictions = [] } = useRegulatorJurisdictions();
  const supervisedTypes = [...new Set((jurisdictions as any[]).map((j: any) => j.supervised_org_type))];
  const { data: orgs = [], isLoading: orgsLoading } = useAllOrganizations(supervisedTypes.length > 0 ? supervisedTypes : undefined);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState<OrgCompliance | null>(null);

  // Fetch all licenses for compliance calculation
  const { data: allLicenses = [], isLoading: licLoading } = useQuery({
    queryKey: ['compliance-all-licenses'],
    queryFn: async () => {
      const { data } = await supabase
        .from('legal_licenses')
        .select('organization_id, license_name, license_category, expiry_date, status')
        .limit(1000);
      return data || [];
    },
  });

  // Fetch violations
  const { data: allViolations = [], isLoading: violLoading } = useQuery({
    queryKey: ['compliance-all-violations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('regulatory_violations')
        .select('violating_organization_id, status, severity')
        .eq('regulator_organization_id', organization.id);
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch inspections
  const { data: allInspections = [], isLoading: inspLoading } = useQuery({
    queryKey: ['compliance-all-inspections', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('field_inspections')
        .select('inspected_organization_id, status, inspection_date, overall_rating, compliance_score')
        .eq('regulator_organization_id', organization.id)
        .order('inspection_date', { ascending: false });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const isLoading = orgsLoading || licLoading || violLoading || inspLoading;

  // Calculate compliance data per org
  const complianceData: OrgCompliance[] = useMemo(() => {
    return (orgs as any[]).map((org: any) => {
      const orgLicenses = allLicenses.filter((l: any) => l.organization_id === org.id);
      const orgViolations = allViolations.filter((v: any) => v.violating_organization_id === org.id);
      const orgInspections = allInspections.filter((i: any) => i.inspected_organization_id === org.id);

      const now = new Date();
      let expired = 0, expiring = 0, active = 0;
      orgLicenses.forEach((l: any) => {
        if (!l.expiry_date) { active++; return; }
        const days = differenceInDays(new Date(l.expiry_date), now);
        if (days < 0) expired++;
        else if (days <= 30) expiring++;
        else active++;
      });

      const openViolations = orgViolations.filter((v: any) => v.status === 'issued' || v.status === 'escalated').length;
      const criticalViolations = orgViolations.filter((v: any) => v.severity === 'critical').length;

      const lastInsp = orgInspections[0];

      // Score calculation
      let score = 100;
      if (orgLicenses.length > 0) {
        score -= (expired / orgLicenses.length) * 40; // Expired licenses heavily penalize
        score -= (expiring / orgLicenses.length) * 10;
      }
      score -= openViolations * 10;
      score -= criticalViolations * 15;
      if (!org.is_verified) score -= 10;
      if (lastInsp?.compliance_score) {
        score = Math.round((score + lastInsp.compliance_score) / 2);
      }
      score = Math.max(0, Math.min(100, Math.round(score)));

      let riskLevel: OrgCompliance['riskLevel'] = 'low';
      if (score < 40 || criticalViolations > 0 || expired >= 2) riskLevel = 'critical';
      else if (score < 60 || expired > 0) riskLevel = 'high';
      else if (score < 80 || expiring > 0 || openViolations > 0) riskLevel = 'medium';

      return {
        orgId: org.id,
        orgName: org.name,
        orgType: org.organization_type,
        isVerified: org.is_verified,
        totalLicenses: orgLicenses.length,
        activeLicenses: active,
        expiredLicenses: expired,
        expiringLicenses: expiring,
        violationCount: orgViolations.length,
        openViolations,
        inspectionCount: orgInspections.length,
        lastInspectionDate: lastInsp?.inspection_date || null,
        lastInspectionRating: lastInsp?.overall_rating || null,
        complianceScore: score,
        riskLevel,
      };
    });
  }, [orgs, allLicenses, allViolations, allInspections]);

  // Filter
  const filtered = complianceData.filter((c) => {
    if (search && !c.orgName.includes(search)) return false;
    if (riskFilter !== 'all' && c.riskLevel !== riskFilter) return false;
    if (typeFilter !== 'all' && c.orgType !== typeFilter) return false;
    return true;
  });

  // Stats
  const stats = useMemo(() => ({
    total: complianceData.length,
    critical: complianceData.filter(c => c.riskLevel === 'critical').length,
    high: complianceData.filter(c => c.riskLevel === 'high').length,
    medium: complianceData.filter(c => c.riskLevel === 'medium').length,
    low: complianceData.filter(c => c.riskLevel === 'low').length,
    avgScore: complianceData.length > 0 ? Math.round(complianceData.reduce((s, c) => s + c.complianceScore, 0) / complianceData.length) : 0,
    totalExpired: complianceData.reduce((s, c) => s + c.expiredLicenses, 0),
    totalOpenViolations: complianceData.reduce((s, c) => s + c.openViolations, 0),
  }), [complianceData]);

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'حرج', count: stats.critical, ...RISK_CONFIG.critical },
          { label: 'مرتفع', count: stats.high, ...RISK_CONFIG.high },
          { label: 'متوسط', count: stats.medium, ...RISK_CONFIG.medium },
          { label: 'منخفض', count: stats.low, ...RISK_CONFIG.low },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              const riskMap: Record<string, string> = { 'حرج': 'critical', 'مرتفع': 'high', 'متوسط': 'medium', 'منخفض': 'low' };
              const risk = riskMap[item.label] || 'all';
              setRiskFilter(riskFilter === risk ? 'all' : risk);
            }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Aggregate KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${stats.avgScore >= 80 ? 'text-emerald-600' : stats.avgScore >= 60 ? 'text-amber-600' : 'text-destructive'}`}>{stats.avgScore}%</p>
            <p className="text-xs text-muted-foreground">متوسط الامتثال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-destructive">{stats.totalExpired}</p>
            <p className="text-xs text-muted-foreground">تراخيص منتهية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.totalOpenViolations}</p>
            <p className="text-xs text-muted-foreground">مخالفات مفتوحة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">إجمالي الجهات</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            رصد الامتثال المباشر
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pr-9" placeholder="بحث عن منظمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-4 h-4 ml-1" />
                <SelectValue placeholder="مستوى الخطر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="critical">حرج</SelectItem>
                <SelectItem value="high">مرتفع</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">منخفض</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <Building2 className="w-4 h-4 ml-1" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {supervisedTypes.map(t => (
                  <SelectItem key={t} value={t}>{ORG_TYPE_MAP[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compliance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right">
                  <th className="p-2">المنظمة</th>
                  <th className="p-2">النوع</th>
                  <th className="p-2">الامتثال</th>
                  <th className="p-2">الخطر</th>
                  <th className="p-2">التراخيص</th>
                  <th className="p-2">المخالفات</th>
                  <th className="p-2">آخر تفتيش</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const risk = RISK_CONFIG[c.riskLevel];
                  const RiskIcon = risk.icon;
                  return (
                    <tr key={c.orgId} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedOrg(selectedOrg?.orgId === c.orgId ? null : c)}>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{c.orgName}</span>
                          {c.isVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[10px]">{ORG_TYPE_MAP[c.orgType] || c.orgType}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Progress value={c.complianceScore} className="h-2 w-16" />
                          <span className={`text-xs font-bold ${c.complianceScore >= 80 ? 'text-emerald-600' : c.complianceScore >= 60 ? 'text-amber-600' : 'text-destructive'}`}>
                            {c.complianceScore}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className={`text-[10px] ${risk.color} ${risk.bg}`}>
                          <RiskIcon className="w-3 h-3 ml-1" />
                          {risk.label}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-emerald-600">{c.activeLicenses}✓</span>
                          {c.expiredLicenses > 0 && <span className="text-destructive">{c.expiredLicenses}✗</span>}
                          {c.expiringLicenses > 0 && <span className="text-amber-600">{c.expiringLicenses}⚠</span>}
                        </div>
                      </td>
                      <td className="p-2">
                        {c.openViolations > 0 ? (
                          <Badge variant="destructive" className="text-[10px]">{c.openViolations} مفتوحة</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">{c.violationCount} إجمالي</span>
                        )}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        {c.lastInspectionDate ? (
                          <div>
                            <p>{format(new Date(c.lastInspectionDate), 'yyyy/MM/dd')}</p>
                            {c.lastInspectionRating && <span className="text-[10px]">{RATING_LABELS[c.lastInspectionRating] || c.lastInspectionRating}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">لم يُفتش</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-6">لا توجد نتائج</p>
            )}
          </div>

          {/* Expanded detail */}
          {selectedOrg && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-lg">{selectedOrg.orgName}</h4>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedOrg(null)}>✕</Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-2xl font-bold">{selectedOrg.complianceScore}%</p>
                    <p className="text-[10px] text-muted-foreground">درجة الامتثال</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-2xl font-bold">{selectedOrg.totalLicenses}</p>
                    <p className="text-[10px] text-muted-foreground">تراخيص ({selectedOrg.activeLicenses} ساري)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-2xl font-bold">{selectedOrg.violationCount}</p>
                    <p className="text-[10px] text-muted-foreground">مخالفات ({selectedOrg.openViolations} مفتوحة)</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-2xl font-bold">{selectedOrg.inspectionCount}</p>
                    <p className="text-[10px] text-muted-foreground">زيارات تفتيش</p>
                  </div>
                </div>
                {selectedOrg.expiredLicenses > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{selectedOrg.expiredLicenses} تراخيص منتهية الصلاحية — يجب اتخاذ إجراء فوري</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceMonitoringPanel;
