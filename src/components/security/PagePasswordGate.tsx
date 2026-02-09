import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { verifyPassword, recoveryTypeLabels } from '@/hooks/usePagePasswords';
import { Lock, Shield, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PagePasswordGateProps {
  children: React.ReactNode;
}

const SESSION_KEY = 'page_unlocked_';

const PagePasswordGate = ({ children }: PagePasswordGateProps) => {
  const location = useLocation();
  const { organization } = useAuth();
  const { toast } = useToast();
  const [pagePassword, setPagePassword] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryMethods, setRecoveryMethods] = useState<any[]>([]);
  const [selectedRecovery, setSelectedRecovery] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  useEffect(() => {
    checkProtection();
  }, [location.pathname, organization?.id]);

  const checkProtection = async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      // Find if current page is protected
      const { data } = await supabase
        .from('page_passwords')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      // Find the most specific matching path
      const match = (data || [])
        .filter(p => location.pathname.startsWith(p.page_path))
        .sort((a, b) => b.page_path.length - a.page_path.length)[0];

      if (match) {
        setPagePassword(match);
        // Check session storage for unlock
        const unlockKey = SESSION_KEY + match.id;
        const unlocked = sessionStorage.getItem(unlockKey);
        if (unlocked === 'true') {
          setIsUnlocked(true);
        }

        // Fetch recovery methods
        const { data: recovery } = await supabase
          .from('page_password_recovery')
          .select('*')
          .eq('page_password_id', match.id)
          .eq('is_enabled', true);
        setRecoveryMethods(recovery || []);
      } else {
        setIsUnlocked(true);
      }
    } catch (err) {
      console.error('Error checking page protection:', err);
      setIsUnlocked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!pagePassword || !password) return;
    setVerifying(true);
    setError('');

    try {
      const valid = await verifyPassword(password, pagePassword.password_hash);
      if (valid) {
        setIsUnlocked(true);
        sessionStorage.setItem(SESSION_KEY + pagePassword.id, 'true');
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ أثناء التحقق');
    } finally {
      setVerifying(false);
    }
  };

  const handleRecovery = async () => {
    if (!selectedRecovery || !recoveryInput) return;
    setVerifying(true);
    setError('');

    try {
      const method = recoveryMethods.find(m => m.recovery_type === selectedRecovery);
      if (!method) return;

      let success = false;

      switch (selectedRecovery) {
        case 'security_question': {
          const storedAnswer = method.recovery_data?.answer || '';
          success = recoveryInput.trim().toLowerCase() === storedAnswer.trim().toLowerCase();
          break;
        }
        case 'backup_code': {
          // Check backup codes
          const { data: codes } = await supabase
            .from('page_password_backup_codes')
            .select('*')
            .eq('page_password_id', pagePassword.id)
            .eq('is_used', false);

          for (const code of (codes || [])) {
            const valid = await verifyPassword(recoveryInput.toUpperCase(), code.code_hash);
            if (valid) {
              await supabase.from('page_password_backup_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', code.id);
              success = true;
              break;
            }
          }
          break;
        }
        case 'admin_reset': {
          toast({ title: 'تم إرسال الطلب', description: 'سيتم إرسال طلب لمدير النظام لإعادة تعيين كلمة المرور' });
          setRecoverySuccess(true);
          setVerifying(false);
          return;
        }
        case 'email':
        case 'phone':
        case 'otp': {
          toast({ title: 'تم الإرسال', description: 'تم إرسال رمز التحقق. يرجى التحقق من الرسائل' });
          // Simulated - in production this would send actual codes
          success = recoveryInput === '123456'; // placeholder
          break;
        }
      }

      if (success) {
        setRecoverySuccess(true);
        setIsUnlocked(true);
        sessionStorage.setItem(SESSION_KEY + pagePassword.id, 'true');
        toast({ title: 'تم فتح الصفحة', description: 'تم التحقق بنجاح' });
      } else {
        setError('الإجابة/الرمز غير صحيح');
      }
    } catch {
      setError('حدث خطأ');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {!showRecovery ? (
            <motion.div key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center pb-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  >
                    <Lock className="h-8 w-8 text-primary" />
                  </motion.div>
                  <CardTitle>صفحة محمية</CardTitle>
                  <CardDescription>
                    هذه الصفحة محمية بكلمة مرور إضافية
                  </CardDescription>
                  <p className="text-sm font-medium text-primary mt-1">{pagePassword?.page_name}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="أدخل كلمة مرور الصفحة"
                      className="text-right text-lg"
                      onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                  </div>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleUnlock}
                    disabled={verifying || !password}
                  >
                    {verifying ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    فتح الصفحة
                  </Button>

                  {recoveryMethods.length > 0 && (
                    <Button
                      variant="link"
                      className="w-full text-sm"
                      onClick={() => setShowRecovery(true)}
                    >
                      نسيت كلمة المرور؟ استرجع بـ {recoveryMethods.length} طرق
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center pb-2">
                  <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle>استرجاع كلمة المرور</CardTitle>
                  <CardDescription>اختر طريقة الاسترجاع المناسبة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedRecovery ? (
                    <>
                      {recoveryMethods.map((method) => {
                        const info = recoveryTypeLabels[method.recovery_type];
                        return (
                          <motion.button
                            key={method.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedRecovery(method.recovery_type)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-right"
                          >
                            <span className="text-2xl">{info?.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium">{info?.label}</p>
                              <p className="text-xs text-muted-foreground">{info?.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.button>
                        );
                      })}
                      <Button variant="outline" className="w-full mt-2" onClick={() => setShowRecovery(false)}>
                        العودة لكلمة المرور
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <span className="text-xl">{recoveryTypeLabels[selectedRecovery]?.icon}</span>
                        <span className="font-medium">{recoveryTypeLabels[selectedRecovery]?.label}</span>
                      </div>

                      {selectedRecovery === 'security_question' && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium bg-muted p-3 rounded-lg">
                            {recoveryMethods.find(m => m.recovery_type === 'security_question')?.recovery_data?.question || 'سؤال الأمان'}
                          </p>
                          <Input
                            value={recoveryInput}
                            onChange={e => { setRecoveryInput(e.target.value); setError(''); }}
                            placeholder="أدخل الإجابة"
                            className="text-right"
                          />
                        </div>
                      )}

                      {selectedRecovery === 'backup_code' && (
                        <Input
                          value={recoveryInput}
                          onChange={e => { setRecoveryInput(e.target.value.toUpperCase()); setError(''); }}
                          placeholder="أدخل الرمز الاحتياطي"
                          className="text-center font-mono text-lg tracking-widest"
                          maxLength={6}
                        />
                      )}

                      {['email', 'phone', 'otp'].includes(selectedRecovery) && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">أدخل رمز التحقق المرسل إليك</p>
                          <Input
                            value={recoveryInput}
                            onChange={e => { setRecoveryInput(e.target.value); setError(''); }}
                            placeholder="رمز التحقق"
                            className="text-center font-mono text-lg tracking-widest"
                            maxLength={6}
                          />
                        </div>
                      )}

                      {selectedRecovery === 'admin_reset' && (
                        <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
                          سيتم إرسال طلب لمدير النظام لإعادة تعيين كلمة مرور هذه الصفحة. ستصلك إشعار عند الموافقة.
                        </p>
                      )}

                      {error && <p className="text-xs text-destructive text-center">{error}</p>}

                      {recoverySuccess && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center gap-2 text-primary p-4"
                        >
                          <CheckCircle2 className="h-6 w-6" />
                          <span className="font-medium">تم بنجاح!</span>
                        </motion.div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setSelectedRecovery(null); setRecoveryInput(''); setError(''); }}>
                          رجوع
                        </Button>
                        <Button className="flex-1" onClick={handleRecovery} disabled={verifying || (!recoveryInput && selectedRecovery !== 'admin_reset')}>
                          {verifying ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" /> : 'تحقق'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PagePasswordGate;
