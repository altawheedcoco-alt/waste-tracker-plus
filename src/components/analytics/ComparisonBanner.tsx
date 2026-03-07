import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ArrowLeftRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ComparisonBannerProps {
  organizationId: string | null;
  dateRange: { from: Date; to: Date };
}

const ComparisonBanner = ({ organizationId, dateRange }: ComparisonBannerProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['comparison-banner', organizationId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async () => {
      if (!organizationId) return null;

      const periodLen = dateRange.to.getTime() - dateRange.from.getTime();
      const prevFrom = new Date(dateRange.from.getTime() - periodLen);

      const [currentRes, prevRes, currentInvRes, prevInvRes] = await Promise.all([
        supabase
          .from('shipments')
          .select('id, quantity, status')
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('shipments')
          .select('id, quantity, status')
          .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
          .gte('created_at', prevFrom.toISOString())
          .lte('created_at', dateRange.from.toISOString()),
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('organization_id', organizationId)
          .gte('created_at', dateRange.from.toISOString())
          .lte('created_at', dateRange.to.toISOString()),
        supabase
          .from('invoices')
          .select('total_amount')
          .eq('organization_id', organizationId)
          .gte('created_at', prevFrom.toISOString())
          .lte('created_at', dateRange.from.toISOString()),
      ]);

      const curr = currentRes.data || [];
      const prev = prevRes.data || [];
      const calcChange = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

      const currQty = curr.reduce((s, sh) => s + (sh.quantity || 0), 0);
      const prevQty = prev.reduce((s, sh) => s + (sh.quantity || 0), 0);
      const currRev = (currentInvRes.data || []).reduce((s, i) => s + (i.total_amount || 0), 0);
      const prevRev = (prevInvRes.data || []).reduce((s, i) => s + (i.total_amount || 0), 0);

      return [
        { label: 'الشحنات', current: curr.length, previous: prev.length, change: calcChange(curr.length, prev.length) },
        { label: 'الكمية (كجم)', current: Math.round(currQty), previous: Math.round(prevQty), change: calcChange(currQty, prevQty) },
        { label: 'الإيرادات (ج.م)', current: Math.round(currRev), previous: Math.round(prevRev), change: calcChange(currRev, prevRev) },
      ];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Skeleton className="h-16 w-full" />;
  if (!data) return null;

  return (
    <Card className="bg-muted/30">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">مقارنة بالفترة السابقة</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {data.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-sm font-bold">{item.current.toLocaleString('en-US')}</span>
                {item.change > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                ) : item.change < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  item.change > 0 ? "text-emerald-600" : item.change < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">سابقاً: {item.previous.toLocaleString('en-US')}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonBanner;
