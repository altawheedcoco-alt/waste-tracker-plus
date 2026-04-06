import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function PartnerScopeSelector({ selectedIds, onChange }: Props) {
  const { profile } = useAuth();

  const { data: partners = [] } = useQuery({
    queryKey: ['org-partners-for-scope', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      // Fetch partner organizations linked to current org
      const { data } = await supabase
        .from('organization_partnerships')
        .select('partner_organization_id, partner_organization:organizations!organization_partnerships_partner_organization_id_fkey(id, name)')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');
      return (data || []).map((p: any) => ({
        id: p.partner_organization_id,
        name: p.partner_organization?.name || 'جهة غير معروفة',
      }));
    },
    enabled: !!profile?.organization_id,
  });

  const allSelected = selectedIds.length === 0;

  const togglePartner = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange([]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge
          variant={allSelected ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={selectAll}
        >
          <Globe className="w-3 h-3 ml-1" />
          كل الجهات
        </Badge>
        <p className="text-xs text-muted-foreground">
          {allSelected ? 'المهمة تشمل كل الجهات المرتبطة' : `${selectedIds.length} جهة محددة`}
        </p>
      </div>

      <ScrollArea className="h-[200px] border rounded-lg p-2">
        {partners.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">لا توجد جهات مرتبطة</p>
        ) : (
          <div className="space-y-2">
            {partners.map((partner: any) => (
              <div key={partner.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                <Checkbox
                  checked={selectedIds.includes(partner.id)}
                  onCheckedChange={() => togglePartner(partner.id)}
                />
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm cursor-pointer flex-1">{partner.name}</Label>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
