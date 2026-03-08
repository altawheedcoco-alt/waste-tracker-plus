/**
 * AccountPendingPage — صفحة حالة الحساب المعلق
 * تظهر عند دخول المستخدم للوحة التحكم وحسابه غير مفعل بعد
 */
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock, FileText, CreditCard, ShieldCheck, Upload,
  CheckCircle2, AlertCircle, LogOut, ArrowRight, RefreshCw,
} from 'lucide-react';
import PlatformLogo from '@/components/common/PlatformLogo';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PendingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  required: boolean;
}

const AccountPendingPage = () => {
  const { profile, organization, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  const isJobseeker = !organization && !roles.includes('admin');
  const isDriver = roles.includes('driver');
  const isCompany = !!organization;

  // Check if documents have been uploaded
  useEffect(() => {
    const checkDocuments = async () => {
      if (!organization) return;
      const { count } = await supabase
        .from('entity_documents')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);
      setDocumentsUploaded((count || 0) > 0);
    };
    checkDocuments();
  }, [organization]);

  const getSteps = (): PendingStep[] => {
    const steps: PendingStep[] = [
      {
        id: 'registration',
        label: 'إنشاء الحساب',
        description: 'تم تسجيل بياناتك بنجاح',
        icon: <CheckCircle2 className="h-5 w-5" />,
        completed: true,
        required: true,
      },
      {
        id: 'terms',
        label: 'الموافقة على الشروط والأحكام',
        description: 'تم قبول الشروط والأحكام وسياسة إخلاء المسؤولية',
        icon: <CheckCircle2 className="h-5 w-5" />,
        completed: true,
        required: true,
      },
    ];

    if (isCompany) {
      steps.push(
        {
          id: 'documents',
          label: 'رفع المستندات المطلوبة',
          description: 'السجل التجاري، الرخصة البيئية، صورة البطاقة، التوقيع',
          icon: <Upload className="h-5 w-5" />,
          completed: documentsUploaded,
          required: true,
        },
        {
          id: 'subscription',
          label: 'دفع رسوم الاشتراك',
          description: 'اختيار خطة الاشتراك المناسبة وإتمام الدفع',
          icon: <CreditCard className="h-5 w-5" />,
          completed: false,
          required: true,
        },
        {
          id: 'review',
          label: 'المراجعة والموافقة الإدارية',
          description: 'سيتم مراجعة بياناتك ومستنداتك من قبل فريق المنصة',
          icon: <ShieldCheck className="h-5 w-5" />,
          completed: organization?.is_verified || false,
          required: true,
        },
      );
    }

    if (isDriver) {
      steps.push(
        {
          id: 'documents',
          label: 'رفع المستندات',
          description: 'رخصة القيادة، رخصة المركبة، صورة البطاقة',
          icon: <Upload className="h-5 w-5" />,
          completed: false,
          required: true,
        },
        {
          id: 'review',
          label: 'المراجعة والموافقة',
          description: 'مراجعة بياناتك من قبل فريق المنصة',
          icon: <ShieldCheck className="h-5 w-5" />,
          completed: profile?.is_active || false,
          required: true,
        },
      );
    }

    if (isJobseeker) {
      // Job seeker can be activated faster
      steps.push({
        id: 'review',
        label: 'تفعيل الحساب',
        description: 'جاري مراجعة حسابك — سيتم التفعيل تلقائياً قريباً',
        icon: <Clock className="h-5 w-5" />,
        completed: profile?.is_active || false,
        required: true,
      });
    }

    return steps;
  };

  const steps = getSteps();
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Re-check profile status
    try {
      if (profile) {
        const { data } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', profile.id)
          .single();
        if (data?.is_active) {
          window.location.reload();
          return;
        }
      }
      if (organization) {
        const { data } = await supabase
          .from('organizations')
          .select('is_active, is_verified')
          .eq('id', organization.id)
          .single();
        if (data?.is_active) {
          window.location.reload();
          return;
        }
      }
    } catch {}
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center">
          <PlatformLogo size="xl" />
          <p className="text-sm text-muted-foreground mt-2">منظومة إدارة المخلفات الذكية</p>
        </div>

        {/* Status Card */}
        <Card className="border-2 border-amber-200 dark:border-amber-800/50 shadow-lg">
          <CardHeader className="text-center pb-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-xl">حسابك قيد المراجعة</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isCompany
                ? 'يرجى استيفاء المتطلبات التالية لتفعيل حسابك'
                : 'جاري مراجعة بياناتك — سيتم إشعارك فور التفعيل'}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">نسبة الاكتمال</span>
                <Badge variant={progressPercent === 100 ? 'default' : 'secondary'}>
                  {completedSteps} / {totalSteps}
                </Badge>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2.5">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    step.completed
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className={`shrink-0 mt-0.5 ${step.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${step.completed ? 'text-primary' : ''}`}>
                        {step.label}
                      </span>
                      {step.completed && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">✓ تم</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  {!step.completed && (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>

            {/* Reminder notice */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  سيتم إرسال تذكيرات دورية لاستكمال المتطلبات المتبقية. تأكد من رفع جميع المستندات المطلوبة
                  لتسريع عملية المراجعة والتفعيل.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex-1"
              >
                <RefreshCw className={`ml-1.5 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث الحالة
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => { await signOut(); navigate('/auth'); }}
                className="flex-1"
              >
                <LogOut className="ml-1.5 h-4 w-4" />
                تسجيل خروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountPendingPage;
