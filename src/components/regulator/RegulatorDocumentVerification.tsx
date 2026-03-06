import { useState } from 'react';
import { Search, FileCheck, FileX, Loader2, Shield, Clock, Building2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useRegulatorConfig } from '@/hooks/useRegulatorData';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import AttestationPrintView from './AttestationPrintView';

interface VerificationResult {
  found: boolean;
  type: 'attestation' | 'license_renewal' | 'legal_license' | 'unknown';
  status: string;
  data: Record<string, any> | null;
  message: string;
}

const ATTESTATION_TYPE_LABELS: Record<string, string> = {
  fee_payment_processing: 'إفادة دفع رسوم',
  registration_confirmation: 'إفادة تسجيل',
  license_renewal_processing: 'إفادة تجديد ترخيص',
};

const LICENSE_CATEGORY_LABELS: Record<string, string> = {
  ida: 'رخصة التشغيل - التنمية الصناعية',
  industrial_register: 'السجل الصناعي',
  wmra: 'ترخيص مزاولة النشاط (WMRA)',
  eeaa: 'موافقة تقييم الأثر البيئي',
  commercial_register: 'السجل التجاري',
  tax_card: 'البطاقة الضريبية',
  hazardous_handling: 'ترخيص تداول مواد خطرة',
  civil_protection: 'تصريح الحماية المدنية',
  other: 'أخرى',
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
  suspended: { label: 'موقوف', color: 'bg-orange-500/10 text-orange-700 border-orange-200' },
};

