/**
 * لوحة محفظة العملاء — خاص بالاستشاريين والمكاتب الاستشارية
 * يعرض ملخص العملاء والمشاريع النشطة
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, TrendingUp, FileCheck, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ClientPortfolioWidget = () => {
  const { organization } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['client-portfolio', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // جلب الشراكات النشطة
      const { data: partnerships } = await supabase
        .from('verified_partnerships')
        .select('id, requester_org_id, partner_org_id, created_at')
        .or(`requester_org_id.eq.${organization.id},partner_org_id.eq.${organization.id}`)
        .eq('status', 'active');

      const clientIds = (partnerships || []).map(p =>
        p.requester_org_id === organization.id ? p.partner_org_id : p.requester_org_id
      ).filter(Boolean);

      let clients: any[] = [];
      if (clientIds.length > 0) {
        const { data } = await supabase
          .from('organizations')
          .select('id, name, organization_type, city')
          .in('id', clientIds)
          .eq('is_active', true)
          .limit(20);
        clients = data || [];
      }

      // تصنيف العملاء حسب النوع
      const typeCount = new Map<string, number>();
      clients.forEach(c => {
        const type = c.organization_type || 'other';
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
      });

      const typeLabels: Record<string, string> = {
        generator: 'مولد',
        transporter: 'ناقل',
        recycler: 'مدور',
        disposal: 'تخلص',
        other: 'أخرى',
      };

      return {
        totalClients: clients.length,
        clientsByType: Array.from(typeCount.entries()).map(([type, count]) => ({
          type: typeLabels[type] || type,
          count,
        })),
        recentClients: clients.slice(0, 4),
        newThisMonth: (partnerships || []).filter(p =>
          new Date(p.created_at).getMonth() === new Date().getMonth()
        ).length,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          محفظة العملاء
          {stats && (
            <Badge className="text-[10px] mr-auto">{stats.totalClients} عميل</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!stats || stats.totalClients === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا توجد عملاء مرتبطين بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* ملخص الأرقام */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-primary/5 text-center">
                <div className="text-xl font-bold text-primary">{stats.totalClients}</div>
                <p className="text-[10px] text-muted-foreground">إجمالي العملاء</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 text-center">
                <div className="text-xl font-bold flex items-center justify-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  {stats.newThisMonth}
                </div>
                <p className="text-[10px] text-muted-foreground">جديد هذا الشهر</p>
              </div>
            </div>

            {/* توزيع حسب النوع */}
            {stats.clientsByType.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {stats.clientsByType.map((ct, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1">
                    <span className="font-bold">{ct.count}</span>
                    {ct.type}
                  </Badge>
                ))}
              </div>
            )}

            {/* آخر العملاء */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">العملاء الأحدث</p>
              {stats.recentClients.map((client: any) => (
                <div key={client.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-medium truncate flex-1">{client.name}</span>
                  {client.city && (
                    <span className="text-[9px] text-muted-foreground">{client.city}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientPortfolioWidget;
