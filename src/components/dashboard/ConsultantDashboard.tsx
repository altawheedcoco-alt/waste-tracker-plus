import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Building2, FileText, Users, ClipboardCheck,
  BarChart3, Eye, Calendar, ArrowLeft, Loader2, AlertTriangle,
  CheckCircle2, Briefcase, MapPin, Phone, Mail,
} from 'lucide-react';
import ConsultantKPIsWidget from '@/components/compliance/ConsultantKPIsWidget';

const ConsultantDashboard = memo(() => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch consultant profile
  const { data: consultantProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-consultant-profile-dash', profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase
        .from('environmental_consultants')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  // Fetch assigned organizations
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['consultant-assignments', consultantProfile?.id],
    queryFn: async () => {
      if (!consultantProfile?.id) return [];
      const { data } = await supabase
        .from('consultant_organization_assignments')
        .select(`
          *,
          organization:organizations(id, name, organization_type, city, logo_url, partner_code)
        `)
        .eq('consultant_id', consultantProfile.id)
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!consultantProfile?.id,
  });

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const orgTypeLabels: Record<string, string> = {
    generator: 'مولد مخلفات',
    transporter: 'ناقل',
    recycler: 'مدوّر',
    disposal: 'تخلص نهائي',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            لوحة تحكم الاستشاري البيئي
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            مرحباً {profile?.full_name} — إدارة ومراقبة الامتثال للجهات المرتبطة
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-consultants')} className="gap-1.5">
            <Briefcase className="w-4 h-4" />
            ملفي المهني
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/consultant-portal')} className="gap-1.5">
            <FileText className="w-4 h-4" />
            بوابة التسجيل
          </Button>
        </div>
      </div>

      {/* Consultant Info Card */}
      {consultantProfile && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold">
                {(consultantProfile as any).full_name?.charAt(0) || 'C'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">{(consultantProfile as any).full_name}</p>
                <p className="text-sm text-muted-foreground">{(consultantProfile as any).specialization || 'استشاري بيئي'}</p>
              </div>
              <Badge variant="outline" className="font-mono text-emerald-700">
                {(consultantProfile as any).consultant_code || 'EC-XXXX'}
              </Badge>
              <Badge variant={(consultantProfile as any).is_active ? 'default' : 'secondary'}>
                {(consultantProfile as any).is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {!consultantProfile && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="font-bold mb-1">لم يتم تسجيلك كاستشاري بيئي بعد</p>
            <p className="text-sm text-muted-foreground mb-4">سجل في بوابة الاستشاريين لتفعيل جميع الأدوات</p>
            <Button onClick={() => navigate('/consultant-portal')} className="gap-2">
              <ShieldCheck className="w-4 h-4" />
              سجل الآن
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="organizations" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            الجهات المرتبطة ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            الامتثال والتقارير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Building2} label="الجهات المرتبطة" value={assignments.length} color="text-blue-600" />
            <StatCard icon={FileText} label="التقارير المطلوبة" value={0} color="text-amber-600" />
            <StatCard icon={CheckCircle2} label="المراجعات المكتملة" value={0} color="text-emerald-600" />
            <StatCard icon={AlertTriangle} label="تنبيهات" value={0} color="text-red-600" />
          </div>

          {/* KPIs Widget */}
          <ConsultantKPIsWidget />
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                الجهات المرتبطة بك
              </CardTitle>
              <CardDescription>الجهات التي عيّنتك كاستشاري بيئي معتمد لها</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssignments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا توجد جهات مرتبطة بعد</p>
                  <p className="text-sm mt-1">شارك كود الاستشاري الخاص بك مع الجهات ليتم تعيينك</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((a: any) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {a.organization?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{a.organization?.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">
                                  {orgTypeLabels[a.organization?.organization_type] || a.organization?.organization_type}
                                </Badge>
                                {a.organization?.city && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {a.organization.city}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {a.can_view_shipments && <Badge variant="secondary" className="text-[9px]">الشحنات</Badge>}
                            {a.can_view_documents && <Badge variant="secondary" className="text-[9px]">المستندات</Badge>}
                            {a.can_view_compliance && <Badge variant="secondary" className="text-[9px]">الامتثال</Badge>}
                            {a.can_view_partners && <Badge variant="secondary" className="text-[9px]">الشركاء</Badge>}
                            {a.can_view_vehicles && <Badge variant="secondary" className="text-[9px]">المركبات</Badge>}
                            {a.can_view_drivers && <Badge variant="secondary" className="text-[9px]">السائقين</Badge>}
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3 gap-1.5"
                            onClick={() => navigate(`/dashboard/organization/${a.organization?.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض بيانات الجهة
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <ConsultantKPIsWidget />
        </TabsContent>
      </Tabs>
    </div>
  );
});

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
  <Card>
    <CardContent className="p-4 text-right">
      <div className="flex items-center justify-between">
        <Icon className={`w-8 h-8 ${color} opacity-60`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

ConsultantDashboard.displayName = 'ConsultantDashboard';

export default ConsultantDashboard;
