import { useState } from 'react';
import { Search, FileCheck, FileX, Loader2, Shield, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import AttestationPrintView from './AttestationPrintView';

interface VerificationResult {
  found: boolean;
  type: 'attestation' | 'license_renewal' | 'unknown';
  status: string;
  data: Record<string, any> | null;
  message: string;
}

const ATTESTATION_TYPE_LABELS: Record<string, string> = {
  fee_payment_processing: 'إفادة دفع رسوم',
  registration_confirmation: 'إفادة تسجيل',
  license_renewal_processing: 'إفادة تجديد ترخيص',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'ساري', color: 'bg-green-500/10 text-green-700 border-green-200' },
  expired: { label: 'منتهي', color: 'bg-red-500/10 text-red-700 border-red-200' },
  revoked: { label: 'ملغي', color: 'bg-red-500/10 text-red-700 border-red-200' },
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
  under_review: { label: 'قيد المراجعة', color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  approved: { label: 'معتمد', color: 'bg-green-500/10 text-green-700 border-green-200' },
  rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-700 border-red-200' },
  fees_pending: { label: 'في انتظار الرسوم', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  fees_paid: { label: 'تم دفع الرسوم', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  processing: { label: 'جاري المعالجة', color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
};

const RegulatorDocumentVerification = () => {
  const { organization } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showPrint, setShowPrint] = useState<any>(null);

  const handleVerify = async () => {
    if (!searchTerm.trim() || !organization?.id) return;
    setLoading(true);
    setResult(null);

    const term = searchTerm.trim();

    try {
      // 1. Search in regulatory_attestations by attestation_number
      const { data: attestation } = await supabase
        .from('regulatory_attestations')
        .select('*, org:organizations!regulatory_attestations_organization_id_fkey(id, name, name_en, organization_type, commercial_register, email, phone)')
        .eq('regulator_organization_id', organization.id)
        .eq('attestation_number', term)
        .maybeSingle();

      if (attestation) {
        const isExpired = new Date(attestation.valid_until) < new Date();
        const isRevoked = attestation.status === 'revoked';
        setResult({
          found: true,
          type: 'attestation',
          status: isRevoked ? 'revoked' : isExpired ? 'expired' : attestation.status,
          data: attestation,
          message: isRevoked
            ? `هذه الإفادة ملغاة. سبب الإلغاء: ${attestation.revocation_reason || 'غير محدد'}`
            : isExpired
            ? 'هذه الإفادة منتهية الصلاحية'
            : 'إفادة صادرة وسارية المفعول ✓',
        });
        setLoading(false);
        return;
      }

      // 2. Search in license_renewal_requests by id or current_license_number or new_license_number
      const { data: renewals } = await supabase
        .from('license_renewal_requests')
        .select('*, org:organizations!license_renewal_requests_organization_id_fkey(id, name, name_en, organization_type, commercial_register, email, phone)')
        .eq('regulator_organization_id', organization.id)
        .or(`id.eq.${term},current_license_number.eq.${term},new_license_number.eq.${term}`);

      if (renewals && renewals.length > 0) {
        const renewal = renewals[0];
        setResult({
          found: true,
          type: 'license_renewal',
          status: renewal.status,
          data: renewal,
          message: `طلب تجديد ترخيص - الحالة: ${STATUS_LABELS[renewal.status]?.label || renewal.status}`,
        });
        setLoading(false);
        return;
      }

      // Not found
      setResult({
        found: false,
        type: 'unknown',
        status: 'not_found',
        data: null,
        message: 'لم يتم العثور على أي مستند صادر من هذه الجهة بهذا الرقم',
      });
    } catch (err) {
      setResult({
        found: false,
        type: 'unknown',
        status: 'error',
        data: null,
        message: 'حدث خطأ أثناء البحث. حاول مرة أخرى.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'dd MMMM yyyy', { locale: ar });
    } catch {
      return date;
    }
  };

  const renderAttestationResult = (data: any) => {
    const orgData = data.organization_data as Record<string, any> || {};
    const org = data.org;
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">رقم الإفادة</span>
            <p className="font-mono font-bold" dir="ltr">{data.attestation_number}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">نوع الإفادة</span>
            <p className="font-medium">{ATTESTATION_TYPE_LABELS[data.attestation_type] || data.attestation_type}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">الجهة المستفيدة</span>
            <p className="font-medium">{org?.name || orgData.name || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">السجل التجاري</span>
            <p className="font-medium">{org?.commercial_register || orgData.commercial_register || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">تاريخ الإصدار</span>
            <p className="font-medium">{formatDate(data.issued_at)}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">صالحة حتى</span>
            <p className="font-medium">{formatDate(data.valid_until)}</p>
          </div>
        </div>

        {data.notes && (
          <div>
            <span className="text-muted-foreground text-xs">ملاحظات</span>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => setShowPrint(data)}
        >
          طباعة الإفادة
        </Button>
      </div>
    );
  };

  const renderRenewalResult = (data: any) => {
    const org = data.org;
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">الجهة المتقدمة</span>
            <p className="font-medium">{org?.name || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">نوع الطلب</span>
            <p className="font-medium">{data.request_type === 'renewal' ? 'تجديد' : 'إصدار جديد'}</p>
          </div>
          {data.current_license_number && (
            <div>
              <span className="text-muted-foreground text-xs">رقم الترخيص الحالي</span>
              <p className="font-mono font-medium" dir="ltr">{data.current_license_number}</p>
            </div>
          )}
          {data.new_license_number && (
            <div>
              <span className="text-muted-foreground text-xs">رقم الترخيص الجديد</span>
              <p className="font-mono font-medium" dir="ltr">{data.new_license_number}</p>
            </div>
          )}
          <div>
            <span className="text-muted-foreground text-xs">تاريخ الطلب</span>
            <p className="font-medium">{formatDate(data.requested_at)}</p>
          </div>
          {data.fee_amount && (
            <div>
              <span className="text-muted-foreground text-xs">الرسوم</span>
              <p className="font-medium">{data.fee_amount} ج.م</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Shield className="w-5 h-5 text-primary" />
            التحقق من المستندات الصادرة
          </CardTitle>
          <CardDescription className="text-right">
            تحقق من صحة أي مستند أو إفادة أو ترخيص صادر من هذه الجهة الرقابية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <Button onClick={handleVerify} disabled={loading} className="shrink-0">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 ml-2" />
                  تحقق
                </>
              )}
            </Button>
            <Input
              placeholder="أدخل رقم الإفادة أو رقم الترخيص أو رقم الطلب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            يدعم: الإفادات الرقمية، طلبات تجديد التراخيص، شهادات التسجيل
          </p>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {result.found ? (
                <div className={`border rounded-lg p-4 ${
                  result.status === 'active' || result.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                    : result.status === 'expired' || result.status === 'revoked' || result.status === 'rejected'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.status === 'active' || result.status === 'approved' ? (
                      <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : result.status === 'expired' || result.status === 'revoked' || result.status === 'rejected' ? (
                      <FileX className="w-5 h-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="font-bold">
                      {result.type === 'attestation' ? 'إفادة رقمية' : 'طلب تجديد ترخيص'}
                    </span>
                    <Badge variant="outline" className={STATUS_LABELS[result.status]?.color || ''}>
                      {STATUS_LABELS[result.status]?.label || result.status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{result.message}</p>

                  {result.type === 'attestation' && result.data && renderAttestationResult(result.data)}
                  {result.type === 'license_renewal' && result.data && renderRenewalResult(result.data)}

                  <Button variant="ghost" size="sm" onClick={() => { setResult(null); setSearchTerm(''); }} className="mt-3 w-full">
                    بحث جديد
                  </Button>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FileX className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="font-bold text-red-700 dark:text-red-300">غير موجود ✗</span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{result.message}</p>
                  <Button variant="ghost" size="sm" onClick={() => { setResult(null); setSearchTerm(''); }} className="mt-3 w-full">
                    حاول مرة أخرى
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {showPrint && (
        <AttestationPrintView attestation={showPrint} onClose={() => setShowPrint(null)} />
      )}
    </>
  );
};

export default RegulatorDocumentVerification;
