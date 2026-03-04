import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notifyAdmins } from '@/services/unifiedNotifier';
import {
  AlertTriangle,
  Send,
  Loader2,
  Truck,
  Flame,
  ShieldAlert,
  Siren,
  Phone,
  MessageSquare,
} from 'lucide-react';

type EmergencyType = 'breakdown' | 'accident' | 'spill' | 'route_deviation' | 'other';

const emergencyTypes: { value: EmergencyType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'breakdown', label: 'تعطل مركبة', icon: Truck, color: 'text-amber-500' },
  { value: 'accident', label: 'حادث مروري', icon: Siren, color: 'text-destructive' },
  { value: 'spill', label: 'انسكاب مواد خطرة', icon: Flame, color: 'text-destructive' },
  { value: 'route_deviation', label: 'انحراف عن المسار', icon: ShieldAlert, color: 'text-amber-500' },
  { value: 'other', label: 'طوارئ أخرى', icon: AlertTriangle, color: 'text-muted-foreground' },
];

interface EmergencyAlertPanelProps {
  shipmentId?: string;
  shipmentNumber?: string;
  driverName?: string;
  compact?: boolean;
}

const EmergencyAlertPanel = ({ shipmentId, shipmentNumber, driverName, compact = false }: EmergencyAlertPanelProps) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('breakdown');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'in_app'>('in_app');

  const handleSendAlert = async () => {
    if (!message.trim()) {
      toast.error('يرجى كتابة تفاصيل الحالة الطارئة');
      return;
    }

    setLoading(true);
    try {
      const typeLabel = emergencyTypes.find(t => t.value === emergencyType)?.label || emergencyType;
      const fullMessage = `🚨 تنبيه طوارئ: ${typeLabel}\n${shipmentNumber ? `الشحنة: ${shipmentNumber}\n` : ''}${driverName ? `السائق: ${driverName}\n` : ''}التفاصيل: ${message}`;

      // 1. إرسال مزدوج (داخلي + واتساب) للمشرفين
      const notifResult = await notifyAdmins(
        `🚨 ${typeLabel}${shipmentNumber ? ` — شحنة ${shipmentNumber}` : ''}`,
        fullMessage,
        {
          type: 'emergency',
          reference_id: shipmentId,
          reference_type: shipmentId ? 'shipment' : undefined,
        }
      );

      // 2. Log as incident
      if (shipmentId) {
        await supabase.from('shipment_logs').insert({
          shipment_id: shipmentId,
          status: 'in_transit' as any,
          notes: `🚨 طوارئ: ${typeLabel} — ${message}`,
          changed_by: profile?.id,
        });
      }

      if (notifResult.whatsApp.success) {
        toast.success('تم إرسال تنبيه الطوارئ (داخلي + واتساب)');
      }

      toast.success('✅ تم إرسال تنبيه الطوارئ للمسؤولين');
      setMessage('');
    } catch (err: any) {
      console.error('Emergency alert error:', err);
      toast.error('فشل في إرسال التنبيه');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-3 p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5" dir="rtl">
        <div className="flex items-center gap-2 text-destructive font-bold">
          <AlertTriangle className="h-5 w-5" />
          إرسال تنبيه طوارئ
        </div>
        <Select value={emergencyType} onValueChange={(v) => setEmergencyType(v as EmergencyType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {emergencyTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>
                <span className="flex items-center gap-2">
                  <t.icon className={`w-4 h-4 ${t.color}`} />
                  {t.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="وصف الحالة الطارئة..."
          rows={2}
          dir="rtl"
        />
        <Button onClick={handleSendAlert} disabled={loading} variant="destructive" className="w-full gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال تنبيه فوري
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-destructive/20" dir="rtl">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center gap-2 justify-end text-destructive">
          <Siren className="w-5 h-5" />
          محرك التنبيهات الطارئة
        </CardTitle>
        <CardDescription>إرسال تنبيهات فورية عبر SMS أو WhatsApp أو إشعار داخلي</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Emergency Type */}
          <div className="space-y-2 text-right">
            <Label>نوع الطوارئ</Label>
            <Select value={emergencyType} onValueChange={(v) => setEmergencyType(v as EmergencyType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <t.icon className={`w-4 h-4 ${t.color}`} />
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel */}
          <div className="space-y-2 text-right">
            <Label>قناة الإرسال</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">
                  <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> إشعار داخلي فقط</span>
                </SelectItem>
                <SelectItem value="sms">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> SMS + إشعار داخلي</span>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-green-500" /> WhatsApp + إشعار داخلي</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info badges */}
          <div className="space-y-2 text-right">
            <Label>معلومات</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {shipmentNumber && <Badge variant="outline">شحنة: {shipmentNumber}</Badge>}
              {driverName && <Badge variant="outline">سائق: {driverName}</Badge>}
              {!shipmentNumber && !driverName && <Badge variant="secondary">تنبيه عام</Badge>}
            </div>
          </div>
        </div>

        <div className="space-y-2 text-right">
          <Label>تفاصيل الحالة الطارئة *</Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="وصف تفصيلي للحالة الطارئة: ماذا حدث، أين، ما الإجراء المطلوب..."
            rows={3}
            dir="rtl"
          />
        </div>

        <div className="flex items-center gap-3 justify-end pt-2 border-t">
          <p className="text-xs text-muted-foreground flex-1">
            سيتم إرسال التنبيه لجميع مسؤولي النظام فوراً
          </p>
          <Button onClick={handleSendAlert} disabled={loading} variant="destructive" size="lg" className="gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            🚨 إرسال تنبيه طوارئ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyAlertPanel;
