import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PartnerBalance {
  name: string;
  type: 'generator' | 'recycler';
  shipmentCount: number;
  totalQuantity: number;
  balance: number;
  orgId: string | null;
}

const TransporterPartnerSummary = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const orgId = organization?.id;

  // Fetch shipments + ledger data for partner summary
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['transporter-partner-summary', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const [shipmentsResult, ledgerResult] = await Promise.all([
        supabase
          .from('shipments')
          .select('generator_id, recycler_id, quantity, status')
          .eq('transporter_id', orgId),
        supabase
          .from('accounting_ledger')
          .select('partner_organization_id, amount, entry_type')
          .eq('organization_id', orgId)
          .not('partner_organization_id', 'is', null),
      ]);

      const shipments = shipmentsResult.data || [];
      const ledger = ledgerResult.data || [];

      // Aggregate per partner
      const partnerMap = new Map<string, PartnerBalance>();

      // Get unique org IDs
      const orgIds = new Set<string>();
      shipments.forEach(s => {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
      });

      // Fetch org names
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .in('id', Array.from(orgIds));

      const orgMap = new Map((orgs || []).map(o => [o.id, o]));

      // Count shipments per partner
      shipments.forEach(s => {
        [
          { id: s.generator_id, type: 'generator' as const },
          { id: s.recycler_id, type: 'recycler' as const },
        ].forEach(({ id, type }) => {
          if (!id || id === orgId) return;
          const org = orgMap.get(id);
          if (!partnerMap.has(id)) {
            partnerMap.set(id, {
              name: org?.name || 'غير معروف',
              type,
              shipmentCount: 0,
              totalQuantity: 0,
              balance: 0,
              orgId: id,
            });
          }
          const p = partnerMap.get(id)!;
          p.shipmentCount++;
          p.totalQuantity += s.quantity || 0;
        });
      });

      // Add ledger balances
      ledger.forEach(e => {
        if (!e.partner_organization_id) return;
        const p = partnerMap.get(e.partner_organization_id);
        if (p) {
          p.balance += e.entry_type === 'credit' ? e.amount : -e.amount;
        }
      });

      return Array.from(partnerMap.values())
        .sort((a, b) => b.shipmentCount - a.shipmentCount)
        .slice(0, 6);
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ملخص الجهات المرتبطة المالي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (partners.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/dashboard/partners')}>
            <ExternalLink className="ml-1 h-3 w-3" />
            عرض الكل
          </Button>
          <div className="text-right">
            <CardTitle className="flex items-center gap-2 justify-end text-sm sm:text-base">
              <Building2 className="w-5 h-5 text-primary" />
              ملخص الجهات المرتبطة المالي
            </CardTitle>
            <CardDescription>أرصدة وعمليات أبرز الجهات المرتبطة</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {partners.map((p) => (
            <div
              key={p.orgId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => p.orgId && navigate(`/dashboard/organization/${p.orgId}`)}
            >
              <div className="flex items-center gap-2">
                <div className="text-left">
                  <p className={`text-sm font-bold ${p.balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {p.balance.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {p.shipmentCount} شحنة
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.type === 'generator' ? 'مولد' : 'مدوّر'} • {p.totalQuantity.toLocaleString('ar-EG')} طن
                  </p>
                </div>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransporterPartnerSummary;