const RegulatorDocumentVerification = () => {
  const { organization } = useAuth();
  const { data: config } = useRegulatorConfig();
  const levelCode = config?.regulator_level_code;

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showPrint, setShowPrint] = useState<any>(null);

  // Fetch all licenses under this regulator's jurisdiction
  const { data: jurisdictionLicenses = [], isLoading: licensesLoading } = useQuery({
    queryKey: ['regulator-jurisdiction-licenses', levelCode],
    queryFn: async () => {
      if (!levelCode) return [];
      const { data } = await supabase
        .from('legal_licenses')
        .select('*, org:organizations!legal_licenses_organization_id_fkey(id, name, name_en, organization_type, commercial_register, email, phone)')
        .eq('issuing_authority_code', levelCode)
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!levelCode,
  });

  const handleVerify = async () => {
    if (!searchTerm.trim() || !organization?.id) return;
    setLoading(true);
    setResult(null);

    const term = searchTerm.trim();

    try {
      // 1. Search in regulatory_attestations
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

      // 2. Search in license_renewal_requests
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

      // 3. Search in legal_licenses by license_number (under this authority's jurisdiction)
      if (levelCode) {
        const { data: licenses } = await supabase
          .from('legal_licenses')
          .select('*, org:organizations!legal_licenses_organization_id_fkey(id, name, name_en, organization_type, commercial_register, email, phone)')
          .eq('issuing_authority_code', levelCode)
          .eq('license_number', term);

        if (licenses && licenses.length > 0) {
          const license = licenses[0];
          const isExpired = license.expiry_date && new Date(license.expiry_date) < new Date();
          setResult({
            found: true,
            type: 'legal_license',
            status: isExpired ? 'expired' : license.status,
            data: license,
            message: isExpired
              ? 'هذا الترخيص منتهي الصلاحية'
              : license.status === 'active'
              ? 'ترخيص ساري المفعول ✓'
              : `ترخيص مسجل - الحالة: ${STATUS_LABELS[license.status]?.label || license.status}`,
          });
          setLoading(false);
          return;
        }
      }

      setResult({
        found: false,
        type: 'unknown',
        status: 'not_found',
        data: null,
        message: 'لم يتم العثور على أي مستند صادر من هذه الجهة بهذا الرقم',
      });
    } catch {
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

  const isStatusPositive = (status: string) => ['active', 'approved', 'fees_paid'].includes(status);
  const isStatusNegative = (status: string) => ['expired', 'revoked', 'rejected', 'suspended'].includes(status);

  const renderAttestationResult = (data: any) => {
    const orgData = data.organization_data as Record<string, any> || {};
    const org = data.org;
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">رقم الإفادة</span><p className="font-mono font-bold" dir="ltr">{data.attestation_number}</p></div>
          <div><span className="text-muted-foreground text-xs">نوع الإفادة</span><p className="font-medium">{ATTESTATION_TYPE_LABELS[data.attestation_type] || data.attestation_type}</p></div>
          <div><span className="text-muted-foreground text-xs">الجهة المستفيدة</span><p className="font-medium">{org?.name || orgData.name || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">السجل التجاري</span><p className="font-medium">{org?.commercial_register || orgData.commercial_register || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">تاريخ الإصدار</span><p className="font-medium">{formatDate(data.issued_at)}</p></div>
          <div><span className="text-muted-foreground text-xs">صالحة حتى</span><p className="font-medium">{formatDate(data.valid_until)}</p></div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowPrint(data)}>طباعة الإفادة</Button>
      </div>
    );
  };

  const renderRenewalResult = (data: any) => {
    const org = data.org;
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">الجهة المتقدمة</span><p className="font-medium">{org?.name || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">نوع الطلب</span><p className="font-medium">{data.request_type === 'renewal' ? 'تجديد' : 'إصدار جديد'}</p></div>
          {data.current_license_number && <div><span className="text-muted-foreground text-xs">رقم الترخيص الحالي</span><p className="font-mono font-medium" dir="ltr">{data.current_license_number}</p></div>}
          {data.new_license_number && <div><span className="text-muted-foreground text-xs">رقم الترخيص الجديد</span><p className="font-mono font-medium" dir="ltr">{data.new_license_number}</p></div>}
          <div><span className="text-muted-foreground text-xs">تاريخ الطلب</span><p className="font-medium">{formatDate(data.requested_at)}</p></div>
          {data.fee_amount && <div><span className="text-muted-foreground text-xs">الرسوم</span><p className="font-medium">{data.fee_amount} ج.م</p></div>}
        </div>
      </div>
    );
  };

  const renderLicenseResult = (data: any) => {
    const org = data.org;
    return (
      <div className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground text-xs">اسم الترخيص</span><p className="font-medium">{data.license_name}</p></div>
          <div><span className="text-muted-foreground text-xs">التصنيف</span><p className="font-medium">{LICENSE_CATEGORY_LABELS[data.license_category] || data.license_category}</p></div>
          <div><span className="text-muted-foreground text-xs">رقم الترخيص</span><p className="font-mono font-bold" dir="ltr">{data.license_number || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">الجهة المرخصة</span><p className="font-medium">{org?.name || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">نوع الجهة</span><p className="font-medium">{org?.organization_type || '-'}</p></div>
          <div><span className="text-muted-foreground text-xs">السجل التجاري</span><p className="font-medium">{org?.commercial_register || '-'}</p></div>
          {data.issue_date && <div><span className="text-muted-foreground text-xs">تاريخ الإصدار</span><p className="font-medium">{formatDate(data.issue_date)}</p></div>}
          {data.expiry_date && <div><span className="text-muted-foreground text-xs">تاريخ الانتهاء</span><p className="font-medium">{formatDate(data.expiry_date)}</p></div>}
          <div><span className="text-muted-foreground text-xs">جهة الإصدار</span><p className="font-medium">{data.issuing_authority}</p></div>
        </div>
        {data.document_url && (
          <Button variant="outline" size="sm" className="w-full mt-2 gap-2" asChild>
            <a href={data.document_url} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" /> عرض صورة الترخيص
            </a>
          </Button>
        )}
      </div>
    );
  };

  // Stats for jurisdiction licenses
  const licenseStats = {
    total: jurisdictionLicenses.length,
    active: jurisdictionLicenses.filter((l: any) => l.status === 'active').length,
    expired: jurisdictionLicenses.filter((l: any) => l.expiry_date && new Date(l.expiry_date) < new Date()).length,
  };

  return (
    <>
      <div className="space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{licenseStats.total}</p>
              <p className="text-xs text-muted-foreground">إجمالي التراخيص المسجلة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{licenseStats.active}</p>
              <p className="text-xs text-muted-foreground">تراخيص سارية</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{licenseStats.expired}</p>
              <p className="text-xs text-muted-foreground">تراخيص منتهية</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verify" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verify" className="gap-1.5">
              <Search className="w-4 h-4" /> التحقق من مستند
            </TabsTrigger>
            <TabsTrigger value="registry" className="gap-1.5">
              <Building2 className="w-4 h-4" /> سجل التراخيص
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verify" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right text-base">
                  <Shield className="w-5 h-5 text-primary" />
                  التحقق من المستندات الصادرة
                </CardTitle>
                <CardDescription className="text-right">
                  تحقق من صحة أي مستند أو إفادة أو ترخيص صادر أو مسجل لدى هذه الجهة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Button onClick={handleVerify} disabled={loading} className="shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 ml-2" />تحقق</>}
                  </Button>
                  <Input
                    placeholder="أدخل رقم الإفادة أو رقم الترخيص أو رقم السجل الصناعي..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  يدعم: الإفادات الرقمية، تراخيص التشغيل، السجل الصناعي، الموافقات البيئية، طلبات التجديد
                </p>

                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {result.found ? (
                      <div className={`border rounded-lg p-4 ${
                        isStatusPositive(result.status)
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : isStatusNegative(result.status)
                          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isStatusPositive(result.status) ? (
                            <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : isStatusNegative(result.status) ? (
                            <FileX className="w-5 h-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="font-bold">
                            {result.type === 'attestation' ? 'إفادة رقمية' : result.type === 'license_renewal' ? 'طلب تجديد ترخيص' : 'ترخيص / تصريح'}
                          </span>
                          <Badge variant="outline" className={STATUS_LABELS[result.status]?.color || ''}>
                            {STATUS_LABELS[result.status]?.label || result.status}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{result.message}</p>

                        {result.type === 'attestation' && result.data && renderAttestationResult(result.data)}
                        {result.type === 'license_renewal' && result.data && renderRenewalResult(result.data)}
                        {result.type === 'legal_license' && result.data && renderLicenseResult(result.data)}

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
                        <Button variant="ghost" size="sm" onClick={() => { setResult(null); setSearchTerm(''); }} className="mt-3 w-full">حاول مرة أخرى</Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registry" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right text-base">
                  <Building2 className="w-5 h-5 text-primary" />
                  سجل التراخيص المسجلة لدى الجهة
                </CardTitle>
                <CardDescription className="text-right">
                  جميع التراخيص والسجلات الصناعية والموافقات المسجلة تحت ولاية هذه الجهة الرقابية
                </CardDescription>
              </CardHeader>
              <CardContent>
                {licensesLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : jurisdictionLicenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد تراخيص مسجلة حالياً</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {jurisdictionLicenses.map((license: any) => {
                      const isExpired = license.expiry_date && new Date(license.expiry_date) < new Date();
                      const org = license.org;
                      return (
                        <div key={license.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{license.license_name}</p>
                                <Badge variant="outline" className={isExpired ? 'bg-red-500/10 text-red-700 border-red-200' : 'bg-green-500/10 text-green-700 border-green-200'}>
                                  {isExpired ? 'منتهي' : 'ساري'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {org?.name || '-'} • {LICENSE_CATEGORY_LABELS[license.license_category] || license.license_category}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {license.license_number && <span dir="ltr" className="font-mono">{license.license_number}</span>}
                                {license.expiry_date && <span>ينتهي: {formatDate(license.expiry_date)}</span>}
                              </div>
                            </div>
                            {license.document_url && (
                              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                <a href={license.document_url} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showPrint && <AttestationPrintView attestation={showPrint} onClose={() => setShowPrint(null)} />}
    </>
  );
};

export default RegulatorDocumentVerification;
