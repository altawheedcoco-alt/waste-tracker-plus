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
import AnnualPlanPrintView from '@/components/transporter/AnnualPlanPrintView';

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

interface VehicleEntry { plate_number: string; vehicle_type: string; capacity: string; condition: string; covered: boolean; license_expiry: string; insurance_expiry: string; }
interface OrgStructureEntry { department: string; position: string; person_name: string; phone: string; responsibilities: string; }
interface WorkforceEntry { role: string; count: number; training_status: string; }

interface FormState {
  plan_year: number;
  plan_type: 'manual' | 'auto';
  waste_categories: string[];
  company_data: { name: string; commercial_register: string; tax_card: string; previous_license: string; address: string; representative: string; phone: string; email: string; };
  org_structure: OrgStructureEntry[];
  vehicles: VehicleEntry[];
  facility_data: { capacity_tons_day: string; processing_method: string; environmental_approval: string; location_coordinates: string; service_area: string; };
  safety_procedures: { spill_response: string; odor_control: string; ppe_policy: string; emergency_contacts: string; monitoring_plan: string; };
  workforce: WorkforceEntry[];
  notes: string;
}

const defaultForm = (): FormState => ({
  plan_year: new Date().getFullYear(),
  plan_type: 'auto',
  waste_categories: [],
  company_data: { name: '', commercial_register: '', tax_card: '', previous_license: '', address: '', representative: '', phone: '', email: '' },
  org_structure: [],
  vehicles: [],
  facility_data: { capacity_tons_day: '', processing_method: '', environmental_approval: '', location_coordinates: '', service_area: '' },
  safety_procedures: { spill_response: '', odor_control: '', ppe_policy: '', emergency_contacts: '', monitoring_plan: '' },
  workforce: [],
  notes: '',
});

