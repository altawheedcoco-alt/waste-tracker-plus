import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileText, Plus, Printer, Send, Loader2, AlertTriangle, Biohazard, Recycle, Stethoscope, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
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

interface DeclarationData {
  generators: Array<{
    name: string;
    commercial_register?: string;
    environmental_license?: string;
    address?: string;
    city?: string;
    representative_name?: string;
    shipments: Array<{
      shipment_number: string;
      waste_type: string;
      quantity: number;
      unit: string;
      pickup_date?: string;
      delivery_date?: string;
      driver_name?: string;
      vehicle_plate?: string;
      license_number?: string;
    }>;
  }>;
  recyclers: Array<{
    name: string;
    commercial_register?: string;
    environmental_license?: string;
    address?: string;
    city?: string;
    representative_name?: string;
    shipments: Array<{
      shipment_number: string;
      waste_type: string;
      quantity: number;
      unit: string;
      delivery_date?: string;
      driver_name?: string;
      vehicle_plate?: string;
    }>;
  }>;
}

export default function TransporterDeclarations() {
  const { organization, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDeclaration, setPreviewDeclaration] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [formType, setFormType] = useState<'manual' | 'auto'>('auto');
  const [formCategory, setFormCategory] = useState<string>('hazardous');
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [generatingData, setGeneratingData] = useState(false);
  const [generatedData, setGeneratedData] = useState<DeclarationData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const orgId = organization?.id;

  // Fetch existing declarations
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

  // Auto-generate declaration data from shipments
  const handleAutoGenerate = async () => {
    if (!orgId || !periodFrom || !periodTo) {
      toast.error('يرجى تحديد الفترة الزمنية');
      return;
    }

    setGeneratingData(true);
    try {
      // Map waste category to waste types
      const categoryWasteTypes: Record<string, string[]> = {
        hazardous: ['chemical', 'electronic'],
        non_hazardous: ['plastic', 'paper', 'metal', 'glass', 'organic', 'construction', 'other'],
        medical: ['medical'],
      };

      const wasteTypes = categoryWasteTypes[formCategory] || [];

      // Fetch shipments for the period
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

      // Collect org and driver IDs
      const orgIds = new Set<string>();
      const driverIds = new Set<string>();
      shipments.forEach(s => {
        if (s.generator_id) orgIds.add(s.generator_id);
        if (s.recycler_id) orgIds.add(s.recycler_id);
        if (s.disposal_facility_id) orgIds.add(s.disposal_facility_id);
        if (s.driver_id) driverIds.add(s.driver_id);
      });

      // Batch fetch orgs and drivers
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

      // Group by generator
      const generatorGroups = new Map<string, any>();
      const recyclerGroups = new Map<string, any>();

      shipments.forEach(s => {
        const genId = s.generator_id || 'unknown';
        const genOrg = orgsMap.get(genId);
        const driver = s.driver_id ? driversMap.get(s.driver_id) : null;

        if (!generatorGroups.has(genId)) {
          generatorGroups.set(genId, {
            name: genOrg?.name || s.manual_disposal_name || 'غير محدد',
            commercial_register: genOrg?.commercial_register,
            environmental_license: genOrg?.environmental_license,
            address: genOrg?.address,
            city: genOrg?.city,
            representative_name: genOrg?.representative_name,
            shipments: [],
          });
        }
        generatorGroups.get(genId).shipments.push({
          shipment_number: s.shipment_number,
          waste_type: s.waste_type,
          quantity: s.quantity,
          unit: s.unit,
          pickup_date: s.actual_pickup_date || s.scheduled_date,
          delivery_date: s.actual_delivery_date,
          driver_name: driver?.profile?.full_name || s.manual_driver_name || '',
          vehicle_plate: driver?.vehicle_plate || s.manual_vehicle_plate || '',
          license_number: driver?.license_number || '',
        });

        // Group recyclers
        const recId = s.recycler_id || s.disposal_facility_id || 'unknown';
        const recOrg = orgsMap.get(recId);
        if (!recyclerGroups.has(recId)) {
          recyclerGroups.set(recId, {
            name: recOrg?.name || 'غير محدد',
            commercial_register: recOrg?.commercial_register,
            environmental_license: recOrg?.environmental_license,
            address: recOrg?.address,
            city: recOrg?.city,
            representative_name: recOrg?.representative_name,
            shipments: [],
          });
        }
        recyclerGroups.get(recId).shipments.push({
          shipment_number: s.shipment_number,
          waste_type: s.waste_type,
          quantity: s.quantity,
          unit: s.unit,
          delivery_date: s.actual_delivery_date,
          driver_name: driver?.profile?.full_name || s.manual_driver_name || '',
          vehicle_plate: driver?.vehicle_plate || s.manual_vehicle_plate || '',
        });
      });

      const data: DeclarationData = {
        generators: Array.from(generatorGroups.values()),
        recyclers: Array.from(recyclerGroups.values()),
      };

      setGeneratedData(data);
      toast.success(`تم توليد البيانات: ${shipments.length} شحنة`);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء توليد البيانات');
    } finally {
      setGeneratingData(false);
    }
  };

  const handleSave = async (asDraft = true) => {
    if (!orgId || !periodFrom || !periodTo) {
      toast.error('يرجى ملء كافة الحقول المطلوبة');
      return;
    }

    setCreating(true);
    try {
      const totalShipments = generatedData
        ? generatedData.generators.reduce((sum, g) => sum + g.shipments.length, 0)
        : 0;
      const totalQty = generatedData
        ? generatedData.generators.reduce((sum, g) => sum + g.shipments.reduce((s2, sh) => s2 + sh.quantity, 0), 0)
        : 0;

      const { error } = await supabase.from('transporter_declarations').insert({
        organization_id: orgId,
        declaration_number: '', // auto-generated by trigger
        declaration_type: formType,
        waste_category: formCategory,
        period_from: periodFrom,
        period_to: periodTo,
        status: asDraft ? 'draft' : 'submitted',
        total_shipments: totalShipments,
        total_quantity: totalQty,
        declaration_data: generatedData || {},
        notes: manualNotes || null,
        submitted_at: asDraft ? null : new Date().toISOString(),
        submitted_by: asDraft ? null : profile?.id,
        created_by: profile?.id,
      } as any);

      if (error) throw error;

      toast.success(asDraft ? 'تم حفظ المسودة' : 'تم تقديم الإقرار');
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
    setFormType('auto');
    setFormCategory('hazardous');
    setPeriodFrom('');
    setPeriodTo('');
    setManualNotes('');
    setGeneratedData(null);
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
    if (error) {
      toast.error('حدث خطأ');
    } else {
      toast.success('تم تقديم الإقرار');
      queryClient.invalidateQueries({ queryKey: ['transporter-declarations'] });
    }
  };

  const categoryLabel = (cat: string) => WASTE_CATEGORIES.find(c => c.value === cat)?.label || cat;

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
        <Button onClick={() => setShowCreate(true)} className="gap-2">
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
                  <TableHead>عدد الشحنات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.map((dec: any) => (
                  <TableRow key={dec.id}>
                    <TableCell className="font-mono text-xs">{dec.declaration_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dec.declaration_type === 'auto' ? 'تلقائي' : 'يدوي'}
                      </Badge>
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
                        <Button size="sm" variant="ghost" onClick={() => handlePreview(dec)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {dec.status === 'draft' && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmit(dec.id)}>
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

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); else setShowCreate(true); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء إقرار جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type */}
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

            {/* Auto generate */}
            {formType === 'auto' && (
              <div className="space-y-3">
                <Button
                  onClick={handleAutoGenerate}
                  disabled={generatingData || !periodFrom || !periodTo}
                  variant="outline"
                  className="gap-2"
                >
                  {generatingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  توليد البيانات من الشحنات
                </Button>

                {generatedData && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-semibold">ملخص البيانات المولدة:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>عدد الجهات المولدة: <strong>{generatedData.generators.length}</strong></p>
                        <p>عدد جهات التدوير/التخلص: <strong>{generatedData.recyclers.length}</strong></p>
                        <p>إجمالي الشحنات: <strong>{generatedData.generators.reduce((s, g) => s + g.shipments.length, 0)}</strong></p>
                        <p>إجمالي الكمية: <strong>{generatedData.generators.reduce((s, g) => s + g.shipments.reduce((s2, sh) => s2 + sh.quantity, 0), 0).toFixed(2)}</strong></p>
                      </div>

                      {/* Preview generators */}
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">الجهات المولدة:</p>
                        {generatedData.generators.map((g, i) => (
                          <div key={i} className="text-xs border rounded p-2 bg-background">
                            <p className="font-medium">{g.name} ({g.shipments.length} شحنة)</p>
                            {g.commercial_register && <p>سجل تجاري: {g.commercial_register}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Manual notes */}
            <div>
              <Label>ملاحظات</Label>
              <Textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} placeholder="ملاحظات إضافية..." />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
              <Button variant="secondary" onClick={() => handleSave(true)} disabled={creating}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                حفظ كمسودة
              </Button>
              <Button onClick={() => handleSave(false)} disabled={creating || (formType === 'auto' && !generatedData)}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                تقديم الإقرار
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              معاينة الإقرار
            </DialogTitle>
          </DialogHeader>
          {previewDeclaration && (
            <DeclarationPrintView
              declaration={previewDeclaration}
              organization={organization}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
