import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, FileCheck, Truck, Recycle, Factory, Trash2, Save, Loader2, AlertTriangle, CheckCircle2, Plus, X } from 'lucide-react';
import { useDocumentComplianceExtractor } from '@/hooks/useDocumentComplianceExtractor';

const WASTE_TYPE_OPTIONS = [
  'نفايات صلبة بلدية', 'نفايات صناعية', 'نفايات طبية', 'نفايات خطرة',
  'نفايات إلكترونية', 'نفايات بناء وهدم', 'نفايات زراعية', 'نفايات عضوية',
  'زيوت مستعملة', 'بطاريات', 'إطارات', 'بلاستيك', 'ورق وكرتون',
  'معادن', 'زجاج', 'نفايات كيميائية', 'حمأة', 'رماد',
];

interface ComplianceData {
  licensed_waste_types: string[];
  wmra_license: string;
  wmra_license_issue_date: string;
  wmra_license_expiry_date: string;
  environmental_approval_number: string;
  env_approval_expiry: string;
  land_transport_license: string;
  hazardous_certified: boolean;
}

export default function ComplianceLicenseSettings() {
  const { organization } = useAuth();
  const { extractAndUpdate, extracting } = useDocumentComplianceExtractor();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customWaste, setCustomWaste] = useState('');
  const [data, setData] = useState<ComplianceData>({
    licensed_waste_types: [],
    wmra_license: '',
    wmra_license_issue_date: '',
    wmra_license_expiry_date: '',
    environmental_approval_number: '',
    env_approval_expiry: '',
    land_transport_license: '',
    hazardous_certified: false,
  });

  const orgType = (organization as any)?.organization_type || '';
  const orgId = organization?.id;

  useEffect(() => {
    if (!orgId) return;
    (async () => {
      setLoading(true);
      const { data: org } = await supabase
        .from('organizations')
        .select('licensed_waste_types, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified')
        .eq('id', orgId)
        .single();
      if (org) {
        setData({
          licensed_waste_types: (org.licensed_waste_types as string[]) || [],
          wmra_license: org.wmra_license || '',
          wmra_license_issue_date: org.wmra_license_issue_date || '',
          wmra_license_expiry_date: org.wmra_license_expiry_date || '',
          environmental_approval_number: org.environmental_approval_number || '',
          env_approval_expiry: org.env_approval_expiry || '',
          land_transport_license: org.land_transport_license || '',
          hazardous_certified: org.hazardous_certified || false,
        });
      }
      setLoading(false);
    })();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase
      .from('organizations')
      .update({
        licensed_waste_types: data.licensed_waste_types,
        wmra_license: data.wmra_license || null,
        wmra_license_issue_date: data.wmra_license_issue_date || null,
        wmra_license_expiry_date: data.wmra_license_expiry_date || null,
        environmental_approval_number: data.environmental_approval_number || null,
        env_approval_expiry: data.env_approval_expiry || null,
        land_transport_license: data.land_transport_license || null,
        hazardous_certified: data.hazardous_certified,
      })
      .eq('id', orgId);

    if (error) {
      toast.error('فشل في حفظ البيانات');
    } else {
      toast.success('تم حفظ بيانات التراخيص والامتثال');
    }
    setSaving(false);
  };

  const toggleWasteType = (type: string) => {
    setData(prev => ({
      ...prev,
      licensed_waste_types: prev.licensed_waste_types.includes(type)
        ? prev.licensed_waste_types.filter(t => t !== type)
        : [...prev.licensed_waste_types, type],
    }));
  };

  const addCustomWaste = () => {
    const trimmed = customWaste.trim();
    if (trimmed && !data.licensed_waste_types.includes(trimmed)) {
      setData(prev => ({ ...prev, licensed_waste_types: [...prev.licensed_waste_types, trimmed] }));
      setCustomWaste('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    const result = await extractAndUpdate(file, orgId);
    if (result) {
      // Refresh data after AI extraction
      const { data: org } = await supabase
        .from('organizations')
        .select('licensed_waste_types, wmra_license, wmra_license_issue_date, wmra_license_expiry_date, environmental_approval_number, env_approval_expiry, land_transport_license, hazardous_certified')
        .eq('id', orgId)
        .single();
      if (org) {
        setData({
          licensed_waste_types: (org.licensed_waste_types as string[]) || [],
          wmra_license: org.wmra_license || '',
          wmra_license_issue_date: org.wmra_license_issue_date || '',
          wmra_license_expiry_date: org.wmra_license_expiry_date || '',
          environmental_approval_number: org.environmental_approval_number || '',
          env_approval_expiry: org.env_approval_expiry || '',
          land_transport_license: org.land_transport_license || '',
          hazardous_certified: org.hazardous_certified || false,
        });
      }
    }
    e.target.value = '';
  };

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const getOrgLabel = () => {
    const labels: Record<string, string> = {
      generator: 'المولّد', transporter: 'الناقل', recycler: 'المدوّر', disposal: 'التخلص النهائي',
    };
    return labels[orgType] || 'الجهة';
  };

  const getWasteLabel = () => {
    const labels: Record<string, string> = {
      generator: 'أنواع المخلفات المولّدة', transporter: 'أنواع المخلفات المنقولة',
      recycler: 'أنواع المخلفات المعالجة/المدورة', disposal: 'أنواع المخلفات للتخلص النهائي',
    };
    return labels[orgType] || 'أنواع المخلفات المرخصة';
  };

  if (loading) {
    return <Card><CardContent className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      {/* AI Document Upload */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">استخراج البيانات تلقائياً بالذكاء الاصطناعي</p>
              <p className="text-xs text-muted-foreground mt-1">
                ارفع أي مستند (ترخيص، موافقة بيئية، تصريح WMRA) وسيتم استخراج البيانات وملء الحقول تلقائياً
              </p>
              <div className="mt-3">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={extracting} />
                  <Button variant="outline" size="sm" className="gap-2" asChild disabled={extracting}>
                    <span>
                      {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                      {extracting ? 'جارٍ التحليل...' : 'رفع مستند للتحليل'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waste Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {orgType === 'transporter' ? <Truck className="h-4 w-4 text-primary" /> :
             orgType === 'recycler' ? <Recycle className="h-4 w-4 text-primary" /> :
             orgType === 'disposal' ? <Trash2 className="h-4 w-4 text-primary" /> :
             <Factory className="h-4 w-4 text-primary" />}
            {getWasteLabel()}
          </CardTitle>
          <CardDescription className="text-xs">
            حدد أنواع المخلفات المرخص لجهة {getOrgLabel()} التعامل معها — تُستخدم في مطابقة الامتثال
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {WASTE_TYPE_OPTIONS.map(type => (
              <Badge
                key={type}
                variant={data.licensed_waste_types.includes(type) ? 'default' : 'outline'}
                className="cursor-pointer text-xs py-1 px-2.5 transition-colors"
                onClick={() => toggleWasteType(type)}
              >
                {data.licensed_waste_types.includes(type) && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {type}
              </Badge>
            ))}
          </div>
          {/* Custom types already selected but not in default list */}
          {data.licensed_waste_types.filter(t => !WASTE_TYPE_OPTIONS.includes(t)).map(type => (
            <Badge key={type} variant="default" className="cursor-pointer text-xs py-1 px-2.5 mr-1" onClick={() => toggleWasteType(type)}>
              <X className="h-3 w-3 mr-1" />{type}
            </Badge>
          ))}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="أضف نوع مخلف مخصص..."
              value={customWaste}
              onChange={e => setCustomWaste(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomWaste()}
              className="text-sm"
            />
            <Button variant="outline" size="sm" onClick={addCustomWaste} disabled={!customWaste.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{data.licensed_waste_types.length} نوع محدد</p>
        </CardContent>
      </Card>

      {/* Hazardous */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold">اعتماد المخلفات الخطرة</p>
                <p className="text-xs text-muted-foreground">هل الجهة معتمدة للتعامل مع المخلفات الخطرة؟</p>
              </div>
            </div>
            <Switch checked={data.hazardous_certified} onCheckedChange={v => setData(p => ({ ...p, hazardous_certified: v }))} />
          </div>
        </CardContent>
      </Card>

      {/* Environmental Approval */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />الموافقة البيئية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">رقم الموافقة البيئية</Label>
              <Input value={data.environmental_approval_number} onChange={e => setData(p => ({ ...p, environmental_approval_number: e.target.value }))} placeholder="أدخل الرقم" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ انتهاء الموافقة</Label>
              <Input type="date" value={data.env_approval_expiry} onChange={e => setData(p => ({ ...p, env_approval_expiry: e.target.value }))} className="mt-1" />
              {isExpired(data.env_approval_expiry) && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />منتهية الصلاحية</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WMRA License */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />تصريح WMRA — جهاز تنظيم إدارة المخلفات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">رقم التصريح</Label>
              <Input value={data.wmra_license} onChange={e => setData(p => ({ ...p, wmra_license: e.target.value }))} placeholder="رقم WMRA" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ الإصدار</Label>
              <Input type="date" value={data.wmra_license_issue_date} onChange={e => setData(p => ({ ...p, wmra_license_issue_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">تاريخ الانتهاء</Label>
              <Input type="date" value={data.wmra_license_expiry_date} onChange={e => setData(p => ({ ...p, wmra_license_expiry_date: e.target.value }))} className="mt-1" />
              {isExpired(data.wmra_license_expiry_date) && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />منتهي الصلاحية</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport License - only for transporter */}
      {(orgType === 'transporter' || orgType === 'transport_office') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />ترخيص النقل البري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-xs">رقم ترخيص النقل البري</Label>
              <Input value={data.land_transport_license} onChange={e => setData(p => ({ ...p, land_transport_license: e.target.value }))} placeholder="أدخل رقم الترخيص" className="mt-1" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2" size="lg">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        حفظ بيانات التراخيص والامتثال
      </Button>
    </div>
  );
}
