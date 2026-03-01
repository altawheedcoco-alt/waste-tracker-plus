import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Save, FileText } from 'lucide-react';
import { useUpdateLicensedWasteTypes } from '@/hooks/useWMIS';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Standard waste types from Egyptian law 202/2020
const WASTE_TYPE_OPTIONS = [
  { value: 'municipal_solid', label: 'نفايات بلدية صلبة', category: 'non_hazardous' },
  { value: 'construction', label: 'مخلفات بناء وهدم', category: 'non_hazardous' },
  { value: 'agricultural', label: 'مخلفات زراعية', category: 'non_hazardous' },
  { value: 'industrial_non_hazardous', label: 'مخلفات صناعية غير خطرة', category: 'non_hazardous' },
  { value: 'paper_cardboard', label: 'ورق وكرتون', category: 'recyclable' },
  { value: 'plastic', label: 'بلاستيك', category: 'recyclable' },
  { value: 'metal', label: 'معادن', category: 'recyclable' },
  { value: 'glass', label: 'زجاج', category: 'recyclable' },
  { value: 'wood', label: 'خشب', category: 'recyclable' },
  { value: 'textile', label: 'منسوجات', category: 'recyclable' },
  { value: 'rubber', label: 'مطاط', category: 'recyclable' },
  { value: 'organic', label: 'مخلفات عضوية', category: 'recyclable' },
  { value: 'electronic', label: 'مخلفات إلكترونية (WEEE)', category: 'hazardous' },
  { value: 'medical', label: 'نفايات طبية', category: 'hazardous' },
  { value: 'chemical', label: 'مخلفات كيميائية', category: 'hazardous' },
  { value: 'oil_waste', label: 'زيوت مستعملة', category: 'hazardous' },
  { value: 'batteries', label: 'بطاريات', category: 'hazardous' },
  { value: 'asbestos', label: 'أسبستوس', category: 'hazardous' },
  { value: 'radioactive', label: 'مواد مشعة', category: 'hazardous' },
  { value: 'tires', label: 'إطارات', category: 'special' },
  { value: 'food_waste', label: 'مخلفات غذائية', category: 'special' },
  { value: 'cooking_oil', label: 'زيوت طعام مستعملة', category: 'special' },
];

const CATEGORY_LABELS: Record<string, string> = {
  non_hazardous: 'غير خطرة',
  recyclable: 'قابلة للتدوير',
  hazardous: 'خطرة ⚠️',
  special: 'خاصة',
};

interface Props {
  organizationId: string;
}

const LicensedWasteTypesEditor = memo(({ organizationId }: Props) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const { mutate: updateTypes, isPending } = useUpdateLicensedWasteTypes();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('licensed_waste_types, license_scope_notes')
        .eq('id', organizationId)
        .single();
      if (data) {
        setSelectedTypes((data as any).licensed_waste_types || []);
        setNotes((data as any).license_scope_notes || '');
      }
      setLoading(false);
    };
    fetch();
  }, [organizationId]);

  const toggleType = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  };

  const handleSave = () => {
    const categories = [...new Set(
      selectedTypes.map(t => WASTE_TYPE_OPTIONS.find(o => o.value === t)?.category).filter(Boolean)
    )] as string[];
    
    updateTypes({
      organizationId,
      licensedWasteTypes: selectedTypes,
      licensedWasteCategories: categories,
      licenseScopeNotes: notes,
    });
  };

  if (loading) return null;

  const grouped = Object.entries(
    WASTE_TYPE_OPTIONS.reduce((acc, opt) => {
      (acc[opt.category] = acc[opt.category] || []).push(opt);
      return acc;
    }, {} as Record<string, typeof WASTE_TYPE_OPTIONS>)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          أنواع المخلفات المرخصة
          <Badge variant="secondary" className="text-xs">{selectedTypes.length} نوع</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grouped.map(([category, types]) => (
          <div key={category} className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">
              {CATEGORY_LABELS[category] || category}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {types.map(type => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 text-xs p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedTypes.includes(type.value)
                      ? 'bg-primary/5 border-primary/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <FileText className="h-3 w-3" />
            ملاحظات نطاق الترخيص
          </Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="أي تفاصيل إضافية عن نطاق الترخيص..."
            rows={2}
            className="text-xs"
          />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isPending ? 'جاري الحفظ...' : 'حفظ أنواع المخلفات المرخصة'}
        </Button>
      </CardContent>
    </Card>
  );
});

LicensedWasteTypesEditor.displayName = 'LicensedWasteTypesEditor';
export default LicensedWasteTypesEditor;
