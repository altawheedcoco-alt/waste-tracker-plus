import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Timer, ArrowDownToLine, MousePointerClick, Route,
  Megaphone, LogOut, FileText, Users
} from 'lucide-react';
import { AnalyticsData, formatDuration } from '@/hooks/useVisitorAnalyticsData';

interface Props {
  analytics: AnalyticsData;
}

const EmptyState = ({ text = 'لا توجد بيانات بعد' }: { text?: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{text}</p>
);

const VisitorEngagementTab = ({ analytics }: Props) => {
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black text-primary">{formatDuration(analytics.avgDuration)}</p>
            <p className="text-[10px] text-muted-foreground">متوسط المدة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ArrowDownToLine className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black text-primary">{analytics.avgScroll}%</p>
            <p className="text-[10px] text-muted-foreground">متوسط التمرير</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MousePointerClick className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-lg font-black text-destructive">{analytics.bounceRate}%</p>
            <p className="text-[10px] text-muted-foreground">معدل الارتداد</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-black text-primary">{analytics.avgPagesPerSession}</p>
            <p className="text-[10px] text-muted-foreground">صفحات/جلسة</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Duration Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" /> توزيع مدة الجلسات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.durationBuckets.map(({ label, count }) => {
                const maxBucket = Math.max(...analytics.durationBuckets.map(b => b.count), 1);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs w-20 shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${(count / maxBucket) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scroll Depth Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-primary" /> توزيع عمق التمرير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.scrollDepthBuckets.map(({ label, count }) => {
                const maxBucket = Math.max(...analytics.scrollDepthBuckets.map(b => b.count), 1);
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs w-16 shrink-0">{label}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full"
                        style={{ width: `${(count / maxBucket) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* New vs Returning */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> جدد مقابل عائدين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-2xl font-black text-primary">{analytics.newVsReturning.new}</p>
                <p className="text-[10px] text-muted-foreground">زائر جديد</p>
              </div>
              <div className="flex-1 p-3 bg-accent/30 rounded-lg text-center">
                <p className="text-2xl font-black text-accent-foreground">{analytics.newVsReturning.returning}</p>
                <p className="text-[10px] text-muted-foreground">زائر عائد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exit Pages */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <LogOut className="w-4 h-4 text-primary" /> صفحات الخروج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.exitPages.length ? analytics.exitPages.map(([page, count]) => (
                <div key={page} className="flex items-center justify-between">
                  <span className="text-xs font-mono truncate max-w-[180px]" dir="ltr">{page}</span>
                  <Badge variant="outline" className="text-[10px]">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="w-4 h-4 text-primary" /> الصفحات الأكثر زيارة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {analytics.topPages.length ? analytics.topPages.map(([page, count], i) => {
                const maxPage = analytics.topPages[0]?.[1] || 1;
                return (
                  <div key={page} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                    <span className="text-xs font-mono truncate min-w-0 flex-1" dir="ltr">{page}</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / maxPage) * 100}%` }} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                );
              }) : <EmptyState />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorEngagementTab;
