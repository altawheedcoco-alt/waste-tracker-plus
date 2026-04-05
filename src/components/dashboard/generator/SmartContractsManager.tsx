/**
 * مدير العقود الذكية - عرض وإدارة العقود مع الناقلين والمدورين
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

const SmartContractsManager = () => {
  const { organization } = useAuth();

  const { data: contracts = [] } = useQuery({
    queryKey: ['generator-contracts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('organization_contracts')
        .select('*, partner:partner_organization_id(name, type)')
        .eq('organization_id', organization.id)
        .order('end_date', { ascending: true });
      return data || [];
    },
    enabled: !!organization?.id,
  });

  const stats = useMemo(() => {
    const now = new Date();
    const active = contracts.filter((c: any) => c.status === 'active' && new Date(c.end_date) > now).length;
    const expiringSoon = contracts.filter((c: any) => {
      const end = new Date(c.end_date);
      return c.status === 'active' && end > now && end.getTime() - now.getTime() < 30 * 86400000;
    }).length;
    const expired = contracts.filter((c: any) => c.status === 'expired' || new Date(c.end_date) <= now).length;
    return { active, expiringSoon, expired, total: contracts.length };
  }, [contracts]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 justify-end">
          <FileText className="h-4 w-4 text-primary" />
          العقود الذكية
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        {stats.total === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">لا توجد عقود مسجلة</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                <p className="text-sm font-bold text-green-600">{stats.active}</p>
                <p className="text-[10px] text-muted-foreground">سارية</p>
              </div>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                <Clock className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                <p className="text-sm font-bold text-amber-600">{stats.expiringSoon}</p>
                <p className="text-[10px] text-muted-foreground">تنتهي قريباً</p>
              </div>
              <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                <p className="text-sm font-bold text-red-600">{stats.expired}</p>
                <p className="text-[10px] text-muted-foreground">منتهية</p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {contracts.slice(0, 5).map((c: any) => {
                const end = new Date(c.end_date);
                const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
                const isExpiring = daysLeft > 0 && daysLeft <= 30;
                const isExpired = daysLeft <= 0;

                return (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
                    <div className="flex items-center gap-1">
                      <Badge variant={isExpired ? 'destructive' : isExpiring ? 'default' : 'secondary'} className="text-[10px]">
                        {isExpired ? 'منتهي' : isExpiring ? `${daysLeft} يوم` : 'ساري'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium">{c.partner?.name || c.contract_type || 'عقد'}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Calendar className="h-2.5 w-2.5" />
                        {end.toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartContractsManager;
