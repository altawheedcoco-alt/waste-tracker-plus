import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, FileText, BarChart3, Eye, Loader2,
  Briefcase, MapPin, ShieldCheck, ClipboardCheck, TrendingUp,
  AlertTriangle, CheckCircle2, GraduationCap,
} from 'lucide-react';
import ConsultantKPIsWidget from '@/components/compliance/ConsultantKPIsWidget';

const ConsultingOfficeDashboard = memo(() => {
  const { profile, organization } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch all consultants belonging to this office (org members who are also consultants)
  const { data: officeConsultants = [], isLoading: loadingConsultants } = useQuery({
    queryKey: ['office-consultants', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      // Get org members
      const { data: members } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, phone, email')
        .eq('organization_id', organization.id);
      if (!members?.length) return [];

      // Check which ones are registered consultants
      const userIds = members.map(m => m.user_id);
      const { data: consultants } = await supabase
        .from('environmental_consultants')
        .select('*')
        .in('user_id', userIds);

      return (consultants || []).map((c: any) => ({
        ...c,
        memberProfile: members.find(m => m.user_id === c.user_id),
      }));
    },
    enabled: !!organization?.id,
  });

  // Fetch all client organizations assigned to any office consultant
  const { data: clientOrgs = [], isLoading: loadingClients } = useQuery({
    queryKey: ['office-clients', officeConsultants.map((c: any) => c.id)],
    queryFn: async () => {
      const consultantIds = officeConsultants.map((c: any) => c.id).filter(Boolean);
      if (!consultantIds.length) return [];
      const { data } = await supabase
        .from('consultant_organization_assignments')
        .select(`
          *,
          organization:organizations(id, name, organization_type, city, logo_url),
          consultant:environmental_consultants(id, full_name, consultant_code)
        `)
        .in('consultant_id', consultantIds)
        .eq('is_active', true);
      return data || [];
    },
    enabled: officeConsultants.length > 0,
  });

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
            <Building2 className="w-7 h-7 text-blue-600" />
            لوحة تحكم المكتب الاستشاري
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {organization?.name} — إدارة العملاء والاستشاريين وملفات الامتثال
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/environmental-consultants')} className="gap-1.5">
          <Users className="w-4 h-4" />
          إدارة الاستشاريين
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="الاستشاريون" value={officeConsultants.length} color="text-blue-600" />
        <StatCard icon={Building2} label="عملاء المكتب" value={clientOrgs.length} color="text-emerald-600" />
        <StatCard icon={FileText} label="التقارير المطلوبة" value={0} color="text-amber-600" />
        <StatCard icon={CheckCircle2} label="المراجعات المكتملة" value={0} color="text-purple-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="consultants" className="gap-1.5">
            <Users className="w-4 h-4" />
            فريق الاستشاريين ({officeConsultants.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            العملاء ({clientOrgs.length})
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            الامتثال
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <ConsultantKPIsWidget />
        </TabsContent>

        <TabsContent value="consultants" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                فريق الاستشاريين
              </CardTitle>
              <CardDescription>الاستشاريون البيئيون المسجلون تحت هذا المكتب</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConsultants ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : officeConsultants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا يوجد استشاريون مسجلون</p>
                  <p className="text-sm mt-1">يمكن لأعضاء المكتب التسجيل عبر بوابة الاستشاريين</p>
                  <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/consultant-portal')}>
                    <GraduationCap className="w-4 h-4" />
                    بوابة التسجيل
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {officeConsultants.map((c: any) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold">
                              {c.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{c.full_name}</p>
                              <p className="text-xs text-muted-foreground">{c.specialization || 'عام'}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono">{c.consultant_code}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {c.license_number && <p>ترخيص: {c.license_number}</p>}
                            {c.memberProfile?.phone && <p>📱 {c.memberProfile.phone}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                عملاء المكتب
              </CardTitle>
              <CardDescription>الجهات التي يشرف عليها استشاريو المكتب</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : clientOrgs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">لا توجد جهات عميلة بعد</p>
                  <p className="text-sm mt-1">سيتم عرض الجهات التي تعيّن أحد استشاريي المكتب</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientOrgs.map((a: any) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-2">
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
                                    <MapPin className="w-2.5 h-2.5" /> {a.organization.city}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-2">
                            الاستشاري: {a.consultant?.full_name} ({a.consultant?.consultant_code})
                          </p>
                          <Button variant="outline" size="sm" className="w-full gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            عرض ملف العميل
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

ConsultingOfficeDashboard.displayName = 'ConsultingOfficeDashboard';

export default ConsultingOfficeDashboard;