export default function DisposalAnnualPlan() {
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
    queryKey: ['disposal-annual-plans', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('transporter_annual_plans').select('*').eq('organization_id', orgId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  const handleAutoGenerate = async () => {
    if (!orgId) return;
    setGenerating(true);
    try {
      const { data: org } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (org) {
        setForm(prev => ({
          ...prev,
          company_data: {
            name: org.name || '', commercial_register: (org as any).commercial_register || '',
            tax_card: (org as any).tax_card || '', previous_license: (org as any).environmental_license || '',
            address: (org as any).address || '', representative: (org as any).representative_name || '',
            phone: (org as any).phone || '', email: (org as any).email || '',
          },
          org_structure: [
            { department: 'الإدارة العليا', position: 'مدير المرفق', person_name: (org as any).representative_name || '', phone: (org as any).phone || '', responsibilities: 'الإشراف العام على عمليات التخلص' },
            { department: 'الإدارة العليا', position: 'المدير التنفيذي', person_name: '', phone: '', responsibilities: 'إدارة العمليات اليومية' },
            { department: 'الإدارة الفنية', position: 'مدير العمليات', person_name: '', phone: '', responsibilities: 'إدارة عمليات استقبال ومعالجة المخلفات' },
            { department: 'الإدارة الفنية', position: 'مشرف الموقع', person_name: '', phone: '', responsibilities: 'الإشراف الميداني على المدفن/المحطة' },
            { department: 'إدارة السلامة والبيئة', position: 'مسؤول السلامة والبيئة', person_name: '', phone: '', responsibilities: 'الامتثال للمعايير البيئية ومراقبة الانبعاثات والمخلفات السائلة' },
            { department: 'نظام التتبع والقبول', position: 'مسؤول الاستقبال والميزان', person_name: '', phone: '', responsibilities: 'تسجيل الشحنات الواردة والتحقق من الأوزان والمستندات' },
          ],
        }));
      }

      const { data: drivers } = await supabase.from('drivers').select('*, profile:profiles(full_name)').eq('organization_id', orgId);
      if (drivers?.length) {
        setForm(prev => ({
          ...prev,
          vehicles: drivers.map(d => ({ plate_number: d.vehicle_plate || '', vehicle_type: d.vehicle_type || '', capacity: '', condition: 'صالحة', covered: true, license_expiry: '', insurance_expiry: '' })),
          workforce: [
            { role: 'مشغل معدات', count: drivers.length, training_status: 'مدرب' },
            { role: 'فني معالجة', count: 0, training_status: '' },
            { role: 'مشرف ميداني', count: 0, training_status: '' },
            { role: 'مسؤول ميزان', count: 0, training_status: '' },
          ],
        }));
      }

      // Detect waste categories from received shipments
      const { data: shipments } = await supabase.from('shipments').select('waste_type').or(`recycler_id.eq.${orgId},disposal_facility_id.eq.${orgId}`).limit(100);
      if (shipments?.length) {
        const cats = new Set<string>();
        shipments.forEach((s: any) => {
          if (['chemical', 'electronic'].includes(s.waste_type)) cats.add('hazardous');
          else if (s.waste_type === 'medical') cats.add('medical');
          else if (s.waste_type === 'construction') cats.add('construction');
          else cats.add('municipal_solid');
        });
        setForm(prev => ({ ...prev, waste_categories: Array.from(cats) }));
      }

      const { data: licenses } = await supabase.from('legal_licenses').select('license_number, license_name, license_category, expiry_date').eq('organization_id', orgId).order('expiry_date', { ascending: false }).limit(1);
      if (licenses?.length) {
        setForm(prev => ({ ...prev, company_data: { ...prev.company_data, previous_license: prev.company_data.previous_license || `${licenses[0].license_category || ''} - ${licenses[0].license_number || ''}` } }));
      }

      toast.success('تم توليد البيانات تلقائياً من النظام');
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد البيانات');
    } finally {
      setGenerating(false);
    }
  };

  const updateCompany = (f: string, v: string) => setForm(p => ({ ...p, company_data: { ...p.company_data, [f]: v } }));
  const updateFacility = (f: string, v: string) => setForm(p => ({ ...p, facility_data: { ...p.facility_data, [f]: v } }));
  const updateSafety = (f: string, v: string) => setForm(p => ({ ...p, safety_procedures: { ...p.safety_procedures, [f]: v } }));

  const addOrgEntry = () => setForm(p => ({ ...p, org_structure: [...p.org_structure, { department: '', position: '', person_name: '', phone: '', responsibilities: '' }] }));
  const removeOrgEntry = (i: number) => setForm(p => ({ ...p, org_structure: p.org_structure.filter((_, idx) => idx !== i) }));
  const updateOrgEntry = (i: number, f: keyof OrgStructureEntry, v: string) => { setForm(p => { const os = [...p.org_structure]; os[i] = { ...os[i], [f]: v }; return { ...p, org_structure: os }; }); };

  const addVehicle = () => setForm(p => ({ ...p, vehicles: [...p.vehicles, { plate_number: '', vehicle_type: '', capacity: '', condition: 'صالحة', covered: true, license_expiry: '', insurance_expiry: '' }] }));
  const removeVehicle = (i: number) => setForm(p => ({ ...p, vehicles: p.vehicles.filter((_, idx) => idx !== i) }));
  const updateVehicle = (i: number, f: keyof VehicleEntry, v: any) => { setForm(p => { const vs = [...p.vehicles]; vs[i] = { ...vs[i], [f]: v }; return { ...p, vehicles: vs }; }); };

  const addWorker = () => setForm(p => ({ ...p, workforce: [...p.workforce, { role: '', count: 0, training_status: '' }] }));
  const removeWorker = (i: number) => setForm(p => ({ ...p, workforce: p.workforce.filter((_, idx) => idx !== i) }));
  const updateWorker = (i: number, f: keyof WorkforceEntry, v: any) => { setForm(p => { const ws = [...p.workforce]; ws[i] = { ...ws[i], [f]: v }; return { ...p, workforce: ws }; }); };

  const toggleCategory = (cat: string) => setForm(p => ({ ...p, waste_categories: p.waste_categories.includes(cat) ? p.waste_categories.filter(c => c !== cat) : [...p.waste_categories, cat] }));

  const handleSave = async (asDraft = true) => {
    if (!orgId) return;
    setCreating(true);
    try {
      const payload = {
        organization_id: orgId, plan_number: '', plan_year: form.plan_year, plan_type: form.plan_type,
        waste_categories: form.waste_categories, company_data: form.company_data,
        vehicles_data: form.vehicles,
        operations_data: { org_structure: form.org_structure, facility_data: form.facility_data, entity_type: 'disposal' },
        disposal_plan: form.facility_data,
        safety_procedures: form.safety_procedures,
        workforce_data: { workforce: form.workforce },
        subcontractors: [],
        notes: form.notes || null,
        status: asDraft ? 'draft' : 'submitted',
        submitted_at: asDraft ? null : new Date().toISOString(),
        submitted_by: asDraft ? null : profile?.id,
      };

      if (editingPlan) {
        const { error } = await supabase.from('transporter_annual_plans').update({ ...payload, updated_at: new Date().toISOString() } as any).eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('تم تحديث الخطة');
      } else {
        const { error } = await supabase.from('transporter_annual_plans').insert({ ...payload, created_by: profile?.id } as any);
        if (error) throw error;
        toast.success(asDraft ? 'تم حفظ المسودة' : 'تم تقديم الخطة');
      }
      queryClient.invalidateQueries({ queryKey: ['disposal-annual-plans'] });
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => { setShowCreate(false); setEditingPlan(null); setForm(defaultForm()); setActiveSection('company'); };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    const cd = plan.company_data || {}; const sp = plan.safety_procedures || {}; const od = plan.operations_data || {}; const wd = plan.workforce_data || {};
    const fd = od.facility_data || plan.disposal_plan || {};
    setForm({
      plan_year: plan.plan_year, plan_type: plan.plan_type, waste_categories: plan.waste_categories || [],
      company_data: { name: cd.name || '', commercial_register: cd.commercial_register || '', tax_card: cd.tax_card || '', previous_license: cd.previous_license || '', address: cd.address || '', representative: cd.representative || '', phone: cd.phone || '', email: cd.email || '' },
      org_structure: od.org_structure || [],
      vehicles: plan.vehicles_data || [],
      facility_data: { capacity_tons_day: fd.capacity_tons_day || '', processing_method: fd.processing_method || '', environmental_approval: fd.environmental_approval || '', location_coordinates: fd.location_coordinates || '', service_area: fd.service_area || '' },
      safety_procedures: { spill_response: sp.spill_response || '', odor_control: sp.odor_control || '', ppe_policy: sp.ppe_policy || '', emergency_contacts: sp.emergency_contacts || '', monitoring_plan: sp.monitoring_plan || '' },
      workforce: wd.workforce || [],
      notes: plan.notes || '',
    });
    setShowCreate(true);
  };

  const sections = [
    { id: 'company', label: 'بيانات المرفق', icon: Factory },
    { id: 'org_structure', label: 'الهيكل التنظيمي', icon: Users },
    { id: 'waste', label: 'أنواع المخلفات', icon: ClipboardList },
    { id: 'facility', label: 'بيانات المنشأة', icon: Factory },
    { id: 'vehicles', label: 'المعدات', icon: Truck },
    { id: 'safety', label: 'السلامة والبيئة', icon: Shield },
    { id: 'workforce', label: 'العمالة والتدريب', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />خطة العمل السنوية - التخلص النهائي</h2>
          <p className="text-sm text-muted-foreground mt-1">وفقاً لقانون 202 لسنة 2020 - إلزامية للحصول على ترخيص WMRA</p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2"><Plus className="h-4 w-4" />إنشاء خطة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{plans.length}</p><p className="text-xs text-muted-foreground">إجمالي الخطط</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{plans.filter((p: any) => p.status === 'approved').length}</p><p className="text-xs text-muted-foreground">معتمدة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-accent-foreground">{plans.filter((p: any) => p.status === 'submitted').length}</p><p className="text-xs text-muted-foreground">مقدمة</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{plans.filter((p: any) => p.status === 'draft').length}</p><p className="text-xs text-muted-foreground">مسودات</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>سجل الخطط السنوية</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : plans.length === 0 ? <p className="text-center text-muted-foreground py-8">لا توجد خطط بعد</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>رقم الخطة</TableHead><TableHead>السنة</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-mono text-xs">{plan.plan_number}</TableCell>
                    <TableCell>{plan.plan_year}</TableCell>
                    <TableCell><Badge variant="outline">{plan.plan_type === 'auto' ? 'تلقائي' : 'يدوي'}</Badge></TableCell>
                    <TableCell><Badge variant={STATUS_MAP[plan.status]?.variant || 'outline'}>{STATUS_MAP[plan.status]?.label || plan.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setPreviewPlan({ ...plan, entity_type: 'disposal' }); setShowPreview(true); }}><Eye className="h-4 w-4" /></Button>
                        {(plan.status === 'draft' || plan.status === 'rejected') && <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}><Pencil className="h-4 w-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); else setShowCreate(true); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPlan ? 'تعديل الخطة السنوية' : 'إنشاء خطة عمل سنوية - التخلص النهائي'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div><Label>السنة</Label><Input type="number" value={form.plan_year} onChange={e => setForm(p => ({ ...p, plan_year: parseInt(e.target.value) || new Date().getFullYear() }))} /></div>
              <div><Label>نوع الإعداد</Label>
                <Select value={form.plan_type} onValueChange={(v) => setForm(p => ({ ...p, plan_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="auto">تلقائي (من النظام)</SelectItem><SelectItem value="manual">يدوي</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-end">{form.plan_type === 'auto' && <Button onClick={handleAutoGenerate} disabled={generating} variant="outline" className="gap-2 w-full">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}توليد تلقائي</Button>}</div>
            </div>

            <div className="flex gap-1 flex-wrap">
              {sections.map(s => (<Button key={s.id} size="sm" variant={activeSection === s.id ? 'default' : 'outline'} onClick={() => setActiveSection(s.id)} className="gap-1 text-xs"><s.icon className="h-3 w-3" /> {s.label}</Button>))}
            </div>

            {activeSection === 'company' && (
              <Card><CardHeader><CardTitle className="text-sm">بيانات جهة التخلص النهائي</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">اسم المرفق</Label><Input value={form.company_data.name} onChange={e => updateCompany('name', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">السجل التجاري</Label><Input value={form.company_data.commercial_register} onChange={e => updateCompany('commercial_register', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">البطاقة الضريبية</Label><Input value={form.company_data.tax_card} onChange={e => updateCompany('tax_card', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الترخيص السابق</Label><Input value={form.company_data.previous_license} onChange={e => updateCompany('previous_license', e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">العنوان</Label><Input value={form.company_data.address} onChange={e => updateCompany('address', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الممثل القانوني</Label><Input value={form.company_data.representative} onChange={e => updateCompany('representative', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الهاتف</Label><Input value={form.company_data.phone} onChange={e => updateCompany('phone', e.target.value)} className="h-8 text-sm" /></div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'org_structure' && (
              <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">الهيكل التنظيمي (طبقاً لقانون 202/2020)</CardTitle><Button size="sm" variant="outline" onClick={addOrgEntry} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة</Button></CardHeader>
                <CardContent>
                  {form.org_structure.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">اضغط "توليد تلقائي" لإنشاء الهيكل</p> : (
                    <Table><TableHeader><TableRow><TableHead className="text-xs p-1">الإدارة</TableHead><TableHead className="text-xs p-1">المنصب</TableHead><TableHead className="text-xs p-1">الاسم</TableHead><TableHead className="text-xs p-1">الهاتف</TableHead><TableHead className="text-xs p-1">المسؤوليات</TableHead><TableHead className="text-xs p-1 w-8"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {form.org_structure.map((o, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={o.department} onChange={e => updateOrgEntry(i, 'department', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={o.position} onChange={e => updateOrgEntry(i, 'position', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={o.person_name} onChange={e => updateOrgEntry(i, 'person_name', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={o.phone} onChange={e => updateOrgEntry(i, 'phone', e.target.value)} className="h-6 text-xs w-28" /></TableCell>
                            <TableCell className="p-1"><Input value={o.responsibilities} onChange={e => updateOrgEntry(i, 'responsibilities', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeOrgEntry(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'waste' && (
              <Card><CardHeader><CardTitle className="text-sm">أنواع المخلفات المستقبَلة</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {WASTE_CATEGORIES_OPTIONS.map(cat => (<div key={cat.value} className="flex items-center gap-2"><Checkbox checked={form.waste_categories.includes(cat.value)} onCheckedChange={() => toggleCategory(cat.value)} /><Label className="text-sm">{cat.label}</Label></div>))}
                </CardContent>
              </Card>
            )}

            {activeSection === 'facility' && (
              <Card><CardHeader><CardTitle className="text-sm">بيانات المنشأة والقدرة الاستيعابية</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">السعة اليومية (طن/يوم)</Label><Input value={form.facility_data.capacity_tons_day} onChange={e => updateFacility('capacity_tons_day', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">طريقة المعالجة / التخلص</Label><Input value={form.facility_data.processing_method} onChange={e => updateFacility('processing_method', e.target.value)} className="h-8 text-sm" placeholder="دفن صحي / حرق / معالجة بيولوجية" /></div>
                  <div><Label className="text-xs">رقم الموافقة البيئية</Label><Input value={form.facility_data.environmental_approval} onChange={e => updateFacility('environmental_approval', e.target.value)} className="h-8 text-sm" /></div>
                  <div><Label className="text-xs">الإحداثيات الجغرافية</Label><Input value={form.facility_data.location_coordinates} onChange={e => updateFacility('location_coordinates', e.target.value)} className="h-8 text-sm" /></div>
                  <div className="col-span-2"><Label className="text-xs">نطاق الخدمة المكاني</Label><Input value={form.facility_data.service_area} onChange={e => updateFacility('service_area', e.target.value)} className="h-8 text-sm" placeholder="المحافظات / المناطق التي يخدمها المرفق" /></div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'vehicles' && (
              <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">المعدات والمركبات</CardTitle><Button size="sm" variant="outline" onClick={addVehicle} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة</Button></CardHeader>
                <CardContent>
                  {form.vehicles.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد معدات</p> : (
                    <Table><TableHeader><TableRow><TableHead className="text-xs p-1">اللوحة/الرقم</TableHead><TableHead className="text-xs p-1">النوع</TableHead><TableHead className="text-xs p-1">السعة</TableHead><TableHead className="text-xs p-1">الحالة</TableHead><TableHead className="text-xs p-1 w-8"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {form.vehicles.map((v, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={v.plate_number} onChange={e => updateVehicle(i, 'plate_number', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={v.vehicle_type} onChange={e => updateVehicle(i, 'vehicle_type', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={v.capacity} onChange={e => updateVehicle(i, 'capacity', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input value={v.condition} onChange={e => updateVehicle(i, 'condition', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeVehicle(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'safety' && (
              <Card><CardHeader><CardTitle className="text-sm">إجراءات السلامة والرقابة البيئية</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-xs">إجراءات التعامل مع الحوادث والتسرب</Label><Textarea value={form.safety_procedures.spill_response} onChange={e => updateSafety('spill_response', e.target.value)} className="text-sm" rows={3} /></div>
                  <div><Label className="text-xs">تدابير مكافحة الروائح والانبعاثات</Label><Textarea value={form.safety_procedures.odor_control} onChange={e => updateSafety('odor_control', e.target.value)} className="text-sm" rows={3} /></div>
                  <div><Label className="text-xs">خطة الرصد البيئي (مياه جوفية، هواء، تربة)</Label><Textarea value={form.safety_procedures.monitoring_plan} onChange={e => updateSafety('monitoring_plan', e.target.value)} className="text-sm" rows={3} /></div>
                  <div><Label className="text-xs">سياسة PPE</Label><Textarea value={form.safety_procedures.ppe_policy} onChange={e => updateSafety('ppe_policy', e.target.value)} className="text-sm" rows={2} /></div>
                  <div><Label className="text-xs">جهات اتصال الطوارئ</Label><Textarea value={form.safety_procedures.emergency_contacts} onChange={e => updateSafety('emergency_contacts', e.target.value)} className="text-sm" rows={2} /></div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'workforce' && (
              <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">العمالة والتدريب</CardTitle><Button size="sm" variant="outline" onClick={addWorker} className="gap-1 text-xs"><Plus className="h-3 w-3" /> إضافة</Button></CardHeader>
                <CardContent>
                  {form.workforce.length === 0 ? <p className="text-center text-muted-foreground text-sm py-4">لا توجد بيانات</p> : (
                    <Table><TableHeader><TableRow><TableHead className="text-xs p-1">الدور الوظيفي</TableHead><TableHead className="text-xs p-1">العدد</TableHead><TableHead className="text-xs p-1">حالة التدريب</TableHead><TableHead className="text-xs p-1 w-8"></TableHead></TableRow></TableHeader>
                      <TableBody>
                        {form.workforce.map((w, i) => (
                          <TableRow key={i}>
                            <TableCell className="p-1"><Input value={w.role} onChange={e => updateWorker(i, 'role', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Input type="number" value={w.count} onChange={e => updateWorker(i, 'count', parseInt(e.target.value) || 0)} className="h-6 text-xs w-16" /></TableCell>
                            <TableCell className="p-1"><Input value={w.training_status} onChange={e => updateWorker(i, 'training_status', e.target.value)} className="h-6 text-xs" /></TableCell>
                            <TableCell className="p-1"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeWorker(i)}><X className="h-3 w-3 text-destructive" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات إضافية..." /></div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button variant="secondary" onClick={() => handleSave(true)} disabled={creating}>{creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}حفظ كمسودة</Button>
              <Button onClick={() => handleSave(false)} disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}تقديم الخطة</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Printer className="h-5 w-5" /> معاينة الخطة</DialogTitle></DialogHeader>
          {previewPlan && <AnnualPlanPrintView plan={previewPlan} organization={organization} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
