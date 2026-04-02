import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Truck, Recycle, Phone, MapPin, Package, Search, UserPlus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const GeneratorPartnersHub = () => {
  const { organization } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [showDiscover, setShowDiscover] = useState(false);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['generator-partners', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

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

  // Discover new partners (not yet connected)
  const { data: discoverable = [] } = useQuery({
    queryKey: ['generator-discover-partners', organization?.id, showDiscover],
    queryFn: async () => {
      if (!organization?.id) return [];
      const existingIds = new Set(partners.map(p => p.id));

      const { data } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, phone')
        .or('organization_type.eq.transporter,organization_type.eq.recycler')
        .eq('status', 'active')
        .limit(20);

      return (data || []).filter(o => !existingIds.has(o.id) && o.id !== organization.id).slice(0, 10);
    },
    enabled: !!organization?.id && showDiscover,
    staleTime: 5 * 60 * 1000,
  });

  const transporters = partners.filter(p => p.organization_type === 'transporter');
  const recyclers = partners.filter(p => p.organization_type === 'recycler');

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

      {/* Discover New Partners */}
      <div className="space-y-2">
        <Button
          variant={showDiscover ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowDiscover(!showDiscover)}
          className="w-full gap-2"
        >
          <Search className="w-4 h-4" />
          {isAr ? (showDiscover ? 'إخفاء الاكتشاف' : 'اكتشف شركاء جدد') : (showDiscover ? 'Hide Discovery' : 'Discover New Partners')}
        </Button>

        {showDiscover && (
          <div className="space-y-2">
            {discoverable.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center text-muted-foreground text-sm">
                  {isAr ? 'لا توجد جهات إضافية متاحة حالياً' : 'No additional partners available'}
                </CardContent>
              </Card>
            ) : (
              discoverable.map(org => (
                <Card key={org.id} className="border-border/50 hover:border-primary/30 transition-all bg-primary/[0.02]">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      org.organization_type === 'transporter'
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {org.organization_type === 'transporter' ? <Truck className="w-5 h-5" /> : <Recycle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{org.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {org.city && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{org.city}</span>}
                        <Badge variant="outline" className="text-[9px] h-4">
                          {org.organization_type === 'transporter' ? (isAr ? 'ناقل' : 'Transporter') : (isAr ? 'مدور' : 'Recycler')}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs h-7"
                      onClick={() => navigate('/dashboard/partners')}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {isAr ? 'ربط' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-xs"
              onClick={() => navigate('/dashboard/partners')}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {isAr ? 'عرض كل الشركاء' : 'View All Partners'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratorPartnersHub;
