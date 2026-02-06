import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Fingerprint,
  Stamp,
  PenTool,
  Upload,
  Shield,
  Settings2,
  Loader2,
  Save,
  Info,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SignatureSettings {
  require_biometric_for_stamp: boolean;
  allow_stamp_without_biometric: boolean;
  allow_uploaded_signature: boolean;
  allow_drawn_signature: boolean;
  require_biometric_for_signature: boolean;
  default_signature_method: 'uploaded' | 'drawn' | 'biometric';
}

const defaultSettings: SignatureSettings = {
  require_biometric_for_stamp: false,
  allow_stamp_without_biometric: true,
  allow_uploaded_signature: true,
  allow_drawn_signature: true,
  require_biometric_for_signature: false,
  default_signature_method: 'drawn',
};

const OrganizationSignatureSettings = () => {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<SignatureSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [organization?.id]);

  const loadSettings = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_signature_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          require_biometric_for_stamp: data.require_biometric_for_stamp,
          allow_stamp_without_biometric: data.allow_stamp_without_biometric,
          allow_uploaded_signature: data.allow_uploaded_signature,
          allow_drawn_signature: data.allow_drawn_signature,
          require_biometric_for_signature: data.require_biometric_for_signature,
          default_signature_method: data.default_signature_method as 'uploaded' | 'drawn' | 'biometric',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = <K extends keyof SignatureSettings>(
    key: K,
    value: SignatureSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!organization?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organization_signature_settings')
        .upsert({
          organization_id: organization.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id',
        });

      if (error) throw error;

      toast.success('تم حفظ إعدادات التوقيع بنجاح');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              إعدادات التوقيع والختم
            </CardTitle>
            <CardDescription>
              تحكم في كيفية توقيع وختم المستندات في جهتك
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
              تغييرات غير محفوظة
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg text-primary">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">خيارات مرنة للتوقيع</p>
            <p className="text-primary/80">
              يمكنك اختيار السماح برفع صورة التوقيع، أو التوقيع الحي، أو التحقق البيومتري، أو مزيج منها.
            </p>
          </div>
        </div>

        {/* Stamp Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Stamp className="h-5 w-5 text-violet-600" />
            <h3 className="font-semibold">إعدادات الختم</h3>
          </div>

          <div className="space-y-4 mr-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>السماح بالختم بدون تحقق بيومتري</Label>
                <p className="text-xs text-muted-foreground">
                  يمكن تطبيق الختم مباشرة على المستندات
                </p>
              </div>
              <Switch
                checked={settings.allow_stamp_without_biometric}
                onCheckedChange={(checked) =>
                  handleChange('allow_stamp_without_biometric', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  طلب التحقق البيومتري للختم
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 ml-1" />
                    أمان عالي
                  </Badge>
                </Label>
                <p className="text-xs text-muted-foreground">
                  يتطلب بصمة أو وجه لتطبيق الختم على أي مستند
                </p>
              </div>
              <Switch
                checked={settings.require_biometric_for_stamp}
                onCheckedChange={(checked) =>
                  handleChange('require_biometric_for_stamp', checked)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Signature Settings */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">إعدادات التوقيع</h3>
          </div>

          <div className="space-y-4 mr-7">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  السماح برفع صورة التوقيع
                </Label>
                <p className="text-xs text-muted-foreground">
                  رفع صورة توقيع ثابتة تُستخدم في كل المستندات
                </p>
              </div>
              <Switch
                checked={settings.allow_uploaded_signature}
                onCheckedChange={(checked) =>
                  handleChange('allow_uploaded_signature', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  السماح بالتوقيع اليدوي الحي
                </Label>
                <p className="text-xs text-muted-foreground">
                  التوقيع بالإصبع أو الماوس عند كل مستند
                </p>
              </div>
              <Switch
                checked={settings.allow_drawn_signature}
                onCheckedChange={(checked) =>
                  handleChange('allow_drawn_signature', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  طلب التحقق البيومتري للتوقيع
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 ml-1" />
                    أمان عالي
                  </Badge>
                </Label>
                <p className="text-xs text-muted-foreground">
                  يتطلب تأكيد الهوية بالبصمة أو الوجه مع كل توقيع
                </p>
              </div>
              <Switch
                checked={settings.require_biometric_for_signature}
                onCheckedChange={(checked) =>
                  handleChange('require_biometric_for_signature', checked)
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Default Method */}
        <div className="space-y-4">
          <Label>طريقة التوقيع الافتراضية</Label>
          <Select
            value={settings.default_signature_method}
            onValueChange={(value: 'uploaded' | 'drawn' | 'biometric') =>
              handleChange('default_signature_method', value)
            }
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {settings.allow_uploaded_signature && (
                <SelectItem value="uploaded">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    صورة التوقيع المرفوعة
                  </div>
                </SelectItem>
              )}
              {settings.allow_drawn_signature && (
                <SelectItem value="drawn">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4" />
                    توقيع يدوي حي
                  </div>
                </SelectItem>
              )}
              <SelectItem value="biometric">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  تحقق بيومتري فقط
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            الطريقة التي ستظهر افتراضياً عند توقيع المستندات
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 min-w-[140px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationSignatureSettings;
