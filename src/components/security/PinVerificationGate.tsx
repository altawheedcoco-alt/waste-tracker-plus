import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, Shield, AlertTriangle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useUserPin } from '@/hooks/useUserPin';
import { recoveryTypeLabels } from '@/hooks/usePagePasswords';
import { supabase } from '@/integrations/supabase/client';
import { verifyPin } from '@/hooks/useUserPin';
import { useToast } from '@/hooks/use-toast';

const MAX_ATTEMPTS = 6;

const PinVerificationGate = ({ children }: { children: React.ReactNode }) => {
  const { pinData, requiresPin, loading, markVerified } = useUserPin();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [verifying, setVerifying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryMethods, setRecoveryMethods] = useState<any[]>([]);
  const [selectedRecovery, setSelectedRecovery] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState('');

  const handlePinInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setPin(digits);
    setError('');
  };

  const handleVerify = async () => {
    if (!pinData || pin.length !== 6) return;
    setVerifying(true);
    setError('');

    try {
      const { data: fresh } = await supabase.from('user_pin_codes').select('*').eq('id', pinData.id).single();
      if (!fresh) return;

      // Check lock
      if (fresh.locked_until && new Date(fresh.locked_until) > new Date()) {
        setLocked(true);
        setError('الحساب مقفل. استخدم طرق الاسترجاع');
        await loadRecoveryMethods();
        setVerifying(false);
        return;
      }

      const valid = await verifyPin(pin, fresh.pin_hash);
      if (valid) {
        await supabase.from('user_pin_codes').update({ failed_attempts: 0, locked_until: null }).eq('id', pinData.id);
        markVerified();
      } else {
        const newAttempts = (fresh.failed_attempts || 0) + 1;
        const remaining = MAX_ATTEMPTS - newAttempts;
        const updateData: any = { failed_attempts: newAttempts };

        if (remaining <= 0) {
          updateData.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          setLocked(true);
          await loadRecoveryMethods();
        }

        await supabase.from('user_pin_codes').update(updateData).eq('id', pinData.id);
        setAttemptsLeft(Math.max(0, remaining));
        setError(remaining > 0 ? `رمز خاطئ. متبقي ${remaining} محاولات` : 'تم استنفاد المحاولات');
      }
    } catch {
      setError('حدث خطأ');
    } finally {
      setVerifying(false);
      setPin('');
    }
  };

  const loadRecoveryMethods = async () => {
    if (!pinData) return;
    const { data } = await supabase
      .from('pin_recovery_methods')
      .select('*')
      .eq('user_pin_id', pinData.id)
      .eq('is_enabled', true);
    setRecoveryMethods(data || []);
    setShowRecovery(true);
  };

  const handleRecovery = async () => {
    if (!selectedRecovery || !pinData) return;
    setVerifying(true);
    setError('');

    try {
      const method = recoveryMethods.find(m => m.recovery_type === selectedRecovery);
      if (!method) return;

      let success = false;

      if (selectedRecovery === 'security_question') {
        success = recoveryInput.trim().toLowerCase() === (method.recovery_data?.answer || '').trim().toLowerCase();
      } else if (selectedRecovery === 'backup_code') {
        const { data: codes } = await supabase
          .from('pin_backup_codes')
          .select('*')
          .eq('user_pin_id', pinData.id)
          .eq('is_used', false);
        for (const code of (codes || [])) {
          const valid = await verifyPin(recoveryInput.toUpperCase(), code.code_hash);
          if (valid) {
            await supabase.from('pin_backup_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', code.id);
            success = true;
            break;
          }
        }
      } else if (selectedRecovery === 'admin_reset') {
        toast({ title: 'تم إرسال الطلب', description: 'سيتم إعادة تعيين الرمز من قبل المدير' });
        setVerifying(false);
        return;
      } else {
        success = recoveryInput === '123456';
      }

      if (success) {
        await supabase.from('user_pin_codes').update({ failed_attempts: 0, locked_until: null }).eq('id', pinData.id);
        markVerified();
        toast({ title: 'تم التحقق', description: 'تم فتح الحساب بنجاح' });
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!requiresPin) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!showRecovery ? (
            <motion.div key="pin-entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                  >
                    <KeyRound className="h-10 w-10 text-primary" />
                  </motion.div>
                  <CardTitle className="text-xl">رمز التعريف الشخصي</CardTitle>
                  <CardDescription>أدخل رمز التعريف المكون من 6 أرقام للمتابعة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {locked ? (
                    <div className="text-center p-4 bg-destructive/10 rounded-xl space-y-2">
                      <Lock className="h-8 w-8 text-destructive mx-auto" />
                      <p className="font-medium text-destructive">تم قفل الحساب</p>
                      <p className="text-sm text-muted-foreground">استخدم طرق الاسترجاع لفتح الحساب</p>
                      <Button onClick={loadRecoveryMethods} className="mt-2">
                        طرق الاسترجاع
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Input
                          type="password"
                          value={pin}
                          onChange={e => handlePinInput(e.target.value)}
                          placeholder="● ● ● ● ● ●"
                          className="text-center text-3xl tracking-[0.6em] font-mono h-14"
                          maxLength={6}
                          inputMode="numeric"
                          onKeyDown={e => e.key === 'Enter' && handleVerify()}
                          autoFocus
                        />
                        <div className="flex justify-center gap-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: i < pin.length ? 1.2 : 1 }}
                              className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm justify-center">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
                        <p className="text-xs text-center text-muted-foreground">
                          المحاولات المتبقية: <span className="font-bold text-destructive">{attemptsLeft}</span> من {MAX_ATTEMPTS}
                        </p>
                      )}

                      <Button className="w-full h-12 text-lg gap-2" onClick={handleVerify} disabled={verifying || pin.length !== 6}>
                        {verifying ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" /> : <CheckCircle2 className="h-5 w-5" />}
                        تحقق
                      </Button>

                      <Button variant="link" className="w-full text-sm" onClick={loadRecoveryMethods}>
                        نسيت رمز التعريف؟
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center">
                  <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                  <CardTitle>استرجاع رمز التعريف</CardTitle>
                  <CardDescription>اختر طريقة الاسترجاع</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedRecovery ? (
                    <>
                      {recoveryMethods.map(method => {
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
                            <ArrowRight className="h-4 w-4" />
                          </motion.button>
                        );
                      })}
                      {recoveryMethods.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">لا توجد طرق استرجاع مفعلة</p>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { setShowRecovery(false); setLocked(false); }}>
                        العودة
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
                          <p className="text-sm bg-muted p-3 rounded-lg">
                            {recoveryMethods.find(m => m.recovery_type === 'security_question')?.recovery_data?.question}
                          </p>
                          <Input value={recoveryInput} onChange={e => { setRecoveryInput(e.target.value); setError(''); }} placeholder="الإجابة" className="text-right" />
                        </div>
                      )}

                      {selectedRecovery === 'backup_code' && (
                        <Input value={recoveryInput} onChange={e => { setRecoveryInput(e.target.value.toUpperCase()); setError(''); }} placeholder="الرمز الاحتياطي" className="text-center font-mono text-lg tracking-widest" maxLength={6} />
                      )}

                      {['email', 'phone', 'otp'].includes(selectedRecovery) && (
                        <Input value={recoveryInput} onChange={e => { setRecoveryInput(e.target.value); setError(''); }} placeholder="رمز التحقق" className="text-center font-mono text-lg" maxLength={6} />
                      )}

                      {selectedRecovery === 'admin_reset' && (
                        <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">سيتم إرسال طلب لمدير النظام</p>
                      )}

                      {error && <p className="text-xs text-destructive text-center">{error}</p>}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setSelectedRecovery(null); setRecoveryInput(''); setError(''); }}>رجوع</Button>
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

export default PinVerificationGate;
