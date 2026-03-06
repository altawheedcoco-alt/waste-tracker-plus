import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Plus, Printer, Send, Loader2, Eye, Pencil, X, Truck, Users, Shield, MapPin, Factory, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import AnnualPlanPrintView from './AnnualPlanPrintView';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'outline' },
  submitted: { label: 'مقدمة', variant: 'default' },
  approved: { label: 'معتمدة', variant: 'secondary' },
  rejected: { label: 'مرفوضة', variant: 'destructive' },
};

const WASTE_CATEGORIES_OPTIONS = [
  { value: 'municipal_solid', label: 'مخلفات بلدية صلبة' },
  { value: 'hazardous', label: 'مخلفات خطرة' },
  { value: 'construction', label: 'مخلفات هدم وبناء' },
  { value: 'medical', label: 'مخلفات طبية' },
  { value: 'electronic', label: 'مخلفات إلكترونية' },
  { value: 'organic', label: 'مخلفات عضوية' },
];

interface VehicleEntry {
  plate_number: string;
  vehicle_type: string;
  capacity: string;
  condition: string;
  covered: boolean;
  license_expiry: string;
  insurance_expiry: string;
}

interface RouteEntry {
  route_name: string;
  collection_point: string;
  destination: string;
  waste_type: string;
  frequency: string;
}

interface SubcontractorEntry {
  name: string;
  commercial_register: string;
  license_number: string;
  scope: string;
}

interface WorkforceEntry {
  role: string;
  count: number;
  training_status: string;
}

interface FormState {
  plan_year: number;
  plan_type: 'manual' | 'auto';
  waste_categories: string[];
  company_data: {
    name: string;
    commercial_register: string;
    tax_card: string;
    previous_license: string;
    address: string;
    representative: string;
    phone: string;
    email: string;
  };
  vehicles: VehicleEntry[];
  routes: RouteEntry[];
  disposal_plan: {
    disposal_site: string;
    disposal_type: string;
    contract_reference: string;
  };
  safety_procedures: {
    spill_response: string;
    odor_control: string;
    ppe_policy: string;
    emergency_contacts: string;
  };
  workforce: WorkforceEntry[];
  subcontractors: SubcontractorEntry[];
  notes: string;
}

const defaultForm = (): FormState => ({
  plan_year: new Date().getFullYear(),
  plan_type: 'auto',
  waste_categories: [],
  company_data: { name: '', commercial_register: '', tax_card: '', previous_license: '', address: '', representative: '', phone: '', email: '' },
  vehicles: [],
  routes: [],
  disposal_plan: { disposal_site: '', disposal_type: '', contract_reference: '' },
  safety_procedures: { spill_response: '', odor_control: '', ppe_policy: '', emergency_contacts: '' },
  workforce: [],
  subcontractors: [],
  notes: '',
});

