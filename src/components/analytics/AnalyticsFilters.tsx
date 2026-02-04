import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AnalyticsFiltersProps {
  organizationId: string | null;
  selectedWasteTypes: string[];
  onWasteTypesChange: (types: string[]) => void;
  selectedPartners: string[];
  onPartnersChange: (partners: string[]) => void;
}

const AnalyticsFilters = ({
  organizationId,
  selectedWasteTypes,
  onWasteTypesChange,
  selectedPartners,
  onPartnersChange,
}: AnalyticsFiltersProps) => {
  // Fetch unique waste types
  const { data: wasteTypes = [] } = useQuery({
    queryKey: ['analytics-waste-types-list', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data } = await supabase
        .from('shipments')
        .select('waste_type')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`)
        .not('waste_type', 'is', null);

      const uniqueTypes = [...new Set(data?.map(s => s.waste_type).filter(Boolean))];
      return uniqueTypes as string[];
    },
    enabled: !!organizationId,
  });

  // Fetch partners
  const { data: partners = [] } = useQuery({
    queryKey: ['analytics-partners-list', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Get unique partners from shipments
      const { data: shipments } = await supabase
        .from('shipments')
        .select('generator_id, transporter_id, recycler_id')
        .or(`generator_id.eq.${organizationId},transporter_id.eq.${organizationId},recycler_id.eq.${organizationId}`);

      const partnerIds = new Set<string>();
      (shipments || []).forEach(s => {
        if (s.generator_id && s.generator_id !== organizationId) partnerIds.add(s.generator_id);
        if (s.transporter_id && s.transporter_id !== organizationId) partnerIds.add(s.transporter_id);
        if (s.recycler_id && s.recycler_id !== organizationId) partnerIds.add(s.recycler_id);
      });

      if (partnerIds.size === 0) return [];

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .in('id', Array.from(partnerIds));

      return (orgs || []).map(o => ({
        id: o.id,
        name: o.name,
      }));
    },
    enabled: !!organizationId,
  });

  const handleWasteTypeToggle = (type: string) => {
    if (selectedWasteTypes.includes(type)) {
      onWasteTypesChange(selectedWasteTypes.filter(t => t !== type));
    } else {
      onWasteTypesChange([...selectedWasteTypes, type]);
    }
  };

  const handlePartnerToggle = (partnerId: string) => {
    if (selectedPartners.includes(partnerId)) {
      onPartnersChange(selectedPartners.filter(p => p !== partnerId));
    } else {
      onPartnersChange([...selectedPartners, partnerId]);
    }
  };

  const clearAllFilters = () => {
    onWasteTypesChange([]);
    onPartnersChange([]);
  };

  const totalFilters = selectedWasteTypes.length + selectedPartners.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Waste Types Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            أنواع النفايات
            {selectedWasteTypes.length > 0 && (
              <Badge variant="secondary" className="mr-1">
                {selectedWasteTypes.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">أنواع النفايات</h4>
            <p className="text-xs text-muted-foreground">
              اختر الأنواع لتصفية البيانات
            </p>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {wasteTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleWasteTypeToggle(type)}
                >
                  <Checkbox
                    checked={selectedWasteTypes.includes(type)}
                    onCheckedChange={() => handleWasteTypeToggle(type)}
                  />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
              {wasteTypes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد أنواع نفايات
                </p>
              )}
            </div>
          </ScrollArea>
          {selectedWasteTypes.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onWasteTypesChange([])}
                >
                  مسح التحديد
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Partners Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            الشركاء
            {selectedPartners.length > 0 && (
              <Badge variant="secondary" className="mr-1">
                {selectedPartners.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">الشركاء</h4>
            <p className="text-xs text-muted-foreground">
              اختر الشركاء لتصفية البيانات
            </p>
          </div>
          <ScrollArea className="h-64">
            <div className="p-2 space-y-1">
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handlePartnerToggle(partner.id)}
                >
                  <Checkbox
                    checked={selectedPartners.includes(partner.id)}
                    onCheckedChange={() => handlePartnerToggle(partner.id)}
                  />
                  <span className="text-sm">{partner.name}</span>
                </div>
              ))}
              {partners.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا يوجد شركاء
                </p>
              )}
            </div>
          </ScrollArea>
          {selectedPartners.length > 0 && (
            <>
              <Separator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onPartnersChange([])}
                >
                  مسح التحديد
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {totalFilters > 0 && (
        <>
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex flex-wrap items-center gap-1">
            {selectedWasteTypes.map((type) => (
              <Badge key={type} variant="secondary" className="gap-1">
                {type}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleWasteTypeToggle(type)}
                />
              </Badge>
            ))}
            {selectedPartners.map((partnerId) => {
              const partner = partners.find(p => p.id === partnerId);
              return (
                <Badge key={partnerId} variant="secondary" className="gap-1">
                  {partner?.name}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => handlePartnerToggle(partnerId)}
                  />
                </Badge>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            مسح الكل
          </Button>
        </>
      )}
    </div>
  );
};

export default AnalyticsFilters;
