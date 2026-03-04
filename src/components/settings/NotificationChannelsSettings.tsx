import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Phone, 
  Bell, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Loader2,
  Smartphone,
  Settings2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChannelConfig {
  id?: string;
  channel_type: 'whatsapp' | 'sms';
  is_enabled: boolean;
  phone_number: string;
  notify_shipment_updates: boolean;
  notify_payment_updates: boolean;
  notify_contract_alerts: boolean;
  notify_system_alerts: boolean;
}

const defaultChannel = (type: 'whatsapp' | 'sms'): ChannelConfig => ({
  channel_type: type,
  is_enabled: false,
  phone_number: '',
  notify_shipment_updates: true,
  notify_payment_updates: true,
  notify_contract_alerts: true,
  notify_system_alerts: false,
});

const NotificationChannelsSettings = () => {
  const { user, organization } = useAuth();
  const queryClient = useQueryClient();
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['notification-channels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as ChannelConfig[];
    },
    enabled: !!user?.id,
  });

  const { data: twilioStatus } = useQuery({
    queryKey: ['twilio-status'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('send-notification', {
        body: { action: 'status' },
      });
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const upsertChannel = useMutation({
    mutationFn: async (config: ChannelConfig) => {
      const payload = {
        user_id: user!.id,
        organization_id: organization?.id,
        ...config,
      };
      
      if (config.id) {
        const { error } = await supabase
          .from('notification_channels')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_channels')
          .upsert(payload, { onConflict: 'user_id,channel_type' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      toast.success('تم حفظ إعدادات الإشعارات');
    },
    onError: () => toast.error('فشل في حفظ الإعدادات'),
  });

  const sendTestMessage = async (channel: 'whatsapp' | 'sms', phone: string) => {
    setTestingChannel(channel);
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          action: 'send',
          channel,
          phone,
          message: `✅ رسالة تجريبية من منصة آي ريسايكل - ${channel === 'whatsapp' ? 'واتساب' : 'SMS'} يعمل بنجاح!`,
          userId: user?.id,
        },
      });
      
      if (error) throw error;
      if (data?.success) {
        toast.success(`تم إرسال رسالة تجريبية عبر ${channel === 'whatsapp' ? 'واتساب' : 'SMS'}`);
      } else {
        toast.error(data?.error || 'فشل في الإرسال');
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الإرسال');
    } finally {
      setTestingChannel(null);
    }
  };

  const getChannelConfig = (type: 'whatsapp' | 'sms'): ChannelConfig => {
    const existing = channels?.find(c => c.channel_type === type);
    return existing || defaultChannel(type);
  };

  const handleToggle = (type: 'whatsapp' | 'sms', field: keyof ChannelConfig, value: any) => {
    const config = { ...getChannelConfig(type), [field]: value };
    upsertChannel.mutate(config);
  };

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">جاري التحميل...</CardContent></Card>;
  }

  const renderChannelCard = (type: 'whatsapp' | 'sms') => {
    const config = getChannelConfig(type);
    const isWhatsApp = type === 'whatsapp';
    const icon = isWhatsApp ? MessageSquare : Phone;
    const Icon = icon;
    const label = isWhatsApp ? 'واتساب' : 'رسائل SMS';
    const color = isWhatsApp ? 'text-green-600' : 'text-blue-600';
    const bgColor = isWhatsApp ? 'bg-green-50 dark:bg-green-950/20' : 'bg-blue-50 dark:bg-blue-950/20';

    return (
      <Card key={type} className={`border ${config.is_enabled ? 'border-primary/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              {label}
            </CardTitle>
            <Switch
              checked={config.is_enabled}
              onCheckedChange={(v) => handleToggle(type, 'is_enabled', v)}
            />
          </div>
          {!twilioStatus?.configured && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5" />
              يتطلب إعداد Twilio لتفعيل الإرسال الفعلي
            </div>
          )}
        </CardHeader>
        
        {config.is_enabled && (
          <CardContent className="space-y-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                رقم الهاتف (مع كود الدولة)
              </Label>
              <div className="flex gap-2">
                <Input
                  dir="ltr"
                  placeholder="+201234567890"
                  value={config.phone_number || ''}
                  onChange={(e) => {
                    const updated = { ...config, phone_number: e.target.value };
                    // Don't save on every keystroke - just update local
                    const existing = channels?.find(c => c.channel_type === type);
                    if (existing) {
                      // Update in place for UI
                    }
                  }}
                  onBlur={(e) => handleToggle(type, 'phone_number', e.target.value)}
                  className="font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!config.phone_number || testingChannel === type}
                  onClick={() => sendTestMessage(type, config.phone_number)}
                >
                  {testingChannel === type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Notification Preferences */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Settings2 className="h-4 w-4" />
                أنواع الإشعارات
              </Label>
              
              {[
                { key: 'notify_shipment_updates', label: 'تحديثات الشحنات', desc: 'إنشاء، موافقة، نقل، تسليم، إتمام' },
                { key: 'notify_driver_assignments', label: 'تعيين السائقين', desc: 'إشعار عند تعيين سائق لشحنة' },
                { key: 'notify_delivery_confirmations', label: 'تأكيدات التسليم', desc: 'إشعار فوري عند وصول الشحنة' },
                { key: 'notify_payment_updates', label: 'تحديثات المدفوعات', desc: 'الإيداعات، الفواتير، المستحقات' },
                { key: 'notify_contract_alerts', label: 'تنبيهات العقود', desc: 'انتهاء العقود، التجديد' },
                { key: 'notify_emergency_alerts', label: 'تنبيهات الطوارئ', desc: 'حالات حرجة تتطلب اهتمام فوري' },
                { key: 'notify_daily_reports', label: 'التقرير اليومي', desc: 'ملخص يومي بالشحنات والإيرادات والأداء' },
                { key: 'notify_weekly_reports', label: 'التقرير الأسبوعي', desc: 'ملخص أسبوعي شامل بالإحصائيات' },
                { key: 'notify_system_alerts', label: 'تنبيهات النظام', desc: 'صيانة، تحديثات هامة' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(config as any)[item.key]}
                    onCheckedChange={(v) => handleToggle(type, item.key as keyof ChannelConfig, v)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">قنوات الإشعارات</h3>
          <p className="text-sm text-muted-foreground">اختر كيف تريد استلام الإشعارات المهمة</p>
        </div>
        {twilioStatus?.configured && (
          <Badge variant="default" className="mr-auto gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            متصل
          </Badge>
        )}
      </div>

      {renderChannelCard('whatsapp')}
      {renderChannelCard('sms')}
    </div>
  );
};

export default NotificationChannelsSettings;
