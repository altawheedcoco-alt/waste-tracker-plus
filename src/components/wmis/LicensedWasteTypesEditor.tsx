import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Save, FileText, Building2, CalendarDays } from 'lucide-react';
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

interface LicenseSourceData {
  license_source_env_approval: boolean;
  license_source_wmra_permit: boolean;
  env_approval_number: string;
  env_approval_date: string;
  env_approval_expiry: string;
  wmra_permit_number: string;
  wmra_permit_date: string;
  wmra_permit_expiry: string;
}

const LicensedWasteTypesEditor = memo(({ organizationId }: Props) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [licenseSource, setLicenseSource] = useState<LicenseSourceData>({
    license_source_env_approval: false,
    license_source_wmra_permit: false,
    env_approval_number: '',
    env_approval_date: '',
    env_approval_expiry: '',
    wmra_permit_number: '',
    wmra_permit_date: '',
    wmra_permit_expiry: '',
  });
  const { mutate: updateTypes, isPending } = useUpdateLicensedWasteTypes();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('licensed_waste_types, license_scope_notes, license_source_env_approval, license_source_wmra_permit, env_approval_number, env_approval_date, env_approval_expiry, wmra_permit_number, wmra_permit_date, wmra_permit_expiry')
        .eq('id', organizationId)
        .single();
      if (data) {
        setSelectedTypes((data as any).licensed_waste_types || []);
        setNotes((data as any).license_scope_notes || '');
        setLicenseSource({
          license_source_env_approval: (data as any).license_source_env_approval || false,
          license_source_wmra_permit: (data as any).license_source_wmra_permit || false,
          env_approval_number: (data as any).env_approval_number || '',
          env_approval_date: (data as any).env_approval_date || '',
          env_approval_expiry: (data as any).env_approval_expiry || '',
          wmra_permit_number: (data as any).wmra_permit_number || '',
          wmra_permit_date: (data as any).wmra_permit_date || '',
          wmra_permit_expiry: (data as any).wmra_permit_expiry || '',
        });
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

  const handleSave = async () => {
    const categories = [...new Set(
      selectedTypes.map(t => WASTE_TYPE_OPTIONS.find(o => o.value === t)?.category).filter(Boolean)
    )] as string[];

    // Save license source data directly
    const { error } = await supabase
      .from('organizations')
      .update({
        license_source_env_approval: licenseSource.license_source_env_approval,
        license_source_wmra_permit: licenseSource.license_source_wmra_permit,
        env_approval_number: licenseSource.env_approval_number || null,
        env_approval_date: licenseSource.env_approval_date || null,
        env_approval_expiry: licenseSource.env_approval_expiry || null,
        wmra_permit_number: licenseSource.wmra_permit_number || null,
        wmra_permit_date: licenseSource.wmra_permit_date || null,
        wmra_permit_expiry: licenseSource.wmra_permit_expiry || null,
      } as any)
      .eq('id', organizationId);

    if (error) {
      toast.error('فشل في حفظ بيانات مصدر الترخيص');
      return;
    }

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
        {/* License Sources Section */}
        <div className="space-y-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <Label className="text-xs font-bold flex items-center gap-1.5 text-primary">
            <Building2 className="h-3.5 w-3.5" />
            مصدر الترخيص الرسمي
          </Label>

          {/* Environmental Approval */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={licenseSource.license_source_env_approval}
                onCheckedChange={(checked) =>
                  setLicenseSource(prev => ({ ...prev, license_source_env_approval: !!checked }))
                }
              />
              <span className="font-medium">الموافقة البيئية للجمع والنقل — وزارة البيئة المصرية</span>
            </label>
            {licenseSource.license_source_env_approval && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mr-6">
                <div>
                  <Label className="text-[10px] text-muted-foreground">رقم الموافقة</Label>
                  <Input
                    value={licenseSource.env_approval_number}
                    onChange={e => setLicenseSource(prev => ({ ...prev, env_approval_number: e.target.value }))}
                    placeholder="مثال: ENV-2025-1234"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-2.5 w-2.5" /> تاريخ الإصدار
                  </Label>
                  <Input
                    type="date"
                    value={licenseSource.env_approval_date}
                    onChange={e => setLicenseSource(prev => ({ ...prev, env_approval_date: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-2.5 w-2.5" /> تاريخ الانتهاء
                  </Label>
                  <Input
                    type="date"
                    value={licenseSource.env_approval_expiry}
                    onChange={e => setLicenseSource(prev => ({ ...prev, env_approval_expiry: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* WMRA Permit */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={licenseSource.license_source_wmra_permit}
                onCheckedChange={(checked) =>
                  setLicenseSource(prev => ({ ...prev, license_source_wmra_permit: !!checked }))
                }
              />
              <span className="font-medium">تصريح جهاز تنظيم إدارة المخلفات (WMRA)</span>
            </label>
            {licenseSource.license_source_wmra_permit && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mr-6">
                <div>
                  <Label className="text-[10px] text-muted-foreground">رقم التصريح</Label>
                  <Input
                    value={licenseSource.wmra_permit_number}
                    onChange={e => setLicenseSource(prev => ({ ...prev, wmra_permit_number: e.target.value }))}
                    placeholder="مثال: WMRA-2025-5678"
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-2.5 w-2.5" /> تاريخ الإصدار
                  </Label>
                  <Input
                    type="date"
                    value={licenseSource.wmra_permit_date}
                    onChange={e => setLicenseSource(prev => ({ ...prev, wmra_permit_date: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-2.5 w-2.5" /> تاريخ الانتهاء
                  </Label>
                  <Input
                    type="date"
                    value={licenseSource.wmra_permit_expiry}
                    onChange={e => setLicenseSource(prev => ({ ...prev, wmra_permit_expiry: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Waste Types Selection */}
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
