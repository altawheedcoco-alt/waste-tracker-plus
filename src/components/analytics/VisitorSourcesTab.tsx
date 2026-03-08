import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, Megaphone, Tag, Target } from 'lucide-react';
import { AnalyticsData } from '@/hooks/useVisitorAnalyticsData';

interface Props {
  analytics: AnalyticsData;
}

const EmptyState = ({ text = 'لا توجد بيانات بعد' }: { text?: string }) => (
  <p className="text-xs text-muted-foreground text-center py-6">{text}</p>
);

const VisitorSourcesTab = ({ analytics }: Props) => {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Referrers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" /> مصادر الإحالة (Referrers)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.referrers.length ? analytics.referrers.map(([host, count]) => {
                const maxRef = analytics.referrers[0]?.[1] || 1;
                return (
                  <div key={host} className="flex items-center gap-2">
                    <span className="text-xs truncate min-w-0 flex-1" dir="ltr">{host}</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / maxRef) * 100}%` }} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{count}</Badge>
                  </div>
                );
              }) : <EmptyState text="معظم الزوار يأتون مباشرة" />}
            </div>
          </CardContent>
        </Card>

        {/* UTM Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" /> UTM Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.utmSources.length ? analytics.utmSources.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm">{source}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              )) : <EmptyState text="لا توجد بيانات UTM — أضف ?utm_source=... لروابطك" />}
            </div>
          </CardContent>
        </Card>

        {/* UTM Medium */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> UTM Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.utmMediums.length ? analytics.utmMediums.map(([medium, count]) => (
                <div key={medium} className="flex items-center justify-between">
                  <span className="text-sm">{medium}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>

        {/* UTM Campaign */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> UTM Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.utmCampaigns.length ? analytics.utmCampaigns.map(([campaign, count]) => (
                <div key={campaign} className="flex items-center justify-between">
                  <span className="text-sm">{campaign}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              )) : <EmptyState />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitorSourcesTab;
