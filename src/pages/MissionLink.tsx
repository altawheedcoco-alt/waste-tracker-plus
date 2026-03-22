/**
 * صفحة الرابط المؤقت — للسائق الخارجي المؤجر
 * يفتح الرابط → يرى تفاصيل المهمة → ينفذ → ينتهي دوره
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MapPin, Truck, Package, Clock, CheckCircle2, AlertTriangle,
  Phone, User, Car, FileText, Loader2, XCircle,
} from 'lucide-react';

type MissionStatus = 'pending' | 'sent' | 'opened' | 'in_progress' | 'completed' | 'expired' | 'cancelled';

interface MissionData {
  id: string;
  token: string;
  pickup_address: string;
  delivery_address: string;
  waste_type: string | null;
  estimated_weight: number | null;
  notes: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  status: MissionStatus;
  expires_at: string;
  actual_weight: number | null;
  execution_notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'في انتظار الفتح', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  sent: { label: 'تم الإرسال', color: 'bg-blue-100 text-blue-800', icon: Truck },
  opened: { label: 'تم الفتح', color: 'bg-sky-100 text-sky-800', icon: FileText },
  in_progress: { label: 'جاري التنفيذ', color: 'bg-primary/10 text-primary', icon: Truck },
  completed: { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  expired: { label: 'منتهي الصلاحية', color: 'bg-muted text-muted-foreground', icon: XCircle },
  cancelled: { label: 'ملغي', color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const MissionLink = () => {
  const { token } = useParams<{ token: string }>();
  const [mission, setMission] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // بيانات التنفيذ
  const [actualWeight, setActualWeight] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');

  useEffect(() => {
    if (!token) return;
    loadMission();
  }, [token]);

  const loadMission = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('external_missions')
      .select('*')
      .eq('token', token!)
      .maybeSingle();

    if (err || !data) {
      setError('الرابط غير صالح أو منتهي الصلاحية');
      setLoading(false);
      return;
    }

    // تحقق من انتهاء الصلاحية
    if (new Date(data.expires_at) < new Date() && data.status !== 'completed') {
      setError('انتهت صلاحية هذا الرابط');
      setLoading(false);
      return;
    }

    setMission(data as MissionData);

    // تحديث الحالة لـ opened إذا كانت pending أو sent
    if (data.status === 'pending' || data.status === 'sent') {
      await supabase
        .from('external_missions')
        .update({ status: 'opened' })
        .eq('id', data.id);
      setMission(prev => prev ? { ...prev, status: 'opened' } : null);
    }

    setLoading(false);
  };

  const handleStartMission = async () => {
    if (!mission) return;
    setSubmitting(true);
    const { error: err } = await supabase
      .from('external_missions')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', mission.id);
    if (err) {
      toast.error('فشل بدء المهمة');
    } else {
      toast.success('تم بدء المهمة');
      setMission(prev => prev ? { ...prev, status: 'in_progress' } : null);
    }
    setSubmitting(false);
  };

  const handleCompleteMission = async () => {
    if (!mission) return;
    setSubmitting(true);
    const { error: err } = await supabase
      .from('external_missions')
      .update({
        status: 'completed',
        actual_weight: actualWeight ? parseFloat(actualWeight) : null,
        execution_notes: executionNotes || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', mission.id);
    if (err) {
      toast.error('فشل تأكيد التسليم');
    } else {
      toast.success('✅ تم تأكيد التسليم بنجاح');
      setMission(prev => prev ? { ...prev, status: 'completed' } : null);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">{error || 'رابط غير صالح'}</h1>
            <p className="text-sm text-muted-foreground">
              تأكد من صحة الرابط أو تواصل مع الجهة التي أرسلته لك
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[mission.status];
  const StatusIcon = statusConfig.icon;
  const isCompleted = mission.status === 'completed';
  const isInProgress = mission.status === 'in_progress';
  const canStart = mission.status === 'opened';

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background" dir="rtl">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">مهمة شحن</h1>
              <p className="text-[10px] text-muted-foreground">رابط مؤقت — لمرة واحدة</p>
            </div>
          </div>
          <Badge className={`${statusConfig.color} border-0 gap-1`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* تفاصيل المهمة */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              تفاصيل الشحنة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">نقطة التحميل</p>
                <p className="text-sm font-medium text-foreground">{mission.pickup_address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">نقطة التسليم</p>
                <p className="text-sm font-medium text-foreground">{mission.delivery_address}</p>
              </div>
            </div>
            {mission.waste_type && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">نوع النفاية:</span>
                <Badge variant="outline">{mission.waste_type}</Badge>
              </div>
            )}
            {mission.estimated_weight && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">الوزن التقديري:</span>
                <span className="font-bold">{mission.estimated_weight} كجم</span>
              </div>
            )}
            {mission.notes && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">{mission.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* بيانات السائق */}
        {(mission.driver_name || mission.driver_phone) && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              {mission.driver_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{mission.driver_name}</span>
                </div>
              )}
              {mission.driver_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span dir="ltr">{mission.driver_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* أزرار الإجراء */}
        {canStart && (
          <Button
            className="w-full h-12 text-base font-bold gap-2"
            onClick={handleStartMission}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-5 h-5" />}
            بدء المهمة
          </Button>
        )}

        {isInProgress && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                تأكيد التسليم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">الوزن الفعلي (كجم)</label>
                <Input
                  type="number"
                  placeholder="أدخل الوزن الفعلي"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">ملاحظات التنفيذ</label>
                <Textarea
                  placeholder="أي ملاحظات عن الشحنة..."
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                className="w-full h-12 text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCompleteMission}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                تأكيد التسليم ✅
              </Button>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="pt-6 text-center space-y-2">
              <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">تم التسليم بنجاح</h2>
              <p className="text-sm text-muted-foreground">شكراً لك — انتهت مهمتك</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-[10px] text-center text-muted-foreground pt-4">
          هذا رابط مؤقت صالح لمرة واحدة • iRecycle Platform v5.1
        </p>
      </div>
    </div>
  );
};

export default MissionLink;
