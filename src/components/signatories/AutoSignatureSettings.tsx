import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Zap, Truck, FileText, Receipt, Award, ScrollText, FileCheck } from 'lucide-react';
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

const AutoSignatureSettings = () => {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<Record<string, SettingRow>>({});
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [signatures, setSignatures] = useState<OrgSignature[]>([]);
  const [stamps, setStamps] = useState<OrgStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

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

    // Build settings map
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold text-foreground">إعدادات التوقيع والختم التلقائي</h2>
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
                  {/* Auto Sign */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm">توقيع تلقائي</Label>
                    <Switch checked={row.auto_sign} onCheckedChange={v => updateSetting(key, 'auto_sign', v)} />
                  </div>

                  {/* Auto Stamp */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <Label className="text-sm">ختم تلقائي</Label>
                    <Switch checked={row.auto_stamp} onCheckedChange={v => updateSetting(key, 'auto_stamp', v)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Default Signatory */}
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

                  {/* Trigger */}
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
                  {/* Default Signature */}
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

                  {/* Default Stamp */}
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
