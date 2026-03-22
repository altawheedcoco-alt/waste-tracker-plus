/**
 * لوحة عقود التأجير للسائق المؤجر
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, Building2, Loader2, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface HiredContractsPanelProps {
  driverId: string;
}

const CONTRACT_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'نشط', variant: 'default' },
  draft: { label: 'مسودة', variant: 'secondary' },
  completed: { label: 'مكتمل', variant: 'outline' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
  expired: { label: 'منتهي', variant: 'secondary' },
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  per_trip: 'بالرحلة',
  hourly: 'بالساعة',
  daily: 'يومي',
  weekly: 'أسبوعي',
  monthly: 'شهري',
};

const HiredContractsPanel = ({ driverId }: HiredContractsPanelProps) => {
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['driver-hire-contracts', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_hire_contracts')
        .select('*, hiring_org:hiring_org_id(name)')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="font-semibold text-sm mb-1">لا توجد عقود حالياً</h3>
          <p className="text-xs text-muted-foreground">
            العقود اختيارية — يمكنك العمل كسائق مؤجر حر بدون عقود رسمية.
            <br />
            ستظهر هنا العقود إن تم الاتفاق مع جهة نقل على عقد محدد.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-amber-500" />
        عقود التأجير ({contracts.length})
      </h3>

      {contracts.map((contract: any) => {
        const statusConfig = CONTRACT_STATUS_MAP[contract.status] || CONTRACT_STATUS_MAP.draft;
        return (
          <Card key={contract.id} className="border border-border/50">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {(contract.hiring_org as any)?.name || 'جهة غير محددة'}
                  </span>
                </div>
                <Badge variant={statusConfig.variant} className="text-[10px]">
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  من: {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: ar })}
                </div>
                {contract.end_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    إلى: {format(new Date(contract.end_date), 'dd MMM yyyy', { locale: ar })}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {CONTRACT_TYPE_LABELS[contract.contract_type] || contract.contract_type}
                </div>
                <div className="flex items-center gap-1">
                  <Banknote className="w-3 h-3" />
                  {contract.agreed_rate} ج.م
                </div>
              </div>

              {contract.status === 'active' && (
                <div className="flex justify-between items-center pt-1 border-t border-border/30 text-xs">
                  <span>رحلات مكتملة: <strong>{contract.total_trips_completed}</strong></span>
                  <span>أرباح: <strong className="text-primary">{contract.total_earnings} ج.م</strong></span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default HiredContractsPanel;
