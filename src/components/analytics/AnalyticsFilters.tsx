import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalyticsFiltersProps {
  organizationId: string | null;
  selectedWasteTypes: string[];
  onWasteTypesChange: (types: string[]) => void;
  selectedPartners: string[];
  onPartnersChange: (partners: string[]) => void;
}

const AnalyticsFilters = ({ organizationId, selectedWasteTypes, onWasteTypesChange, selectedPartners, onPartnersChange }: AnalyticsFiltersProps) => {
  const { t } = useLanguage();

  const { data: wasteTypes = [] } = useQuery({
    queryKey: ['analytics-waste-types-list', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await supabase.from('shipments').select('waste_type')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .not('waste_type', 'is', null);
      return [...new Set(data?.map(s => s.waste_type).filter(Boolean))] as string[];
    },
    enabled: !!organizationId,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['analytics-partners-list', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data: shipments } = await supabase.from('shipments').select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`);
      const partnerIds = new Set<string>();
      (shipments || []).forEach(s => {
        if (s.generator_id && s.generator_id !== organizationId) partnerIds.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== organizationId) partnerIds.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== organizationId) partnerIds.add(s.recycler_id);
      });
      if (partnerIds.size === 0) return [];
      const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', Array.from(partnerIds));
      return (orgs || []).map(o => ({ id: o.id, name: o.name }));
    },
    enabled: !!organizationId,
  });

  const handleWasteTypeToggle = (type: string) => {
    onWasteTypesChange(selectedWasteTypes.includes(type) ? selectedWasteTypes.filter(t => t !== type) : [...selectedWasteTypes, type]);
  };

  const handlePartnerToggle = (partnerId: string) => {
    onPartnersChange(selectedPartners.includes(partnerId) ? selectedPartners.filter(p => p !== partnerId) : [...selectedPartners, partnerId]);
  };

  const totalFilters = selectedWasteTypes.length + selectedPartners.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            {t('analytics.wasteTypes')}
            {selectedWasteTypes.length > 0 && <Badge variant="secondary" className="mr-1 rtl:mr-1 ltr:ml-1">{selectedWasteTypes.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">{t('analytics.wasteTypes')}</h4>
            <p className="text-xs text-muted-foreground">{t('analytics.selectWasteTypes')}</p>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {wasteTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handleWasteTypeToggle(type)}>
                  <Checkbox checked={selectedWasteTypes.includes(type)} onCheckedChange={() => handleWasteTypeToggle(type)} />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
              {wasteTypes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('analytics.noWasteTypes')}</p>}
            </div>
          </ScrollArea>
          {selectedWasteTypes.length > 0 && (
            <><Separator /><div className="p-2"><Button variant="ghost" size="sm" className="w-full" onClick={() => onWasteTypesChange([])}>{t('analytics.clearSelection')}</Button></div></>
          )}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            {t('analytics.linkedPartners')}
            {selectedPartners.length > 0 && <Badge variant="secondary" className="mr-1 rtl:mr-1 ltr:ml-1">{selectedPartners.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">{t('analytics.linkedPartners')}</h4>
            <p className="text-xs text-muted-foreground">{t('analytics.selectPartners')}</p>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {partners.map((partner) => (
                <div key={partner.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => handlePartnerToggle(partner.id)}>
                  <Checkbox checked={selectedPartners.includes(partner.id)} onCheckedChange={() => handlePartnerToggle(partner.id)} />
                  <span className="text-sm">{partner.name}</span>
                </div>
              ))}
              {partners.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t('analytics.noPartners')}</p>}
            </div>
          </ScrollArea>
          {selectedPartners.length > 0 && (
            <><Separator /><div className="p-2"><Button variant="ghost" size="sm" className="w-full" onClick={() => onPartnersChange([])}>{t('analytics.clearSelection')}</Button></div></>
          )}
        </PopoverContent>
      </Popover>

      {totalFilters > 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-wrap items-center gap-1">
            {selectedWasteTypes.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">{type}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleWasteTypeToggle(type)} /></Badge>
            ))}
            {selectedPartners.map((partnerId) => {
              const partner = partners.find(p => p.id === partnerId);
              return <Badge key={partnerId} variant="secondary" className="gap-1">{partner?.name}<X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handlePartnerToggle(partnerId)} /></Badge>;
            })}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { onWasteTypesChange([]); onPartnersChange([]); }} className="text-muted-foreground hover:text-destructive">{t('analytics.clearAll')}</Button>
        </>
      )}
    </div>
  );
};

export default AnalyticsFilters;
