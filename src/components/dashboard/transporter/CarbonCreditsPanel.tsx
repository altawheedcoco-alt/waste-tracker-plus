import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, TrendingUp, DollarSign, Award, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const CarbonCreditsPanel = () => {
  const { organization } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);

  const { data: credits = [], refetch } = useQuery({
    queryKey: ['carbon-credits', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data } = await supabase
        .from('carbon_credits')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50) as any;
      return data || [];
    },
    enabled: !!organization?.id,
    refetchInterval: 60_000, // Auto-refresh every 60s
  });

  const totalCredits = credits.reduce((s: number, c: any) => s + (c.carbon_tons || 0), 0);
  const totalValueSAR = credits.reduce((s: number, c: any) => s + (c.credit_value_sar || 0), 0);
  const tradeable = credits.filter((c: any) => c.tradeable && c.status === 'verified');
  const pending = credits.filter((c: any) => c.status === 'pending');

  const calculateCredits = async () => {
    if (!organization?.id) return;
    setIsCalculating(true);
    try {
      // Fetch recent recycling shipments without credits
      const shipmentsQuery = supabase
        .from('shipments')
        .select('id, actual_weight, waste_type, status') as any;
      const { data: shipments } = await shipmentsQuery
        .eq('organization_id', organization.id)
        .eq('status', 'delivered')
        .limit(50);

      const existingIds = credits.map((c: any) => c.source_shipment_id);
      const newShipments = shipments?.filter((s: any) => !existingIds.includes(s.id) && s.actual_weight) || [];

      if (newShipments.length === 0) {
        toast.info('لا توجد شحنات جديدة لحساب أرصدة الكربون');
        setIsCalculating(false);
        return;
      }

      let created = 0;
      for (const shipment of newShipments) {
        const carbonTons = (shipment.actual_weight || 0) * 0.5; // ~0.5 ton CO2 saved per ton recycled
        const valuePerTon = 45; // ~45 SAR per carbon credit
        await (supabase.from('carbon_credits') as any).insert({
          organization_id: organization.id,
          credit_type: 'recycling',
          carbon_tons: parseFloat(carbonTons.toFixed(3)),
          credit_value_usd: parseFloat((carbonTons * 12).toFixed(2)),
          credit_value_sar: parseFloat((carbonTons * valuePerTon).toFixed(2)),
          source_shipment_id: shipment.id,
          source_description: `إعادة تدوير ${shipment.waste_type || 'مخلفات'} - ${shipment.actual_weight} طن`,
          status: 'pending',
        });
        created++;
      }

      toast.success(`تم حساب ${created} رصيد كربون جديد`);
      refetch();
    } catch {
      toast.error('خطأ في حساب أرصدة الكربون');
    } finally {
      setIsCalculating(false);
    }
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة',
    verified: 'مُعتمد',
    traded: 'تم التداول',
    expired: 'منتهي',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-600',
    verified: 'bg-emerald-500/10 text-emerald-600',
    traded: 'bg-blue-500/10 text-blue-600',
    expired: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Leaf className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
            <p className="text-2xl font-bold">{totalCredits.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">طن CO₂ مُوفَّر</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalValueSAR.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">ج.م (قيمة تقديرية)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Award className="w-6 h-6 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold">{tradeable.length}</p>
            <p className="text-xs text-muted-foreground">قابل للتداول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-xs text-muted-foreground">قيد المراجعة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Leaf className="w-5 h-5 text-emerald-500" />
            أرصدة الكربون القابلة للتداول
          </CardTitle>
          <Button onClick={calculateCredits} disabled={isCalculating} size="sm">
            {isCalculating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
            حساب أرصدة جديدة
          </Button>
        </CardHeader>
        <CardContent>
          {credits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>اضغط "حساب أرصدة جديدة" لبدء تتبع أرصدة الكربون</p>
            </div>
          ) : (
            <div className="space-y-2">
              {credits.slice(0, 20).map((credit: any) => (
                <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{credit.source_description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(credit.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-left">
                      <p className="text-sm font-bold">{credit.carbon_tons} طن</p>
                      <p className="text-xs text-muted-foreground">{credit.credit_value_sar} ج.م</p>
                    </div>
                    <Badge variant="outline" className={statusColors[credit.status]}>
                      {statusLabels[credit.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonCreditsPanel;
