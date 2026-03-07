import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ShieldAlert, Scan, Activity, Shield, Zap, AlertTriangle, CheckCircle2,
  Clock, Eye, Loader2, Brain, Ban, Lock, Bell, Key, Database, Fingerprint,
  TrendingUp, XCircle, Target,
} from 'lucide-react';
import {
  useCyberThreats, useDefenseRules, useThreatPatterns, useRunThreatScan,
  useResolveThreat, useCyberStats, CyberThreat,
} from '@/hooks/useCyberSecurity';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const THREAT_ICONS: Record<string, any> = {
  brute_force: Ban, sql_injection: Database, xss: AlertTriangle,
  data_exfiltration: Key, privilege_escalation: Lock, anomalous_access: Eye,
  rate_abuse: Zap, suspicious_login: Fingerprint, api_abuse: Activity,
};

const THREAT_LABELS: Record<string, string> = {
  brute_force: 'قوة غاشمة', sql_injection: 'حقن SQL', xss: 'XSS',
  data_exfiltration: 'تسريب بيانات', privilege_escalation: 'تصعيد صلاحيات',
  anomalous_access: 'وصول شاذ', rate_abuse: 'إساءة استخدام', suspicious_login: 'دخول مشبوه',
  api_abuse: 'إساءة API',
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'منخفض' },
  medium: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', label: 'متوسط' },
  high: { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', label: 'عالي' },
  critical: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', label: 'حرج' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  detected: { label: 'مكتشف', color: 'bg-red-500' },
  analyzing: { label: 'قيد التحليل', color: 'bg-amber-500' },
  mitigated: { label: 'تم التخفيف', color: 'bg-blue-500' },
  resolved: { label: 'تم الحل', color: 'bg-emerald-500' },
  false_positive: { label: 'إنذار كاذب', color: 'bg-gray-400' },
};

const ACTION_LABELS: Record<string, string> = {
  block_ip: 'حظر IP', lock_account: 'قفل الحساب', rate_limit: 'تقييد المعدل',
  notify_admin: 'إخطار المشرف', revoke_token: 'إلغاء الرمز', quarantine_data: 'عزل البيانات',
};

