import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Zap, Truck, FileText, Receipt, Award, ScrollText, FileCheck, QrCode, Barcode, PenTool, Stamp, ShieldCheck, Fingerprint, Hash, ScanLine, CheckCircle2 } from 'lucide-react';
import { saveAutoSignSetting, getOrgAutoSignSettings } from '@/services/autoSignatureEngine';

interface Signatory {
  id: string;
  full_name: string;
  job_title: string | null;
  is_active: boolean | null;
}

interface OrgSignature {
  id: string;
  signature_name: string;
  signer_name: string;
  is_active: boolean;
}

interface OrgStamp {
  id: string;
  stamp_name: string;
  is_active: boolean;
}

interface SettingRow {
  id?: string;
  document_type: string;
  is_enabled: boolean;
  auto_sign: boolean;
  auto_stamp: boolean;
  default_signatory_id: string | null;
  default_signature_id: string | null;
  default_stamp_id: string | null;
  trigger_on: string;
  trigger_status: string | null;
}

const DOCUMENT_TYPES = [
  { key: 'shipment', label: 'الشحنات', icon: Truck },
  { key: 'contract', label: 'العقود', icon: FileText },
  { key: 'invoice', label: 'الفواتير', icon: Receipt },
  { key: 'certificate', label: 'الشهادات', icon: Award },
  { key: 'award_letter', label: 'خطابات الترسية', icon: ScrollText },
  { key: 'declaration', label: 'الإقرارات', icon: FileCheck },
];

const TRIGGER_OPTIONS = [
  { value: 'creation', label: 'عند الإنشاء' },
  { value: 'approval', label: 'عند الاعتماد' },
  { value: 'status_change', label: 'عند تغيير الحالة' },
];

// ─── Signing Methods ───
const SIGNING_METHODS = [
  { value: 'digital_draw', label: 'رسم يدوي (Canvas)', icon: PenTool, desc: 'توقيع بالرسم المباشر على الشاشة' },
  { value: 'digital_type', label: 'توقيع مكتوب', icon: FileText, desc: 'كتابة الاسم كتوقيع نصي' },
  { value: 'digital_image', label: 'صورة توقيع مرفوعة', icon: Fingerprint, desc: 'رفع صورة التوقيع الشخصي' },
  { value: 'click_to_sign', label: 'توقيع بالنقر', icon: CheckCircle2, desc: 'اعتماد بنقرة واحدة (الأسرع)' },
  { value: 'biometric', label: 'بصمة بيومترية', icon: Fingerprint, desc: 'التحقق بالبصمة (إن توفرت)' },
  { value: 'otp_verified', label: 'توقيع مؤكد بـ OTP', icon: ShieldCheck, desc: 'رمز تحقق عبر SMS/بريد إلكتروني' },
  { value: 'manual_print', label: 'طباعة للتوقيع الحي', icon: FileCheck, desc: 'طباعة نسخة مع أماكن للتوقيع والختم' },
];

// ─── Stamp Methods ───
const STAMP_METHODS = [
  { value: 'digital_stamp', label: 'ختم إلكتروني (صورة)', icon: Stamp, desc: 'ختم رقمي بصورة الختم الرسمي' },
  { value: 'platform_seal', label: 'ختم المنصة الرسمي', icon: ShieldCheck, desc: 'ختم iRecycle الموثق تلقائياً' },
  { value: 'organization_seal', label: 'ختم الجهة المعتمد', icon: Award, desc: 'ختم المنظمة المسجل لدينا' },
  { value: 'notary_stamp', label: 'ختم توثيقي (نوتاري)', icon: ScrollText, desc: 'ختم مع تصديق رسمي' },
  { value: 'qr_seal', label: 'ختم QR ذكي', icon: QrCode, desc: 'ختم مع رمز QR مدمج للتحقق' },
  { value: 'manual_stamp', label: 'طباعة للختم الحي', icon: FileCheck, desc: 'طباعة لإضافة الختم يدوياً' },
];

