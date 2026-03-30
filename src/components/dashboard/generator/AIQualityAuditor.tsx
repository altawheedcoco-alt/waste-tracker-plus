import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck, Database, GitBranch, ImageIcon, Loader2,
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock,
  FileText, Truck, Users, Scale, Leaf, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'pending';
  detail: string;
  category: 'data' | 'workflow' | 'visual';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const statusConfig = {
  pass: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-950/30', label: 'ناجح' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950/30', label: 'تحذير' },
  fail: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-950/30', label: 'فشل' },
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'قيد الفحص' },
};

const AIQualityAuditor = () => {
  const { organization } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [checks, setChecks] = useState<AuditCheck[]>([]);
  const [auditTab, setAuditTab] = useState('data');

  // Fetch org data for local auditing
  const { data: orgData } = useQuery({
    queryKey: ['audit-org-data', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const [shipmentsRes, invoicesRes, orgRes, driversRes] = await Promise.all([
        supabase.from('shipments').select('id, status, waste_type, quantity, unit, pickup_date, delivered_at, created_at, generator_notes, hazard_level, packaging_method').eq('generator_id', organization.id).limit(100),
        supabase.from('invoices').select('id, status, total_amount, due_date, paid_amount').eq('organization_id', organization.id).limit(50),
        supabase.from('organizations').select('*').eq('id', organization.id).single(),
        supabase.from('drivers').select('id, license_number, vehicle_plate, license_expiry').limit(20),
      ]);
      return {
        shipments: shipmentsRes.data || [],
        invoices: invoicesRes.data || [],
        org: orgRes.data,
        drivers: driversRes.data || [],
      };
    },
    enabled: !!organization?.id,
  });

  const runAudit = useCallback(async () => {
    if (!orgData) {
      toast.error('لا توجد بيانات كافية للفحص');
      return;
    }
    setIsAuditing(true);
    setChecks([]);

    const newChecks: AuditCheck[] = [];
    const { shipments, invoices, org, drivers } = orgData;

    // ═══════ DATA COMPLIANCE CHECKS ═══════
    // 1. Organization profile completeness
    const requiredFields = ['name', 'email', 'phone', 'address', 'city', 'commercial_register'];
    const missingFields = requiredFields.filter(f => !org?.[f as keyof typeof org]);
    newChecks.push({
      id: 'org-profile',
      label: 'اكتمال بيانات المؤسسة',
      status: missingFields.length === 0 ? 'pass' : missingFields.length <= 2 ? 'warn' : 'fail',
      detail: missingFields.length === 0 ? 'جميع البيانات الأساسية مكتملة' : `حقول ناقصة: ${missingFields.join(', ')}`,
      category: 'data',
      severity: missingFields.length > 2 ? 'high' : 'medium',
    });

    // 2. License validity
    const wmraExpiry = org?.wmra_license_expiry_date;
    const isExpired = wmraExpiry ? new Date(wmraExpiry) < new Date() : true;
    const isExpiringSoon = wmraExpiry ? new Date(wmraExpiry) < new Date(Date.now() + 30 * 86400000) : false;
    newChecks.push({
      id: 'license-validity',
      label: 'صلاحية ترخيص WMRA',
      status: !wmraExpiry ? 'fail' : isExpired ? 'fail' : isExpiringSoon ? 'warn' : 'pass',
      detail: !wmraExpiry ? 'لم يتم تسجيل ترخيص WMRA' : isExpired ? 'الترخيص منتهي الصلاحية!' : isExpiringSoon ? 'الترخيص سينتهي خلال 30 يوماً' : `صالح حتى ${wmraExpiry}`,
      category: 'data',
      severity: isExpired ? 'critical' : 'medium',
    });

    // 3. Shipment data quality
    const incompleteShipments = shipments.filter(s => !s.waste_type || !s.quantity || !s.hazard_level);
    const incompleteRatio = shipments.length > 0 ? incompleteShipments.length / shipments.length : 0;
    newChecks.push({
      id: 'shipment-quality',
      label: 'جودة بيانات الشحنات',
      status: incompleteRatio === 0 ? 'pass' : incompleteRatio < 0.2 ? 'warn' : 'fail',
      detail: `${incompleteShipments.length} من ${shipments.length} شحنة تفتقد بيانات (نوع المخلفات/الكمية/مستوى الخطورة)`,
      category: 'data',
      severity: incompleteRatio > 0.3 ? 'high' : 'low',
    });

    // 4. Invoice reconciliation
    const unpaidOverdue = invoices.filter(i => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());
    newChecks.push({
      id: 'invoice-overdue',
      label: 'فواتير متأخرة السداد',
      status: unpaidOverdue.length === 0 ? 'pass' : unpaidOverdue.length <= 2 ? 'warn' : 'fail',
      detail: unpaidOverdue.length === 0 ? 'لا توجد فواتير متأخرة' : `${unpaidOverdue.length} فاتورة متأخرة عن موعد السداد`,
      category: 'data',
      severity: unpaidOverdue.length > 3 ? 'high' : 'medium',
    });

    // ═══════ WORKFLOW HEALTH CHECKS ═══════
    // 5. Stuck shipments
    const stuckShipments = shipments.filter(s => {
      if (!['new', 'approved', 'in_transit'].includes(s.status)) return false;
      const age = (Date.now() - new Date(s.created_at).getTime()) / 86400000;
      return (s.status === 'new' && age > 3) || (s.status === 'approved' && age > 5) || (s.status === 'in_transit' && age > 7);
    });
    newChecks.push({
      id: 'stuck-shipments',
      label: 'شحنات متوقفة (Bottleneck)',
      status: stuckShipments.length === 0 ? 'pass' : stuckShipments.length <= 2 ? 'warn' : 'fail',
      detail: stuckShipments.length === 0 ? 'لا توجد شحنات عالقة' : `${stuckShipments.length} شحنة متأخرة عن الجدول الزمني المتوقع`,
      category: 'workflow',
      severity: stuckShipments.length > 3 ? 'high' : 'medium',
    });

    // 6. Completion rate
    const completed = shipments.filter(s => ['delivered', 'confirmed'].includes(s.status)).length;
    const completionRate = shipments.length > 0 ? (completed / shipments.length) * 100 : 0;
    newChecks.push({
      id: 'completion-rate',
      label: 'معدل إتمام الشحنات',
      status: completionRate >= 80 ? 'pass' : completionRate >= 50 ? 'warn' : 'fail',
      detail: `${completionRate.toFixed(0)}% من الشحنات مكتملة (${completed}/${shipments.length})`,
      category: 'workflow',
      severity: completionRate < 50 ? 'high' : 'low',
    });

    // 7. Average processing time
    const deliveredWithDates = shipments.filter(s => s.delivered_at && s.created_at);
    const avgDays = deliveredWithDates.length > 0
      ? deliveredWithDates.reduce((sum, s) => sum + (new Date(s.delivered_at!).getTime() - new Date(s.created_at).getTime()) / 86400000, 0) / deliveredWithDates.length
      : 0;
    newChecks.push({
      id: 'processing-time',
      label: 'متوسط وقت المعالجة',
      status: avgDays <= 3 ? 'pass' : avgDays <= 7 ? 'warn' : 'fail',
      detail: deliveredWithDates.length === 0 ? 'لا توجد شحنات مكتملة لحساب المتوسط' : `${avgDays.toFixed(1)} يوم متوسط من الإنشاء حتى التسليم`,
      category: 'workflow',
      severity: avgDays > 7 ? 'high' : 'low',
    });

    // 8. Hazardous waste compliance
    const hazardous = shipments.filter(s => s.hazard_level === 'hazardous');
    const hazWithoutPackaging = hazardous.filter(s => !s.packaging_method);
    newChecks.push({
      id: 'hazardous-compliance',
      label: 'امتثال المخلفات الخطرة',
      status: hazWithoutPackaging.length === 0 ? 'pass' : 'fail',
      detail: hazardous.length === 0 ? 'لا توجد شحنات خطرة مسجلة' : hazWithoutPackaging.length === 0 ? `${hazardous.length} شحنة خطرة مع بيانات تغليف مكتملة` : `${hazWithoutPackaging.length} شحنة خطرة بدون طريقة تغليف محددة`,
      category: 'workflow',
      severity: 'critical',
    });

    // ═══════ VISUAL / DOCUMENT INSPECTION ═══════
    // 9. Driver licenses check
    const expiredLicenses = drivers.filter(d => d.license_expiry && new Date(d.license_expiry) < new Date());
    newChecks.push({
      id: 'driver-licenses',
      label: 'رخص السائقين',
      status: expiredLicenses.length === 0 ? 'pass' : 'warn',
      detail: expiredLicenses.length === 0 ? 'جميع رخص السائقين سارية' : `${expiredLicenses.length} سائق برخصة منتهية`,
      category: 'visual',
      severity: expiredLicenses.length > 0 ? 'high' : 'low',
    });

    // 10. Notes/documentation audit
    const shipmentsWithoutNotes = shipments.filter(s => !s.generator_notes);
    const notesRatio = shipments.length > 0 ? shipmentsWithoutNotes.length / shipments.length : 0;
    newChecks.push({
      id: 'documentation-notes',
      label: 'توثيق ملاحظات الشحنات',
      status: notesRatio < 0.3 ? 'pass' : notesRatio < 0.6 ? 'warn' : 'fail',
      detail: `${shipmentsWithoutNotes.length} شحنة بدون ملاحظات توثيقية من المولد`,
      category: 'visual',
      severity: 'medium',
    });

    // 11. Environmental compliance (waste types diversity)
    const uniqueWasteTypes = new Set(shipments.map(s => s.waste_type).filter(Boolean));
    newChecks.push({
      id: 'waste-diversity',
      label: 'تنوع أنواع المخلفات المسجلة',
      status: uniqueWasteTypes.size >= 3 ? 'pass' : uniqueWasteTypes.size >= 1 ? 'warn' : 'fail',
      detail: `${uniqueWasteTypes.size} نوع مخلفات مسجل: ${[...uniqueWasteTypes].slice(0, 5).join(', ') || 'لا يوجد'}`,
      category: 'visual',
      severity: 'low',
    });

    // 12. Commercial register check
    newChecks.push({
      id: 'commercial-register',
      label: 'السجل التجاري والبطاقة الضريبية',
      status: org?.commercial_register && org?.tax_card ? 'pass' : !org?.commercial_register && !org?.tax_card ? 'fail' : 'warn',
      detail: !org?.commercial_register ? 'لم يتم إدخال رقم السجل التجاري' : !org?.tax_card ? 'لم يتم إدخال رقم البطاقة الضريبية' : 'السجل التجاري والبطاقة الضريبية مكتملان',
      category: 'visual',
      severity: 'high',
    });

    // Simulate progressive loading
    for (let i = 0; i < newChecks.length; i++) {
      await new Promise(r => setTimeout(r, 150));
      setChecks(prev => [...prev, newChecks[i]]);
    }

    setIsAuditing(false);
    
    const failCount = newChecks.filter(c => c.status === 'fail').length;
    const warnCount = newChecks.filter(c => c.status === 'warn').length;
    if (failCount > 0) {
      toast.error(`تم اكتشاف ${failCount} مشكلة و ${warnCount} تحذير`);
    } else if (warnCount > 0) {
      toast.warning(`${warnCount} تحذيرات — راجع التفاصيل`);
    } else {
      toast.success('✅ جميع الفحوصات ناجحة!');
    }
  }, [orgData]);

  const filteredChecks = checks.filter(c => c.category === auditTab);
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const failCount = checks.filter(c => c.status === 'fail').length;
  const score = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            onClick={runAudit}
            disabled={isAuditing || !orgData}
            className="gap-2"
            size="sm"
          >
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isAuditing ? 'جارٍ الفحص...' : 'بدء الفحص'}
          </Button>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end text-base sm:text-lg">
              <ShieldCheck className="w-5 h-5 text-primary" />
              مراقب الجودة الرقمي (AI Auditor)
            </CardTitle>
            <CardDescription className="text-xs">فحص شامل للامتثال وسير العمل والمستندات</CardDescription>
          </div>
        </div>

        {/* Score Bar */}
        {checks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-3">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />{passCount}</span>
                <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" />{warnCount}</span>
                <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" />{failCount}</span>
              </div>
              <span className="font-bold text-lg">{score}%</span>
            </div>
            <Progress
              value={score}
              className="h-2.5"
            />
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {checks.length === 0 && !isAuditing ? (
          <div className="text-center py-8 text-muted-foreground space-y-2">
            <Brain className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm">اضغط "بدء الفحص" لتشغيل مراقب الجودة الذكي</p>
            <p className="text-xs opacity-60">يفحص 12 نقطة عبر 3 محاور: البيانات، سير العمل، المستندات</p>
          </div>
        ) : (
          <Tabs value={auditTab} onValueChange={setAuditTab} dir="rtl">
            <TabsList className="w-full grid grid-cols-3 mb-3">
              <TabsTrigger value="data" className="gap-1.5 text-xs sm:text-sm">
                <Database className="w-3.5 h-3.5" />
                الامتثال
                {checks.filter(c => c.category === 'data' && c.status === 'fail').length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 h-4 mr-1">
                    {checks.filter(c => c.category === 'data' && c.status === 'fail').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-1.5 text-xs sm:text-sm">
                <GitBranch className="w-3.5 h-3.5" />
                سير العمل
                {checks.filter(c => c.category === 'workflow' && c.status === 'fail').length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 h-4 mr-1">
                    {checks.filter(c => c.category === 'workflow' && c.status === 'fail').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="visual" className="gap-1.5 text-xs sm:text-sm">
                <ImageIcon className="w-3.5 h-3.5" />
                المستندات
                {checks.filter(c => c.category === 'visual' && c.status === 'fail').length > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1 h-4 mr-1">
                    {checks.filter(c => c.category === 'visual' && c.status === 'fail').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {['data', 'workflow', 'visual'].map(cat => (
              <TabsContent key={cat} value={cat} className="mt-0">
                <ScrollArea className="max-h-[400px]">
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {filteredChecks.length === 0 && isAuditing && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          جارٍ فحص هذا المحور...
                        </div>
                      )}
                      {filteredChecks.map((check, i) => {
                        const cfg = statusConfig[check.status];
                        const Icon = cfg.icon;
                        return (
                          <motion.div
                            key={check.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-start gap-3 p-3 rounded-lg ${cfg.bg} border border-border/30`}
                          >
                            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
                            <div className="flex-1 min-w-0 text-right">
                              <div className="flex items-center justify-between gap-2">
                                <Badge variant="outline" className={`text-[10px] ${cfg.color} shrink-0`}>
                                  {cfg.label}
                                </Badge>
                                <span className="font-medium text-sm truncate">{check.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{check.detail}</p>
                              {check.severity === 'critical' && (
                                <Badge variant="destructive" className="text-[10px] mt-1">أولوية قصوى</Badge>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default AIQualityAuditor;
