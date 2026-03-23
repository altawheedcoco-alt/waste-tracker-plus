import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart, Users, Globe, Monitor, Smartphone, Tablet, Clock } from 'lucide-react';

interface ViewRow {
  id: string;
  post_id: string;
  visitor_id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

interface PostRow {
  id: string;
  title: string;
  views_count: number;
  likes_count: number;
}

const AdminPostAnalytics = () => {
  const { data: views = [] } = useQuery({
    queryKey: ['admin-post-views'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_post_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      return (data || []) as ViewRow[];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['admin-post-stats'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('platform_posts')
        .select('id, title, views_count, likes_count')
        .order('views_count', { ascending: false });
      return (data || []) as PostRow[];
    },
  });

  // إحصائيات عامة
  const totalViews = posts.reduce((s, p) => s + (p.views_count || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
  const uniqueVisitors = new Set(views.map(v => v.visitor_id)).size;
  const uniqueIPs = new Set(views.filter(v => v.ip_address && v.ip_address !== 'unknown').map(v => v.ip_address)).size;

  // توزيع الأجهزة
  const deviceCounts: Record<string, number> = {};
  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  views.forEach(v => {
    if (v.device_type) deviceCounts[v.device_type] = (deviceCounts[v.device_type] || 0) + 1;
    if (v.browser) browserCounts[v.browser] = (browserCounts[v.browser] || 0) + 1;
    if (v.os) osCounts[v.os] = (osCounts[v.os] || 0) + 1;
  });

  // أحدث الزوار
  const recentViews = views.slice(0, 20);

  // أعلى المنشورات
  const topPosts = posts.slice(0, 10);

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-3.5 h-3.5" />;
    if (type === 'tablet') return <Tablet className="w-3.5 h-3.5" />;
    return <Monitor className="w-3.5 h-3.5" />;
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) + ' ' +
      date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ملخص */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-black text-primary">{totalViews.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي المشاهدات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-black text-destructive">{totalLikes.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">إجمالي الإعجابات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-blue-600">{uniqueVisitors.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">زائر فريد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-600">{uniqueIPs.toLocaleString('ar-EG')}</p>
            <p className="text-[10px] text-muted-foreground">عنوان IP فريد</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* أعلى المنشورات */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> أعلى المنشورات مشاهدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {topPosts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="text-[10px] text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                  <span className="truncate flex-1 text-xs">{p.title}</span>
                  <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                    👁 {p.views_count}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                    ❤ {p.likes_count}
                  </Badge>
                </div>
              ))}
              {topPosts.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
            </div>
          </CardContent>
        </Card>

        {/* توزيع الأجهزة */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" /> توزيع الأجهزة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const max = Math.max(...Object.values(deviceCounts), 1);
                return (
                  <div key={type} className="flex items-center gap-2">
                    {deviceIcon(type)}
                    <span className="text-xs w-14 shrink-0 capitalize">{type}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                );
              })}
              {Object.keys(deviceCounts).length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد بيانات</p>}
            </div>

            {/* المتصفحات */}
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs font-bold mb-2">المتصفحات</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).map(([b, c]) => (
                  <Badge key={b} variant="secondary" className="text-[10px]">{b}: {c}</Badge>
                ))}
              </div>
            </div>

            {/* أنظمة التشغيل */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-bold mb-2">أنظمة التشغيل</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(osCounts).sort((a, b) => b[1] - a[1]).map(([o, c]) => (
                  <Badge key={o} variant="secondary" className="text-[10px]">{o}: {c}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* سجل أحدث المشاهدات */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> أحدث المشاهدات (آخر 20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-right py-2 px-1">الوقت</th>
                  <th className="text-right py-2 px-1">معرف الزائر</th>
                  <th className="text-right py-2 px-1">IP</th>
                  <th className="text-right py-2 px-1">الجهاز</th>
                  <th className="text-right py-2 px-1">المتصفح</th>
                  <th className="text-right py-2 px-1">النظام</th>
                </tr>
              </thead>
              <tbody>
                {recentViews.map(v => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-1.5 px-1 whitespace-nowrap">{formatTime(v.created_at)}</td>
                    <td className="py-1.5 px-1 font-mono text-[10px] max-w-[100px] truncate" dir="ltr">{v.visitor_id?.slice(0, 12)}...</td>
                    <td className="py-1.5 px-1 font-mono text-[10px]" dir="ltr">{v.ip_address || '—'}</td>
                    <td className="py-1.5 px-1">
                      <span className="flex items-center gap-1">
                        {v.device_type && deviceIcon(v.device_type)}
                        {v.device_type || '—'}
                      </span>
                    </td>
                    <td className="py-1.5 px-1">{v.browser || '—'}</td>
                    <td className="py-1.5 px-1">{v.os || '—'}</td>
                  </tr>
                ))}
                {recentViews.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-6 text-muted-foreground">لا توجد مشاهدات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPostAnalytics;
