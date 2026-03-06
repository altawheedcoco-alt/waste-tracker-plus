import { useState, useRef } from 'react';
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
import { FileText, Plus, Printer, Send, Loader2, Biohazard, Recycle, Stethoscope, Eye, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import DeclarationPrintView from './DeclarationPrintView';

const WASTE_CATEGORIES = [
  { value: 'hazardous', label: 'مخلفات خطرة', icon: Biohazard, color: 'text-destructive' },
  { value: 'non_hazardous', label: 'مخلفات غير خطرة', icon: Recycle, color: 'text-primary' },
  { value: 'medical', label: 'مخلفات طبية', icon: Stethoscope, color: 'text-orange-600' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'مسودة', variant: 'outline' },
  submitted: { label: 'مقدم', variant: 'default' },
  accepted: { label: 'مقبول', variant: 'secondary' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

interface ShipmentEntry {
  shipment_number: string;
  waste_type: string;
  quantity: number;
  unit: string;
  date: string; // single date (تاريخ التسليم/الاستلام)
  driver_name: string;
  vehicle_plate: string;
  license_number: string;
}

interface EntityGroup {
  id: string;
  name: string;
  commercial_register?: string;
  environmental_license?: string;
  address?: string;
  city?: string;
  representative_name?: string;
  included: boolean; // whether to include in declaration
  shipments: ShipmentEntry[];
}

interface DeclarationData {
  generators: EntityGroup[];
  recyclers: EntityGroup[];
}

export default function TransporterDeclarations() {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDeclaration, setPreviewDeclaration] = useState<any>(null);
  const [editingDeclaration, setEditingDeclaration] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [formType, setFormType] = useState<'manual' | 'auto'>('auto');
  const [formCategory, setFormCategory] = useState<string>('hazardous');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [generatingData, setGeneratingData] = useState(false);
  const [generatedData, setGeneratedData] = useState<DeclarationData | null>(null);

  const orgId = organization?.id;

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['transporter-declarations', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transporter_declarations')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  // Auto-generate from shipments
  const handleAutoGenerate = async () => {
    if (!orgId || !periodFrom || !periodTo) {
      toast.error('يرجى تحديد الفترة الزمنية');
      return;
    }
    setGeneratingData(true);
    try {
      const categoryWasteTypes: Record<string, string[]> = {
        hazardous: ['chemical', 'electronic'],
        non_hazardous: ['plastic', 'paper', 'metal', 'glass', 'organic', 'construction', 'other'],
        medical: ['medical'],
      };
      const wasteTypes = categoryWasteTypes[formCategory] || [];

      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('transporter_id', orgId)
        .gte('created_at', periodFrom)
        .lte('created_at', periodTo + 'T23:59:59')
        .in('waste_type', wasteTypes as any)
        .in('status', ['delivered', 'confirmed', 'completed'] as any)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!shipments?.length) {
        toast.info('لا توجد شحنات في هذه الفترة لهذا التصنيف');
        setGeneratingData(false);
        return;
      }

      const orgIds = new Set<string>();
      const driverIds = new Set<string>();
      shipments.forEach(s => {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
        if (s.disposal_facility_id) orgIds.add(s.disposal_facility_id);
        if (s.driver_id) driverIds.add(s.driver_id);
      });

      const [orgsRes, driversRes] = await Promise.all([
        orgIds.size > 0
          ? supabase.from('organizations').select('id, name, commercial_register, environmental_license, address, city, representative_name').in('id', Array.from(orgIds))
          : { data: [] },
        driverIds.size > 0
          ? supabase.from('drivers').select('id, license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone)').in('id', Array.from(driverIds))
          : { data: [] },
      ]);

      const orgsMap = new Map<string, any>();
      (orgsRes.data || []).forEach(o => orgsMap.set(o.id, o));
      const driversMap = new Map<string, any>();
      (driversRes.data || []).forEach(d => {
        driversMap.set(d.id, { ...d, profile: Array.isArray(d.profile) ? d.profile[0] : d.profile });
      });

      const generatorGroups = new Map<string, EntityGroup>();
      const recyclerGroups = new Map<string, EntityGroup>();

      shipments.forEach(s => {
        const genId = s.generator_id || 'unknown';
        const genOrg = orgsMap.get(genId);
        const driver = s.driver_id ? driversMap.get(s.driver_id) : null;
        // Use delivered_at as main date (تاريخ التسليم = تاريخ الاستلام)
        const shipDate = s.delivered_at || s.pickup_date || s.created_at;

        if (!generatorGroups.has(genId)) {
          generatorGroups.set(genId, {
            id: genId,
            name: genOrg?.name || s.manual_disposal_name || 'غير محدد',
            commercial_register: genOrg?.commercial_register,
            environmental_license: genOrg?.environmental_license,
            address: genOrg?.address,
            city: genOrg?.city,
            representative_name: genOrg?.representative_name,
            included: true,
            shipments: [],
          });
        }
        generatorGroups.get(genId)!.shipments.push({
          shipment_number: s.shipment_number,
          waste_type: s.waste_type,
          quantity: s.quantity,
          unit: s.unit,
          date: shipDate ? shipDate.split('T')[0] : '',
          driver_name: driver?.profile?.full_name || s.manual_driver_name || '',
          vehicle_plate: driver?.vehicle_plate || s.manual_vehicle_plate || '',
          license_number: driver?.license_number || '',
        });

        const recId = s.recycler_id || s.disposal_facility_id || 'unknown';
        const recOrg = orgsMap.get(recId);
        if (!recyclerGroups.has(recId)) {
          recyclerGroups.set(recId, {
            id: recId,
            name: recOrg?.name || 'غير محدد',
            commercial_register: recOrg?.commercial_register,
            environmental_license: recOrg?.environmental_license,
            address: recOrg?.address,
            city: recOrg?.city,
            representative_name: recOrg?.representative_name,
            included: true,
            shipments: [],
          });
        }
        recyclerGroups.get(recId)!.shipments.push({
          shipment_number: s.shipment_number,
          waste_type: s.waste_type,
          quantity: s.quantity,
          unit: s.unit,
          date: shipDate ? shipDate.split('T')[0] : '',
          driver_name: driver?.profile?.full_name || s.manual_driver_name || '',
          vehicle_plate: driver?.vehicle_plate || s.manual_vehicle_plate || '',
          license_number: driver?.license_number || '',
        });
      });

      setGeneratedData({
        generators: Array.from(generatorGroups.values()),
        recyclers: Array.from(recyclerGroups.values()),
      });
      toast.success(`تم توليد البيانات: ${shipments.length} شحنة`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد البيانات');
    } finally {
      setGeneratingData(false);
    }
  };

  // Toggle entity inclusion
  const toggleEntity = (type: 'generators' | 'recyclers', idx: number) => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type]];
    updated[type][idx] = { ...updated[type][idx], included: !updated[type][idx].included };
    setGeneratedData(updated);
  };

  // Edit shipment field inline
  const editShipmentField = (type: 'generators' | 'recyclers', entityIdx: number, shipIdx: number, field: keyof ShipmentEntry, value: any) => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type]];
    updated[type][entityIdx] = { ...updated[type][entityIdx], shipments: [...updated[type][entityIdx].shipments] };
    updated[type][entityIdx].shipments[shipIdx] = { ...updated[type][entityIdx].shipments[shipIdx], [field]: value };
    setGeneratedData(updated);
  };

  // Remove a shipment
  const removeShipment = (type: 'generators' | 'recyclers', entityIdx: number, shipIdx: number) => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type]];
    updated[type][entityIdx] = { ...updated[type][entityIdx], shipments: updated[type][entityIdx].shipments.filter((_, i) => i !== shipIdx) };
    setGeneratedData(updated);
  };

  // Add manual shipment
  const addManualShipment = (type: 'generators' | 'recyclers', entityIdx: number) => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type]];
    updated[type][entityIdx] = {
      ...updated[type][entityIdx],
      shipments: [...updated[type][entityIdx].shipments, {
        shipment_number: '',
        waste_type: '',
        quantity: 0,
        unit: 'طن',
        date: '',
        driver_name: '',
        vehicle_plate: '',
        license_number: '',
      }],
    };
    setGeneratedData(updated);
  };

  // Add manual entity
  const addManualEntity = (type: 'generators' | 'recyclers') => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type], {
      id: `manual-${Date.now()}`,
      name: '',
      included: true,
      shipments: [{
        shipment_number: '',
        waste_type: '',
        quantity: 0,
        unit: 'طن',
        date: '',
        driver_name: '',
        vehicle_plate: '',
        license_number: '',
      }],
    }];
    setGeneratedData(updated);
  };

  // Edit entity field
  const editEntityField = (type: 'generators' | 'recyclers', idx: number, field: string, value: string) => {
    if (!generatedData) return;
    const updated = { ...generatedData };
    updated[type] = [...updated[type]];
    updated[type][idx] = { ...updated[type][idx], [field]: value };
    setGeneratedData(updated);
  };

  // Filter only included entities for saving
  const getFilteredData = (data: DeclarationData) => ({
    generators: data.generators.filter(g => g.included),
    recyclers: data.recyclers.filter(r => r.included),
  });

  const handleSave = async (asDraft = true) => {
    if (!orgId || !periodFrom || !periodTo) {
      toast.error('يرجى ملء كافة الحقول المطلوبة');
      return;
    }
    setCreating(true);
    try {
      const filtered = generatedData ? getFilteredData(generatedData) : { generators: [], recyclers: [] };
      const totalShipments = filtered.generators.reduce((sum, g) => sum + g.shipments.length, 0);
      const totalQty = filtered.generators.reduce((sum, g) => sum + g.shipments.reduce((s2, sh) => s2 + sh.quantity, 0), 0);

      if (editingDeclaration) {
        // Update existing
        const { error } = await supabase.from('transporter_declarations')
          .update({
            declaration_type: formType,
            waste_category: formCategory,
            period_from: periodFrom,
            period_to: periodTo,
            status: asDraft ? 'draft' : 'submitted',
            total_shipments: totalShipments,
            total_quantity: totalQty,
            declaration_data: filtered,
            notes: manualNotes || null,
            submitted_at: asDraft ? null : new Date().toISOString(),
            submitted_by: asDraft ? null : profile?.id,
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', editingDeclaration.id);
        if (error) throw error;
        toast.success('تم تحديث الإقرار');
      } else {
        const { error } = await supabase.from('transporter_declarations').insert({
          organization_id: orgId,
          declaration_number: '',
          declaration_type: formType,
          waste_category: formCategory,
          period_from: periodFrom,
          period_to: periodTo,
          status: asDraft ? 'draft' : 'submitted',
          total_shipments: totalShipments,
          total_quantity: totalQty,
          declaration_data: filtered,
          notes: manualNotes || null,
          submitted_at: asDraft ? null : new Date().toISOString(),
          submitted_by: asDraft ? null : profile?.id,
          created_by: profile?.id,
        } as any);
        if (error) throw error;
        toast.success(asDraft ? 'تم حفظ المسودة' : 'تم تقديم الإقرار');
      }
      queryClient.invalidateQueries({ queryKey: ['transporter-declarations'] });
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
    setEditingDeclaration(null);
    setFormType('auto');
    setFormCategory('hazardous');
    setPeriodFrom('');
    setPeriodTo('');
    setManualNotes('');
    setGeneratedData(null);
  };

  const handleEdit = (dec: any) => {
    setEditingDeclaration(dec);
    setFormType(dec.declaration_type);
    setFormCategory(dec.waste_category);
    setPeriodFrom(dec.period_from);
    setPeriodTo(dec.period_to);
    setManualNotes(dec.notes || '');
    // Load saved data with included flag
    const savedData = dec.declaration_data as any;
    if (savedData?.generators || savedData?.recyclers) {
      setGeneratedData({
        generators: (savedData.generators || []).map((g: any) => ({ ...g, included: g.included !== false })),
        recyclers: (savedData.recyclers || []).map((r: any) => ({ ...r, included: r.included !== false })),
      });
    } else {
      setGeneratedData({ generators: [], recyclers: [] });
    }
    setShowCreate(true);
  };

  const handlePreview = (dec: any) => {
    setPreviewDeclaration(dec);
    setShowPreview(true);
  };

  const handleSubmit = async (id: string) => {
    const { error } = await supabase
      .from('transporter_declarations')
      .update({ status: 'submitted', submitted_at: new Date().toISOString(), submitted_by: profile?.id } as any)
      .eq('id', id);
    if (error) toast.error('حدث خطأ');
    else {
      toast.success('تم تقديم الإقرار');
      queryClient.invalidateQueries({ queryKey: ['transporter-declarations'] });
    }
  };

  const categoryLabel = (cat: string) => WASTE_CATEGORIES.find(c => c.value === cat)?.label || cat;
  const includedGenerators = generatedData?.generators.filter(g => g.included) || [];
  const includedRecyclers = generatedData?.recyclers.filter(r => r.included) || [];
  const totalShipments = includedGenerators.reduce((s, g) => s + g.shipments.length, 0);
  const totalQty = includedGenerators.reduce((s, g) => s + g.shipments.reduce((s2, sh) => s2 + sh.quantity, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            إقرارات الناقل الدورية
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إقرارات دورية تُقدم لجهاز تنظيم إدارة المخلفات (WMRA) عن المخلفات المنقولة
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowCreate(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء إقرار
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {WASTE_CATEGORIES.map(cat => {
          const count = declarations.filter((d: any) => d.waste_category === cat.value).length;
          const Icon = cat.icon;
          return (
            <Card key={cat.value}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-8 w-8 ${cat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{cat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Send className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{declarations.filter((d: any) => d.status === 'submitted').length}</p>
              <p className="text-xs text-muted-foreground">مقدمة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Declarations List */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الإقرارات</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : declarations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد إقرارات بعد</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الإقرار</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الفترة</TableHead>
                  <TableHead>الشحنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((dec: any) => (
                  <TableRow key={dec.id}>
                    <TableCell className="font-mono text-xs">{dec.declaration_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dec.declaration_type === 'auto' ? 'تلقائي' : 'يدوي'}</Badge>
                    </TableCell>
                    <TableCell>{categoryLabel(dec.waste_category)}</TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(dec.period_from), 'yyyy/MM/dd')} - {format(new Date(dec.period_to), 'yyyy/MM/dd')}
                    </TableCell>
                    <TableCell>{dec.total_shipments}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[dec.status]?.variant || 'outline'}>
                        {STATUS_MAP[dec.status]?.label || dec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handlePreview(dec)} title="معاينة">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(dec.status === 'draft' || dec.status === 'rejected') && (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(dec)} title="تعديل">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {dec.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmit(dec.id)} title="تقديم">
                            <Send className="h-4 w-4" />
                          </Button>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeclaration ? 'تعديل الإقرار' : 'إنشاء إقرار جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الإقرار</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as 'manual' | 'auto')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">تلقائي (من النظام)</SelectItem>
                    <SelectItem value="manual">يدوي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>تصنيف المخلفات</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WASTE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>من تاريخ</Label>
                <Input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
              </div>
            </div>

            {/* Auto generate button */}
            {formType === 'auto' && (
              <Button
                onClick={handleAutoGenerate}
                disabled={generatingData || !periodFrom || !periodTo}
                variant="outline"
                className="gap-2"
              >
                {generatingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                توليد البيانات من الشحنات
              </Button>
            )}

            {/* Manual mode: initialize empty data */}
            {formType === 'manual' && !generatedData && (
              <Button variant="outline" onClick={() => setGeneratedData({ generators: [], recyclers: [] })} className="gap-2">
                <Plus className="h-4 w-4" />
                بدء إدخال البيانات يدوياً
              </Button>
            )}

            {/* Editable Data Section */}
            {generatedData && (
              <div className="space-y-4">
                {/* Summary */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-3">
                    <div className="grid grid-cols-4 gap-2 text-sm text-center">
                      <div><strong>{includedGenerators.length}</strong><br /><span className="text-xs text-muted-foreground">جهة مولدة</span></div>
                      <div><strong>{includedRecyclers.length}</strong><br /><span className="text-xs text-muted-foreground">جهة تدوير/تخلص</span></div>
                      <div><strong>{totalShipments}</strong><br /><span className="text-xs text-muted-foreground">شحنة</span></div>
                      <div><strong>{totalQty.toFixed(2)}</strong><br /><span className="text-xs text-muted-foreground">إجمالي الكمية</span></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generators */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">الجهات المولدة (المستلم منها)</h3>
                    <Button size="sm" variant="outline" onClick={() => addManualEntity('generators')} className="gap-1 text-xs">
                      <Plus className="h-3 w-3" /> إضافة جهة
                    </Button>
                  </div>
                  {generatedData.generators.map((gen, gi) => (
                    <Card key={gen.id} className={`mb-3 ${!gen.included ? 'opacity-50' : ''}`}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={gen.included}
                            onCheckedChange={() => toggleEntity('generators', gi)}
                          />
                          <Input
                            value={gen.name}
                            onChange={e => editEntityField('generators', gi, 'name', e.target.value)}
                            placeholder="اسم الجهة المولدة"
                            className="font-semibold text-sm h-8"
                          />
                        </div>
                        {gen.included && (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <Input placeholder="سجل تجاري" value={gen.commercial_register || ''} onChange={e => editEntityField('generators', gi, 'commercial_register', e.target.value)} className="h-7 text-xs" />
                              <Input placeholder="ترخيص بيئي" value={gen.environmental_license || ''} onChange={e => editEntityField('generators', gi, 'environmental_license', e.target.value)} className="h-7 text-xs" />
                              <Input placeholder="الممثل القانوني" value={gen.representative_name || ''} onChange={e => editEntityField('generators', gi, 'representative_name', e.target.value)} className="h-7 text-xs" />
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs p-1">رقم الشحنة</TableHead>
                                  <TableHead className="text-xs p-1">نوع المخلف</TableHead>
                                  <TableHead className="text-xs p-1">الكمية</TableHead>
                                  <TableHead className="text-xs p-1">الوحدة</TableHead>
                                  <TableHead className="text-xs p-1">تاريخ التسليم</TableHead>
                                  <TableHead className="text-xs p-1">السائق</TableHead>
                                  <TableHead className="text-xs p-1">اللوحة</TableHead>
                                  <TableHead className="text-xs p-1">الرخصة</TableHead>
                                  <TableHead className="text-xs p-1 w-8"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {gen.shipments.map((sh, si) => (
                                  <TableRow key={si}>
                                    <TableCell className="p-1"><Input value={sh.shipment_number} onChange={e => editShipmentField('generators', gi, si, 'shipment_number', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.waste_type} onChange={e => editShipmentField('generators', gi, si, 'waste_type', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input type="number" value={sh.quantity} onChange={e => editShipmentField('generators', gi, si, 'quantity', parseFloat(e.target.value) || 0)} className="h-6 text-xs w-16" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.unit} onChange={e => editShipmentField('generators', gi, si, 'unit', e.target.value)} className="h-6 text-xs w-14" /></TableCell>
                                    <TableCell className="p-1"><Input type="date" value={sh.date} onChange={e => editShipmentField('generators', gi, si, 'date', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.driver_name} onChange={e => editShipmentField('generators', gi, si, 'driver_name', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.vehicle_plate} onChange={e => editShipmentField('generators', gi, si, 'vehicle_plate', e.target.value)} className="h-6 text-xs w-20" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.license_number} onChange={e => editShipmentField('generators', gi, si, 'license_number', e.target.value)} className="h-6 text-xs w-20" /></TableCell>
                                    <TableCell className="p-1">
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeShipment('generators', gi, si)}>
                                        <X className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Button size="sm" variant="ghost" onClick={() => addManualShipment('generators', gi)} className="text-xs gap-1">
                              <Plus className="h-3 w-3" /> إضافة شحنة
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recyclers */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">جهات التدوير / التخلص (المسلم إليها)</h3>
                    <Button size="sm" variant="outline" onClick={() => addManualEntity('recyclers')} className="gap-1 text-xs">
                      <Plus className="h-3 w-3" /> إضافة جهة
                    </Button>
                  </div>
                  {generatedData.recyclers.map((rec, ri) => (
                    <Card key={rec.id} className={`mb-3 ${!rec.included ? 'opacity-50' : ''}`}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={rec.included}
                            onCheckedChange={() => toggleEntity('recyclers', ri)}
                          />
                          <Input
                            value={rec.name}
                            onChange={e => editEntityField('recyclers', ri, 'name', e.target.value)}
                            placeholder="اسم جهة التدوير/التخلص"
                            className="font-semibold text-sm h-8"
                          />
                        </div>
                        {rec.included && (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <Input placeholder="سجل تجاري" value={rec.commercial_register || ''} onChange={e => editEntityField('recyclers', ri, 'commercial_register', e.target.value)} className="h-7 text-xs" />
                              <Input placeholder="ترخيص بيئي" value={rec.environmental_license || ''} onChange={e => editEntityField('recyclers', ri, 'environmental_license', e.target.value)} className="h-7 text-xs" />
                              <Input placeholder="الممثل القانوني" value={rec.representative_name || ''} onChange={e => editEntityField('recyclers', ri, 'representative_name', e.target.value)} className="h-7 text-xs" />
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs p-1">رقم الشحنة</TableHead>
                                  <TableHead className="text-xs p-1">نوع المخلف</TableHead>
                                  <TableHead className="text-xs p-1">الكمية</TableHead>
                                  <TableHead className="text-xs p-1">الوحدة</TableHead>
                                  <TableHead className="text-xs p-1">تاريخ التسليم</TableHead>
                                  <TableHead className="text-xs p-1">السائق</TableHead>
                                  <TableHead className="text-xs p-1">اللوحة</TableHead>
                                  <TableHead className="text-xs p-1 w-8"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rec.shipments.map((sh, si) => (
                                  <TableRow key={si}>
                                    <TableCell className="p-1"><Input value={sh.shipment_number} onChange={e => editShipmentField('recyclers', ri, si, 'shipment_number', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.waste_type} onChange={e => editShipmentField('recyclers', ri, si, 'waste_type', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input type="number" value={sh.quantity} onChange={e => editShipmentField('recyclers', ri, si, 'quantity', parseFloat(e.target.value) || 0)} className="h-6 text-xs w-16" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.unit} onChange={e => editShipmentField('recyclers', ri, si, 'unit', e.target.value)} className="h-6 text-xs w-14" /></TableCell>
                                    <TableCell className="p-1"><Input type="date" value={sh.date} onChange={e => editShipmentField('recyclers', ri, si, 'date', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.driver_name} onChange={e => editShipmentField('recyclers', ri, si, 'driver_name', e.target.value)} className="h-6 text-xs" /></TableCell>
                                    <TableCell className="p-1"><Input value={sh.vehicle_plate} onChange={e => editShipmentField('recyclers', ri, si, 'vehicle_plate', e.target.value)} className="h-6 text-xs w-20" /></TableCell>
                                    <TableCell className="p-1">
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeShipment('recyclers', ri, si)}>
                                        <X className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <Button size="sm" variant="ghost" onClick={() => addManualShipment('recyclers', ri)} className="text-xs gap-1">
                              <Plus className="h-3 w-3" /> إضافة شحنة
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button variant="secondary" onClick={() => handleSave(true)} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                حفظ كمسودة
              </Button>
              <Button onClick={() => handleSave(false)} disabled={creating || !generatedData}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                تقديم الإقرار
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              معاينة الإقرار
            </DialogTitle>
          </DialogHeader>
          {previewDeclaration && (
            <DeclarationPrintView declaration={previewDeclaration} organization={organization} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