// ─── Verification Methods ───
const VERIFICATION_METHODS = [
  { key: 'qr_code', label: 'رمز QR', icon: QrCode, desc: 'رمز استجابة سريع للتحقق الفوري', color: 'text-primary' },
  { key: 'barcode', label: 'باركود', icon: Barcode, desc: 'كود خطي للمسح الميداني', color: 'text-emerald-600' },
  { key: 'sha256_hash', label: 'بصمة SHA-256', icon: Hash, desc: 'بصمة رقمية لسلامة المستند', color: 'text-amber-600' },
  { key: 'vrf_code', label: 'رمز تحقق VRF', icon: ScanLine, desc: 'رمز تحقق فريد أبجدي رقمي', color: 'text-violet-600' },
  { key: 'digital_signature', label: 'توقيع إلكتروني', icon: PenTool, desc: 'توقيع مفوض رقمي معتمد', color: 'text-blue-600' },
  { key: 'org_stamp', label: 'ختم الجهة', icon: Stamp, desc: 'ختم المنظمة الرسمي', color: 'text-red-600' },
  { key: 'platform_endorsement', label: 'تصديق المنصة', icon: ShieldCheck, desc: 'ختم اعتماد المنصة الرسمي', color: 'text-primary' },
  { key: 'watermark', label: 'علامة مائية', icon: Fingerprint, desc: 'علامة حماية مطبوعة على المستند', color: 'text-muted-foreground' },
];