const CyberSecurityCenter = () => {
  const [tab, setTab] = useState('threats');
  const [selectedThreat, setSelectedThreat] = useState<CyberThreat | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('resolved');

  const { data: threats = [], isLoading: threatsLoading } = useCyberThreats();
  const { data: rules = [], toggleRule } = useDefenseRules();
  const { data: patterns = [] } = useThreatPatterns();
  const { data: stats } = useCyberStats();
  const scanMutation = useRunThreatScan();
  const resolveMutation = useResolveThreat();

  const kpis = [
    { label: 'إجمالي التهديدات', value: stats?.total || 0, icon: ShieldAlert, color: 'text-red-500' },
    { label: 'تهديدات حرجة', value: stats?.critical || 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'تم التخفيف تلقائياً', value: stats?.mitigated || 0, icon: Shield, color: 'text-blue-500' },
    { label: 'تهديدات نشطة', value: stats?.active || 0, icon: Activity, color: 'text-amber-500' },
  ];

  const handleResolve = () => {
    if (!selectedThreat) return;
    resolveMutation.mutate({ id: selectedThreat.id, notes: resolveNotes, status: resolveStatus });
    setSelectedThreat(null);
    setResolveNotes('');
  };

  return (
    <DashboardLayout>
      <div dir="rtl" className="p-4 md:p-6 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/30">
              <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">مركز الأمن السيبراني</h1>
              <p className="text-sm text-muted-foreground">كشف التهديدات · التنبؤ بالهجمات · الاستجابة التلقائية</p>
            </div>
          </div>
          <Button onClick={() => scanMutation.mutate()} disabled={scanMutation.isPending} variant="destructive">
            {scanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Scan className="w-4 h-4 ml-1" />}
            {scanMutation.isPending ? 'جاري الفحص...' : 'فحص أمني شامل'}
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map(k => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <k.icon className={`w-8 h-8 ${k.color}`} />
                <div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="threats"><ShieldAlert className="w-4 h-4 ml-1" /> التهديدات</TabsTrigger>
            <TabsTrigger value="rules"><Shield className="w-4 h-4 ml-1" /> قواعد الدفاع</TabsTrigger>
            <TabsTrigger value="patterns"><Brain className="w-4 h-4 ml-1" /> أنماط الهجمات</TabsTrigger>
          </TabsList>

          {/* Threats */}
          <TabsContent value="threats" className="mt-4 space-y-2">
            {threatsLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            {!threatsLoading && threats.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">لم يتم اكتشاف أي تهديدات</p>
                <p className="text-sm">قم بتشغيل فحص أمني شامل لتحليل النظام</p>
              </CardContent></Card>
            )}
            {threats.map(threat => {
              const Icon = THREAT_ICONS[threat.threat_type] || ShieldAlert;
              const sev = SEVERITY_STYLES[threat.severity] || SEVERITY_STYLES.medium;
              const st = STATUS_LABELS[threat.status] || STATUS_LABELS.detected;
              return (
                <Card key={threat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedThreat(threat)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${sev.bg}`}>
                          <Icon className={`w-5 h-5 ${sev.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`${sev.bg} ${sev.text} border-0`}>{sev.label}</Badge>
                            <Badge variant="outline">{THREAT_LABELS[threat.threat_type] || threat.threat_type}</Badge>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${st.color}`} />
                              <span className="text-xs text-muted-foreground">{st.label}</span>
                            </div>
                            {threat.auto_response_taken && (
                              <Badge variant="secondary" className="text-xs"><Zap className="w-3 h-3 ml-0.5" /> استجابة تلقائية</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{threat.description}</p>
                          {threat.source_ip && <p className="text-xs font-mono mt-1 text-muted-foreground">IP: {threat.source_ip}</p>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(threat.detected_at), 'dd/MM HH:mm', { locale: ar })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Defense Rules */}
          <TabsContent value="rules" className="mt-4 space-y-3">
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{rule.rule_name}</span>
                      <Badge variant="outline">{THREAT_LABELS[rule.threat_type] || rule.threat_type}</Badge>
                      <Badge variant="outline" className={SEVERITY_STYLES[rule.severity_trigger]?.bg + ' ' + SEVERITY_STYLES[rule.severity_trigger]?.text + ' border-0'}>
                        ≥ {SEVERITY_STYLES[rule.severity_trigger]?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {ACTION_LABELS[rule.action_type] || rule.action_type}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> تهدئة: {rule.cooldown_minutes} دقيقة</span>
                      {rule.trigger_count > 0 && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> تفعيل: {rule.trigger_count} مرة</span>}
                    </div>
                  </div>
                  <Switch checked={rule.is_enabled} onCheckedChange={(v) => toggleRule.mutate({ id: rule.id, enabled: v })} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Patterns */}
          <TabsContent value="patterns" className="mt-4 space-y-2">
            {patterns.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">لم يتم اكتشاف أنماط بعد — قم بتشغيل الفحص أولاً</CardContent></Card>
            )}
            {patterns.map(pattern => (
              <Card key={pattern.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm font-mono">{pattern.pattern_name}</span>
                        <Badge variant="outline">{pattern.pattern_type}</Badge>
                        {pattern.is_whitelisted && <Badge variant="secondary">مستثنى</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>ظهور: {pattern.occurrence_count} مرة</span>
                        <span>أول رصد: {format(new Date(pattern.first_seen_at), 'dd/MM/yyyy', { locale: ar })}</span>
                        <span>آخر رصد: {format(new Date(pattern.last_seen_at), 'dd/MM/yyyy', { locale: ar })}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`text-lg font-bold ${pattern.risk_score >= 70 ? 'text-red-600' : pattern.risk_score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {pattern.risk_score}%
                      </div>
                      <span className="text-[10px] text-muted-foreground">خطورة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Threat Detail Dialog */}
        <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
          <DialogContent dir="rtl" className="max-w-xl max-h-[80vh] overflow-y-auto">
            {selectedThreat && (() => {
              const Icon = THREAT_ICONS[selectedThreat.threat_type] || ShieldAlert;
              const sev = SEVERITY_STYLES[selectedThreat.severity];
              const st = STATUS_LABELS[selectedThreat.status];
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${sev.text}`} />
                      {THREAT_LABELS[selectedThreat.threat_type]} — {sev.label}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`${sev.bg} ${sev.text} border-0`}>{sev.label}</Badge>
                      <div className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full ${st.color}`} /><span className="text-xs">{st.label}</span></div>
                    </div>

                    <p className="text-sm">{selectedThreat.description}</p>

                    {selectedThreat.source_ip && (
                      <div className="text-sm"><span className="font-medium">IP المصدر:</span> <span className="font-mono">{selectedThreat.source_ip}</span></div>
                    )}

                    {selectedThreat.auto_response_taken && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium flex items-center gap-1"><Zap className="w-4 h-4 text-blue-500" /> استجابة تلقائية</p>
                        <p className="text-sm mt-1">{ACTION_LABELS[selectedThreat.auto_response_taken] || selectedThreat.auto_response_taken}</p>
                        {selectedThreat.auto_response_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(selectedThreat.auto_response_at), 'dd/MM/yyyy HH:mm')}</p>}
                      </div>
                    )}

                    {selectedThreat.ai_analysis && (
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-medium flex items-center gap-1 mb-1"><Brain className="w-4 h-4 text-primary" /> تحليل الذكاء الاصطناعي</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedThreat.ai_analysis}</p>
                        {selectedThreat.ai_confidence && <Badge variant="secondary" className="mt-2 text-xs">ثقة: {selectedThreat.ai_confidence}%</Badge>}
                      </div>
                    )}

                    {selectedThreat.evidence && Object.keys(selectedThreat.evidence).length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">الأدلة</p>
                        <pre className="text-xs bg-muted p-2 rounded font-mono overflow-x-auto" dir="ltr">
                          {JSON.stringify(selectedThreat.evidence, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Resolve Controls */}
                    {selectedThreat.status !== 'resolved' && selectedThreat.status !== 'false_positive' && (
                      <div className="space-y-3 border-t pt-3">
                        <Select value={resolveStatus} onValueChange={setResolveStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resolved">تم الحل</SelectItem>
                            <SelectItem value="false_positive">إنذار كاذب</SelectItem>
                            <SelectItem value="mitigated">تم التخفيف</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="ملاحظات الحل..." rows={2} />
                        <Button onClick={handleResolve} className="w-full" disabled={resolveMutation.isPending}>
                          {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
                          تحديث الحالة
                        </Button>
                      </div>
                    )}

                    {selectedThreat.resolution_notes && (
                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200">
                        <p className="text-sm font-medium">ملاحظات الحل</p>
                        <p className="text-sm mt-1">{selectedThreat.resolution_notes}</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CyberSecurityCenter;
