import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-green-100 text-green-800' },
  expired: { label: 'منتهي', color: 'bg-red-100 text-red-800' },
  draft: { label: 'مسودة', color: 'bg-muted text-foreground' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
  superseded: { label: 'مُعدّل', color: 'bg-yellow-100 text-yellow-800' },
};

const PublicPermitView = () => {
  const { token } = useParams<{ token: string }>();
  const [permit, setPermit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchPermit = async () => {
      const { data, error: err } = await supabase
        .from('permits')
        .select('*')
        .eq('share_token', token)
        .maybeSingle();

      if (err) {
        setError('خطأ في تحميل التصريح');
      } else if (!data) {
        setError('التصريح غير موجود أو الرابط منتهي الصلاحية');
      } else if (data.share_token_expires_at && new Date(data.share_token_expires_at) < new Date()) {
        setError('انتهت صلاحية رابط المشاركة');
      } else {
        setPermit(data);
      }
      setLoading(false);
    };
    fetchPermit();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!permit) return null;

  const statusInfo = STATUS_LABELS[permit.status] || STATUS_LABELS.draft;
  const isExpired = permit.valid_until && new Date(permit.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-background rounded-xl shadow-lg border p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <FileText className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-xl font-bold">تصريح رسمي</h1>
          <p className="text-sm text-muted-foreground font-mono">{permit.permit_number}</p>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
          {isExpired && <Badge variant="destructive">منتهي الصلاحية</Badge>}
        </div>

        {/* Person Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          {permit.person_photo_url && (
            <div className="flex justify-center mb-2">
              <img src={permit.person_photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2" />
            </div>
          )}
          {permit.person_name && <InfoRow label="الاسم" value={permit.person_name} />}
          {permit.person_role && <InfoRow label="الصفة" value={permit.person_role} />}
          {permit.person_id_number && <InfoRow label="رقم الهوية" value={permit.person_id_number} />}
          {permit.vehicle_plate && <InfoRow label="لوحة المركبة" value={permit.vehicle_plate} />}
          {permit.purpose && <InfoRow label="الغرض" value={permit.purpose} />}
          {permit.valid_from && <InfoRow label="صالح من" value={new Date(permit.valid_from).toLocaleDateString('ar-EG')} />}
          {permit.valid_until && <InfoRow label="صالح حتى" value={new Date(permit.valid_until).toLocaleDateString('ar-EG')} />}
        </div>

        {/* Document Images */}
        {(permit.id_card_front_url || permit.id_card_back_url || permit.license_front_url || permit.license_back_url) && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">المستندات المرفقة</h3>
            <div className="grid grid-cols-2 gap-2">
              {permit.id_card_front_url && <img src={permit.id_card_front_url} alt="بطاقة - وجه" className="w-full h-28 object-cover rounded border" />}
              {permit.id_card_back_url && <img src={permit.id_card_back_url} alt="بطاقة - ظهر" className="w-full h-28 object-cover rounded border" />}
              {permit.license_front_url && <img src={permit.license_front_url} alt="رخصة - وجه" className="w-full h-28 object-cover rounded border" />}
              {permit.license_back_url && <img src={permit.license_back_url} alt="رخصة - ظهر" className="w-full h-28 object-cover rounded border" />}
            </div>
          </div>
        )}

        {/* QR + Barcode */}
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center gap-6">
          <Barcode value={permit.verification_code || permit.permit_number} width={1.2} height={40} fontSize={10} margin={0} displayValue />
          <QRCodeSVG value={JSON.stringify({ permit: permit.permit_number, code: permit.verification_code })} size={80} level="M" />
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          هذا التصريح صادر إلكترونياً من نظام إدارة المخلفات. يمكن التحقق من صلاحيته عبر مسح رمز QR.
        </p>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default PublicPermitView;
