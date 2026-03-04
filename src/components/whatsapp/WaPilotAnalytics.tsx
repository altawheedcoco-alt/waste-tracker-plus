import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Activity, Target, Zap } from 'lucide-react';

interface MessageLog {
  id: string;
  status: string;
  direction: string;
  message_type: string;
  created_at: string;
  organization_id: string;
}

interface OrgInfo {
  id: string;
  name: string;
  organization_type: string;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  generator: 'مولّد', transporter: 'ناقل', recycler: 'مدوّر',
  disposal: 'تخلص', consultant: 'استشاري', consulting_office: 'مكتب استشاري', iso_body: 'اعتماد',
};

const WaPilotAnalytics = ({ messages, orgs }: { messages: MessageLog[]; orgs: OrgInfo[] }) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const today = messages.filter(m => new Date(m.created_at).toDateString() === now.toDateString());
    const week = messages.filter(m => (now.getTime() - new Date(m.created_at).getTime()) < 7 * 86400000);
    const month = messages.filter(m => (now.getTime() - new Date(m.created_at).getTime()) < 30 * 86400000);

    const deliveryRate = messages.length > 0
      ? Math.round((messages.filter(m => m.status === 'sent' || m.status === 'delivered').length / messages.length) * 100)
      : 0;

    // Messages by org type
    const orgMap = new Map(orgs.map(o => [o.id, o]));
    const byOrgType: Record<string, number> = {};
    messages.forEach(m => {
      const org = orgMap.get(m.organization_id);
      const type = org?.organization_type || 'unknown';
      byOrgType[type] = (byOrgType[type] || 0) + 1;
    });

    // Messages by type
    const byMsgType: Record<string, number> = {};
    messages.forEach(m => { byMsgType[m.message_type] = (byMsgType[m.message_type] || 0) + 1; });

    // Daily trend (last 7 days)
    const dailyTrend: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const count = messages.filter(m => new Date(m.created_at).toDateString() === d.toDateString()).length;
      dailyTrend.push({ day: dayStr, count });
    }

    // Top orgs by messages
    const orgMsgCount: Record<string, number> = {};
    messages.forEach(m => {
      if (m.organization_id) orgMsgCount[m.organization_id] = (orgMsgCount[m.organization_id] || 0) + 1;
    });
    const topOrgs = Object.entries(orgMsgCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ org: orgMap.get(id), count }));

    // Failure analysis
    const failedMsgs = messages.filter(m => m.status === 'failed');
    const failureRate = messages.length > 0 ? Math.round((failedMsgs.length / messages.length) * 100) : 0;

    return { today, week, month, deliveryRate, byOrgType, byMsgType, dailyTrend, topOrgs, failureRate, failedMsgs };
  }, [messages, orgs]);

  const maxDailyCount = Math.max(...analytics.dailyTrend.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <Activity className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{analytics.today.length}</div>
          <p className="text-xs text-muted-foreground">اليوم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{analytics.week.length}</div>
          <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold">{analytics.month.length}</div>
          <p className="text-xs text-muted-foreground">هذا الشهر</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <div className="text-2xl font-bold text-green-600">{analytics.deliveryRate}%</div>
          <p className="text-xs text-muted-foreground">نسبة التسليم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <div className="text-2xl font-bold text-destructive">{analytics.failureRate}%</div>
          <p className="text-xs text-muted-foreground">نسبة الفشل</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Trend Chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">الاتجاه اليومي (آخر 7 أيام)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {analytics.dailyTrend.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium">{d.count}</span>
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all"
                    style={{ height: `${Math.max((d.count / maxDailyCount) * 100, 4)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages by Org Type */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">التوزيع حسب نوع الجهة</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.byOrgType).sort(([, a], [, b]) => b - a).map(([type, count]) => {
                const pct = Math.round((count / messages.length) * 100);
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{ORG_TYPE_LABELS[type] || type}</span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Messages by Type */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">أنواع الرسائل</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analytics.byMsgType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs gap-1">
                  {type} <span className="font-bold">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Organizations */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Zap className="h-4 w-4" />أكثر الجهات نشاطاً</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topOrgs.map(({ org, count }, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary w-5">{i + 1}</span>
                    <span>{org?.name || 'غير معروف'}</span>
                  </div>
                  <Badge>{count}</Badge>
                </div>
              ))}
              {analytics.topOrgs.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">لا توجد بيانات</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaPilotAnalytics;
