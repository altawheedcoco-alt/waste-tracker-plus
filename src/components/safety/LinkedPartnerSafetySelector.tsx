import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLinkedPartners, LinkedPartner } from '@/hooks/useLinkedPartners';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Link2 } from 'lucide-react';

interface LinkedPartnerSafetySelectorProps {
  value?: string;
  onChange: (entityId: string, entityType: string, entityName: string) => void;
  label?: string;
  includeOwn?: boolean;
}

const LinkedPartnerSafetySelector = memo(({ value, onChange, label = 'ربط بجهة', includeOwn = true }: LinkedPartnerSafetySelectorProps) => {
  const { organization } = useAuth();
  const { data: partners, isLoading } = useLinkedPartners();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'مولد';
      case 'transporter': return 'ناقل';
      case 'recycler': return 'مدور';
      case 'disposal': return 'تخلص نهائي';
      default: return type;
    }
  };

  return (
    <div>
      <Label className="flex items-center gap-1.5">
        <Link2 className="w-3 h-3" />
        {label}
      </Label>
      <Select value={value || ''} onValueChange={v => {
        if (v === organization?.id) {
          onChange(v, organization?.organization_type || '', organization?.name || '');
        } else {
          const partner = partners?.find(p => p.id === v);
          if (partner) onChange(partner.id, partner.organization_type, partner.name);
        }
      }}>
        <SelectTrigger>
          <SelectValue placeholder="اختر الجهة (اختياري)" />
        </SelectTrigger>
        <SelectContent>
          {includeOwn && organization && (
            <SelectItem value={organization.id}>
              <div className="flex items-center gap-2">
                <Building2 className="w-3 h-3" />
                <span>{organization.name}</span>
                <Badge variant="outline" className="text-[8px]">جهتي</Badge>
              </div>
            </SelectItem>
          )}
          {partners?.map(partner => (
            <SelectItem key={partner.id} value={partner.id}>
              <div className="flex items-center gap-2">
                <span>{partner.name}</span>
                <Badge variant="secondary" className="text-[8px]">{getTypeLabel(partner.organization_type)}</Badge>
              </div>
            </SelectItem>
          ))}
          {!isLoading && (!partners || partners.length === 0) && (
            <div className="p-2 text-xs text-muted-foreground text-center">لا توجد جهات مرتبطة</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

LinkedPartnerSafetySelector.displayName = 'LinkedPartnerSafetySelector';
export default LinkedPartnerSafetySelector;
