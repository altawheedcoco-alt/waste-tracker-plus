import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, KeyRound, ArrowRight, CheckCircle, AlertCircle, Mail, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import PlatformLogo from '@/components/common/PlatformLogo';
import { validatePasswordStrength } from '@/lib/inputSanitizer';

type ResetView = 'request' | 'update' | 'success';

const RESET_COOLDOWN_MS = 60_000; // 60 seconds between reset emails

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
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const passwordStrength = password ? validatePasswordStrength(password) : null;
  const strengthPercent = passwordStrength ? (passwordStrength.score / 5) * 100 : 0;
  const strengthColor = strengthPercent <= 40 ? 'bg-destructive' : strengthPercent <= 70 ? 'bg-yellow-500' : 'bg-green-500';

  // Cleanup cooldown timer
  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') setView('update');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setView('update');
    });
    return () => subscription.unsubscribe();
  }, []);

  const startCooldown = () => {
    setCooldown(RESET_COOLDOWN_MS / 1000);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || cooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
      startCooldown();
      toast({ title: 'تم الإرسال', description: 'تم إرسال رابط استرجاع كلمة المرور إلى بريدك الإلكتروني' });
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message || 'حدث خطأ أثناء إرسال رابط الاسترجاع', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Verify session is still valid before updating
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Try to recover session from URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else {
          toast({ title: 'انتهت الجلسة', description: 'رابط استعادة كلمة المرور انتهت صلاحيته. أعد طلب رابط جديد.', variant: 'destructive' });
          setView('request');
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        // If aborted, retry once
        if (error.message?.includes('abort') || error.message?.includes('signal')) {
          await new Promise(r => setTimeout(r, 1000));
          const { error: retryError } = await supabase.auth.updateUser({ password });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }
      setView('success');
      toast({ title: 'تم التحديث', description: 'تم تحديث كلمة المرور بنجاح' });
    } catch (error: any) {
      const msg = error.message?.includes('abort') || error.message?.includes('signal')
        ? 'انتهت مهلة الاتصال. تأكد من اتصالك بالإنترنت وأعد المحاولة.'
        : (error.message || 'حدث خطأ أثناء تحديث كلمة المرور');
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-safe flex items-center justify-center p-4 relative" dir="rtl">
      {/* v3.0 Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(160, 68%, 40%, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, hsl(205, 78%, 42%, 0.04) 0%, transparent 50%)',
        }} />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-muted/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6">
          <PlatformLogo size="lg" className="mx-auto mb-3" />
          <h1 className="text-xl font-bold text-primary">iRecycle</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">نظام إدارة المخلفات</p>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-[9px] font-bold text-primary">
              <Sparkles className="w-2.5 h-2.5" />v3.0
            </span>
          </div>
        </div>

        <Card className="border border-border/30 shadow-2xl shadow-primary/[0.04] rounded-2xl overflow-hidden">
          <div className="h-1 w-full" style={{
            background: 'linear-gradient(90deg, hsl(160, 68%, 40%), hsl(178, 60%, 38%), hsl(205, 78%, 42%))',
          }} />
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-3.5 rounded-2xl bg-primary/10 w-fit mb-3">
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

          <CardContent className="pt-4 pb-6">
            {view === 'request' && !emailSent && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Input id="reset-email" type="email" placeholder="example@company.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading || cooldown > 0}>
                  {loading ? 'جاري الإرسال...' : cooldown > 0 ? `انتظر ${cooldown} ثانية` : 'إرسال رابط الاسترجاع'}
                </Button>
                <Button type="button" variant="ghost" className="w-full gap-2" onClick={() => navigate('/auth')}>
                  <ArrowRight className="w-4 h-4" />العودة لتسجيل الدخول
                </Button>
              </form>
            )}

            {view === 'request' && emailSent && (
              <div className="space-y-4 text-center">
                <Alert className="border-primary/30 bg-primary/5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    تم إرسال رابط استرجاع كلمة المرور إلى <strong dir="ltr">{email}</strong>.
                    <br />يرجى التحقق من بريدك الإلكتروني.
                  </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" onClick={() => { setEmailSent(false); setEmail(''); }} disabled={cooldown > 0}>
                  {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown} ثانية` : 'إعادة الإرسال لبريد آخر'}
                </Button>
                <Button variant="ghost" className="w-full gap-2" onClick={() => navigate('/auth')}>
                  <ArrowRight className="w-4 h-4" />العودة لتسجيل الدخول
                </Button>
              </div>
            )}

            {view === 'update' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input id="new-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && passwordStrength && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div className={`h-full transition-all ${strengthColor}`} style={{ width: `${strengthPercent}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{strengthPercent <= 40 ? 'ضعيفة' : strengthPercent <= 70 ? 'متوسطة' : 'قوية'}</span>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {passwordStrength.feedback.map((f, i) => <li key={i}>• {f}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} dir="ltr" required minLength={6} />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />كلمتا المرور غير متطابقتين</p>
                  )}
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading || !password || !confirmPassword || password !== confirmPassword}>
                  {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>
            )}

            {view === 'success' && (
              <div className="space-y-4 text-center">
                <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة</p>
                <Button className="w-full h-11" onClick={() => navigate('/auth')}>الذهاب لتسجيل الدخول</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
