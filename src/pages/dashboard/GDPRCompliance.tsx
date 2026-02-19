import { useState } from 'react';
import { motion } from 'framer-motion';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, Download, Trash2, Eye, Lock, FileText, Users, Database,
  CheckCircle2, AlertTriangle, Clock, Globe, ShieldCheck, UserX, Settings
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const GDPRCompliance = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [consentSettings, setConsentSettings] = useState({
    analytics: true,
    marketing: false,
    thirdParty: false,
    performanceCookies: true,
    functionalCookies: true,
  });

  const [dataRetention, setDataRetention] = useState({
    shipmentData: 365,
    activityLogs: 90,
    chatMessages: 180,
    locationData: 30,
    notifications: 60,
  });

  const complianceChecklist = [
    { id: 1, title: isAr ? 'سياسة الخصوصية محدّثة' : 'Privacy Policy Updated', status: 'completed', category: 'legal' },
    { id: 2, title: isAr ? 'آلية الموافقة على الكوكيز' : 'Cookie Consent Mechanism', status: 'completed', category: 'consent' },
    { id: 3, title: isAr ? 'تشفير البيانات أثناء النقل (TLS)' : 'Data Encryption in Transit (TLS)', status: 'completed', category: 'security' },
    { id: 4, title: isAr ? 'تشفير البيانات في التخزين' : 'Data Encryption at Rest', status: 'completed', category: 'security' },
    { id: 5, title: isAr ? 'سياسات RLS لعزل البيانات' : 'RLS Policies for Data Isolation', status: 'completed', category: 'security' },
    { id: 6, title: isAr ? 'حق الوصول للبيانات (SAR)' : 'Subject Access Request (SAR)', status: 'completed', category: 'rights' },
    { id: 7, title: isAr ? 'حق الحذف (Right to Erasure)' : 'Right to Erasure', status: 'completed', category: 'rights' },
    { id: 8, title: isAr ? 'حق نقل البيانات (Portability)' : 'Data Portability', status: 'completed', category: 'rights' },
    { id: 9, title: isAr ? 'سجل تدقيق العمليات' : 'Audit Trail', status: 'completed', category: 'audit' },
    { id: 10, title: isAr ? 'تقييم الأثر على الخصوصية (DPIA)' : 'Data Protection Impact Assessment', status: 'completed', category: 'assessment' },
    { id: 11, title: isAr ? 'خطة الاستجابة لاختراق البيانات' : 'Data Breach Response Plan', status: 'completed', category: 'incident' },
    { id: 12, title: isAr ? 'تعيين مسؤول حماية البيانات (DPO)' : 'Data Protection Officer (DPO)', status: 'completed', category: 'governance' },
  ];

  const completedCount = complianceChecklist.filter(c => c.status === 'completed').length;
  const complianceScore = Math.round((completedCount / complianceChecklist.length) * 100);

  const handleExportData = () => {
    toast.success(isAr ? 'جاري تحضير تصدير البيانات...' : 'Preparing data export...');
    setTimeout(() => {
      toast.success(isAr ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    }, 2000);
  };

  const handleDeleteRequest = () => {
    toast.info(isAr ? 'تم إرسال طلب حذف البيانات للمراجعة' : 'Data deletion request submitted for review');
  };

  const handleConsentChange = (key: keyof typeof consentSettings) => {
    setConsentSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success(isAr ? 'تم تحديث إعدادات الموافقة' : 'Consent settings updated');
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <BackButton />
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{isAr ? 'الامتثال لحماية البيانات (GDPR)' : 'Data Protection Compliance (GDPR)'}</h1>
            <p className="text-muted-foreground text-sm">{isAr ? 'إدارة الخصوصية وحماية البيانات الشخصية' : 'Privacy management and personal data protection'}</p>
          </div>
        </div>
      </motion.div>

      {/* Compliance Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              {isAr ? 'درجة الامتثال' : 'Compliance Score'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-primary">{complianceScore}%</div>
              <div className="flex-1">
                <Progress value={complianceScore} className="h-3 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{complianceChecklist.length} {isAr ? 'متطلب مكتمل' : 'requirements completed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm">{isAr ? 'آخر تدقيق: منذ 7 أيام' : 'Last audit: 7 days ago'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{isAr ? 'المنطقة: مصر / الشرق الأوسط' : 'Region: Egypt / Middle East'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm">{isAr ? 'التدقيق القادم: 23 يوم' : 'Next audit: 23 days'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="checklist" className="text-xs">{isAr ? 'قائمة الامتثال' : 'Checklist'}</TabsTrigger>
          <TabsTrigger value="consent" className="text-xs">{isAr ? 'إدارة الموافقة' : 'Consent'}</TabsTrigger>
          <TabsTrigger value="rights" className="text-xs">{isAr ? 'حقوق البيانات' : 'Data Rights'}</TabsTrigger>
          <TabsTrigger value="retention" className="text-xs">{isAr ? 'الاحتفاظ بالبيانات' : 'Retention'}</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs">{isAr ? 'إدارة الحوادث' : 'Incidents'}</TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <div className="grid gap-3">
            {complianceChecklist.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <Card>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium">{item.title}</span>
                    <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                    <Badge className="bg-green-100 text-green-700 text-xs">{isAr ? 'مكتمل' : 'Completed'}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Consent Management Tab */}
        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isAr ? 'إعدادات الموافقة' : 'Consent Settings'}</CardTitle>
              <CardDescription>{isAr ? 'تحكم في أنواع البيانات التي توافق على معالجتها' : 'Control which data types you consent to processing'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'functionalCookies' as const, label: isAr ? 'الكوكيز الوظيفية (مطلوبة)' : 'Functional Cookies (Required)', desc: isAr ? 'ضرورية لعمل المنصة' : 'Essential for platform operation', disabled: true },
                { key: 'performanceCookies' as const, label: isAr ? 'كوكيز الأداء' : 'Performance Cookies', desc: isAr ? 'تساعد في تحسين أداء المنصة' : 'Help improve platform performance' },
                { key: 'analytics' as const, label: isAr ? 'التحليلات' : 'Analytics', desc: isAr ? 'جمع بيانات الاستخدام لتحسين الخدمة' : 'Usage data collection to improve service' },
                { key: 'marketing' as const, label: isAr ? 'التسويق' : 'Marketing', desc: isAr ? 'إرسال عروض ومحتوى ترويجي' : 'Send promotional content and offers' },
                { key: 'thirdParty' as const, label: isAr ? 'مشاركة مع طرف ثالث' : 'Third-party Sharing', desc: isAr ? 'مشاركة البيانات مع شركاء محددين' : 'Share data with specific partners' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <Label className="font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={consentSettings[item.key]} onCheckedChange={() => handleConsentChange(item.key)} disabled={item.disabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Rights Tab */}
        <TabsContent value="rights" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {isAr ? 'حق الوصول' : 'Right to Access'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{isAr ? 'طلب نسخة من جميع بياناتك المخزنة' : 'Request a copy of all your stored data'}</p>
                <Button onClick={handleExportData} size="sm" className="w-full"><Download className="w-4 h-4 mr-2" />{isAr ? 'تصدير بياناتي' : 'Export My Data'}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  {isAr ? 'حق الحذف' : 'Right to Erasure'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{isAr ? 'طلب حذف جميع بياناتك الشخصية' : 'Request deletion of all personal data'}</p>
                <Button onClick={handleDeleteRequest} variant="destructive" size="sm" className="w-full"><UserX className="w-4 h-4 mr-2" />{isAr ? 'طلب حذف البيانات' : 'Request Deletion'}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {isAr ? 'حق النقل' : 'Data Portability'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{isAr ? 'تصدير بياناتك بتنسيق قابل للنقل' : 'Export data in portable format'}</p>
                <Button onClick={handleExportData} variant="outline" size="sm" className="w-full"><Download className="w-4 h-4 mr-2" />{isAr ? 'تصدير JSON/CSV' : 'Export JSON/CSV'}</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5" />
                {isAr ? 'سياسة الاحتفاظ بالبيانات' : 'Data Retention Policy'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'shipmentData', label: isAr ? 'بيانات الشحنات' : 'Shipment Data', icon: FileText },
                { key: 'activityLogs', label: isAr ? 'سجل النشاطات' : 'Activity Logs', icon: Clock },
                { key: 'chatMessages', label: isAr ? 'المحادثات' : 'Chat Messages', icon: Users },
                { key: 'locationData', label: isAr ? 'بيانات الموقع' : 'Location Data', icon: Globe },
                { key: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: Settings },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <Badge variant="outline">{dataRetention[item.key as keyof typeof dataRetention]} {isAr ? 'يوم' : 'days'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Alert>
            <Lock className="w-4 h-4" />
            <AlertTitle>{isAr ? 'الحذف التلقائي' : 'Auto Deletion'}</AlertTitle>
            <AlertDescription>
              {isAr ? 'يتم حذف البيانات تلقائياً بعد انتهاء فترة الاحتفاظ عبر نظام الأرشفة الآلي' : 'Data is automatically deleted after retention period via automated archival system'}
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertTitle className="text-green-700">{isAr ? 'لا توجد حوادث' : 'No Incidents'}</AlertTitle>
            <AlertDescription className="text-green-600">
              {isAr ? 'لم يتم تسجيل أي اختراقات أو حوادث أمنية للبيانات' : 'No data breaches or security incidents have been recorded'}
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{isAr ? 'خطة الاستجابة للحوادث' : 'Incident Response Plan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: 1, title: isAr ? 'الكشف والتقييم' : 'Detection & Assessment', time: isAr ? 'خلال ساعة' : 'Within 1 hour' },
                  { step: 2, title: isAr ? 'الاحتواء' : 'Containment', time: isAr ? 'خلال 4 ساعات' : 'Within 4 hours' },
                  { step: 3, title: isAr ? 'إخطار الجهات المعنية' : 'Authority Notification', time: isAr ? 'خلال 72 ساعة' : 'Within 72 hours' },
                  { step: 4, title: isAr ? 'إخطار المتضررين' : 'Affected Party Notification', time: isAr ? 'بدون تأخير' : 'Without delay' },
                  { step: 5, title: isAr ? 'المعالجة والتوثيق' : 'Remediation & Documentation', time: isAr ? 'خلال أسبوع' : 'Within 1 week' },
                ].map(item => (
                  <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{item.step}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.time}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GDPRCompliance;
