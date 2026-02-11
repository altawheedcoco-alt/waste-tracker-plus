import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Plus, FileText, Building2, ClipboardList, Ban } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import LicenseManagementDialog from './LicenseManagementDialog';
import { useComplianceGate } from '@/hooks/useComplianceGate';

interface LegalLicense {
  id: string;
  organization_id: string;
  license_category: string;
  license_name: string;
  license_name_en: string | null;
  issuing_authority: string;
  license_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  document_url: string | null;
  notes: string | null;
  allowed_waste_codes: string[];
}

const categoryLabels: Record<string, string> = {
  ida: 'الهيئة العامة للتنمية الصناعية',
  wmra: 'جهاز تنظيم إدارة المخلفات',
  eeaa: 'جهاز شئون البيئة (تقييم أثر بيئي)',
  civil_protection: 'الحماية المدنية',
  atomic_energy: 'هيئة الطاقة الذرية',
  commercial_register: 'السجل التجاري',
  industrial_register: 'السجل الصناعي',
  activity_specific: 'ترخيص نشاط نوعي',
  other: 'أخرى',
};

const categoryIcons: Record<string, string> = {
  ida: '🏭', wmra: '♻️', eeaa: '🌍', civil_protection: '🚒',
  atomic_energy: '☢️', commercial_register: '📋', industrial_register: '🏗️',
  activity_specific: '📜', other: '📄',
};

