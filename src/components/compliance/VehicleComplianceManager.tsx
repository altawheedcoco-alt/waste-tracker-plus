import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Truck, Plus, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VehicleCompliance {
  id: string;
  plate_number: string;
  vehicle_type: string;
  hazmat_license_number: string | null;
  hazmat_license_expiry: string | null;
  has_hazard_placards: boolean;
  placard_types: string[];
  has_fire_extinguisher: boolean;
  has_sand_box: boolean;
  has_spill_kit: boolean;
  has_first_aid_kit: boolean;
  gps_registered_with_authority: boolean;
  vehicle_license_expiry: string | null;
  insurance_number: string | null;
  insurance_expiry: string | null;
  compliance_status: string;
  last_inspection_date: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  compliant: { label: 'ممتثل', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  non_compliant: { label: 'غير ممتثل', color: 'bg-red-100 text-red-800', icon: XCircle },
  pending: { label: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const VehicleComplianceManager = () => {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    vehicle_type: 'truck',
    hazmat_license_number: '',
    hazmat_license_expiry: '',
    has_hazard_placards: false,
    has_fire_extinguisher: false,
    has_sand_box: false,
    has_spill_kit: false,
    has_first_aid_kit: false,
    gps_registered_with_authority: false,
    vehicle_license_expiry: '',
    insurance_number: '',
    insurance_expiry: '',
    notes: '',
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicle-compliance', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_compliance')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as VehicleCompliance[];
    },
    enabled: !!organization?.id,
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('vehicle_compliance').insert({
        organization_id: organization!.id,
        plate_number: data.plate_number,
        vehicle_type: data.vehicle_type,
        hazmat_license_number: data.hazmat_license_number || null,
        hazmat_license_expiry: data.hazmat_license_expiry || null,
        has_hazard_placards: data.has_hazard_placards,
        has_fire_extinguisher: data.has_fire_extinguisher,
        has_sand_box: data.has_sand_box,
        has_spill_kit: data.has_spill_kit,
        has_first_aid_kit: data.has_first_aid_kit,
        gps_registered_with_authority: data.gps_registered_with_authority,
        vehicle_license_expiry: data.vehicle_license_expiry || null,
        insurance_number: data.insurance_number || null,
        insurance_expiry: data.insurance_expiry || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-compliance'] });
      toast.success('تم إضافة المركبة بنجاح');
      setShowDialog(false);
      resetForm();
    },
    onError: () => toast.error('خطأ في إضافة المركبة'),
  });

  const resetForm = () => setFormData({
    plate_number: '', vehicle_type: 'truck', hazmat_license_number: '',
    hazmat_license_expiry: '', has_hazard_placards: false, has_fire_extinguisher: false,
    has_sand_box: false, has_spill_kit: false, has_first_aid_kit: false,
    gps_registered_with_authority: false, vehicle_license_expiry: '',
    insurance_number: '', insurance_expiry: '', notes: '',
  });

  const safetyChecks = [
    { key: 'has_hazard_placards' as const, label: 'ملصقات تحذيرية (Placards)' },
    { key: 'has_fire_extinguisher' as const, label: 'طفاية حريق مناسبة' },
    { key: 'has_sand_box' as const, label: 'صندوق رمل' },
    { key: 'has_spill_kit' as const, label: 'أدوات احتواء الانسكاب' },
    { key: 'has_first_aid_kit' as const, label: 'صندوق إسعافات أولية' },
    { key: 'gps_registered_with_authority' as const, label: 'GPS مسجل لدى الجهات الرسمية' },
  ];

  const getExpiryBadge = (date: string | null) => {
    if (!date) return <Badge variant="outline">غير محدد</Badge>;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge variant="destructive">منتهي</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-500">ينتهي قريباً</Badge>;
    return <Badge className="bg-green-600 text-white">ساري</Badge>;
  };

  const stats = {
    total: vehicles.length,
    compliant: vehicles.filter(v => v.compliance_status === 'compliant').length,
    nonCompliant: vehicles.filter(v => v.compliance_status !== 'compliant').length,
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">إجمالي المركبات</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
          <p className="text-xs text-muted-foreground">ممتثلة</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
          <p className="text-xs text-muted-foreground">غير ممتثلة</p>
        </CardContent></Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" /> الملف القانوني للمركبات
        </h3>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 ml-1" /> إضافة مركبة
        </Button>
      </div>

      {/* Vehicle List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
      ) : vehicles.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>لم يتم إضافة مركبات بعد</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => {
            const cfg = STATUS_CONFIG[v.compliance_status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            const safetyCount = [v.has_hazard_placards, v.has_fire_extinguisher, v.has_sand_box, v.has_spill_kit, v.has_first_aid_kit, v.gps_registered_with_authority].filter(Boolean).length;
            return (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{v.plate_number}</p>
                      <p className="text-sm text-muted-foreground">{v.vehicle_type === 'truck' ? 'شاحنة' : v.vehicle_type}</p>
                    </div>
                    <Badge className={cfg.color}>
                      <Icon className="h-3 w-3 ml-1" /> {cfg.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">رخصة المواد الخطرة:</span>
                      <div className="flex items-center gap-1 mt-1">
                        {v.hazmat_license_number || 'غير مسجل'}
                        {getExpiryBadge(v.hazmat_license_expiry)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">رخصة المركبة:</span>
                      <div className="mt-1">{getExpiryBadge(v.vehicle_license_expiry)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">التأمين:</span>
                      <div className="mt-1">{getExpiryBadge(v.insurance_expiry)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">تجهيزات الأمان:</span>
                      <div className="mt-1">
                        <Badge variant={safetyCount === 6 ? 'default' : 'outline'}>
                          {safetyCount}/6
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مركبة جديدة</DialogTitle>
            <DialogDescription>تسجيل المركبة مع بيانات الامتثال القانوني</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>رقم اللوحة *</Label>
                <Input value={formData.plate_number} onChange={e => setFormData(p => ({ ...p, plate_number: e.target.value }))} placeholder="أ ب ج 1234" />
              </div>
              <div>
                <Label>نوع المركبة</Label>
                <Input value={formData.vehicle_type} onChange={e => setFormData(p => ({ ...p, vehicle_type: e.target.value }))} placeholder="شاحنة / تريلا" />
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="font-semibold text-sm">رخصة تداول المواد الخطرة</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>رقم الرخصة</Label>
                  <Input value={formData.hazmat_license_number} onChange={e => setFormData(p => ({ ...p, hazmat_license_number: e.target.value }))} />
                </div>
                <div>
                  <Label>تاريخ الانتهاء</Label>
                  <Input type="date" value={formData.hazmat_license_expiry} onChange={e => setFormData(p => ({ ...p, hazmat_license_expiry: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-3">
              <p className="font-semibold text-sm">رخصة المركبة والتأمين</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>انتهاء رخصة المركبة</Label>
                  <Input type="date" value={formData.vehicle_license_expiry} onChange={e => setFormData(p => ({ ...p, vehicle_license_expiry: e.target.value }))} />
                </div>
                <div>
                  <Label>رقم التأمين</Label>
                  <Input value={formData.insurance_number} onChange={e => setFormData(p => ({ ...p, insurance_number: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>انتهاء التأمين</Label>
                <Input type="date" value={formData.insurance_expiry} onChange={e => setFormData(p => ({ ...p, insurance_expiry: e.target.value }))} />
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-2">
              <p className="font-semibold text-sm flex items-center gap-1">
                <Shield className="h-4 w-4" /> تجهيزات الأمان
              </p>
              {safetyChecks.map(check => (
                <div key={check.key} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData[check.key]}
                    onCheckedChange={v => setFormData(p => ({ ...p, [check.key]: !!v }))}
                  />
                  <Label className="text-sm cursor-pointer">{check.label}</Label>
                </div>
              ))}
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
            </div>

            <Button className="w-full" onClick={() => addMutation.mutate(formData)} disabled={!formData.plate_number || addMutation.isPending}>
              {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ المركبة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleComplianceManager;
