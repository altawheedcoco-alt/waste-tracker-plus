import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Truck, Recycle, Star, Phone, MapPin, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const GeneratorPartnersHub = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['generator-partners', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get unique partner org IDs from shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('transporter_id, recycler_id')
        .eq('generator_id', organization.id)
        .not('transporter_id', 'is', null);

      if (!shipments?.length) return [];

      const partnerIds = [...new Set([
        ...shipments.map(s => s.transporter_id).filter(Boolean),
        ...shipments.map(s => s.recycler_id).filter(Boolean),
      ])] as string[];

      if (!partnerIds.length) return [];

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, phone, email, address')
        .in('id', partnerIds);

      // Count shipments per partner
      const partnerStats = partnerIds.map(pid => {
        const count = shipments.filter(s => s.transporter_id === pid || s.recycler_id === pid).length;
        return { id: pid, shipmentCount: count };
      });

      return (orgs || []).map(org => ({
        ...org,
        shipmentCount: partnerStats.find(p => p.id === org.id)?.shipmentCount || 0,
      })).sort((a, b) => b.shipmentCount - a.shipmentCount);
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const transporters = partners.filter(p => p.organization_type === 'transporter');
  const recyclers = partners.filter(p => p.organization_type === 'recycler');

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'إجمالي الشركاء' : 'Total Partners', value: partners.length, icon: Building2, color: 'text-primary' },
          { label: isAr ? 'ناقلون' : 'Transporters', value: transporters.length, icon: Truck, color: 'text-blue-500' },
          { label: isAr ? 'مدورون' : 'Recyclers', value: recyclers.length, icon: Recycle, color: 'text-emerald-500' },
          { label: isAr ? 'شحنات مشتركة' : 'Joint Shipments', value: partners.reduce((s, p) => s + p.shipmentCount, 0), icon: Package, color: 'text-amber-500' },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <stat.icon className={cn("w-5 h-5 mx-auto mb-1", stat.color)} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Partner List */}
      {partners.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>{isAr ? 'لا يوجد شركاء حتى الآن' : 'No partners yet'}</p>
            <p className="text-xs mt-1">{isAr ? 'سيظهر الشركاء تلقائياً بعد إنشاء شحنات' : 'Partners will appear after creating shipments'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {partners.map(partner => (
            <Card key={partner.id} className="border-border/50 hover:border-primary/30 transition-all hover:shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  partner.organization_type === 'transporter'
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}>
                  {partner.organization_type === 'transporter' ? <Truck className="w-5 h-5" /> : <Recycle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{partner.name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {partner.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{partner.city}</span>}
                    {partner.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{partner.phone}</span>}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Package className="w-2.5 h-2.5" />
                    {partner.shipmentCount}
                  </Badge>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{isAr ? 'شحنة' : 'shipments'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeneratorPartnersHub;