const TrafficLight = ({ status }: { status: string }) => {
  const colors = {
    green: 'bg-emerald-500 shadow-emerald-500/50',
    yellow: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
    red: 'bg-red-500 shadow-red-500/50 animate-pulse',
  };
  const label = { green: 'ساري', yellow: 'ينتهي قريباً', red: 'منتهي' };
  const key = status === 'expired' ? 'red' : status === 'expiring_soon' ? 'yellow' : 'green';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${colors[key]} shadow-lg`} />
      <span className={`text-[10px] font-medium ${
        key === 'red' ? 'text-red-600' : key === 'yellow' ? 'text-amber-600' : 'text-emerald-600'
      }`}>{label[key]}</span>
    </div>
  );
};

const LegalComplianceWidget = () => {
  const { organization } = useAuth();
  const orgId = organization?.id;
  const [showManagement, setShowManagement] = useState(false);
  const { status: complianceStatus } = useComplianceGate();

  // Fetch inspection count
  const { data: inspectionCount = 0 } = useQuery({
    queryKey: ['inspection-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase.from('inspection_logs').select('*', { count: 'exact', head: true }).eq('organization_id', orgId);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: licenses = [], isLoading, refetch } = useQuery({
    queryKey: ['legal-licenses', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('legal_licenses')
        .select('*')
        .eq('organization_id', orgId)
        .order('expiry_date', { ascending: true });
      if (error) throw error;
      // Recalculate status client-side for real-time accuracy
      return (data || []).map((lic: any) => {
        if (!lic.expiry_date) return { ...lic, _light: 'green' };
        const days = differenceInDays(new Date(lic.expiry_date), new Date());
        if (days < 0) return { ...lic, status: 'expired', _light: 'red' };
        if (days <= 30) return { ...lic, status: 'expiring_soon', _light: 'yellow' };
        return { ...lic, status: 'active', _light: 'green' };
      });
    },
    enabled: !!orgId,
  });

  const stats = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter((l: any) => l._light === 'green').length;
    const expiring = licenses.filter((l: any) => l._light === 'yellow').length;
    const expired = licenses.filter((l: any) => l._light === 'red').length;
    const score = total > 0 ? Math.round((active / total) * 100) : 0;
    return { total, active, expiring, expired, score };
  }, [licenses]);

  const overallLight = stats.expired > 0 ? 'red' : stats.expiring > 0 ? 'yellow' : 'green';

  if (isLoading) {
    return (
      <Card><CardHeader><CardTitle className="flex items-center gap-2 justify-end"><Shield className="w-5 h-5" /> الامتثال القانوني</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
    );
  }

  return (
    <>
      <Card className={`border-2 transition-colors ${
        overallLight === 'red' ? 'border-red-300 dark:border-red-800/60 bg-gradient-to-br from-red-50/50 to-background dark:from-red-950/10' :
        overallLight === 'yellow' ? 'border-amber-300 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/10' :
        'border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/10'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8 gap-1" onClick={() => setShowManagement(true)}>
              <Plus className="w-3 h-3" /> إدارة التراخيص
            </Button>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Shield className={`w-5 h-5 ${
                overallLight === 'red' ? 'text-red-600' : overallLight === 'yellow' ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              نظام الامتثال القانوني
            </CardTitle>
          </div>
          <CardDescription className="text-right">
            إشارة المرور القانونية - مراقبة التراخيص والامتثال للقانون المصري
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Operations Blocked Banner */}
          {complianceStatus.blockOperations && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-700">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">العمليات معلقة - تراخيص سيادية منتهية</p>
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-[10px] text-red-600 text-right mt-1">
                لا يمكن إصدار مانيفست أو شهادة تخلص حتى تجديد التراخيص المنتهية
              </p>
            </div>
          )}

          {/* Compliance Score */}
          <div className="p-4 rounded-xl bg-card border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${
                  stats.score >= 80 ? 'text-emerald-600' : stats.score >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {stats.score}%
                </div>
                {inspectionCount > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <ClipboardList className="w-3 h-3" /> {inspectionCount} تفتيش
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">نسبة الامتثال القانوني</p>
                <p className="text-xs text-muted-foreground">
                  {stats.score === 100 ? 'ممتثل بالكامل ✅' :
                   stats.score >= 80 ? 'امتثال جيد' :
                   stats.score >= 50 ? 'يحتاج مراجعة ⚠️' : 'خطر عدم امتثال 🚨'}
                </p>
              </div>
            </div>
            <Progress value={stats.score} className={`h-3 ${
              stats.score >= 80 ? '[&>div]:bg-emerald-500' : stats.score >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            }`} />
          </div>

          {/* Traffic Light Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
              <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{stats.active}</p>
              <p className="text-[10px] text-emerald-600">ساري</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-center">
              <Clock className="w-5 h-5 mx-auto text-amber-600 mb-1" />
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{stats.expiring}</p>
              <p className="text-[10px] text-amber-600">ينتهي قريباً</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-center">
              <XCircle className="w-5 h-5 mx-auto text-red-600 mb-1" />
              <p className="text-lg font-bold text-red-700 dark:text-red-400">{stats.expired}</p>
              <p className="text-[10px] text-red-600">منتهي</p>
            </div>
          </div>

          {/* Expired/Expiring Alerts */}
          {(stats.expired > 0 || stats.expiring > 0) && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-2 text-right flex items-center gap-1 justify-end">
                <AlertTriangle className="w-4 h-4" />
                تنبيهات قانونية عاجلة
              </p>
              <div className="space-y-1.5">
                {licenses
                  .filter((l: any) => l._light === 'red' || l._light === 'yellow')
                  .slice(0, 5)
                  .map((lic: any) => {
                    const days = lic.expiry_date ? differenceInDays(new Date(lic.expiry_date), new Date()) : null;
                    return (
                      <div key={lic.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-background/60">
                        <TrafficLight status={lic.status} />
                        <div className="text-right flex items-center gap-1.5">
                          <span className="font-medium">{lic.license_name}</span>
                          <span>{categoryIcons[lic.license_category] || '📄'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {stats.expired > 0 && (
                <p className="text-[10px] text-red-600 mt-2 text-right font-medium">
                  ⛔ تراخيص منتهية - لا يمكن إصدار مانيفست جديد حتى التجديد
                </p>
              )}
            </div>
          )}

          {/* License List */}
          {licenses.length === 0 ? (
            <div className="text-center py-6">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">لم يتم إضافة تراخيص بعد</p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => setShowManagement(true)}>
                <Plus className="w-3 h-3 ml-1" /> إضافة أول ترخيص
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {licenses.map((lic: any, index: number) => (
                <motion.div
                  key={lic.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border bg-card hover:shadow-sm transition-all ${
                    lic._light === 'red' ? 'border-red-300 dark:border-red-700' :
                    lic._light === 'yellow' ? 'border-amber-300 dark:border-amber-700' : ''
                  }`}
                >
                  <TrafficLight status={lic.status} />
                  <div className="flex items-center gap-2 text-right flex-1 mr-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-sm font-medium truncate">{lic.license_name}</span>
                        <span className="text-sm">{categoryIcons[lic.license_category] || '📄'}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {categoryLabels[lic.license_category] || lic.issuing_authority}
                        {lic.license_number && ` • ${lic.license_number}`}
                        {lic.expiry_date && ` • ينتهي ${format(new Date(lic.expiry_date), 'dd MMM yyyy', { locale: ar })}`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LicenseManagementDialog
        open={showManagement}
        onOpenChange={setShowManagement}
        onSaved={() => refetch()}
      />
    </>
  );
};

export default LegalComplianceWidget;