const AutoSignatureSettings = () => {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<Record<string, SettingRow>>({});
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [signatures, setSignatures] = useState<OrgSignature[]>([]);
  const [stamps, setStamps] = useState<OrgStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Global defaults (stored in localStorage for now)
  const [defaultSigningMethod, setDefaultSigningMethod] = useState(() => localStorage.getItem('default_signing_method') || 'click_to_sign');
  const [defaultStampMethod, setDefaultStampMethod] = useState(() => localStorage.getItem('default_stamp_method') || 'digital_stamp');
  const [enabledVerifications, setEnabledVerifications] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('enabled_verifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return VERIFICATION_METHODS.reduce((acc, v) => ({ ...acc, [v.key]: true }), {});
  });

  const orgId = organization?.id;

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    const [settingsData, sigData, sigsData, stampsData] = await Promise.all([
      getOrgAutoSignSettings(orgId),
      supabase.from('authorized_signatories').select('id, full_name, job_title, is_active').eq('organization_id', orgId).eq('is_active', true),
      (supabase.from('organization_signatures') as any).select('id, signature_name, signer_name, is_active').eq('organization_id', orgId).eq('is_active', true),
      (supabase.from('organization_stamps') as any).select('id, stamp_name, is_active').eq('organization_id', orgId).eq('is_active', true),
    ]);

    const map: Record<string, SettingRow> = {};
    DOCUMENT_TYPES.forEach(dt => {
      const existing = settingsData.find(s => s.document_type === dt.key);
      map[dt.key] = existing ? {
        id: existing.id,
        document_type: dt.key,
        is_enabled: existing.is_enabled,
        auto_sign: existing.auto_sign,
        auto_stamp: existing.auto_stamp,
        default_signatory_id: existing.default_signatory_id,
        default_signature_id: existing.default_signature_id,
        default_stamp_id: existing.default_stamp_id,
        trigger_on: existing.trigger_on,
        trigger_status: existing.trigger_status,
      } : {
        document_type: dt.key,
        is_enabled: false,
        auto_sign: false,
        auto_stamp: false,
        default_signatory_id: null,
        default_signature_id: null,
        default_stamp_id: null,
        trigger_on: 'creation',
        trigger_status: null,
      };
    });

    setSettings(map);
    setSignatories((sigData.data || []) as Signatory[]);
    setSignatures((sigsData.data || []) as OrgSignature[]);
    setStamps((stampsData.data || []) as OrgStamp[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateSetting = (docType: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [docType]: { ...prev[docType], [field]: value },
    }));
  };

  const handleSave = async (docType: string) => {
    if (!orgId) return;
    setSaving(docType);
    const row = settings[docType];
    const success = await saveAutoSignSetting({
      organization_id: orgId,
      document_type: docType,
      is_enabled: row.is_enabled,
      auto_sign: row.auto_sign,
      auto_stamp: row.auto_stamp,
      default_signatory_id: row.default_signatory_id,
      default_signature_id: row.default_signature_id,
      default_stamp_id: row.default_stamp_id,
      trigger_on: row.trigger_on,
      trigger_status: row.trigger_status,
    });
    if (success) {
      toast.success(`تم حفظ إعدادات ${DOCUMENT_TYPES.find(d => d.key === docType)?.label}`);
    } else {
      toast.error('فشل في الحفظ');
    }
    setSaving(null);
  };

  const saveGlobalDefaults = () => {
    localStorage.setItem('default_signing_method', defaultSigningMethod);
    localStorage.setItem('default_stamp_method', defaultStampMethod);
    localStorage.setItem('enabled_verifications', JSON.stringify(enabledVerifications));
    toast.success('تم حفظ الإعدادات الافتراضية');
  };

  const toggleVerification = (key: string) => {
    setEnabledVerifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enabledCount = Object.values(enabledVerifications).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* ═══════════════════════════════════════════════
          Section 1: Verification Methods (TOP - Primary)
          ═══════════════════════════════════════════════ */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/[0.03] to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            وسائل التحقق والتوثيق الافتراضية
            <Badge variant="outline" className="text-[10px] mr-2">{enabledCount}/{VERIFICATION_METHODS.length} مفعّل</Badge>
          </CardTitle>
          <CardDescription>
            اختر وسائل التحقق التي ستُدمج تلقائياً في جميع المستندات الرسمية الصادرة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VERIFICATION_METHODS.map(({ key, label, icon: Icon, desc, color }) => (
              <div
                key={key}
                onClick={() => toggleVerification(key)}
                className={`relative cursor-pointer rounded-xl border-2 p-3 transition-all hover:shadow-md ${
                  enabledVerifications[key]
                    ? 'border-primary/50 bg-primary/[0.04] shadow-sm'
                    : 'border-border/50 bg-muted/20 opacity-60'
                }`}
              >
                {enabledVerifications[key] && (
                  <div className="absolute top-2 left-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* ─── Default Signing Method ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary" />
                <Label className="text-sm font-semibold">طريقة التوقيع الافتراضية</Label>
              </div>
              <Select value={defaultSigningMethod} onValueChange={setDefaultSigningMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر طريقة التوقيع" />
                </SelectTrigger>
                <SelectContent>
                  {SIGNING_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-medium">{m.label}</span>
                          <span className="text-[10px] text-muted-foreground mr-2">— {m.desc}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Quick preview of all methods */}
              <div className="flex flex-wrap gap-1.5">
                {SIGNING_METHODS.map(m => (
                  <Badge
                    key={m.value}
                    variant={defaultSigningMethod === m.value ? 'default' : 'outline'}
                    className="text-[9px] cursor-pointer gap-1 transition-all"
                    onClick={() => setDefaultSigningMethod(m.value)}
                  >
                    <m.icon className="w-2.5 h-2.5" />
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* ─── Default Stamp Method ─── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Stamp className="w-4 h-4 text-red-600" />
                <Label className="text-sm font-semibold">طريقة الختم الافتراضية</Label>
              </div>
              <Select value={defaultStampMethod} onValueChange={setDefaultStampMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر طريقة الختم" />
                </SelectTrigger>
                <SelectContent>
                  {STAMP_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-medium">{m.label}</span>
                          <span className="text-[10px] text-muted-foreground mr-2">— {m.desc}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-1.5">
                {STAMP_METHODS.map(m => (
                  <Badge
                    key={m.value}
                    variant={defaultStampMethod === m.value ? 'default' : 'outline'}
                    className="text-[9px] cursor-pointer gap-1 transition-all"
                    onClick={() => setDefaultStampMethod(m.value)}
                  >
                    <m.icon className="w-2.5 h-2.5" />
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={saveGlobalDefaults} size="sm" className="gap-2 mt-2">
            <ShieldCheck className="w-4 h-4" />
            حفظ الإعدادات الافتراضية
          </Button>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════
          Section 2: Per-Document Auto-Sign Settings
          ═══════════════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-foreground">إعدادات التوقيع والختم التلقائي لكل مستند</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        فعّل التوقيع التلقائي لكل نوع مستند، وحدد المفوض والتوقيع والختم الافتراضي وتوقيت التطبيق.
      </p>

      {DOCUMENT_TYPES.map(({ key, label, icon: Icon }) => {
        const row = settings[key];
        if (!row) return null;

        return (
          <Card key={key} className={`transition-all ${row.is_enabled ? 'border-primary/40' : 'opacity-70'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  {label}
                  {row.is_enabled && <Badge variant="outline" className="text-[10px] gap-1"><Zap className="w-3 h-3" />تلقائي</Badge>}
                </CardTitle>
                <Switch
                  checked={row.is_enabled}
                  onCheckedChange={v => updateSetting(key, 'is_enabled', v)}
                />
              </div>
            </CardHeader>

            {row.is_enabled && (
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm">توقيع تلقائي</Label>
                    <Switch checked={row.auto_sign} onCheckedChange={v => updateSetting(key, 'auto_sign', v)} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm">ختم تلقائي</Label>
                    <Switch checked={row.auto_stamp} onCheckedChange={v => updateSetting(key, 'auto_stamp', v)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">المفوض الافتراضي</Label>
                    <Select value={row.default_signatory_id || ''} onValueChange={v => updateSetting(key, 'default_signatory_id', v || null)}>
                      <SelectTrigger><SelectValue placeholder="اختر مفوضاً" /></SelectTrigger>
                      <SelectContent>
                        {signatories.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.full_name} {s.job_title ? `— ${s.job_title}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">توقيت التوقيع</Label>
                    <Select value={row.trigger_on} onValueChange={v => updateSetting(key, 'trigger_on', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TRIGGER_OPTIONS.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">صورة التوقيع الافتراضية</Label>
                    <Select value={row.default_signature_id || ''} onValueChange={v => updateSetting(key, 'default_signature_id', v || null)}>
                      <SelectTrigger><SelectValue placeholder="اختر توقيعاً" /></SelectTrigger>
                      <SelectContent>
                        {signatures.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.signature_name} — {s.signer_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">الختم الافتراضي</Label>
                    <Select value={row.default_stamp_id || ''} onValueChange={v => updateSetting(key, 'default_stamp_id', v || null)}>
                      <SelectTrigger><SelectValue placeholder="اختر ختماً" /></SelectTrigger>
                      <SelectContent>
                        {stamps.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.stamp_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {row.trigger_on === 'status_change' && (
                  <div className="max-w-xs">
                    <Label className="text-xs">الحالة المُحفزة</Label>
                    <Select value={row.trigger_status || ''} onValueChange={v => updateSetting(key, 'trigger_status', v || null)}>
                      <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">مسجلة</SelectItem>
                        <SelectItem value="picked_up">تم الاستلام</SelectItem>
                        <SelectItem value="in_transit">قيد النقل</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="confirmed">مؤكدة</SelectItem>
                        <SelectItem value="approved">معتمدة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  className="gap-2"
                >
                  {saving === key && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ الإعدادات
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default AutoSignatureSettings;
