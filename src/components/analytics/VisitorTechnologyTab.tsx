import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chrome, Monitor, Smartphone, Tablet, Cpu, MonitorSmartphone, Languages } from 'lucide-react';
import { AnalyticsData, formatDuration } from '@/hooks/useVisitorAnalyticsData';

interface Props {
  analytics: AnalyticsData;
}

const EmptyState = () => <p className="text-xs text-muted-foreground text-center py-6">لا توجد بيانات</p>;

const deviceLabel = (d: string) => d === 'mobile' ? 'هاتف' : d === 'tablet' ? 'تابلت' : 'كمبيوتر';
const DeviceIcon = ({ type }: { type: string }) => {
  if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (type === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
};

const VisitorTechnologyTab = ({ analytics }: Props) => {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Browsers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Chrome className="w-4 h-4 text-primary" /> المتصفحات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.browsers.length ? analytics.browsers.map(([name, count]) => {
                const dur = analytics.browserDurations[name];
                const avgDur = dur ? Math.round(dur.total / dur.count) : 0;
                return (
                  <div key={name} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{name}</span>
                      {avgDur > 0 && <span className="text-[10px] text-muted-foreground mr-2">({formatDuration(avgDur)} متوسط)</span>}
                    </div>
                    <Badge variant="secondary" className="text-xs">{count}</Badge>
                  </div>
                );
              }) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* OS */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" /> أنظمة التشغيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.oses.length ? analytics.oses.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm">{name}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Devices with bounce rates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MonitorSmartphone className="w-4 h-4 text-primary" /> الأجهزة ومعدل الارتداد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.devices.length ? analytics.devices.map(([device, count]) => {
                const br = analytics.deviceBounceRates[device];
                const bounceRate = br ? Math.round((br.bounced / br.total) * 100) : 0;
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DeviceIcon type={device} />
                      <span className="text-sm">{deviceLabel(device)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">ارتداد {bounceRate}%</span>
                      <Badge variant="secondary" className="text-xs">{count}</Badge>
                    </div>
                  </div>
                );
              }) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Screen Resolutions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" /> دقة الشاشة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {analytics.screenResolutions.length ? analytics.screenResolutions.map(([res, count]) => (
                <div key={res} className="flex items-center justify-between">
                  <span className="text-xs font-mono" dir="ltr">{res}</span>
                  <Badge variant="outline" className="text-[10px]">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" /> اللغات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.languages.length ? analytics.languages.map(([lang, count]) => (
                <Badge key={lang} variant="outline" className="text-xs px-3 py-1.5">
                  {lang} <span className="mr-1 text-muted-foreground">({count})</span>
                </Badge>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorTechnologyTab;
