import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/back-button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, Plus, Users, CheckCircle, XCircle, Clock, AlertTriangle, Search, FileText, Printer, UserPlus, Trash2, Copy } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import PermitPrintTemplate from '@/components/permits/PermitPrintTemplate';

interface Permit {
  id: string;
  organization_id: string;
  driver_id: string;
  permit_number: string;
  permit_type: string;
  status: string;
  issued_at: string;
  valid_from: string;
  valid_until: string;
  scope: any;
  conditions: string | null;
  notes: string | null;
  created_at: string;
}

const PERMIT_STATUS: Record<string, { label: string; icon: any; variant: string }> = {
  active: { label: 'ساري', icon: CheckCircle, variant: 'bg-green-100 text-green-800' },
  expired: { label: 'منتهي', icon: XCircle, variant: 'bg-red-100 text-red-800' },
  suspended: { label: 'موقوف', icon: AlertTriangle, variant: 'bg-yellow-100 text-yellow-800' },
  revoked: { label: 'ملغي', icon: XCircle, variant: 'bg-destructive/10 text-destructive' },
};

const DriverPermits = () => {
  const { profile, organization, roles } = useAuth();
  const queryClient = useQueryClient();
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [printPermit, setPrintPermit] = useState<Permit | null>(null);
  const [entryMode, setEntryMode] = useState<'select' | 'manual'>('select');
  const [manualDrivers, setManualDrivers] = useState<{ name: string; plate: string; license: string; phone: string }[]>([
    { name: '', plate: '', license: '', phone: '' },
  ]);
  const [formData, setFormData] = useState({
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    permit_type: 'operating',
    conditions: '',
    notes: '',
    scope: { transport: true, loading: true, unloading: true },
  });

  const isAdmin = roles?.includes('admin');
  const orgType = organization?.organization_type as string;
  const hasAccess = isAdmin || orgType === 'transporter';

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['permit-drivers', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, license_number, vehicle_plate, vehicle_type, profiles(full_name)')
        .eq('organization_id', organization!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && hasAccess,
  });

  // Fetch permits
  const { data: permits = [], isLoading } = useQuery({
    queryKey: ['driver-permits', organization?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('driver_permits') as any)
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Permit[];
    },
    enabled: !!organization?.id && hasAccess,
  });

  // Generate permit number
  const generatePermitNumber = async () => {
    const { data, error } = await supabase.rpc('generate_permit_number', { org_id: organization!.id });
    if (error) throw error;
    return data as string;
  };

  // Bulk issue mutation
  const bulkIssueMutation = useMutation({
    mutationFn: async () => {
      if (entryMode === 'select' && selectedDrivers.length === 0) throw new Error('اختر سائقاً واحداً على الأقل');
      if (entryMode === 'manual' && manualDrivers.every(d => !d.name.trim())) throw new Error('أدخل بيانات سائق واحد على الأقل');
      if (!formData.valid_until) throw new Error('حدد تاريخ الانتهاء');

      if (entryMode === 'select') {
        const inserts = await Promise.all(
          selectedDrivers.map(async (driverId) => {
            const permitNumber = await generatePermitNumber();
            return {
              organization_id: organization!.id,
              driver_id: driverId,
              permit_number: permitNumber,
              permit_type: formData.permit_type,
              issued_by: profile!.id,
              valid_from: formData.valid_from,
              valid_until: formData.valid_until,
              scope: formData.scope,
              conditions: formData.conditions || null,
              notes: formData.notes || null,
              status: 'active',
            };
          })
        );
        const { error } = await (supabase.from('driver_permits') as any).insert(inserts);
        if (error) throw error;
      } else {
        // Manual entry - store as notes-based permits with manual driver info
        const validManual = manualDrivers.filter(d => d.name.trim());
        const inserts = await Promise.all(
          validManual.map(async (driver) => {
            const permitNumber = await generatePermitNumber();
            return {
              organization_id: organization!.id,
              driver_id: null, // manual entry - no linked driver
              permit_number: permitNumber,
              permit_type: formData.permit_type,
              issued_by: profile!.id,
              valid_from: formData.valid_from,
              valid_until: formData.valid_until,
              scope: formData.scope,
              conditions: formData.conditions || null,
              notes: `[بيانات يدوية] الاسم: ${driver.name} | اللوحة: ${driver.plate} | الرخصة: ${driver.license} | الهاتف: ${driver.phone}${formData.notes ? '\n' + formData.notes : ''}`,
              status: 'active',
            };
          })
        );
        const { error } = await (supabase.from('driver_permits') as any).insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-permits'] });
      const count = entryMode === 'select' ? selectedDrivers.length : manualDrivers.filter(d => d.name.trim()).length;
      toast.success(`تم إصدار ${count} تصريح بنجاح`);
      setShowBulkDialog(false);
      setSelectedDrivers([]);
      setManualDrivers([{ name: '', plate: '', license: '', phone: '' }]);
      setFormData({
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        permit_type: 'operating',
        conditions: '',
        notes: '',
        scope: { transport: true, loading: true, unloading: true },
      });
    },
    onError: (e: any) => toast.error(e.message || 'خطأ في إصدار التصاريح'),
  });

  // Suspend/revoke mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const updateData: any = { status };
      if (status === 'suspended') {
        updateData.suspended_at = new Date().toISOString();
        updateData.suspended_by = profile!.id;
        updateData.suspension_reason = reason;
      } else if (status === 'revoked') {
        updateData.revoked_at = new Date().toISOString();
        updateData.revoked_by = profile!.id;
        updateData.revocation_reason = reason;
      }
      const { error } = await (supabase.from('driver_permits') as any).update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-permits'] });
      toast.success('تم تحديث حالة التصريح');
    },
  });

  const getDriverName = (driverId: string) => {
    const d = drivers.find((dr: any) => dr.id === driverId);
    return (d as any)?.profiles?.full_name || (d as any)?.license_number || driverId.slice(0, 8);
  };

  const getDriverPlate = (driverId: string) => {
    const d = drivers.find((dr: any) => dr.id === driverId);
    return (d as any)?.vehicle_plate || '';
  };

  // Filter permits
  const filteredPermits = permits.filter((p) => {
    const matchesSearch = searchQuery === '' ||
      p.permit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getDriverName(p.driver_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: permits.length,
    active: permits.filter(p => p.status === 'active').length,
    expiringSoon: permits.filter(p => {
      if (p.status !== 'active') return false;
      const days = differenceInDays(new Date(p.valid_until), new Date());
      return days >= 0 && days <= 30;
    }).length,
    expired: permits.filter(p => p.status === 'expired' || (p.status === 'active' && new Date(p.valid_until) < new Date())).length,
  };

  const toggleDriver = (id: string) => {
    setSelectedDrivers(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const selectAllDrivers = () => {
    if (selectedDrivers.length === drivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(drivers.map((d: any) => d.id));
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!hasAccess) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasAccess, navigate]);

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <BackButton />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            نظام تصاريح السائقين
          </h1>
          <p className="text-muted-foreground mt-1">إصدار وإدارة تصاريح التشغيل للسائقين بالجملة</p>
        </div>
        <Button onClick={() => setShowBulkDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إصدار تصاريح بالجملة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">إجمالي التصاريح</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-sm text-muted-foreground">سارية</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{stats.expiringSoon}</p>
            <p className="text-sm text-muted-foreground">تنتهي خلال 30 يوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold">{stats.expired}</p>
            <p className="text-sm text-muted-foreground">منتهية</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم التصريح أو اسم السائق..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">ساري</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
            <SelectItem value="suspended">موقوف</SelectItem>
            <SelectItem value="revoked">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Permits List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
      ) : filteredPermits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-semibold">لا توجد تصاريح</p>
            <p className="text-muted-foreground">ابدأ بإصدار تصاريح لسائقيك</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPermits.map((permit) => {
            const st = PERMIT_STATUS[permit.status] || PERMIT_STATUS.active;
            const StatusIcon = st.icon;
            const daysLeft = differenceInDays(new Date(permit.valid_until), new Date());
            const isExpiringSoon = permit.status === 'active' && daysLeft >= 0 && daysLeft <= 30;
            const isActuallyExpired = permit.status === 'active' && daysLeft < 0;

            return (
              <Card key={permit.id} className={isActuallyExpired ? 'border-destructive/50' : isExpiringSoon ? 'border-yellow-400/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-lg">{getDriverName(permit.driver_id)}</p>
                        <Badge className={st.variant}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {isActuallyExpired ? 'منتهي فعلياً' : st.label}
                        </Badge>
                        {isExpiringSoon && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 ml-1" />
                            {daysLeft} يوم متبقي
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>رقم التصريح: <strong>{permit.permit_number}</strong></span>
                        <span>لوحة المركبة: <strong>{getDriverPlate(permit.driver_id)}</strong></span>
                        <span>من: {format(new Date(permit.valid_from), 'dd/MM/yyyy')}</span>
                        <span>إلى: {format(new Date(permit.valid_until), 'dd/MM/yyyy')}</span>
                      </div>
                      {permit.scope && (
                        <div className="flex gap-2 mt-2">
                          {permit.scope.transport && <Badge variant="outline">نقل</Badge>}
                          {permit.scope.loading && <Badge variant="outline">تحميل</Badge>}
                          {permit.scope.unloading && <Badge variant="outline">تفريغ</Badge>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrintPermit(permit)}
                      >
                        <Printer className="h-3 w-3 ml-1" />
                        طباعة
                      </Button>
                      {permit.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-yellow-700"
                            onClick={() => {
                              const reason = prompt('سبب الإيقاف:');
                              if (reason) updateStatusMutation.mutate({ id: permit.id, status: 'suspended', reason });
                            }}
                          >
                            إيقاف
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt('سبب الإلغاء:');
                              if (reason) updateStatusMutation.mutate({ id: permit.id, status: 'revoked', reason });
                            }}
                          >
                            إلغاء
                          </Button>
                        </>
                      )}
                      {permit.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: permit.id, status: 'active' })}
                        >
                          إعادة تفعيل
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bulk Issue Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              إصدار تصاريح بالجملة
            </DialogTitle>
            <DialogDescription>
              اختر السائقين وحدد تفاصيل التصريح لإصدار تصاريح متعددة دفعة واحدة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Entry mode toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={entryMode === 'select' ? 'default' : 'ghost'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setEntryMode('select')}
              >
                <Users className="h-4 w-4" />
                اختيار من السائقين المسجلين
              </Button>
              <Button
                variant={entryMode === 'manual' ? 'default' : 'ghost'}
                className="flex-1 gap-2"
                size="sm"
                onClick={() => setEntryMode('manual')}
              >
                <UserPlus className="h-4 w-4" />
                إدخال بيانات يدوياً
              </Button>
            </div>

            {/* Driver selection - registered */}
            {entryMode === 'select' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">اختر السائقين ({selectedDrivers.length}/{drivers.length})</Label>
                  <Button variant="ghost" size="sm" onClick={selectAllDrivers}>
                    {selectedDrivers.length === drivers.length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </Button>
                </div>
                <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                  {drivers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا يوجد سائقون مسجلون</p>
                  ) : (
                    drivers.map((driver: any) => {
                      const hasActivePermit = permits.some(
                        p => p.driver_id === driver.id && p.status === 'active'
                      );
                      return (
                        <label
                          key={driver.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedDrivers.includes(driver.id)}
                            onCheckedChange={() => toggleDriver(driver.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{driver.profiles?.full_name || driver.license_number}</p>
                            <p className="text-xs text-muted-foreground">{driver.vehicle_plate} - {driver.vehicle_type}</p>
                          </div>
                          {hasActivePermit && (
                            <Badge className="bg-green-100 text-green-800 text-xs">لديه تصريح ساري</Badge>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Manual driver entry */}
            {entryMode === 'manual' && (
              <div>
                <Label className="text-base font-semibold mb-3 block">بيانات المصرح لهم</Label>
                <div className="space-y-3">
                  {manualDrivers.map((driver, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">سائق {idx + 1}</span>
                        {manualDrivers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setManualDrivers(prev => prev.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="اسم السائق *"
                          value={driver.name}
                          onChange={(e) => {
                            const updated = [...manualDrivers];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setManualDrivers(updated);
                          }}
                        />
                        <Input
                          placeholder="رقم لوحة المركبة"
                          value={driver.plate}
                          onChange={(e) => {
                            const updated = [...manualDrivers];
                            updated[idx] = { ...updated[idx], plate: e.target.value };
                            setManualDrivers(updated);
                          }}
                        />
                        <Input
                          placeholder="رقم رخصة القيادة"
                          value={driver.license}
                          onChange={(e) => {
                            const updated = [...manualDrivers];
                            updated[idx] = { ...updated[idx], license: e.target.value };
                            setManualDrivers(updated);
                          }}
                        />
                        <Input
                          placeholder="رقم الهاتف"
                          value={driver.phone}
                          onChange={(e) => {
                            const updated = [...manualDrivers];
                            updated[idx] = { ...updated[idx], phone: e.target.value };
                            setManualDrivers(updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-dashed"
                    onClick={() => setManualDrivers(prev => [...prev, { name: '', plate: '', license: '', phone: '' }])}
                  >
                    <Plus className="h-4 w-4" />
                    إضافة سائق آخر
                  </Button>
                </div>
              </div>
            )}

            {/* Permit type */}
            <div>
              <Label className="mb-2 block">نوع التصريح</Label>
              <Select value={formData.permit_type} onValueChange={(v) => setFormData(p => ({ ...p, permit_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operating">تصريح تشغيل عام</SelectItem>
                  <SelectItem value="transport">تصريح نقل مخلفات</SelectItem>
                  <SelectItem value="hazardous">تصريح نقل مواد خطرة</SelectItem>
                  <SelectItem value="temporary">تصريح مؤقت</SelectItem>
                  <SelectItem value="internal">تصريح داخلي</SelectItem>
                  <SelectItem value="cross_border">تصريح عبور بين المحافظات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permit details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData(p => ({ ...p, valid_from: e.target.value }))}
                />
              </div>
              <div>
                <Label>تاريخ الانتهاء *</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(p => ({ ...p, valid_until: e.target.value }))}
                />
              </div>
            </div>

            {/* Scope */}
            <div>
              <Label className="mb-2 block">نطاق التصريح</Label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'transport', label: 'نقل' },
                  { key: 'loading', label: 'تحميل' },
                  { key: 'unloading', label: 'تفريغ' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.scope[key as keyof typeof formData.scope]}
                      onCheckedChange={(checked) =>
                        setFormData(p => ({ ...p, scope: { ...p.scope, [key]: !!checked } }))
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Conditions with templates */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>شروط خاصة</Label>
                <Select onValueChange={(v) => {
                  if (v === 'custom') return;
                  setFormData(p => ({
                    ...p,
                    conditions: p.conditions ? p.conditions + '\n' + v : v,
                  }));
                }}>
                  <SelectTrigger className="w-auto h-8 text-xs gap-1">
                    <Copy className="h-3 w-3" />
                    <SelectValue placeholder="صيغ جاهزة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="يجب الالتزام بقواعد السلامة المهنية أثناء النقل والتحميل والتفريغ.">السلامة المهنية</SelectItem>
                    <SelectItem value="يُمنع نقل أي مواد خارج نطاق التصريح المحدد.">تقييد المواد</SelectItem>
                    <SelectItem value="يجب ارتداء معدات الحماية الشخصية (PPE) في جميع الأوقات.">معدات الحماية</SelectItem>
                    <SelectItem value="يُلزم السائق بالتوقيع على سجل الاستلام والتسليم لكل شحنة.">سجل الاستلام</SelectItem>
                    <SelectItem value="يجب إبلاغ المسؤول فوراً عن أي حادث أو تسرب أثناء النقل.">الإبلاغ عن الحوادث</SelectItem>
                    <SelectItem value="هذا التصريح صالح فقط خلال ساعات العمل الرسمية (8 صباحاً - 6 مساءً).">ساعات العمل</SelectItem>
                    <SelectItem value="يُمنع التوقف غير المبرر أو تغيير المسار المحدد دون إذن مسبق.">الالتزام بالمسار</SelectItem>
                    <SelectItem value="يجب أن تكون المركبة مؤمّنة ومرخصة وصالحة للسير طوال مدة التصريح.">صلاحية المركبة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="أي شروط إضافية على التصريح... (اختر من الصيغ الجاهزة أو اكتب شروطك)"
                value={formData.conditions}
                onChange={(e) => setFormData(p => ({ ...p, conditions: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <Label>ملاحظات</Label>
              <Textarea
                placeholder="ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={
                (entryMode === 'select' && selectedDrivers.length === 0) ||
                (entryMode === 'manual' && manualDrivers.every(d => !d.name.trim())) ||
                !formData.valid_until ||
                bulkIssueMutation.isPending
              }
              onClick={() => bulkIssueMutation.mutate()}
            >
              {bulkIssueMutation.isPending
                ? 'جاري الإصدار...'
                : `إصدار ${entryMode === 'select' ? selectedDrivers.length : manualDrivers.filter(d => d.name.trim()).length} تصريح`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={!!printPermit} onOpenChange={(open) => !open && setPrintPermit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              معاينة وطباعة التصريح
            </DialogTitle>
            <DialogDescription>معاينة التصريح قبل الطباعة بتنسيق A4</DialogDescription>
          </DialogHeader>
          {printPermit && (
            <PermitPrintTemplate
              permit={{
                permitNumber: printPermit.permit_number,
                orgName: organization?.name || '',
                driverName: getDriverName(printPermit.driver_id),
                vehiclePlate: getDriverPlate(printPermit.driver_id),
                vehicleType: drivers.find((d: any) => d.id === printPermit.driver_id)?.vehicle_type || '',
                validFrom: printPermit.valid_from,
                validUntil: printPermit.valid_until,
                scope: printPermit.scope,
                conditions: printPermit.conditions || undefined,
                issuedAt: printPermit.issued_at,
              }}
              onClose={() => setPrintPermit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverPermits;
