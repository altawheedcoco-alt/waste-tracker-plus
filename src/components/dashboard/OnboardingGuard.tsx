import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Shield, FileText, UserCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

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
  });

  // Admins bypass all checks
  if (isAdmin) return <>{children}</>;

  // Loading state
  if (isLoading || !status) return <>{children}</>;

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

  // Onboarding completed - allow access
  if (status.onboarding_completed) return <>{children}</>;

  // Calculate progress
  const steps = [
    { key: 'terms', label: 'الموافقة على الشروط والأحكام', done: status.terms_accepted, icon: FileText },
    { key: 'identity', label: 'التحقق من الهوية', done: status.identity_verified, icon: UserCheck },
    { key: 'documents', label: 'رفع الوثائق القانونية', done: status.documents_submitted, icon: Shield },
    { key: 'verified', label: 'موافقة مدير النظام', done: status.is_verified, icon: CheckCircle2 },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">استكمال إجراءات التسجيل</CardTitle>
          <p className="text-muted-foreground mt-2">
            يجب استكمال جميع المتطلبات التالية قبل تفعيل حسابك
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>التقدم</span>
              <span>{completedCount} من {steps.length}</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  step.done
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.done
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm font-medium ${step.done ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {!status.terms_accepted && (
            <Button className="w-full" onClick={() => navigate('/dashboard/settings')}>
              الموافقة على الشروط والأحكام
            </Button>
          )}

          {status.terms_accepted && !status.identity_verified && (
            <Button className="w-full" onClick={() => navigate('/dashboard/settings')}>
              التحقق من الهوية
            </Button>
          )}

          {status.terms_accepted && status.identity_verified && !status.documents_submitted && (
            <Button className="w-full" onClick={() => navigate('/dashboard/settings')}>
              رفع الوثائق القانونية
            </Button>
          )}

          {status.terms_accepted && status.identity_verified && status.documents_submitted && !status.is_verified && (
            <p className="text-center text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              ⏳ تم إرسال طلبك وهو قيد المراجعة من مدير النظام
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingGuard;
