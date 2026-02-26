import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound, ArrowRight, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlatformLogo from '@/components/common/PlatformLogo';

type ResetView = 'request' | 'update' | 'success';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<ResetView>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // Check if user arrived via recovery link
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setView('update');
    }

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('update');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال رابط الاسترجاع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمتا المرور غير متطابقتين',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setView('success');
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث كلمة المرور بنجاح',
      });
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث كلمة المرور',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <PlatformLogo size="lg" className="mx-auto mb-3" />
          <h1 className="text-xl font-bold text-primary">iRecycle</h1>
          <p className="text-sm text-muted-foreground">Waste Management System - نظام إدارة المخلفات</p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {view === 'request' && 'استرجاع كلمة المرور'}
              {view === 'update' && 'تعيين كلمة مرور جديدة'}
              {view === 'success' && 'تم بنجاح!'}
            </CardTitle>
            <CardDescription>
              {view === 'request' && 'أدخل بريدك الإلكتروني لإرسال رابط الاسترجاع'}
              {view === 'update' && 'أدخل كلمة المرور الجديدة'}
              {view === 'success' && 'تم تحديث كلمة المرور بنجاح'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Request Reset Form */}
            {view === 'request' && !emailSent && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="example@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      required
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط الاسترجاع'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </Button>
              </form>
            )}

            {/* Email Sent Confirmation */}
            {view === 'request' && emailSent && (
              <div className="space-y-4 text-center">
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    تم إرسال رابط استرجاع كلمة المرور إلى <strong dir="ltr">{email}</strong>.
                    <br />
                    يرجى التحقق من بريدك الإلكتروني (وقد يكون في مجلد الرسائل غير المرغوب فيها).
                  </AlertDescription>
                </Alert>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setEmailSent(false); setEmail(''); }}
                >
                  إعادة الإرسال لبريد آخر
                </Button>

                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => navigate('/auth')}
                >
                  <ArrowRight className="w-4 h-4" />
                  العودة لتسجيل الدخول
                </Button>
              </div>
            )}

            {/* Update Password Form */}
            {view === 'update' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      dir="ltr"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    required
                    minLength={6}
                  />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      كلمتا المرور غير متطابقتين
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
            )}

            {/* Success View */}
            {view === 'success' && (
              <div className="space-y-4 text-center">
                <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
                </p>
                <Button className="w-full" onClick={() => navigate('/auth')}>
                  الذهاب لتسجيل الدخول
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
