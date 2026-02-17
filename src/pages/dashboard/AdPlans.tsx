import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BackButton from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, Rocket, Image, Video, Globe, BarChart3, Loader2, ShieldCheck, ArrowUpCircle, Search, CrownIcon } from 'lucide-react';

const PLAN_ICONS: Record<string, any> = { banner: Zap, featured: Star, spotlight: Rocket, premium: Crown };
const PLAN_COLORS: Record<string, string> = {
  banner: 'from-blue-500 to-cyan-500',
  featured: 'from-purple-500 to-pink-500',
  spotlight: 'from-amber-500 to-orange-500',
  premium: 'from-yellow-400 to-amber-600',
};

const SERVICE_ICONS: Record<string, any> = {
  verified_badge: ShieldCheck,
  priority_listing: ArrowUpCircle,
  analytics_report: BarChart3,
  featured_profile: CrownIcon,
  sponsored_search: Search,
};

const AdPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [p, s] = await Promise.all([
        supabase.from('ad_plans').select('*').eq('is_active', true).order('priority_order'),
        supabase.from('revenue_services').select('*').eq('is_active', true).order('price_egp'),
      ]);
      setPlans(p.data || []);
      setServices(s.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">باقات الإعلانات والخدمات المميزة</h1>
            <p className="text-muted-foreground text-sm">اختر الباقة المناسبة لتعزيز ظهور منشأتك</p>
          </div>
        </div>

        <Tabs defaultValue="ads">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="ads">باقات الإعلانات</TabsTrigger>
            <TabsTrigger value="services">خدمات مميزة</TabsTrigger>
          </TabsList>

          <TabsContent value="ads" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, idx) => {
                const Icon = PLAN_ICONS[plan.plan_type] || Star;
                const color = PLAN_COLORS[plan.plan_type] || 'from-primary to-primary';
                const features: string[] = (() => {
                  try { return JSON.parse(typeof plan.features === 'string' ? plan.features : JSON.stringify(plan.features)); } catch { return []; }
                })();
                const isPopular = idx === 2;
                return (
                  <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${isPopular ? 'ring-2 ring-primary scale-[1.02]' : ''}`}>
                    {isPopular && <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-1 font-bold">الأكثر طلباً</div>}
                    <CardHeader className={`pb-2 ${isPopular ? 'pt-8' : ''}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{plan.name_ar}</CardTitle>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-extrabold">{plan.price_egp}</span>
                        <span className="text-muted-foreground text-sm">ج.م / {plan.duration_days} يوم</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                      <div className="flex gap-1.5 pt-2">
                        {plan.allows_video && <Badge variant="outline" className="text-[10px]"><Video className="h-3 w-3 ml-1" />فيديو</Badge>}
                        {plan.homepage_placement && <Badge variant="outline" className="text-[10px]"><Globe className="h-3 w-3 ml-1" />الرئيسية</Badge>}
                        <Badge variant="outline" className="text-[10px]"><Image className="h-3 w-3 ml-1" />{plan.max_media_count} صور</Badge>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant={isPopular ? 'default' : 'outline'} onClick={() => navigate('/dashboard/my-ads')}>
                        اختر هذه الباقة
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(svc => {
                const Icon = SERVICE_ICONS[svc.service_type] || Star;
                const features: string[] = (() => {
                  try { return JSON.parse(typeof svc.features === 'string' ? svc.features : JSON.stringify(svc.features)); } catch { return []; }
                })();
                return (
                  <Card key={svc.id} className="hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{svc.service_name_ar}</CardTitle>
                      <p className="text-sm text-muted-foreground">{svc.description_ar}</p>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-extrabold">{svc.price_egp}</span>
                        <span className="text-muted-foreground text-sm">ج.م / {svc.duration_days} يوم</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline">اشترك الآن</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdPlans;
