/**
 * Document Protection Settings — إعدادات حماية المستند
 * يتيح للجهة ضبط: PIN، صلاحيات المعاينة/التحميل/الطباعة، علامة مائية، إشعار عند التحميل
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Shield, Lock, Eye, Download, Printer, Droplets, Bell, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentProtectionSettingsProps {
  documentId: string;
  initialSettings?: {
    protection_enabled?: boolean;
    protection_pin?: string | null;
    allow_view?: boolean;
    allow_download?: boolean;
    allow_print?: boolean;
    watermark_enabled?: boolean;
    notify_on_download?: boolean;
  };
  onSaved?: () => void;
}

const DocumentProtectionSettings = ({ documentId, initialSettings, onSaved }: DocumentProtectionSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    protection_enabled: initialSettings?.protection_enabled ?? false,
    protection_pin: initialSettings?.protection_pin ?? '',
    allow_view: initialSettings?.allow_view ?? true,
    allow_download: initialSettings?.allow_download ?? true,
    allow_print: initialSettings?.allow_print ?? true,
    watermark_enabled: initialSettings?.watermark_enabled ?? false,
    notify_on_download: initialSettings?.notify_on_download ?? false,
  });

  const handleSave = async () => {
    if (settings.protection_enabled && settings.protection_pin && settings.protection_pin.length < 4) {
      toast.error('رمز الأمان يجب أن يكون 4 أرقام على الأقل');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_documents')
        .update({
          protection_enabled: settings.protection_enabled,
          protection_pin: settings.protection_pin || null,
          allow_view: settings.allow_view,
          allow_download: settings.allow_download,
          allow_print: settings.allow_print,
          watermark_enabled: settings.watermark_enabled,
          notify_on_download: settings.notify_on_download,
        } as any)
        .eq('id', documentId);

      if (error) throw error;
      toast.success('تم حفظ إعدادات الحماية');
      onSaved?.();
      setOpen(false);
    } catch (err: any) {
      toast.error('فشل في حفظ الإعدادات');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const isProtected = settings.protection_enabled;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Shield className={`w-4 h-4 ${isProtected ? 'text-primary' : 'text-muted-foreground'}`} />
          {isProtected && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" dir="rtl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              حماية المستند
            </h4>
            <Switch
              checked={settings.protection_enabled}
              onCheckedChange={(v) => setSettings(s => ({ ...s, protection_enabled: v }))}
            />
          </div>

          {settings.protection_enabled && (
            <div className="space-y-3 pt-2 border-t">
              {/* PIN */}
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  رمز الأمان (PIN)
                </Label>
                <Input
                  type="password"
                  maxLength={6}
                  placeholder="4-6 أرقام"
                  value={settings.protection_pin}
                  onChange={(e) => setSettings(s => ({ ...s, protection_pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  className="h-8 text-sm font-mono text-center tracking-widest"
                  dir="ltr"
                />
                <p className="text-[10px] text-muted-foreground">يُطلب عند التحميل والطباعة</p>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">صلاحيات الوصول</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1.5"><Eye className="w-3 h-3" /> السماح بالمعاينة</span>
                    <Switch
                      checked={settings.allow_view}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, allow_view: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1.5"><Download className="w-3 h-3" /> السماح بالتحميل</span>
                    <Switch
                      checked={settings.allow_download}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, allow_download: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1.5"><Printer className="w-3 h-3" /> السماح بالطباعة</span>
                    <Switch
                      checked={settings.allow_print}
                      onCheckedChange={(v) => setSettings(s => ({ ...s, allow_print: v }))}
                    />
                  </div>
                </div>
              </div>

              {/* Extra protections */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1.5"><Droplets className="w-3 h-3" /> علامة مائية تلقائية</span>
                  <Switch
                    checked={settings.watermark_enabled}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, watermark_enabled: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs flex items-center gap-1.5"><Bell className="w-3 h-3" /> إشعار عند التحميل</span>
                  <Switch
                    checked={settings.notify_on_download}
                    onCheckedChange={(v) => setSettings(s => ({ ...s, notify_on_download: v }))}
                  />
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-1 pt-1">
                {settings.protection_pin && <Badge variant="secondary" className="text-[10px]">🔒 PIN</Badge>}
                {!settings.allow_download && <Badge variant="destructive" className="text-[10px]">⛔ تحميل</Badge>}
                {!settings.allow_print && <Badge variant="destructive" className="text-[10px]">⛔ طباعة</Badge>}
                {settings.watermark_enabled && <Badge variant="outline" className="text-[10px]">💧 علامة مائية</Badge>}
                {settings.notify_on_download && <Badge variant="outline" className="text-[10px]">🔔 إشعار</Badge>}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full h-8 gap-2 text-xs">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                حفظ إعدادات الحماية
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DocumentProtectionSettings;
