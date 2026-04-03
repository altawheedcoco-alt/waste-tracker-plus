/**
 * OrganizationTimeline — خط زمني تفاعلي لأحداث المنظمة
 * يعرض آخر الأنشطة والأحداث المهمة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History, Truck, FileText, Users, DollarSign, Bell,
  CheckCircle2, Plus, ArrowRight, Shield
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  type: 'shipment' | 'financial' | 'partner' | 'document' | 'system';
  title: string;
  description: string;
  timestamp: string;
  icon: typeof Truck;
  color: string;
}

const typeConfig = {
  shipment: { icon: Truck, color: 'bg-blue-500' },
  financial: { icon: DollarSign, color: 'bg-emerald-500' },
  partner: { icon: Users, color: 'bg-purple-500' },
  document: { icon: FileText, color: 'bg-amber-500' },
  system: { icon: Shield, color: 'bg-muted-foreground' },
};

export default function OrganizationTimeline() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const { data: events, isLoading } = useQuery({
    queryKey: ['org-timeline', orgId],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!orgId) return [];

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [shipmentsRes, ledgerRes] = await Promise.all([
        supabase.from('shipments')
          .select('id, status, waste_type, quantity, unit, created_at')
          .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase.from('accounting_ledger')
          .select('id, entry_type, amount, description, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const events: TimelineEvent[] = [];

      (shipmentsRes.data || []).forEach(s => {
        const tons = s.unit === 'kg' ? (s.quantity || 0) / 1000 : (s.quantity || 0);
        const statusMap: Record<string, string> = {
          new: 'شحنة جديدة',
          approved: 'تمت الموافقة',
          collecting: 'جاري التجميع',
          in_transit: 'في الطريق',
          delivered: 'تم التسليم',
          confirmed: 'تم التأكيد',
        };
        events.push({
          id: `s-${s.id}`,
          type: 'shipment',
          title: statusMap[s.status] || s.status,
          description: `${s.waste_type || 'مخلفات'} - ${Math.round(tons * 10) / 10} طن`,
          timestamp: s.created_at,
          icon: s.status === 'confirmed' ? CheckCircle2 : Truck,
          color: typeConfig.shipment.color,
        });
      });

      (ledgerRes.data || []).forEach(l => {
        events.push({
          id: `l-${l.id}`,
          type: 'financial',
          title: l.entry_type === 'credit' ? 'إيراد' : 'مصروف',
          description: `${l.amount.toLocaleString()} ج.م${l.description ? ` - ${l.description}` : ''}`,
          timestamp: l.created_at,
          icon: DollarSign,
          color: typeConfig.financial.color,
        });
      });

      return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-5 w-5 text-primary" />
          الخط الزمني
          <Badge variant="secondary" className="text-[10px] mr-auto">آخر 7 أيام</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[380px] px-4 pb-4">
          {isLoading ? (
            <div className="space-y-4">{Array(6).fill(0).map((_, i) => <div key={i} className="h-14 bg-muted/30 rounded animate-pulse" />)}</div>
          ) : !events?.length ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
              لا توجد أحداث حديثة
            </div>
          ) : (
            <div className="relative pr-4">
              {/* Vertical line */}
              <div className="absolute right-[7px] top-2 bottom-2 w-px bg-border" />

              {events.map((event, idx) => {
                const Icon = event.icon;
                return (
                  <div key={event.id} className="relative flex gap-3 pb-4">
                    {/* Dot */}
                    <div className={`relative z-10 w-4 h-4 rounded-full ${event.color} flex items-center justify-center shrink-0 mt-1`}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{event.title}</span>
                        <span className="text-[10px] text-muted-foreground mr-auto">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: ar })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
