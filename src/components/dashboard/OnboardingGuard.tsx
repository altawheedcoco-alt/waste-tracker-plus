import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, FileText, UserCheck, CheckCircle2, AlertTriangle, 
  Clock, ArrowLeft, Loader2, Building2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface OnboardingStatus {
  terms_accepted: boolean;
  identity_verified: boolean;
  documents_submitted: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
}

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes('admin');

  // Check if this is a demo/test organization
  const isDemoOrg = !!(
    organization?.name?.includes('تجريبي') ||
    organization?.name?.includes('Demo') ||
    (organization as any)?.email?.endsWith('@demo.test') ||
    (organization as any)?.email?.endsWith('@irecycle.test')
  );

  const { data: status, isLoading } = useQuery({
    queryKey: ['onboarding-status', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('terms_accepted, identity_verified, documents_submitted, is_verified, onboarding_completed, is_suspended, suspension_reason')
        .eq('id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OnboardingStatus | null;
    },
    enabled: !!organization?.id,
    refetchInterval: 30000,
  });

  // Admins and demo orgs bypass all checks
  if (isAdmin || isDemoOrg) return <>{children}</>;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!status) return <>{children}</>;

  // Suspended organization
  if (status.is_suspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-lg w-full border-destructive">
          <CardHeader className="text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive text-2xl">تم تعليق هذه المنظمة</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {status.suspension_reason || 'تم تعليق حساب المنظمة. يرجى التواصل مع مدير النظام.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Fully onboarded - allow access
  if (status.onboarding_completed && status.is_verified) return <>{children}</>;

  // ═══════════════════════════════════════════
  // Determine current phase
  // ═══════════════════════════════════════════

  const dataComplete = status.terms_accepted && status.identity_verified && status.documents_submitted;
  const pendingApproval = dataComplete && !status.is_verified;

  const steps = [
    { key: 'terms', label: 'الموافقة على الشروط والأحكام والسياسات', done: status.terms_accepted, icon: FileText },
    { key: 'identity', label: 'التحقق من الهوية', done: status.identity_verified, icon: UserCheck },
    { key: 'documents', label: 'رفع الوثائق القانونية', done: status.documents_submitted, icon: Shield },
    { key: 'verified', label: 'مراجعة وموافقة إدارة النظام', done: status.is_verified, icon: CheckCircle2 },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  // ═══════════════════════════════════════════
  // Phase 2: Pending Admin Approval
  // ═══════════════════════════════════════════
  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.3 }}
          className="max-w-lg w-full"
        >
          <Card className="border-primary/30">
            <CardHeader className="text-center pb-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Clock className="w-20 h-20 text-primary mx-auto mb-4" />
              </motion.div>
              <CardTitle className="text-2xl">بانتظار مراجعة طلب التسجيل</CardTitle>
              <p className="text-muted-foreground mt-2">
                تم استلام طلبك بنجاح وهو الآن قيد المراجعة من إدارة النظام
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تقدم التسجيل</span>
                  <span className="font-medium text-primary">{completedCount} من {steps.length}</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Steps Status */}
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      step.done
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      step.done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${step.done ? 'text-primary' : 'text-amber-700 dark:text-amber-400'}`}>
                      {step.label}
                    </span>
                    {step.done ? (
                      <Badge variant="outline" className="mr-auto text-xs bg-primary/5 text-primary border-primary/20">مكتمل</Badge>
                    ) : (
                      <Badge variant="outline" className="mr-auto text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">قيد المراجعة</Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-muted/50 rounded-lg p-4 border space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="w-4 h-4 text-primary" />
                  ماذا يحدث الآن؟
                </div>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>يقوم فريق الإدارة بمراجعة بياناتك ومستنداتك</li>
                  <li>سيتم إشعارك فور اعتماد الطلب</li>
                  <li>بعد الموافقة ستتمكن من استخدام جميع أدوات المنصة</li>
                </ul>
              </div>

              {/* Action */}
              <Button 
                variant="outline" 
                className="w-full gap-2" 
                onClick={() => navigate('/dashboard/settings')}
              >
                <ArrowLeft className="w-4 h-4" />
                الرجوع لمراجعة البيانات
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Phase 1: Incomplete Data / Terms
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-lg w-full"
      >
        <Card>
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">استكمال إجراءات التسجيل</CardTitle>
            <p className="text-muted-foreground mt-2">
              يجب استكمال جميع المتطلبات التالية قبل تفعيل حسابك واستخدام أدوات المنصة
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">التقدم</span>
                <span className="font-medium">{completedCount} من {steps.length}</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    step.done
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.done
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${step.done ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Dynamic Action Button */}
            {!status.terms_accepted && (
              <Button className="w-full gap-2" size="lg" onClick={() => navigate('/dashboard/settings')}>
                <FileText className="w-5 h-5" />
                الموافقة على الشروط والأحكام والسياسات
              </Button>
            )}

            {status.terms_accepted && !status.identity_verified && (
              <Button className="w-full gap-2" size="lg" onClick={() => navigate('/dashboard/settings')}>
                <UserCheck className="w-5 h-5" />
                التحقق من الهوية
              </Button>
            )}

            {status.terms_accepted && status.identity_verified && !status.documents_submitted && (
              <Button className="w-full gap-2" size="lg" onClick={() => navigate('/dashboard/settings')}>
                <Shield className="w-5 h-5" />
                رفع الوثائق القانونية
              </Button>
            )}

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300 text-center">
                ⚠️ لا يمكن استخدام أدوات المنصة إلا بعد استيفاء جميع البيانات والموافقة على الشروط والأحكام واعتماد الطلب من إدارة النظام
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingGuard;