export default function TransporterAnnualPlan() {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [activeSection, setActiveSection] = useState<string>('company');

  const orgId = organization?.id;

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['transporter-annual-plans', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transporter_annual_plans')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const handleAutoGenerate = async () => {
    if (!orgId) return;
    setGenerating(true);
    try {
      // Fetch org info
      const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (org) {
        setForm(prev => ({
          ...prev,
          company_data: {
            name: org.name || '',
            commercial_register: (org as any).commercial_register || '',
            tax_card: (org as any).tax_card || '',
            previous_license: (org as any).environmental_license || '',
            address: (org as any).address || '',
            representative: (org as any).representative_name || '',
            phone: (org as any).phone || '',
            email: (org as any).email || '',
          },
        }));
      }

      // Fetch vehicles
      const { data: drivers } = await supabase.from('drivers')
        .select('*, profile:profiles(full_name)')
        .eq('organization_id', orgId);
      
      if (drivers?.length) {
        setForm(prev => ({
          ...prev,
          vehicles: drivers.map(d => ({
            plate_number: d.vehicle_plate || '',
            vehicle_type: d.vehicle_type || '',
            capacity: '',
            condition: 'صالحة',
            covered: true,
            license_expiry: (d as any).license_expiry || '',
            insurance_expiry: '',
          })),
          workforce: [
            { role: 'سائق', count: drivers.length, training_status: 'مدرب' },
            { role: 'مساعد', count: 0, training_status: '' },
            { role: 'مشرف', count: 0, training_status: '' },
          ],
        }));
      }

      // Fetch partners (recyclers/disposal as disposal destinations, subcontractors)
      const { data: partners } = await supabase.from('organizations')
        .select('id, name, organization_type, commercial_register, environmental_license')
        .in('id', (await supabase.from('shipments')
          .select('recycler_id')
          .eq('transporter_id', orgId)
          .not('recycler_id', 'is', null)
          .limit(50)).data?.map((s: any) => s.recycler_id).filter(Boolean) || []);

      if (partners?.length) {
        const disposalPartner = partners[0];
        setForm(prev => ({
          ...prev,
          disposal_plan: {
            ...prev.disposal_plan,
            disposal_site: (disposalPartner as any)?.name || '',
            disposal_type: (disposalPartner as any)?.organization_type === 'recycler' ? 'تدوير' : 'تخلص آمن',
          },
        }));
      }

      // Fetch recent routes from shipments
      const { data: shipments } = await supabase.from('shipments')
        .select('pickup_location, delivery_address, waste_type, generator_id, recycler_id')
        .eq('transporter_id', orgId)
        .limit(100);

      if (shipments?.length) {
        const routeMap = new Map<string, RouteEntry>();
        shipments.forEach((s: any) => {
          const key = `${s.pickup_location || ''}-${s.delivery_address || ''}`;
          if (!routeMap.has(key)) {
            routeMap.set(key, {
              route_name: `مسار ${routeMap.size + 1}`,
              collection_point: s.pickup_location || '',
              destination: s.delivery_address || '',
              waste_type: s.waste_type || '',
              frequency: 'يومي',
            });
          }
        });
        setForm(prev => ({ ...prev, routes: Array.from(routeMap.values()).slice(0, 20) }));

        // Auto-detect waste categories
        const cats = new Set<string>();
        shipments.forEach((s: any) => {
          if (['chemical', 'electronic'].includes(s.waste_type)) cats.add('hazardous');
          else if (s.waste_type === 'medical') cats.add('medical');
          else if (s.waste_type === 'construction') cats.add('construction');
          else cats.add('municipal_solid');
        });
        setForm(prev => ({ ...prev, waste_categories: Array.from(cats) }));
      }

      // Fetch legal licenses for previous license info
      const { data: licenses } = await supabase.from('legal_licenses')
        .select('license_number, license_name, license_category, expiry_date')
        .eq('organization_id', orgId)
        .order('expiry_date', { ascending: false })
        .limit(1);

      if (licenses?.length) {
        setForm(prev => ({
          ...prev,
          company_data: {
            ...prev.company_data,
            previous_license: prev.company_data.previous_license || `${licenses[0].license_category || ''} - ${licenses[0].license_number || ''}`,
          },
        }));
      }

      toast.success('تم توليد البيانات تلقائياً من النظام');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد البيانات');
    } finally {
      setGenerating(false);
    }
  };

  const updateCompany = (field: string, value: string) => {
    setForm(prev => ({ ...prev, company_data: { ...prev.company_data, [field]: value } }));
  };

  const updateDisposal = (field: string, value: string) => {
    setForm(prev => ({ ...prev, disposal_plan: { ...prev.disposal_plan, [field]: value } }));
  };

  const updateSafety = (field: string, value: string) => {
    setForm(prev => ({ ...prev, safety_procedures: { ...prev.safety_procedures, [field]: value } }));
  };

  const addVehicle = () => setForm(prev => ({ ...prev, vehicles: [...prev.vehicles, { plate_number: '', vehicle_type: '', capacity: '', condition: 'صالحة', covered: true, license_expiry: '', insurance_expiry: '' }] }));
  const removeVehicle = (i: number) => setForm(prev => ({ ...prev, vehicles: prev.vehicles.filter((_, idx) => idx !== i) }));
  const updateVehicle = (i: number, field: keyof VehicleEntry, value: any) => {
    setForm(prev => {
      const v = [...prev.vehicles];
      v[i] = { ...v[i], [field]: value };
      return { ...prev, vehicles: v };
    });
  };

  const addRoute = () => setForm(prev => ({ ...prev, routes: [...prev.routes, { route_name: '', collection_point: '', destination: '', waste_type: '', frequency: 'يومي' }] }));
  const removeRoute = (i: number) => setForm(prev => ({ ...prev, routes: prev.routes.filter((_, idx) => idx !== i) }));
  const updateRoute = (i: number, field: keyof RouteEntry, value: string) => {
    setForm(prev => {
      const r = [...prev.routes];
      r[i] = { ...r[i], [field]: value };
      return { ...prev, routes: r };
    });
  };

  const addWorker = () => setForm(prev => ({ ...prev, workforce: [...prev.workforce, { role: '', count: 0, training_status: '' }] }));
  const removeWorker = (i: number) => setForm(prev => ({ ...prev, workforce: prev.workforce.filter((_, idx) => idx !== i) }));
  const updateWorker = (i: number, field: keyof WorkforceEntry, value: any) => {
    setForm(prev => {
      const w = [...prev.workforce];
      w[i] = { ...w[i], [field]: value };
      return { ...prev, workforce: w };
    });
  };

  const addSubcontractor = () => setForm(prev => ({ ...prev, subcontractors: [...prev.subcontractors, { name: '', commercial_register: '', license_number: '', scope: '' }] }));
  const removeSubcontractor = (i: number) => setForm(prev => ({ ...prev, subcontractors: prev.subcontractors.filter((_, idx) => idx !== i) }));
  const updateSubcontractor = (i: number, field: keyof SubcontractorEntry, value: string) => {
    setForm(prev => {
      const s = [...prev.subcontractors];
      s[i] = { ...s[i], [field]: value };
      return { ...prev, subcontractors: s };
    });
  };

  const toggleCategory = (cat: string) => {
    setForm(prev => ({
      ...prev,
      waste_categories: prev.waste_categories.includes(cat)
        ? prev.waste_categories.filter(c => c !== cat)
        : [...prev.waste_categories, cat],
    }));
  };

  const handleSave = async (asDraft = true) => {
    if (!orgId) return;
    setCreating(true);
    try {
      const payload = {
        organization_id: orgId,
        plan_number: '',
        plan_year: form.plan_year,
        plan_type: form.plan_type,
        waste_categories: form.waste_categories,
        company_data: form.company_data,
        vehicles_data: form.vehicles,
        operations_data: { routes: form.routes },
        disposal_plan: form.disposal_plan,
        safety_procedures: form.safety_procedures,
        workforce_data: { workforce: form.workforce },
        subcontractors: form.subcontractors,
        notes: form.notes || null,
        status: asDraft ? 'draft' : 'submitted',
        submitted_at: asDraft ? null : new Date().toISOString(),
        submitted_by: asDraft ? null : profile?.id,
      };

      if (editingPlan) {
        const { error } = await supabase.from('transporter_annual_plans')
          .update({ ...payload, updated_at: new Date().toISOString() } as any)
          .eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('تم تحديث الخطة');
      } else {
        const { error } = await supabase.from('transporter_annual_plans')
          .insert({ ...payload, created_by: profile?.id } as any);
        if (error) throw error;
        toast.success(asDraft ? 'تم حفظ المسودة' : 'تم تقديم الخطة');
      }
      queryClient.invalidateQueries({ queryKey: ['transporter-annual-plans'] });
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setShowCreate(false);
    setEditingPlan(null);
    setForm(defaultForm());
    setActiveSection('company');
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    const cd = plan.company_data || {};
    const dp = plan.disposal_plan || {};
    const sp = plan.safety_procedures || {};
    const od = plan.operations_data || {};
    const wd = plan.workforce_data || {};
    setForm({
      plan_year: plan.plan_year,
      plan_type: plan.plan_type,
      waste_categories: plan.waste_categories || [],
      company_data: { name: cd.name || '', commercial_register: cd.commercial_register || '', tax_card: cd.tax_card || '', previous_license: cd.previous_license || '', address: cd.address || '', representative: cd.representative || '', phone: cd.phone || '', email: cd.email || '' },
      vehicles: plan.vehicles_data || [],
      routes: od.routes || [],
      disposal_plan: { disposal_site: dp.disposal_site || '', disposal_type: dp.disposal_type || '', contract_reference: dp.contract_reference || '' },
      safety_procedures: { spill_response: sp.spill_response || '', odor_control: sp.odor_control || '', ppe_policy: sp.ppe_policy || '', emergency_contacts: sp.emergency_contacts || '' },
      workforce: wd.workforce || [],
      subcontractors: plan.subcontractors || [],
      notes: plan.notes || '',
    });
    setShowCreate(true);
  };

  const sections = [
    { id: 'company', label: 'بيانات الشركة', icon: Factory },
    { id: 'waste', label: 'أنواع المخلفات', icon: ClipboardList },
    { id: 'vehicles', label: 'المعدات والمركبات', icon: Truck },
    { id: 'routes', label: 'المسارات التشغيلية', icon: MapPin },
    { id: 'disposal', label: 'خطة التخلص', icon: Factory },
    { id: 'safety', label: 'إجراءات السلامة', icon: Shield },
    { id: 'workforce', label: 'العمالة والتدريب', icon: Users },
    { id: 'subcontractors', label: 'المقاولون من الباطن', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            خطة العمل السنوية
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            وفقاً لقانون 202 لسنة 2020 - إلزامية للحصول على ترخيص WMRA
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء خطة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{plans.length}</p>
          <p className="text-xs text-muted-foreground">إجمالي الخطط</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{plans.filter((p: any) => p.status === 'approved').length}</p>
          <p className="text-xs text-muted-foreground">معتمدة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-accent-foreground">{plans.filter((p: any) => p.status === 'submitted').length}</p>
          <p className="text-xs text-muted-foreground">مقدمة</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{plans.filter((p: any) => p.status === 'draft').length}</p>
          <p className="text-xs text-muted-foreground">مسودات</p>
        </CardContent></Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>سجل الخطط السنوية</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : plans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد خطط بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الخطة</TableHead>
                  <TableHead>السنة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>أنواع المخلفات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-xs">{plan.plan_number}</TableCell>
                    <TableCell>{plan.plan_year}</TableCell>
                    <TableCell><Badge variant="outline">{plan.plan_type === 'auto' ? 'تلقائي' : 'يدوي'}</Badge></TableCell>
                    <TableCell className="text-xs">{(plan.waste_categories || []).map((c: string) => WASTE_CATEGORIES_OPTIONS.find(o => o.value === c)?.label || c).join('، ')}</TableCell>
                    <TableCell><Badge variant={STATUS_MAP[plan.status]?.variant || 'outline'}>{STATUS_MAP[plan.status]?.label || plan.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setPreviewPlan(plan); setShowPreview(true); }}><Eye className="h-4 w-4" /></Button>
                        {(plan.status === 'draft' || plan.status === 'rejected') && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); else setShowCreate(true); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'تعديل الخطة السنوية' : 'إنشاء خطة عمل سنوية'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Top controls */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>السنة</Label>
                <Input type="number" value={form.plan_year} onChange={e => setForm(prev => ({ ...prev, plan_year: parseInt(e.target.value) || new Date().getFullYear() }))} />
              </div>
              <div>
                <Label>نوع الإعداد</Label>
                <Select value={form.plan_type} onValueChange={(v) => setForm(prev => ({ ...prev, plan_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">تلقائي (من النظام)</SelectItem>
                    <SelectItem value="manual">يدوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {form.plan_type === 'auto' && (
                  <Button onClick={handleAutoGenerate} disabled={generating} variant="outline" className="gap-2 w-full">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    توليد تلقائي
                  </Button>
                )}
              </div>
            </div>

            {/* Section navigation */}
            <div className="flex gap-1 flex-wrap">
              {sections.map(s => (
                <Button key={s.id} size="sm" variant={activeSection === s.id ? 'default' : 'outline'} onClick={() => setActiveSection(s.id)} className="gap-1 text-xs">
                  <s.icon className="h-3 w-3" /> {s.label}
                </Button>
              ))}
            </div>

            {/* Company Data */}
            {activeSection === 'company' && (
              <Card>
                <CardHeader><CardTitle className="text-sm">بيانات الجهة الناقلة</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">اسم الشركة</Label><Input value={form.company_data.name} onChange={e => updateCompany('name', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">السجل التجاري</Label><Input value={form.company_data.commercial_register} onChange={e => updateCompany('commercial_register', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">البطاقة الضريبية</Label><Input value={form.company_data.tax_card} onChange={e => updateCompany('tax_card', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الترخيص السابق</Label><Input value={form.company_data.previous_license} onChange={e => updateCompany('previous_license', e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">العنوان</Label><Input value={form.company_data.address} onChange={e => updateCompany('address', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الممثل القانوني</Label><Input value={form.company_data.representative} onChange={e => updateCompany('representative', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الهاتف</Label><Input value={form.company_data.phone} onChange={e => updateCompany('phone', e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">البريد الإلكتروني</Label><Input value={form.company_data.email} onChange={e => updateCompany('email', e.target.value)} className="h-8 text-sm" /></div>
                </CardContent>
              </Card>
            )}

            {/* Waste Categories */}
            {activeSection === 'waste' && (
              <Card>
                <CardHeader><CardTitle className="text-sm">أنواع المخلفات المنقولة</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {WASTE_CATEGORIES_OPTIONS.map(cat => (
                    <div key={cat.value} className="flex items-center gap-2">
                      <Checkbox checked={form.waste_categories.includes(cat.value)} onCheckedChange={() => toggleCategory(cat.value)} />
                      <Label className="text-sm">{cat.label}</Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Vehicles */}
            {activeSection === 'vehicles' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">بيان المعدات والمركبات</CardTitle>
                  <Button size="sm" variant="outline" onClick={addVehicle} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة مركبة</Button>
                </CardHeader>
                <CardContent>
                  {form.vehicles.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">لا توجد مركبات</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-1">اللوحة</TableHead>
                          <TableHead className="text-xs p-1">النوع</TableHead>
                          <TableHead className="text-xs p-1">السعة</TableHead>
                          <TableHead className="text-xs p-1">الحالة</TableHead>
                          <TableHead className="text-xs p-1">مغطاة</TableHead>
                          <TableHead className="text-xs p-1">انتهاء الرخصة</TableHead>
                          <TableHead className="text-xs p-1">انتهاء التأمين</TableHead>
                          <TableHead className="text-xs p-1 w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.vehicles.map((v, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={v.plate_number} onChange={e => updateVehicle(i, 'plate_number', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={v.vehicle_type} onChange={e => updateVehicle(i, 'vehicle_type', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={v.capacity} onChange={e => updateVehicle(i, 'capacity', e.target.value)} className="h-6 text-xs w-16" /></TableCell>
                            <TableCell className="p-1"><Input value={v.condition} onChange={e => updateVehicle(i, 'condition', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Checkbox checked={v.covered} onCheckedChange={(c) => updateVehicle(i, 'covered', !!c)} /></TableCell>
                            <TableCell className="p-1"><Input type="date" value={v.license_expiry} onChange={e => updateVehicle(i, 'license_expiry', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input type="date" value={v.insurance_expiry} onChange={e => updateVehicle(i, 'insurance_expiry', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeVehicle(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Routes */}
            {activeSection === 'routes' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">منظومة التشغيل والمسارات</CardTitle>
                  <Button size="sm" variant="outline" onClick={addRoute} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة مسار</Button>
                </CardHeader>
                <CardContent>
                  {form.routes.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">لا توجد مسارات</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-1">اسم المسار</TableHead>
                          <TableHead className="text-xs p-1">نقطة التجميع</TableHead>
                          <TableHead className="text-xs p-1">الوجهة</TableHead>
                          <TableHead className="text-xs p-1">نوع المخلف</TableHead>
                          <TableHead className="text-xs p-1">التكرار</TableHead>
                          <TableHead className="text-xs p-1 w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.routes.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={r.route_name} onChange={e => updateRoute(i, 'route_name', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={r.collection_point} onChange={e => updateRoute(i, 'collection_point', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={r.destination} onChange={e => updateRoute(i, 'destination', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={r.waste_type} onChange={e => updateRoute(i, 'waste_type', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={r.frequency} onChange={e => updateRoute(i, 'frequency', e.target.value)} className="h-6 text-xs w-20" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeRoute(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Disposal Plan */}
            {activeSection === 'disposal' && (
              <Card>
                <CardHeader><CardTitle className="text-sm">خطة التخلص الآمن</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label className="text-xs">موقع التخلص النهائي (المدفن الصحي / محطة المعالجة)</Label><Input value={form.disposal_plan.disposal_site} onChange={e => updateDisposal('disposal_site', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">نوع التخلص</Label><Input value={form.disposal_plan.disposal_type} onChange={e => updateDisposal('disposal_type', e.target.value)} className="h-8 text-sm" placeholder="مدفن صحي / معالجة / تدوير" /></div>
                  <div><Label className="text-xs">مرجع العقد</Label><Input value={form.disposal_plan.contract_reference} onChange={e => updateDisposal('contract_reference', e.target.value)} className="h-8 text-sm" /></div>
                </CardContent>
              </Card>
            )}

            {/* Safety */}
            {activeSection === 'safety' && (
              <Card>
                <CardHeader><CardTitle className="text-sm">إجراءات السلامة البيئية</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs">إجراءات التعامل مع الانسكابات والحوادث</Label><Textarea value={form.safety_procedures.spill_response} onChange={e => updateSafety('spill_response', e.target.value)} className="text-sm" rows={3} /></div>
                  <div><Label className="text-xs">تدابير الحد من الروائح وتناثر المخلفات</Label><Textarea value={form.safety_procedures.odor_control} onChange={e => updateSafety('odor_control', e.target.value)} className="text-sm" rows={3} /></div>
                  <div><Label className="text-xs">سياسة معدات الحماية الشخصية (PPE)</Label><Textarea value={form.safety_procedures.ppe_policy} onChange={e => updateSafety('ppe_policy', e.target.value)} className="text-sm" rows={2} /></div>
                  <div><Label className="text-xs">جهات اتصال الطوارئ</Label><Textarea value={form.safety_procedures.emergency_contacts} onChange={e => updateSafety('emergency_contacts', e.target.value)} className="text-sm" rows={2} /></div>
                </CardContent>
              </Card>
            )}

            {/* Workforce */}
            {activeSection === 'workforce' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">العمالة والتدريب</CardTitle>
                  <Button size="sm" variant="outline" onClick={addWorker} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة</Button>
                </CardHeader>
                <CardContent>
                  {form.workforce.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">لا توجد بيانات</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-1">الدور الوظيفي</TableHead>
                          <TableHead className="text-xs p-1">العدد</TableHead>
                          <TableHead className="text-xs p-1">حالة التدريب</TableHead>
                          <TableHead className="text-xs p-1 w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.workforce.map((w, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={w.role} onChange={e => updateWorker(i, 'role', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input type="number" value={w.count} onChange={e => updateWorker(i, 'count', parseInt(e.target.value) || 0)} className="h-6 text-xs w-16" /></TableCell>
                            <TableCell className="p-1"><Input value={w.training_status} onChange={e => updateWorker(i, 'training_status', e.target.value)} className="h-6 text-xs" placeholder="مدرب / قيد التدريب" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeWorker(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Subcontractors */}
            {activeSection === 'subcontractors' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">المقاولون من الباطن</CardTitle>
                  <Button size="sm" variant="outline" onClick={addSubcontractor} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة</Button>
                </CardHeader>
                <CardContent>
                  {form.subcontractors.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">لا يوجد مقاولون من الباطن</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-1">اسم المقاول</TableHead>
                          <TableHead className="text-xs p-1">السجل التجاري</TableHead>
                          <TableHead className="text-xs p-1">رقم الترخيص</TableHead>
                          <TableHead className="text-xs p-1">نطاق العمل</TableHead>
                          <TableHead className="text-xs p-1 w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.subcontractors.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={s.name} onChange={e => updateSubcontractor(i, 'name', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={s.commercial_register} onChange={e => updateSubcontractor(i, 'commercial_register', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={s.license_number} onChange={e => updateSubcontractor(i, 'license_number', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={s.scope} onChange={e => updateSubcontractor(i, 'scope', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeSubcontractor(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div>
              <Label>ملاحظات عامة</Label>
              <Textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="ملاحظات إضافية..." />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button variant="secondary" onClick={() => handleSave(true)} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                حفظ كمسودة
              </Button>
              <Button onClick={() => handleSave(false)} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                تقديم الخطة
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> معاينة الخطة السنوية</DialogTitle>
          </DialogHeader>
          {previewPlan && <AnnualPlanPrintView plan={previewPlan} organization={organization} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
