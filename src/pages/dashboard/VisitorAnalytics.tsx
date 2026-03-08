import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, Users, Globe, Monitor, Smartphone, Tablet,
  MapPin, Clock, ArrowRight, Search, RefreshCw,
  BarChart3, TrendingUp, Chrome, Activity,
  Timer, ArrowDownToLine, Route, Megaphone, MousePointerClick
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const VisitorAnalytics = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('overview');

  // Counter stats
  const { data: counter } = useQuery({
    queryKey: ['visitor-counter'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('visitor_counter')
        .select('*')
        .eq('id', 'global')
        .single();
      return data;
    },
  });

  // Visitor list
  const { data: visitors = [], isLoading, refetch } = useQuery({
    queryKey: ['visitor-tracking-list', search],
    queryFn: async () => {
      let query = (supabase as any)
        .from('visitor_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (search) {
        query = query.or(`ip_address.ilike.%${search}%,country.ilike.%${search}%,city.ilike.%${search}%,browser.ilike.%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });

  // Analytics aggregations
  const { data: analytics } = useQuery({
    queryKey: ['visitor-analytics'],
    queryFn: async () => {
      const { data: all } = await (supabase as any)
        .from('visitor_tracking')
        .select('country, city, browser, os, device_type, is_returning, created_at, session_duration_seconds, max_scroll_depth, pages_visited, utm_source, utm_medium, utm_campaign, bounce')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!all) return null;

      const countries: Record<string, number> = {};
      const browsers: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const oses: Record<string, number> = {};
      const utmSources: Record<string, number> = {};
      const topPages: Record<string, number> = {};
      let returning = 0;
      let today = 0;
      let totalDuration = 0;
      let durationCount = 0;
      let totalScroll = 0;
      let scrollCount = 0;
      let bounceCount = 0;
      const todayStr = new Date().toISOString().slice(0, 10);

      all.forEach((v: any) => {
        if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
        if (v.browser) browsers[v.browser] = (browsers[v.browser] || 0) + 1;
        if (v.device_type) devices[v.device_type] = (devices[v.device_type] || 0) + 1;
        if (v.os) oses[v.os] = (oses[v.os] || 0) + 1;
        if (v.is_returning) returning++;
        if (v.created_at?.startsWith(todayStr)) today++;
        if (v.session_duration_seconds > 0) {
          totalDuration += v.session_duration_seconds;
          durationCount++;
        }
        if (v.max_scroll_depth > 0) {
          totalScroll += v.max_scroll_depth;
          scrollCount++;
        }
        if (v.bounce) bounceCount++;
        if (v.utm_source) utmSources[v.utm_source] = (utmSources[v.utm_source] || 0) + 1;
        if (v.pages_visited && Array.isArray(v.pages_visited)) {
          v.pages_visited.forEach((p: string) => {
            topPages[p] = (topPages[p] || 0) + 1;
          });
        }
      });

      return {
        countries: Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 10),
        browsers: Object.entries(browsers).sort((a, b) => b[1] - a[1]),
        devices: Object.entries(devices).sort((a, b) => b[1] - a[1]),
        oses: Object.entries(oses).sort((a, b) => b[1] - a[1]),
        utmSources: Object.entries(utmSources).sort((a, b) => b[1] - a[1]).slice(0, 10),
        topPages: Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 10),
        returningRate: all.length ? Math.round((returning / all.length) * 100) : 0,
        bounceRate: all.length ? Math.round((bounceCount / all.length) * 100) : 0,
        avgDuration: durationCount ? Math.round(totalDuration / durationCount) : 0,
        avgScroll: scrollCount ? Math.round(totalScroll / scrollCount) : 0,
        todayVisits: today,
        total: all.length,
      };
    },
  });

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} ثانية`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} د ${secs} ث`;
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                تحليلات الزوار
              </h1>
              <p className="text-xs text-muted-foreground">مراقبة وتحليل بيانات زوار المنصة</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-1" /> تحديث
          </Button>
        </div>

        {/* KPI Cards - 2 rows */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الزيارات', value: counter?.total_visits || 0, icon: Eye, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'زائر فريد', value: counter?.unique_visitors || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'زيارات اليوم', value: analytics?.todayVisits || 0, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'نسبة العودة', value: `${analytics?.returningRate || 0}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'متوسط المدة', value: formatDuration(analytics?.avgDuration || 0), icon: Timer, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'متوسط التمرير', value: `${analytics?.avgScroll || 0}%`, icon: ArrowDownToLine, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { label: 'معدل الارتداد', value: `${analytics?.bounceRate || 0}%`, icon: MousePointerClick, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'صفحات مُتصفَّحة', value: analytics?.topPages?.length || 0, icon: Route, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black truncate">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('ar-EG') : kpi.value}</p>
                  <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="engagement">التفاعل</TabsTrigger>
            <TabsTrigger value="visitors">سجل الزوار</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Countries */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" /> الدول الأكثر زيارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.countries?.map(([country, count]: [string, number]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="text-sm">{country}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(count / (analytics?.total || 1)) * 100}%` }}
                            />
                          </div>
                          <Badge variant="outline" className="text-[10px]">{count}</Badge>
                        </div>
                      </div>
                    )) || <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Browsers */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Chrome className="w-4 h-4 text-primary" /> المتصفحات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.browsers?.map(([browser, count]: [string, number]) => (
                      <div key={browser} className="flex items-center justify-between">
                        <span className="text-sm">{browser}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    )) || <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Devices */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" /> الأجهزة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.devices?.map(([device, count]: [string, number]) => (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {deviceIcon(device)}
                          <span className="text-sm capitalize">{device === 'mobile' ? 'هاتف' : device === 'tablet' ? 'تابلت' : 'كمبيوتر'}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    )) || <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
                  </div>
                </CardContent>
              </Card>

              {/* OS */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> أنظمة التشغيل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.oses?.map(([os, count]: [string, number]) => (
                      <div key={os} className="flex items-center justify-between">
                        <span className="text-sm">{os}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    )) || <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Top Pages */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Route className="w-4 h-4 text-primary" /> الصفحات الأكثر زيارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.topPages?.length ? analytics.topPages.map(([page, count]: [string, number]) => (
                      <div key={page} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[200px] font-mono text-xs" dir="ltr">{page}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(count / (analytics.topPages[0]?.[1] || 1)) * 100}%` }}
                            />
                          </div>
                          <Badge variant="outline" className="text-[10px]">{count}</Badge>
                        </div>
                      </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>}
                  </div>
                </CardContent>
              </Card>

              {/* UTM Sources */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-primary" /> مصادر الحملات (UTM)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics?.utmSources?.length ? analytics.utmSources.map(([source, count]: [string, number]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm">{source}</span>
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      </div>
                    )) : <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات UTM بعد — أضف ?utm_source=... لروابطك</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Scroll Depth Distribution */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4 text-primary" /> ملخص التفاعل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-black text-primary">{formatDuration(analytics?.avgDuration || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">متوسط مدة الجلسة</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-black text-cyan-500">{analytics?.avgScroll || 0}%</p>
                      <p className="text-xs text-muted-foreground mt-1">متوسط عمق التمرير</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-black text-red-500">{analytics?.bounceRate || 0}%</p>
                      <p className="text-xs text-muted-foreground mt-1">معدل الارتداد</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visitors Tab */}
          <TabsContent value="visitors" className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالـ IP أو الدولة أو المدينة أو المتصفح..."
                className="pr-9"
              />
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</p>
                ) : visitors.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات</p>
                ) : (
                  visitors.map((v: any) => (
                    <Card key={v.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {deviceIcon(v.device_type || 'desktop')}
                              <span className="text-sm font-semibold">{v.browser || 'غير معروف'}</span>
                              <span className="text-xs text-muted-foreground">({v.os})</span>
                              {v.is_returning && <Badge className="text-[9px] h-4">عائد</Badge>}
                              {v.bounce === false && <Badge variant="outline" className="text-[9px] h-4 text-emerald-600">متفاعل</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[v.city, v.country].filter(Boolean).join(', ') || 'غير محدد'}
                              </span>
                              <span>IP: {v.ip_address || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span>الشاشة: {v.screen_resolution || '—'}</span>
                              <span>اللغة: {v.language || '—'}</span>
                              <span>الزيارة #{v.visit_count}</span>
                              {v.session_duration_seconds > 0 && (
                                <span className="text-primary font-medium">⏱ {formatDuration(v.session_duration_seconds)}</span>
                              )}
                              {v.max_scroll_depth > 0 && (
                                <span className="text-cyan-600 font-medium">↓ {v.max_scroll_depth}%</span>
                              )}
                            </div>
                            {v.utm_source && (
                              <p className="text-[10px] text-purple-600">
                                📢 UTM: {v.utm_source}{v.utm_medium ? ` / ${v.utm_medium}` : ''}{v.utm_campaign ? ` / ${v.utm_campaign}` : ''}
                              </p>
                            )}
                            {v.referrer && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-md">
                                المصدر: {v.referrer}
                              </p>
                            )}
                          </div>
                          <div className="text-left shrink-0">
                            <span className="text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3 inline ml-1" />
                              {format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VisitorAnalytics;
