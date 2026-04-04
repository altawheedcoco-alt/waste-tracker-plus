import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, AlertTriangle, CheckCircle, Download, Clock, Scale, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/navigation/BackButton';

const LAW_ARTICLES = [
  { number: 'المادة 27', title: 'التزامات مولد المخلفات', description: 'يلتزم مولد المخلفات بفصلها من المنبع وفقاً للأنواع المحددة' },
  { number: 'المادة 28', title: 'سجل المخلفات', description: 'يلتزم مولد المخلفات بإمساك سجل لأنواع وكميات المخلفات' },
  { number: 'المادة 29', title: 'التعاقد مع ناقل مرخص', description: 'يحظر التخلص من المخلفات إلا عن طريق ناقل مرخص' },
  { number: 'المادة 35', title: 'ترخيص نشاط النقل', description: 'يجب الحصول على ترخيص لنقل المخلفات من WMRA' },
  { number: 'المادة 38', title: 'بيان الحمولة (مانيفست)', description: 'يلتزم الناقل بحمل بيان الحمولة أثناء النقل' },
  { number: 'المادة 44', title: 'ترخيص التدوير/المعالجة', description: 'يحظر ممارسة نشاط تدوير المخلفات بدون ترخيص' },
];

const LegalShield = () => {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch shipments for compliance analysis
  const { data: shipments = [] } = useQuery({
    queryKey: ['legal-shield-shipments', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await supabase
        .from('shipments')
        .select('id, status, created_at, waste_type, weight_kg, source_organization_id, destination_organization_id')
        .or(`source_organization_id.eq.${orgId},destination_organization_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch organization license data
  const { data: orgData } = useQuery({
    queryKey: ['legal-shield-org', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      return data;
    },
    enabled: !!orgId,
  });

  // Compliance calculations
  const complianceMetrics = useMemo(() => {
    const total = shipments.length;
    const withWasteType = shipments.filter((s: any) => s.waste_type).length;
    const withWeight = shipments.filter((s: any) => s.weight_kg && s.weight_kg > 0).length;
    const completed = shipments.filter((s: any) => s.status === 'delivered' || s.status === 'confirmed').length;

    const wasteClassification = total > 0 ? Math.round((withWasteType / total) * 100) : 100;
    const weightDocumentation = total > 0 ? Math.round((withWeight / total) * 100) : 100;
    const manifestCompliance = total > 0 ? Math.round((completed / total) * 100) : 100;

    const overallScore = Math.round((wasteClassification + weightDocumentation + manifestCompliance) / 3);

    return { wasteClassification, weightDocumentation, manifestCompliance, overallScore, total };
  }, [shipments]);

  // License expiry check
  const licenseAlerts = useMemo(() => {
    const alerts: Array<{ type: string; label: string; expiryDate: string; daysLeft: number; status: 'expired' | 'warning' | 'ok' }> = [];
    if (!orgData) return alerts;

    const checkExpiry = (date: string | null, label: string, type: string) => {
      if (!date) return;
      const expiry = new Date(date);
      const now = new Date();
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const status = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'warning' : 'ok';
      alerts.push({ type, label, expiryDate: date, daysLeft, status });
    };

    checkExpiry((orgData as any).license_expiry_date, 'ترخيص النشاط', 'activity');
    checkExpiry((orgData as any).wmra_license_expiry_date, 'ترخيص WMRA', 'wmra');
    checkExpiry((orgData as any).env_approval_expiry, 'الموافقة البيئية', 'env');

    return alerts;
  }, [orgData]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 border-green-500/30';
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">الدرع القانوني</h1>
              <p className="text-sm text-muted-foreground">مراقبة الامتثال لقانون إدارة المخلفات 202/2020</p>
            </div>
          </div>
        </div>

        {/* Overall Score Card */}
        <Card className={`border ${getScoreBg(complianceMetrics.overallScore)}`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(complianceMetrics.overallScore)}`}>
                  {complianceMetrics.overallScore}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">درجة الامتثال الإجمالية</p>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard label="تصنيف المخلفات" value={complianceMetrics.wasteClassification} icon={<Scale className="w-4 h-4" />} />
                <MetricCard label="توثيق الأوزان" value={complianceMetrics.weightDocumentation} icon={<FileText className="w-4 h-4" />} />
                <MetricCard label="اكتمال المانيفست" value={complianceMetrics.manifestCompliance} icon={<CheckCircle className="w-4 h-4" />} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Alerts */}
        {licenseAlerts.filter(a => a.status !== 'ok').length > 0 && (
          <div className="space-y-2">
            {licenseAlerts.filter(a => a.status !== 'ok').map(alert => (
              <Card key={alert.type} className={`border ${alert.status === 'expired' ? 'border-destructive/50 bg-destructive/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {alert.status === 'expired' ? (
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                  )}
                  <div>
                    <p className={`font-semibold text-sm ${alert.status === 'expired' ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-400'}`}>
                      {alert.label} — {alert.status === 'expired' ? 'منتهي' : `ينتهي خلال ${alert.daysLeft} يوم`}
                    </p>
                    <p className="text-xs text-muted-foreground">تاريخ الانتهاء: {alert.expiryDate}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="articles">المواد القانونية</TabsTrigger>
            <TabsTrigger value="records">سجل المخلفات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    ملخص الامتثال
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ComplianceRow label="عدد الشحنات المسجلة" value={complianceMetrics.total.toString()} />
                  <ComplianceRow label="نسبة تصنيف المخلفات" value={`${complianceMetrics.wasteClassification}%`} ok={complianceMetrics.wasteClassification >= 90} />
                  <ComplianceRow label="نسبة توثيق الأوزان" value={`${complianceMetrics.weightDocumentation}%`} ok={complianceMetrics.weightDocumentation >= 90} />
                  <ComplianceRow label="نسبة اكتمال المانيفست" value={`${complianceMetrics.manifestCompliance}%`} ok={complianceMetrics.manifestCompliance >= 90} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    حالة التراخيص
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {licenseAlerts.length > 0 ? licenseAlerts.map(alert => (
                    <div key={alert.type} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{alert.label}</span>
                      <Badge variant={alert.status === 'ok' ? 'default' : alert.status === 'warning' ? 'secondary' : 'destructive'}>
                        {alert.status === 'ok' ? 'ساري' : alert.status === 'warning' ? 'ينتهي قريباً' : 'منتهي'}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">لا توجد بيانات تراخيص مسجلة</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="articles" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LAW_ARTICLES.map(article => (
                <Card key={article.number} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{article.number}</h3>
                        <p className="text-xs font-medium text-primary mt-0.5">{article.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{article.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="records" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">سجل المخلفات الإلكتروني</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    تصدير PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">التاريخ</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">نوع المخلفات</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">الوزن (كجم)</th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.slice(0, 20).map((s: any) => (
                        <tr key={s.id} className="border-b border-border/50">
                          <td className="py-2 px-3 text-foreground">{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                          <td className="py-2 px-3 text-foreground">{s.waste_type || '—'}</td>
                          <td className="py-2 px-3 text-foreground">{s.weight_kg || '—'}</td>
                          <td className="py-2 px-3">
                            <Badge variant={s.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                              {s.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {shipments.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد شحنات مسجلة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const MetricCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => {
  const color = value >= 90 ? 'text-green-600 dark:text-green-400' : value >= 70 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive';
  return (
    <div className="text-center p-3 rounded-lg bg-background/50">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <div className={`text-2xl font-bold ${color}`}>{value}%</div>
    </div>
  );
};

const ComplianceRow = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold ${ok === undefined ? 'text-foreground' : ok ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
      {value}
    </span>
  </div>
);

export default LegalShield;
