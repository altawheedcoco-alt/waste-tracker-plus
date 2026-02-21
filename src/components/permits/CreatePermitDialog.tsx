import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Truck, User, ShieldCheck, CalendarDays, StickyNote, Camera, Image, UserCheck, Search } from 'lucide-react';
import { usePermits, CreatePermitData } from '@/hooks/usePermits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

const PERMIT_TYPES = [
  { value: 'waste_exit', label: 'تصريح خروج مخلفات' },
  { value: 'person_access', label: 'تصريح شخص / سائق' },
  { value: 'transport', label: 'تصريح نقل' },
  { value: 'general', label: 'تصريح عام مخصص' },
];

const IMAGE_SOURCES = [
  { value: 'manual', label: 'رفع يدوي', icon: Camera },
  { value: 'driver', label: 'من سائق مسجل', icon: UserCheck },
  { value: 'profile', label: 'من مستخدم مسجل', icon: User },
  { value: 'archive', label: 'من أرشيف الصور', icon: Image },
  { value: 'kyc', label: 'من ملف التحقق (KYC)', icon: ShieldCheck },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 pt-3 pb-1 border-b border-border/50">
    <Icon className="w-4 h-4 text-primary" />
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
  </div>
);

const CreatePermitDialog = ({ open, onOpenChange }: Props) => {
  const { createPermit } = usePermits();
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const { data: shipments } = useQuery({
    queryKey: ['shipments-for-permit', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, waste_description, quantity, unit, manual_vehicle_plate, manual_driver_name, pickup_date')
        .or(`generator_id.eq.${orgId},transporter_id.eq.${orgId},recycler_id.eq.${orgId}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
  });

  // Fetch drivers for the organization
  const { data: drivers } = useQuery({
    queryKey: ['drivers-for-permit', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('drivers')
        .select('id, profile_id, license_number, license_expiry, vehicle_type, vehicle_plate, profiles!inner(full_name, phone, avatar_url)')
        .eq('organization_id', orgId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
  });

  // Fetch organization members (profiles)
  const { data: orgMembers } = useQuery({
    queryKey: ['org-members-for-permit', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, user_id')
        .eq('organization_id', orgId)
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
  });

  // Fetch KYC data for selected user
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { data: kycData } = useQuery({
    queryKey: ['kyc-for-permit', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const { data, error } = await supabase
        .from('profile_sensitive_data')
        .select('national_id, id_card_front_url, id_card_back_url')
        .eq('user_id', selectedUserId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUserId,
  });

  // Fetch archive images
  const { data: archiveImages } = useQuery({
    queryKey: ['permit-archive-images', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('permit_document_images')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
  });

  const [form, setForm] = useState<CreatePermitData>({
    permit_type: 'waste_exit',
    purpose: '',
    image_source: 'manual',
  });

  const update = (key: keyof CreatePermitData, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Auto-fill from shipment
  const handleShipmentChange = (shipmentId: string) => {
    if (shipmentId === '_none') {
      update('shipment_id', undefined);
      return;
    }
    update('shipment_id', shipmentId);
    const shipment = shipments?.find(s => s.id === shipmentId);
    if (!shipment) return;

    setForm(prev => ({
      ...prev,
      shipment_id: shipmentId,
      waste_type: shipment.waste_type || prev.waste_type || '',
      waste_description: shipment.waste_description || prev.waste_description || '',
      estimated_quantity: shipment.quantity ?? prev.estimated_quantity,
      quantity_unit: shipment.unit || prev.quantity_unit || 'ton',
      vehicle_plate: shipment.manual_vehicle_plate || prev.vehicle_plate || '',
      person_name: shipment.manual_driver_name || prev.person_name || '',
      valid_from: shipment.pickup_date ? new Date(shipment.pickup_date).toISOString().slice(0, 16) : prev.valid_from || '',
      purpose: prev.purpose || `تصريح مرتبط بالشحنة ${shipment.shipment_number}`,
    }));
  };

  // Auto-fill from driver
  const handleDriverSelect = (driverId: string) => {
    if (driverId === '_none') {
      update('linked_driver_id', undefined);
      return;
    }
    const driver = drivers?.find(d => d.id === driverId);
    if (!driver) return;

    const driverProfile = driver.profiles as any;
    setSelectedUserId(null); // reset kyc selection

    setForm(prev => ({
      ...prev,
      linked_driver_id: driverId,
      linked_profile_id: driver.profile_id,
      person_name: driverProfile?.full_name || prev.person_name,
      person_phone: driverProfile?.phone || prev.person_phone,
      person_photo_url: driverProfile?.avatar_url || prev.person_photo_url,
      vehicle_plate: driver.vehicle_plate || prev.vehicle_plate,
      vehicle_type: driver.vehicle_type || prev.vehicle_type,
      license_number: driver.license_number || prev.license_number,
      license_expiry: driver.license_expiry || prev.license_expiry,
      image_source: 'driver',
    }));

    // Try to load KYC data for this driver's user
    if (driver.profile_id) {
      const member = orgMembers?.find(m => m.id === driver.profile_id);
      if (member?.user_id) {
        setSelectedUserId(member.user_id);
      }
    }
  };

  // Auto-fill from profile/member
  const handleMemberSelect = (profileId: string) => {
    if (profileId === '_none') {
      update('linked_profile_id', undefined);
      setSelectedUserId(null);
      return;
    }
    const member = orgMembers?.find(m => m.id === profileId);
    if (!member) return;

    setForm(prev => ({
      ...prev,
      linked_profile_id: profileId,
      person_name: member.full_name || prev.person_name,
      person_phone: member.phone || prev.person_phone,
      person_photo_url: member.avatar_url || prev.person_photo_url,
      image_source: 'profile',
    }));

    if (member.user_id) {
      setSelectedUserId(member.user_id);
    }
  };

  // When KYC data loads, apply it
  useEffect(() => {
    if (kycData && (form.image_source === 'driver' || form.image_source === 'profile' || form.image_source === 'kyc')) {
      setForm(prev => ({
        ...prev,
        person_id_number: kycData.national_id || prev.person_id_number,
        id_card_front_url: kycData.id_card_front_url || prev.id_card_front_url,
        id_card_back_url: kycData.id_card_back_url || prev.id_card_back_url,
      }));
    }
  }, [kycData]);

  // Handle archive image selection
  const handleArchiveImageSelect = (imageId: string) => {
    const img = archiveImages?.find(i => i.id === imageId);
    if (!img) return;

    const fieldMap: Record<string, keyof CreatePermitData> = {
      'id_card_front': 'id_card_front_url',
      'id_card_back': 'id_card_back_url',
      'license_front': 'license_front_url',
      'license_back': 'license_back_url',
    };
    const field = fieldMap[img.image_type];
    if (field) {
      update(field, img.image_url);
    }
    if (img.person_name && !form.person_name) {
      update('person_name', img.person_name);
    }
    if (img.document_number && !form.person_id_number) {
      update('person_id_number', img.document_number);
    }
  };

  // Handle manual image upload
  const handleImageUpload = async (file: File, type: 'id_card_front' | 'id_card_back' | 'license_front' | 'license_back') => {
    if (!orgId) return;
    const path = `${orgId}/permits/${type}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('organization-documents').upload(path, file);
    if (error) {
      console.error('Upload error:', error);
      return;
    }
    const { data: urlData } = supabase.storage.from('organization-documents').getPublicUrl(path);
    const fieldMap: Record<string, keyof CreatePermitData> = {
      'id_card_front': 'id_card_front_url',
      'id_card_back': 'id_card_back_url',
      'license_front': 'license_front_url',
      'license_back': 'license_back_url',
    };
    update(fieldMap[type], urlData.publicUrl);

    // Save to archive
    await supabase.from('permit_document_images').insert({
      organization_id: orgId,
      uploaded_by: profile?.id,
      image_type: type,
      image_url: urlData.publicUrl,
      person_name: form.person_name || null,
      document_number: form.person_id_number || null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPermit.mutateAsync(form);
    onOpenChange(false);
    setForm({ permit_type: 'waste_exit', purpose: '', image_source: 'manual' });
    setSelectedUserId(null);
  };

  const showPersonFields = true; // Always show since permits need person data
  const showWasteFields = form.permit_type === 'waste_exit' || form.permit_type === 'transport';
  const imageSource = form.image_source || 'manual';

  const ImagePreview = ({ url, label }: { url?: string; label: string }) => {
    if (!url) return null;
    return (
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <img src={url} alt={label} className="w-full h-20 object-cover rounded-md border" />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء تصريح جديد</DialogTitle>
          <DialogDescription>أنشئ تصريحاً مع إمكانية ربط بيانات السائق أو المستخدم تلقائياً</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Section: Basic Info */}
          <SectionHeader icon={FileText} title="البيانات الأساسية" />
          <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">نوع التصريح *</Label>
                <Select value={form.permit_type} onValueChange={v => update('permit_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMIT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">مصدر البيانات</Label>
                <Select value={imageSource} onValueChange={v => update('image_source', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {IMAGE_SOURCES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <span className="flex items-center gap-1.5">
                          <s.icon className="w-3 h-3" />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الغرض</Label>
              <Input value={form.purpose || ''} onChange={e => update('purpose', e.target.value)} placeholder="غرض التصريح" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ربط بشحنة (اختياري)</Label>
              <Select value={form.shipment_id || '_none'} onValueChange={handleShipmentChange}>
                <SelectTrigger><SelectValue placeholder="بدون ربط بشحنة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">بدون ربط بشحنة</SelectItem>
                  {shipments?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.shipment_number} - {s.waste_type || 'بدون نوع'} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section: Source Selection (Driver/Member/Archive) */}
          {imageSource === 'driver' && (
            <>
              <SectionHeader icon={UserCheck} title="اختيار سائق مسجل" />
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <Select value={form.linked_driver_id || '_none'} onValueChange={handleDriverSelect}>
                  <SelectTrigger><SelectValue placeholder="اختر سائقاً..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">اختر سائقاً</SelectItem>
                    {drivers?.map(d => {
                      const dp = d.profiles as any;
                      return (
                        <SelectItem key={d.id} value={d.id}>
                          {dp?.full_name || 'بدون اسم'} — {d.vehicle_plate || 'بدون لوحة'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {form.linked_driver_id && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    ✓ تم تحميل بيانات السائق تلقائياً
                  </Badge>
                )}
              </div>
            </>
          )}

          {imageSource === 'profile' && (
            <>
              <SectionHeader icon={User} title="اختيار مستخدم مسجل" />
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <Select value={form.linked_profile_id || '_none'} onValueChange={handleMemberSelect}>
                  <SelectTrigger><SelectValue placeholder="اختر مستخدماً..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">اختر مستخدماً</SelectItem>
                    {orgMembers?.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name || 'بدون اسم'} {m.phone ? `— ${m.phone}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.linked_profile_id && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    ✓ تم تحميل بيانات المستخدم تلقائياً
                  </Badge>
                )}
              </div>
            </>
          )}

          {imageSource === 'kyc' && (
            <>
              <SectionHeader icon={ShieldCheck} title="اختيار من ملف التحقق (KYC)" />
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                <Select value={form.linked_profile_id || '_none'} onValueChange={handleMemberSelect}>
                  <SelectTrigger><SelectValue placeholder="اختر مستخدماً لاستيراد بيانات KYC..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">اختر مستخدماً</SelectItem>
                    {orgMembers?.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name || 'بدون اسم'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {kycData && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <ImagePreview url={kycData.id_card_front_url || undefined} label="البطاقة — وجه" />
                    <ImagePreview url={kycData.id_card_back_url || undefined} label="البطاقة — ظهر" />
                  </div>
                )}
              </div>
            </>
          )}

          {imageSource === 'archive' && (
            <>
              <SectionHeader icon={Image} title="اختيار من أرشيف الصور" />
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-2">
                {(!archiveImages || archiveImages.length === 0) ? (
                  <p className="text-xs text-muted-foreground text-center py-2">لا توجد صور محفوظة بعد. ارفع صوراً جديدة لحفظها تلقائياً.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                    {archiveImages.map(img => (
                      <button
                        type="button"
                        key={img.id}
                        onClick={() => handleArchiveImageSelect(img.id)}
                        className="border rounded-md p-1 hover:border-primary transition-colors text-right"
                      >
                        <img src={img.image_url} alt={img.image_type} className="w-full h-14 object-cover rounded" />
                        <p className="text-[9px] text-muted-foreground mt-0.5 truncate">{img.person_name || img.image_type}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Section: Person / Driver Details */}
          {showPersonFields && (
            <>
              <SectionHeader icon={User} title="بيانات الشخص / السائق" />
              <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">اسم الشخص</Label>
                    <Input value={form.person_name || ''} onChange={e => update('person_name', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الهوية</Label>
                    <Input value={form.person_id_number || ''} onChange={e => update('person_id_number', e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">الهاتف</Label>
                    <Input value={form.person_phone || ''} onChange={e => update('person_phone', e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الصفة / الدور</Label>
                    <Input value={form.person_role || ''} onChange={e => update('person_role', e.target.value)} placeholder="سائق، مندوب، ..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">لوحة المركبة</Label>
                    <Input value={form.vehicle_plate || ''} onChange={e => update('vehicle_plate', e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">نوع المركبة</Label>
                    <Input value={form.vehicle_type || ''} onChange={e => update('vehicle_type', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">رقم الرخصة</Label>
                    <Input value={form.license_number || ''} onChange={e => update('license_number', e.target.value)} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">انتهاء الرخصة</Label>
                    <Input type="date" value={form.license_expiry || ''} onChange={e => update('license_expiry', e.target.value)} dir="ltr" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section: Document Images Upload (Manual) */}
          {imageSource === 'manual' && (
            <>
              <SectionHeader icon={Camera} title="رفع صور المستندات" />
              <div className="rounded-lg border border-border/40 bg-muted/30 p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">البطاقة — وجه</Label>
                    <Input type="file" accept="image/*" className="text-xs" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'id_card_front')} />
                    <ImagePreview url={form.id_card_front_url} label="البطاقة — وجه" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">البطاقة — ظهر</Label>
                    <Input type="file" accept="image/*" className="text-xs" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'id_card_back')} />
                    <ImagePreview url={form.id_card_back_url} label="البطاقة — ظهر" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">الرخصة — وجه</Label>
                    <Input type="file" accept="image/*" className="text-xs" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'license_front')} />
                    <ImagePreview url={form.license_front_url} label="الرخصة — وجه" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الرخصة — ظهر</Label>
                    <Input type="file" accept="image/*" className="text-xs" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'license_back')} />
                    <ImagePreview url={form.license_back_url} label="الرخصة — ظهر" />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Show loaded images preview for non-manual sources */}
          {imageSource !== 'manual' && (form.id_card_front_url || form.id_card_back_url || form.license_front_url || form.license_back_url) && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-primary mb-2">صور مُحمّلة تلقائياً</p>
              <div className="grid grid-cols-4 gap-2">
                <ImagePreview url={form.id_card_front_url} label="بطاقة — وجه" />
                <ImagePreview url={form.id_card_back_url} label="بطاقة — ظهر" />
                <ImagePreview url={form.license_front_url} label="رخصة — وجه" />
                <ImagePreview url={form.license_back_url} label="رخصة — ظهر" />
              </div>
            </div>
          )}

          {/* Section: Waste Info */}
          {showWasteFields && (
            <>
              <SectionHeader icon={Truck} title="بيانات المخلفات" />
              <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">نوع المخلف</Label>
                    <Input value={form.waste_type || ''} onChange={e => update('waste_type', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">الكمية التقديرية</Label>
                    <Input type="number" value={form.estimated_quantity || ''} onChange={e => update('estimated_quantity', parseFloat(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">وصف المخلف</Label>
                  <Textarea value={form.waste_description || ''} onChange={e => update('waste_description', e.target.value)} rows={2} />
                </div>
              </div>
            </>
          )}

          {/* Section: Validity */}
          <SectionHeader icon={CalendarDays} title="فترة الصلاحية" />
          <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">صالح من</Label>
                <Input type="datetime-local" value={form.valid_from || ''} onChange={e => update('valid_from', e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">صالح حتى</Label>
                <Input type="datetime-local" value={form.valid_until || ''} onChange={e => update('valid_until', e.target.value)} dir="ltr" />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <SectionHeader icon={StickyNote} title="ملاحظات وتعليمات" />
          <div className="space-y-3 rounded-lg border border-border/40 bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">تعليمات خاصة</Label>
              <Textarea value={form.special_instructions || ''} onChange={e => update('special_instructions', e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ملاحظات</Label>
              <Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">إلغاء</Button>
            <Button type="submit" disabled={createPermit.isPending} className="flex-1">
              {createPermit.isPending ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإنشاء...</> : 'إنشاء التصريح'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePermitDialog;
