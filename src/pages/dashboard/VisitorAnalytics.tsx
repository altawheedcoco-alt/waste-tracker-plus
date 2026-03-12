import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BackButton from '@/components/ui/back-button';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye, Users, Monitor, Smartphone, Tablet,
  MapPin, Clock, ArrowRight, Search, RefreshCw,
  TrendingUp, Activity, Timer, ArrowDownToLine,
  MousePointerClick, Route
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useVisitorAnalyticsData, formatDuration, type VisitorRecord } from '@/hooks/useVisitorAnalyticsData';
import VisitorGeographicTab from '@/components/analytics/VisitorGeographicTab';
import VisitorTechnologyTab from '@/components/analytics/VisitorTechnologyTab';
import VisitorTemporalTab from '@/components/analytics/VisitorTemporalTab';
import VisitorEngagementTab from '@/components/analytics/VisitorEngagementTab';
import VisitorSourcesTab from '@/components/analytics/VisitorSourcesTab';

const VisitorAnalytics = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('overview');

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

  const { data: allVisitors = [], isLoading, refetch } = useQuery({
    queryKey: ['visitor-tracking-all'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('visitor_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      return (data || []) as VisitorRecord[];
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['visitor-tracking-search', search],
    queryFn: async () => {
      if (!search) return allVisitors;
      const { data } = await (supabase as any)
        .from('visitor_tracking')
        .select('*')
        .or(`ip_address.ilike.%${search}%,country.ilike.%${search}%,city.ilike.%${search}%,browser.ilike.%${search}%`)
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []) as VisitorRecord[];
    },
    enabled: !!search,
  });

  const visitors = search ? searchResults : allVisitors;
  const analytics = useVisitorAnalyticsData(allVisitors);

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
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
                تحليلات الزوار المتقدمة
              </h1>
              <p className="text-xs text-muted-foreground">مراقبة وتحليل سلوك زوار المنصة بتفصيل عميق</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-1" /> تحديث
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي الزيارات', value: counter?.total_visits || 0, icon: Eye, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'زائر فريد', value: counter?.unique_visitors || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'زيارات اليوم', value: analytics.todayVisits, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'نسبة العودة', value: `${analytics.returningRate}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'متوسط المدة', value: formatDuration(analytics.avgDuration), icon: Timer, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'متوسط التمرير', value: `${analytics.avgScroll}%`, icon: ArrowDownToLine, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { label: 'معدل الارتداد', value: `${analytics.bounceRate}%`, icon: MousePointerClick, color: 'text-destructive', bg: 'bg-destructive/10' },
            { label: 'صفحات/جلسة', value: analytics.avgPagesPerSession, icon: Route, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
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

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">📊 نظرة عامة</TabsTrigger>
            <TabsTrigger value="geographic">🌍 جغرافي</TabsTrigger>
            <TabsTrigger value="temporal">⏰ زمني</TabsTrigger>
            <TabsTrigger value="engagement">💡 التفاعل</TabsTrigger>
            <TabsTrigger value="technology">💻 التقنية</TabsTrigger>
            <TabsTrigger value="sources">📢 المصادر</TabsTrigger>
            <TabsTrigger value="visitors">📋 السجل</TabsTrigger>
          </TabsList>

          {/* Overview - combined summary */}
          <TabsContent value="overview" className="space-y-4">
            <VisitorTemporalTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="geographic">
            <VisitorGeographicTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="temporal">
            <VisitorTemporalTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="engagement">
            <VisitorEngagementTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="technology">
            <VisitorTechnologyTab analytics={analytics} />
          </TabsContent>

          <TabsContent value="sources">
            <VisitorSourcesTab analytics={analytics} />
          </TabsContent>

          {/* Visitors Log */}
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
                            <div className="flex items-center gap-2 flex-wrap">
                              {deviceIcon(v.device_type || 'desktop')}
                              <span className="text-sm font-semibold">{v.browser || 'غير معروف'}</span>
                              <span className="text-xs text-muted-foreground">({v.os})</span>
                              {v.is_returning && <Badge className="text-[9px] h-4">عائد</Badge>}
                              {v.bounce === false && <Badge variant="outline" className="text-[9px] h-4 border-emerald-500 text-emerald-600">متفاعل</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {[v.city, v.region, v.country].filter(Boolean).join(', ') || 'غير محدد'}
                              </span>
                              <span>IP: {v.ip_address || '—'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                              <span>الشاشة: {v.screen_resolution || '—'}</span>
                              <span>اللغة: {v.language || '—'}</span>
                              <span>الزيارة #{v.visit_count}</span>
                              {v.session_duration_seconds > 0 && (
                                <span className="text-primary font-medium">⏱ {formatDuration(v.session_duration_seconds)}</span>
                              )}
                              {v.max_scroll_depth > 0 && (
                                <span className="font-medium">↓ {v.max_scroll_depth}%</span>
                              )}
                            </div>
                            {v.pages_visited && v.pages_visited.length > 0 && (
                              <p className="text-[10px] text-muted-foreground">
                                📄 مسار: {v.pages_visited.slice(0, 5).join(' → ')}{v.pages_visited.length > 5 ? ` (+${v.pages_visited.length - 5})` : ''}
                              </p>
                            )}
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
