import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, MapPin, Map } from 'lucide-react';
import { AnalyticsData } from '@/hooks/useVisitorAnalyticsData';

interface Props {
  analytics: AnalyticsData;
}

const BarItem = ({ label, count, maxCount, color = 'bg-primary' }: { label: string; count: number; maxCount: number; color?: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm truncate min-w-0 flex-1">{label}</span>
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${maxCount ? (count / maxCount) * 100 : 0}%` }} />
      </div>
      <Badge variant="outline" className="text-[10px] min-w-[32px] justify-center">{count}</Badge>
    </div>
  </div>
);

const EmptyState = ({ text = 'لا توجد بيانات' }: { text?: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{text}</p>
);

const VisitorGeographicTab = ({ analytics }: Props) => {
  const maxCountry = analytics.countries[0]?.[1] || 1;
  const maxCity = analytics.cities[0]?.[1] || 1;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Countries */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> الدول
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.countries.length ? analytics.countries.map(([name, count]) => (
                <BarItem key={name} label={name} count={count} maxCount={maxCountry} />
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Cities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> المدن
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {analytics.cities.length ? analytics.cities.map(([name, count]) => (
                <BarItem key={name} label={name} count={count} maxCount={maxCity} color="bg-accent" />
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* Regions */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Map className="w-4 h-4 text-primary" /> المناطق / المحافظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {analytics.regions.length ? analytics.regions.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between p-2 bg-muted/40 rounded-lg">
                  <span className="text-xs truncate">{name}</span>
                  <Badge variant="secondary" className="text-[10px] ml-2">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorGeographicTab;
