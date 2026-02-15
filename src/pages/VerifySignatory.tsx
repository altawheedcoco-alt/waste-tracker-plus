import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Truck, FileText, Receipt, Award, Loader2 } from 'lucide-react';

interface SignatoryInfo {
  full_name: string;
  job_title: string | null;
  authority_level: string;
  is_active: boolean | null;
  signatory_code: string | null;
  can_sign_shipments: boolean | null;
  can_sign_contracts: boolean | null;
  can_sign_invoices: boolean | null;
  can_sign_certificates: boolean | null;
  activated_at: string | null;
  created_at: string;
  organization?: { name: string } | null;
}

const permissions = [
  { key: 'can_sign_shipments', label: 'الشحنات', icon: Truck },
  { key: 'can_sign_contracts', label: 'العقود', icon: FileText },
  { key: 'can_sign_invoices', label: 'الفواتير', icon: Receipt },
  { key: 'can_sign_certificates', label: 'الشهادات', icon: Award },
] as const;

const VerifySignatory = () => {
  const { code } = useParams<{ code: string }>();
  const [data, setData] = useState<SignatoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sig, error } = await supabase
        .from('authorized_signatories')
        .select('full_name, job_title, authority_level, is_active, signatory_code, can_sign_shipments, can_sign_contracts, can_sign_invoices, can_sign_certificates, activated_at, created_at, organization_id')
        .eq('signatory_code', code)
        .maybeSingle();

      if (error || !sig) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Fetch org name
      let orgName = '';
      if (sig.organization_id) {
        const { data: org } = await supabase.from('organizations').select('name').eq('id', sig.organization_id).single();
        orgName = org?.name || '';
      }

      setData({ ...sig, organization: { name: orgName } } as SignatoryInfo);
      setLoading(false);
    })();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">مفوض غير موجود</h1>
            <p className="text-sm text-muted-foreground">الكود المُدخل ({code}) غير مسجل في النظام أو تم حذفه.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full border-2 border-primary/30">
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-primary mb-2" />
            <h1 className="text-lg font-bold text-foreground">التحقق من المفوض المعتمد</h1>
            <p className="text-xs text-muted-foreground">منصة iRecycle • نظام التحقق الرسمي</p>
          </div>

          {/* Status */}
          <div className="text-center">
            {data?.is_active ? (
              <Badge className="gap-1 bg-green-100 text-green-800 text-sm px-4 py-1">
                <CheckCircle className="w-4 h-4" />
                مفوض نشط ومعتمد
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-sm px-4 py-1">
                <XCircle className="w-4 h-4" />
                مفوض غير نشط
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <InfoRow label="الاسم" value={data?.full_name || ''} />
            <InfoRow label="المسمى الوظيفي" value={data?.job_title || '—'} />
            <InfoRow label="المنظمة" value={data?.organization?.name || '—'} />
            <InfoRow label="مستوى السلطة" value={data?.authority_level || '—'} />
            <InfoRow label="كود المفوض" value={data?.signatory_code || '—'} mono />
            <InfoRow label="تاريخ التفعيل" value={data?.activated_at ? new Date(data.activated_at).toLocaleDateString('ar-EG') : new Date(data?.created_at || '').toLocaleDateString('ar-EG')} />
          </div>

          {/* Permissions */}
          <div>
            <p className="text-sm font-semibold mb-2">صلاحيات التوقيع المعتمدة:</p>
            <div className="grid grid-cols-2 gap-2">
              {permissions.map(({ key, label, icon: Icon }) => {
                const has = !!(data as any)?.[key];
                return (
                  <div key={key} className={`flex items-center gap-2 p-2 rounded text-sm ${has ? 'bg-green-50 text-green-800' : 'bg-muted text-muted-foreground line-through'}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] text-center text-muted-foreground border-t pt-3">
            هذا التحقق تم عبر منصة iRecycle الرسمية • البيانات محدثة لحظياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
  </div>
);

export default VerifySignatory;
