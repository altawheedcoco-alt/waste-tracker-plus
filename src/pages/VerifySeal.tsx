import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Search, Leaf, ArrowLeft, Lock, CheckCircle2, XCircle, Loader2, ExternalLink, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { generateSealNumber } from '@/lib/secureDigitalSeal';

interface SealVerificationResult {
  isValid: boolean;
  sealNumber: string;
  sealType: 'member' | 'organization';
  entityName?: string;
  entityId?: string;
  orgName?: string;
  orgId?: string;
  profileUrl?: string;
  message: string;
  verifiedAt: string;
}

const VerifySeal = () => {
  const [searchParams] = useSearchParams();
  const [sealCode, setSealCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SealVerificationResult | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setSealCode(code);
      verifySeal(code);
    }
  }, [searchParams]);

  const verifySeal = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const upperCode = code.trim().toUpperCase();
    const isMemberSeal = upperCode.startsWith('MS-');
    const isOrgSeal = upperCode.startsWith('OS-');

    try {
      if (isMemberSeal) {
        // Search profiles - generate seal numbers and match
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, organization_id')
          .limit(500);

        if (profiles) {
          for (const p of profiles) {
            const sn = generateSealNumber(p.id, 'member', p.full_name || '');
            if (sn === upperCode) {
              let orgName = '';
              let orgId = '';
              if (p.organization_id) {
                const { data: org } = await supabase
                  .from('organizations')
                  .select('id, name')
                  .eq('id', p.organization_id)
                  .single();
                orgName = org?.name || '';
                orgId = org?.id || '';
              }

              await logScan(upperCode, 'valid');
              setResult({
                isValid: true,
                sealNumber: upperCode,
                sealType: 'member',
                entityName: p.full_name || '',
                entityId: p.id,
                orgName,
                orgId,
                profileUrl: `/dashboard/profile/${p.id}`,
                message: 'ختم رقمي مؤمّن لعضو معتمد في منصة iRecycle',
                verifiedAt: new Date().toISOString(),
              });
              setLoading(false);
              return;
            }
          }
        }

        await logScan(upperCode, 'invalid');
        setResult({
          isValid: false,
          sealNumber: upperCode,
          sealType: 'member',
          message: 'لم يتم العثور على ختم عضو بهذا الرقم في النظام',
          verifiedAt: new Date().toISOString(),
        });
      } else if (isOrgSeal) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .limit(500);

        if (orgs) {
          for (const o of orgs) {
            const sn = generateSealNumber(o.id, 'organization', o.name || '');
            if (sn === upperCode) {
              await logScan(upperCode, 'valid');
              setResult({
                isValid: true,
                sealNumber: upperCode,
                sealType: 'organization',
                entityName: o.name || '',
                entityId: o.id,
                orgId: o.id,
                profileUrl: `/dashboard/organization/${o.id}`,
                message: 'ختم رقمي مؤمّن لجهة معتمدة في منصة iRecycle',
                verifiedAt: new Date().toISOString(),
              });
              setLoading(false);
              return;
            }
          }
        }

        await logScan(upperCode, 'invalid');
        setResult({
          isValid: false,
          sealNumber: upperCode,
          sealType: 'organization',
          message: 'لم يتم العثور على ختم جهة بهذا الرقم في النظام',
          verifiedAt: new Date().toISOString(),
        });
      } else {
        // Try VRF codes or generic seal codes
        // First check document_signatures for platform_seal_number
        const { data: sig } = await supabase
          .from('document_signatures')
          .select('id, signer_name, signer_role, signer_title, document_type, document_id, signature_method, platform_seal_number, created_at, status')
          .eq('platform_seal_number', code.trim())
          .maybeSingle();

        if (sig) {
          const s = sig as any;
          await logScan(code.trim(), 'valid');
          setResult({
            isValid: true,
            sealNumber: code.trim(),
            sealType: 'member',
            entityName: s.signer_name || '',
            entityId: s.signer_id || undefined,
            profileUrl: s.signer_id ? `/dashboard/profile/${s.signer_id}` : undefined,
            message: `توقيع رقمي مؤمّن — ${s.signer_name} (${s.signer_role || s.signer_title || 'موقّع'}) على مستند ${s.document_type}`,
            verifiedAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        // Try verification codes from contracts
        const { data: contract } = await supabase
          .from('contracts')
          .select('id, contract_number, title, partner_name, verification_code')
          .eq('verification_code', code.trim())
          .maybeSingle();

        if (contract) {
          await logScan(code.trim(), 'valid');
          setResult({
            isValid: true,
            sealNumber: code.trim(),
            sealType: 'organization',
            entityName: contract.partner_name || contract.title || '',
            message: `كود تحقق صالح — عقد رقم ${contract.contract_number}`,
            verifiedAt: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }

        await logScan(code.trim(), 'invalid');
        setResult({
          isValid: false,
          sealNumber: code.trim(),
          sealType: 'member',
          message: 'لم يتم العثور على ختم أو توقيع رقمي بهذا الكود في النظام',
          verifiedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Seal verification error:', error);
      setResult({
        isValid: false,
        sealNumber: code.trim(),
        sealType: 'member',
        message: 'حدث خطأ أثناء التحقق',
        verifiedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const logScan = async (reference: string, scanResult: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('qr_scan_logs').insert({
        scan_type: 'seal',
        document_reference: reference,
        scan_result: scanResult,
        scanner_user_id: user?.id,
        scanner_user_agent: navigator.userAgent,
      });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-50/30 py-6 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Leaf className="h-9 w-9 text-green-600" />
            <h1 className="text-2xl font-bold text-green-700">iRecycle</h1>
          </div>
          <p className="text-sm text-muted-foreground">نظام إدارة المخلفات وإعادة التدوير</p>
        </motion.div>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-primary text-sm">التحقق من الختم / التوقيع الرقمي</span>
            <Lock className="h-4 w-4 text-primary" />
          </div>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => verifySeal(sealCode)} disabled={loading || !sealCode.trim()} className="shrink-0">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 ml-2" />تحقق</>}
                </Button>
                <Input
                  placeholder="أدخل رقم الختم (MS-XXXX-XXXX أو OS-XXXX-XXXX) أو كود التحقق VRF"
                  value={sealCode}
                  onChange={(e) => setSealCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifySeal(sealCode)}
                  dir="ltr"
                  className="flex-1 font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px] gap-1">🔏 أختام أعضاء (MS-)</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">🏢 أختام جهات (OS-)</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">✍️ توقيعات رقمية</Badge>
                <Badge variant="secondary" className="text-[10px] gap-1">🔐 أكواد VRF</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Result */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground">جاري التحقق من الختم الرقمي...</p>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={`border-2 ${result.isValid ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : 'border-red-300 bg-red-50/50 dark:bg-red-950/20'}`}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  {result.isValid ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 shrink-0" />
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
                      {result.isValid ? 'ختم / توقيع رقمي صحيح ✓' : 'غير موجود في النظام ✗'}
                    </h3>
                    <p className={`text-sm ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>{result.message}</p>
                  </div>
                </div>

                {result.isValid && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">رقم الختم</span>
                        <p className="font-mono font-bold text-primary">{result.sealNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">النوع</span>
                        <p className="font-medium">
                          <Badge variant="outline" className="gap-1">
                            {result.sealType === 'member' ? <><User className="w-3 h-3" /> ختم عضو</> : <><Building2 className="w-3 h-3" /> ختم جهة</>}
                          </Badge>
                        </p>
                      </div>
                      {result.entityName && (
                        <div>
                          <span className="text-muted-foreground text-xs">الاسم</span>
                          <p className="font-semibold">{result.entityName}</p>
                        </div>
                      )}
                      {result.orgName && (
                        <div>
                          <span className="text-muted-foreground text-xs">الجهة</span>
                          <p className="font-medium">{result.orgName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground text-xs">تاريخ التحقق</span>
                        <p className="text-xs">{new Date(result.verifiedAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>

                    {result.profileUrl && (
                      <Link
                        to={result.profileUrl}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        عرض الملف الشخصي
                      </Link>
                    )}
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={() => { setResult(null); setSealCode(''); }} className="w-full">
                  بحث جديد
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/scan">مسح QR</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/verify">تحقق من مستند</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">الرئيسية</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} iRecycle - جميع الحقوق محفوظة
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifySeal;
