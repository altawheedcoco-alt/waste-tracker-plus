/**
 * بياناتي — مركز البيانات المتكامل لكل جهة
 * My Data Center — Comprehensive data hub per entity type
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Database, Building2, FileText, Package, Users, Shield, Award,
  Truck, Recycle, Factory, BarChart3, Calendar, MapPin, Phone,
  Mail, Globe, Hash, CreditCard, Clock, CheckCircle2, AlertCircle,
  TrendingUp, Wallet, FileCheck, Scale, Leaf, Activity, Download,
  Eye, Printer, Briefcase, Lock, Fingerprint, ArrowRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ─── Entity Type Configurations ───
const ENTITY_SECTIONS: Record<string, { icon: typeof Building2; label: string; tabs: { id: string; label: string; icon: typeof Database }[] }> = {
  generator: {
    icon: Building2,
    label: 'بيانات المولّد',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: Database },
      { id: 'org', label: 'بيانات المنظمة', icon: Building2 },
      { id: 'compliance', label: 'الامتثال والتراخيص', icon: Shield },
      { id: 'operations', label: 'العمليات', icon: Package },
      { id: 'finance', label: 'الملخص المالي', icon: Wallet },
      { id: 'team', label: 'الفريق', icon: Users },
      { id: 'partners', label: 'الشركاء', icon: Briefcase },
    ],
  },
  transporter: {
    icon: Truck,
    label: 'بيانات الناقل',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: Database },
      { id: 'org', label: 'بيانات المنظمة', icon: Building2 },
      { id: 'fleet', label: 'الأسطول والسائقون', icon: Truck },
      { id: 'compliance', label: 'الامتثال والتراخيص', icon: Shield },
      { id: 'operations', label: 'العمليات', icon: Package },
      { id: 'finance', label: 'الملخص المالي', icon: Wallet },
      { id: 'partners', label: 'الشركاء', icon: Briefcase },
    ],
  },
  recycler: {
    icon: Recycle,
    label: 'بيانات المدوّر',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: Database },
      { id: 'org', label: 'بيانات المنظمة', icon: Building2 },
      { id: 'compliance', label: 'الامتثال والتراخيص', icon: Shield },
      { id: 'operations', label: 'العمليات', icon: Package },
      { id: 'environment', label: 'البيئة والاستدامة', icon: Leaf },
      { id: 'finance', label: 'الملخص المالي', icon: Wallet },
      { id: 'partners', label: 'الشركاء', icon: Briefcase },
    ],
  },
  disposal: {
    icon: Factory,
    label: 'بيانات جهة التخلص',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: Database },
      { id: 'org', label: 'بيانات المنظمة', icon: Building2 },
      { id: 'facilities', label: 'المرافق', icon: Factory },
      { id: 'compliance', label: 'الامتثال والتراخيص', icon: Shield },
      { id: 'operations', label: 'العمليات', icon: Package },
      { id: 'finance', label: 'الملخص المالي', icon: Wallet },
    ],
  },
  default: {
    icon: Building2,
    label: 'بياناتي',
    tabs: [
      { id: 'overview', label: 'نظرة عامة', icon: Database },
      { id: 'org', label: 'بيانات المنظمة', icon: Building2 },
      { id: 'compliance', label: 'الامتثال', icon: Shield },
      { id: 'team', label: 'الفريق', icon: Users },
    ],
  },
};

const InfoRow = ({ icon: Icon, label, value, badge }: { icon: typeof Building2; label: string; value?: string | null; badge?: { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="w-4 h-4" />
      {label}
    </div>
    <div className="flex items-center gap-2">
      {badge && <Badge variant={badge.variant} className="text-[10px]">{badge.text}</Badge>}
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, trend }: { icon: typeof Package; label: string; value: number | string; color: string; trend?: string }) => (
  <Card className="border-border/40">
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && <span className="text-xs text-emerald-600 font-medium">{trend}</span>}
      </div>
      <div className="mt-2">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const MyDataCenter = () => {
  const { organization, profile, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const orgType = organization?.organization_type || 'default';
  const config = ENTITY_SECTIONS[orgType] || ENTITY_SECTIONS.default;
  const EntityIcon = config.icon;

  // ─── Fetch all relevant data ───
  const { data: orgData } = useQuery({
    queryKey: ['mydata-org', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .maybeSingle();
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: teamData = [] } = useQuery({
    queryKey: ['mydata-team', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, avatar_url, phone, is_active, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const { data: shipmentsCount = 0 } = useQuery({
    queryKey: ['mydata-shipments-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('shipments')
        .select('id', { count: 'exact', head: true })
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},receiver_id.eq.${organization.id}`);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const { data: docsCount = 0 } = useQuery({
    queryKey: ['mydata-docs-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('entity_documents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const { data: partnersCount = 0 } = useQuery({
    queryKey: ['mydata-partners-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('organization_partnerships')
        .select('id', { count: 'exact', head: true })
        .or(`requester_id.eq.${organization.id},partner_id.eq.${organization.id}`)
        .eq('status', 'accepted');
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const { data: invoicesCount = 0 } = useQuery({
    queryKey: ['mydata-invoices-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const { data: contractsCount = 0 } = useQuery({
    queryKey: ['mydata-contracts-count', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return 0;
      const { count } = await supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .or(`organization_id.eq.${organization.id},partner_organization_id.eq.${organization.id}`);
      return count || 0;
    },
    enabled: !!organization?.id,
  });

  const { data: licensesData = [] } = useQuery({
    queryKey: ['mydata-licenses', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('organization_licenses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('expiry_date', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const activeLicenses = licensesData.filter((l: any) => l.status === 'active' || l.status === 'approved');
  const expiredLicenses = licensesData.filter((l: any) => l.status === 'expired');
  const complianceScore = licensesData.length > 0
    ? Math.round((activeLicenses.length / licensesData.length) * 100)
    : 0;

  const orgTypeLabel: Record<string, string> = {
    generator: 'مولد مخلفات',
    transporter: 'ناقل',
    recycler: 'مدوّر',
    disposal: 'تخلص نهائي',
    consultant: 'استشاري',
    consulting_office: 'مكتب استشارات',
    regulator: 'جهة رقابية',
    admin: 'مدير النظام',
  };

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                {config.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                مركز البيانات المتكامل — عرض وإدارة كافة بيانات ومعلومات جهتك
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/dashboard/document-center?tab=upload')}>
              <FileText className="w-4 h-4" />
              رفع مستند
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/dashboard/organization-profile')}>
              <Building2 className="w-4 h-4" />
              ملف المنظمة
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full" dir="rtl">
            <TabsList className="inline-flex h-11 w-max gap-1 bg-muted/60 p-1 rounded-xl">
              {config.tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs whitespace-nowrap rounded-lg px-3">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-4">
            {/* ═══ Overview Tab ═══ */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <StatCard icon={Package} label="الشحنات" value={shipmentsCount} color="bg-blue-600" />
                <StatCard icon={FileText} label="المستندات" value={docsCount} color="bg-emerald-600" />
                <StatCard icon={Users} label="أعضاء الفريق" value={teamData.length} color="bg-purple-600" />
                <StatCard icon={Briefcase} label="الشركاء" value={partnersCount} color="bg-amber-600" />
                <StatCard icon={CreditCard} label="الفواتير" value={invoicesCount} color="bg-rose-600" />
                <StatCard icon={FileCheck} label="العقود" value={contractsCount} color="bg-indigo-600" />
              </div>

              {/* Compliance Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    مؤشر الامتثال
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={complianceScore} className="h-3" />
                    </div>
                    <div className="text-2xl font-bold text-primary">{complianceScore}%</div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{activeLicenses.length} ترخيص ساري</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span>{expiredLicenses.length} منتهي</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-muted-foreground" />
                      <span>{licensesData.length} إجمالي</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Access */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Building2, label: 'ملف المنظمة', path: '/dashboard/organization-profile', color: 'text-primary' },
                  { icon: FileText, label: 'مركز المستندات', path: '/dashboard/document-center', color: 'text-emerald-600' },
                  { icon: Shield, label: 'الامتثال', path: '/dashboard/compliance-assessment', color: 'text-amber-600' },
                  { icon: BarChart3, label: 'التقارير', path: '/dashboard/reports', color: 'text-blue-600' },
                ].map(item => (
                  <Card key={item.path} className="cursor-pointer hover:shadow-md transition-all group" onClick={() => navigate(item.path)}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <item.icon className={`w-8 h-8 ${item.color}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-[-4px] transition-transform" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ═══ Organization Tab ═══ */}
            <TabsContent value="org" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    البيانات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow icon={Building2} label="اسم المنظمة" value={orgData?.name} />
                  <InfoRow icon={Building2} label="الاسم بالإنجليزية" value={orgData?.name_en} />
                  <InfoRow icon={Hash} label="السجل التجاري" value={orgData?.commercial_register} />
                  <InfoRow icon={Hash} label="البطاقة الضريبية" value={orgData?.tax_card_number} />
                  <InfoRow icon={Scale} label="نوع الجهة" value={orgTypeLabel[orgType] || orgType}
                    badge={{ text: orgType, variant: 'secondary' }} />
                  <InfoRow icon={MapPin} label="العنوان" value={orgData?.address} />
                  <InfoRow icon={MapPin} label="المدينة" value={orgData?.city} />
                  <InfoRow icon={MapPin} label="المنطقة" value={orgData?.region} />
                  <InfoRow icon={Phone} label="الهاتف" value={orgData?.phone} />
                  <InfoRow icon={Mail} label="البريد الإلكتروني" value={orgData?.email} />
                  <InfoRow icon={Globe} label="الموقع الإلكتروني" value={orgData?.website} />
                  <InfoRow icon={Calendar} label="تاريخ التسجيل" value={orgData?.created_at ? format(new Date(orgData.created_at), 'yyyy/MM/dd') : null} />
                  <InfoRow icon={CheckCircle2} label="حالة التحقق"
                    value={orgData?.verification_status === 'verified' ? 'موثق' : orgData?.verification_status === 'pending' ? 'قيد المراجعة' : 'غير موثق'}
                    badge={{
                      text: orgData?.verification_status === 'verified' ? '✓' : '⏳',
                      variant: orgData?.verification_status === 'verified' ? 'default' : 'secondary'
                    }}
                  />
                  <InfoRow icon={Fingerprint} label="كود الشراكة" value={orgData?.partner_code} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Compliance Tab ═══ */}
            <TabsContent value="compliance" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    التراخيص والتصاريح
                  </CardTitle>
                  <CardDescription>
                    {activeLicenses.length} ساري من أصل {licensesData.length} ترخيص
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {licensesData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا توجد تراخيص مسجلة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {licensesData.map((license: any) => {
                        const isExpired = license.status === 'expired' || (license.expiry_date && new Date(license.expiry_date) < new Date());
                        return (
                          <div key={license.id} className={`p-3 rounded-lg border ${isExpired ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpired ? <AlertCircle className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                <span className="text-sm font-medium">{license.license_type || 'ترخيص'}</span>
                              </div>
                              <Badge variant={isExpired ? 'destructive' : 'default'} className="text-[10px]">
                                {isExpired ? 'منتهي' : 'ساري'}
                              </Badge>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>رقم: {license.license_number || '—'}</div>
                              <div>الجهة: {license.issuing_authority || '—'}</div>
                              <div>صدر: {license.issue_date ? format(new Date(license.issue_date), 'yyyy/MM/dd') : '—'}</div>
                              <div>ينتهي: {license.expiry_date ? format(new Date(license.expiry_date), 'yyyy/MM/dd') : '—'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Operations Tab ═══ */}
            <TabsContent value="operations" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Package} label="إجمالي الشحنات" value={shipmentsCount} color="bg-blue-600" />
                <StatCard icon={FileCheck} label="العقود" value={contractsCount} color="bg-purple-600" />
                <StatCard icon={CreditCard} label="الفواتير" value={invoicesCount} color="bg-rose-600" />
                <StatCard icon={FileText} label="المستندات" value={docsCount} color="bg-emerald-600" />
              </div>
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">للاطلاع على تفاصيل العمليات التشغيلية</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/shipments')}>
                      الشحنات <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/reports')}>
                      التقارير <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Finance Tab ═══ */}
            <TabsContent value="finance" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard icon={CreditCard} label="الفواتير" value={invoicesCount} color="bg-rose-600" />
                <StatCard icon={FileCheck} label="العقود النشطة" value={contractsCount} color="bg-indigo-600" />
                <StatCard icon={Wallet} label="الإيداعات" value="—" color="bg-amber-600" />
              </div>
              <Card>
                <CardContent className="p-6 text-center">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">للاطلاع على التفاصيل المالية الكاملة</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/erp/accounting')}>
                      المحاسبة <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/erp/financial-dashboard')}>
                      التقارير المالية <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Team Tab ═══ */}
            <TabsContent value="team" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    فريق العمل ({teamData.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamData.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>لا يوجد أعضاء مسجلين</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamData.map((member: any) => (
                        <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.full_name || 'بدون اسم'}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{member.role || 'عضو'}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Partners Tab ═══ */}
            <TabsContent value="partners" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-lg font-semibold">{partnersCount} شريك</p>
                  <p className="text-sm text-muted-foreground mt-1">الشركاء المرتبطين بالمنظمة</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard/partners')}>
                    إدارة الشركاء <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Fleet Tab (Transporter) ═══ */}
            <TabsContent value="fleet" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Truck className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">لإدارة الأسطول والسائقين</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/transporter-drivers')}>
                      إدارة السائقين <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/driver-tracking')}>
                      تتبع السائقين <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Environment Tab (Recycler) ═══ */}
            <TabsContent value="environment" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Leaf className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">للاطلاع على البيانات البيئية والاستدامة</p>
                  <div className="flex gap-2 justify-center mt-3">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/carbon-footprint')}>
                      البصمة الكربونية <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-sustainability')}>
                      الاستدامة <ArrowRight className="w-3.5 h-3.5 mr-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ═══ Facilities Tab (Disposal) ═══ */}
            <TabsContent value="facilities" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Factory className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">لإدارة مرافق التخلص</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard/disposal-facilities')}>
                    إدارة المرافق <ArrowRight className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyDataCenter;
