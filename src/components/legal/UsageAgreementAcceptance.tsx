/**
 * UsageAgreementAcceptance — قسم قبول اتفاقية الاستخدام
 * يظهر في صفحتي الشروط والسياسات للمستخدمين المسجلين
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';
import { supabase } from '@/integrations/supabase/client';
import { CURRENT_TERMS_VERSION } from '@/data/organizationTermsContent';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Shield, FileText, CheckCircle2, AlertTriangle, Handshake, Scale, Gavel, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageAgreementAcceptanceProps {
  /** Which page is this rendered on */
  currentPage: 'terms' | 'policies';
  className?: string;
}

const UsageAgreementAcceptance = ({ currentPage, className }: UsageAgreementAcceptanceProps) => {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const { hasAcceptedTerms, loading } = useTermsAcceptance();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allAccepted = acceptedTerms && acceptedPolicies && acceptedDisclaimer;

  const handleAcceptAgreement = async () => {
    if (!user || !organization || !allAccepted) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('terms_acceptances').insert({
        user_id: user.id,
        organization_id: organization.id,
        organization_type: organization.organization_type,
        organization_name: organization.name,
        full_name: user.user_metadata?.full_name || user.email || '',
        terms_version: CURRENT_TERMS_VERSION,
        accepted_at: new Date().toISOString(),
        ip_address: null,
      });

      if (error) throw error;

      toast.success('تم قبول اتفاقية الاستخدام بنجاح', {
        description: `الإصدار ${CURRENT_TERMS_VERSION} — تم التسجيل في سجل المراجعة`,
      });

      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Error accepting agreement:', err);
      toast.error('حدث خطأ أثناء تسجيل الموافقة');
    } finally {
      setSubmitting(false);
    }
  };

  // Agreement summary section (shown for everyone)
  const agreementSummary = (
    <div className={cn('rounded-2xl border-2 border-primary/20 bg-primary/5 overflow-hidden', className)} dir="rtl">
      {/* Header */}
      <div className="bg-primary/10 px-6 py-5 border-b border-primary/15">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">اتفاقية الاستخدام</h2>
            <p className="text-xs text-muted-foreground">Usage Agreement — الإصدار {CURRENT_TERMS_VERSION}</p>
          </div>
        </div>
      </div>

      {/* Agreement body */}
      <div className="px-6 py-5 space-y-4">
        {/* Golden disclaimer */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
                البند الجوهري — إخلاء المسؤولية
              </p>
              <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                تعتبر هذه المنصة وسيطاً تقنياً لنقل وتداول البيانات، وتقع المسئولية القانونية الكاملة
                عن صحة البيانات المدخلة ومطابقتها للواقع الفعلي على عاتق المستخدم
                (المولد/ الناقل/ المستلم) دون أدنى مسئولية على إدارة المنصة.
              </p>
            </div>
          </div>
        </div>

        {/* What the agreement covers */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            تتضمن هذه الاتفاقية الموافقة على:
          </h3>
          <div className="grid gap-2.5">
            <Link
              to="/terms"
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
                currentPage === 'terms'
                  ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Gavel className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">الشروط والأحكام</p>
                <p className="text-xs text-muted-foreground">36 مادة — الإطار القانوني والمسؤوليات والجزاءات</p>
              </div>
              {currentPage === 'terms' && (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              )}
            </Link>

            <Link
              to="/policies"
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
                currentPage === 'policies'
                  ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20'
                  : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">اشتراطات وسياسات المنصة</p>
                <p className="text-xs text-muted-foreground">31 مادة — الاشتراطات التشغيلية والرقابية</p>
              </div>
              {currentPage === 'policies' && (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              )}
            </Link>

            <Link
              to="/privacy"
              className="flex items-center gap-3 p-3.5 rounded-xl border bg-card border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">سياسة الخصوصية</p>
                <p className="text-xs text-muted-foreground">حماية البيانات الشخصية وفقاً لقانون 151/2020</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Acceptance section — only for logged-in users who haven't accepted */}
        {user && organization && !hasAcceptedTerms && !loading && (
          <div className="mt-6 p-5 rounded-xl bg-card border-2 border-primary/20 space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              الموافقة على اتفاقية الاستخدام
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              بصفتك ممثلاً عن <strong className="text-foreground">{organization.name}</strong>، يجب الموافقة على جميع البنود التالية لتفعيل حسابك بالكامل.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(c) => setAcceptedTerms(!!c)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-foreground/80">
                  أقر بأنني قرأت وفهمت جميع بنود{' '}
                  <Link to="/terms" className="text-primary font-semibold underline underline-offset-2">
                    الشروط والأحكام (36 مادة)
                  </Link>{' '}
                  وأوافق عليها بالكامل.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={acceptedPolicies}
                  onCheckedChange={(c) => setAcceptedPolicies(!!c)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-foreground/80">
                  أقر بأنني قرأت وفهمت جميع{' '}
                  <Link to="/policies" className="text-primary font-semibold underline underline-offset-2">
                    اشتراطات وسياسات المنصة (31 مادة)
                  </Link>{' '}
                  وأوافق على الالتزام الكامل بها.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 transition-colors">
                <Checkbox
                  checked={acceptedDisclaimer}
                  onCheckedChange={(c) => setAcceptedDisclaimer(!!c)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-foreground/80">
                  أقر أنا <strong>({user.user_metadata?.full_name || 'المفوض بالتوقيع'})</strong> بصفتي الممثل القانوني
                  للمنشأة بصحة ودقة واكتمال جميع البيانات، وأتحمل المسؤولية القانونية الكاملة — المدنية
                  والجنائية — عن أي خطأ أو تضليل أو تزوير، دون أدنى مسؤولية على إدارة منصة iRecycle
                  بصفتها جهة وسيطة تقنية.
                </span>
              </label>
            </div>

            <Button
              onClick={handleAcceptAgreement}
              disabled={!allAccepted || submitting}
              className="w-full gap-2"
              size="lg"
            >
              {submitting ? (
                'جاري التسجيل...'
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  قبول اتفاقية الاستخدام — الإصدار {CURRENT_TERMS_VERSION}
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              سيتم تسجيل موافقتك بختم زمني وعنوان IP في سجل المراجعة غير القابل للتعديل
              وفقاً لقانون التوقيع الإلكتروني 15/2004
            </p>
          </div>
        )}

        {/* Already accepted */}
        {user && hasAcceptedTerms && !loading && (
          <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">تم قبول اتفاقية الاستخدام</p>
              <p className="text-xs text-muted-foreground">الإصدار {CURRENT_TERMS_VERSION} — مسجل في سجل المراجعة</p>
            </div>
          </div>
        )}

        {/* Not logged in */}
        {!user && (
          <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              سجّل دخولك للموافقة على اتفاقية الاستخدام وتفعيل حسابك
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')} className="shrink-0 gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              تسجيل الدخول
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return agreementSummary;
};

export default UsageAgreementAcceptance;
