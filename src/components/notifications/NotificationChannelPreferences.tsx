import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Mail, Phone, Smartphone, Clock, Save, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

interface ChannelPrefs {
  in_app_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_phone: string;
  notification_email: string;
  sms_phone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
  quiet_hours_enabled: boolean;
}

const defaultPrefs: ChannelPrefs = {
  in_app_enabled: true,
  push_enabled: true,
  whatsapp_enabled: true,
  email_enabled: false,
  sms_enabled: false,
  whatsapp_phone: '',
  notification_email: '',
  sms_phone: '',
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  quiet_hours_enabled: false,
};

const NotificationChannelPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<ChannelPrefs>(defaultPrefs);

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: ['notification-channel-prefs', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await (supabase as any)
        .from('notification_channel_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as any;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (savedPrefs) {
      setPrefs({
        in_app_enabled: savedPrefs.in_app_enabled ?? true,
        push_enabled: savedPrefs.push_enabled ?? true,
        whatsapp_enabled: savedPrefs.whatsapp_enabled ?? true,
        email_enabled: savedPrefs.email_enabled ?? false,
        sms_enabled: savedPrefs.sms_enabled ?? false,
        whatsapp_phone: savedPrefs.whatsapp_phone ?? '',
        notification_email: savedPrefs.notification_email ?? '',
        sms_phone: savedPrefs.sms_phone ?? '',
        quiet_hours_start: savedPrefs.quiet_hours_start ?? '22:00',
        quiet_hours_end: savedPrefs.quiet_hours_end ?? '07:00',
        quiet_hours_enabled: savedPrefs.quiet_hours_enabled ?? false,
      });
    }
  }, [savedPrefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const payload = {
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_channel_preferences' as any)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channel-prefs'] });
      toast.success('تم حفظ تفضيلات الإشعارات بنجاح');
    },
    onError: () => toast.error('فشل في حفظ التفضيلات'),
  });

  const channels = [
    {
      key: 'in_app_enabled' as const,
      label: 'داخل التطبيق',
      desc: 'إشعارات فورية داخل المنصة',
      icon: Bell,
      color: 'text-primary',
      badge: 'أساسي',
      badgeClass: 'bg-primary/10 text-primary',
      disabled: true,
    },
    {
      key: 'push_enabled' as const,
      label: 'إشعارات الدفع',
      desc: 'إشعارات على المتصفح والجوال',
      icon: Smartphone,
      color: 'text-chart-2',
      badge: 'مُوصى',
      badgeClass: 'bg-chart-2/10 text-chart-2',
    },
    {
      key: 'whatsapp_enabled' as const,
      label: 'واتساب',
      desc: 'رسائل فورية عبر WaPilot',
      icon: MessageCircle,
      color: 'text-chart-4',
      badge: 'متاح',
      badgeClass: 'bg-chart-4/10 text-chart-4',
    },
    {
      key: 'email_enabled' as const,
      label: 'البريد الإلكتروني',
      desc: 'إشعارات عبر الإيميل',
      icon: Mail,
      color: 'text-chart-3',
      badge: 'اختياري',
      badgeClass: 'bg-chart-3/10 text-chart-3',
    },
    {
      key: 'sms_enabled' as const,
      label: 'رسائل SMS',
      desc: 'رسائل نصية قصيرة',
      icon: Phone,
      color: 'text-chart-5',
      badge: 'قريباً',
      badgeClass: 'bg-muted text-muted-foreground',
      disabled: true,
      comingSoon: true,
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-border/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="w-5 h-5 text-primary" />
            قنوات الإشعارات
          </CardTitle>
          <p className="text-xs text-muted-foreground">اختر الطريقة المفضلة لاستقبال الإشعارات</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.map((ch) => (
            <div
              key={ch.key}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20"
            >
              <div className="flex items-center gap-3">
                <ch.icon className={`w-5 h-5 ${ch.color}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{ch.label}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ch.badgeClass}`}>
                      {ch.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{ch.desc}</p>
                </div>
              </div>
              <Switch
                checked={prefs[ch.key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [ch.key]: v }))}
                disabled={ch.disabled}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* إعدادات إضافية */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">بيانات الاتصال</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {prefs.whatsapp_enabled && (
            <div className="space-y-1">
              <Label className="text-xs">رقم واتساب (اختياري - يؤخذ من الملف الشخصي تلقائياً)</Label>
              <Input
                placeholder="201xxxxxxxxx"
                value={prefs.whatsapp_phone}
                onChange={(e) => setPrefs((p) => ({ ...p, whatsapp_phone: e.target.value }))}
                className="text-sm h-9"
                dir="ltr"
              />
            </div>
          )}
          {prefs.email_enabled && (
            <div className="space-y-1">
              <Label className="text-xs">بريد الإشعارات (اختياري)</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={prefs.notification_email}
                onChange={(e) => setPrefs((p) => ({ ...p, notification_email: e.target.value }))}
                className="text-sm h-9"
                dir="ltr"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ساعات الهدوء */}
      <Card className="border-border/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              ساعات الهدوء
            </CardTitle>
            <Switch
              checked={prefs.quiet_hours_enabled}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, quiet_hours_enabled: v }))}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">خلال هذه الفترة ستصلك إشعارات داخل التطبيق فقط</p>
        </CardHeader>
        {prefs.quiet_hours_enabled && (
          <CardContent className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">من</Label>
              <Input
                type="time"
                value={prefs.quiet_hours_start}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_hours_start: e.target.value }))}
                className="text-sm h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">إلى</Label>
              <Input
                type="time"
                value={prefs.quiet_hours_end}
                onChange={(e) => setPrefs((p) => ({ ...p, quiet_hours_end: e.target.value }))}
                className="text-sm h-9"
              />
            </div>
          </CardContent>
        )}
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full gap-2"
      >
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        حفظ التفضيلات
      </Button>
    </div>
  );
};

export default NotificationChannelPreferences;
