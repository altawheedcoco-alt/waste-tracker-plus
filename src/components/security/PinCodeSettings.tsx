import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Shield, Trash2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useUserPin } from '@/hooks/useUserPin';
import { recoveryTypeLabels } from '@/hooks/usePagePasswords';

const PinCodeSettings = () => {
  const { pinData, loading, setupPin, removePin } = useUserPin();
  const [setupOpen, setSetupOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(true);
  const [recoveryConfig, setRecoveryConfig] = useState<Record<string, { enabled: boolean; data: Record<string, any> }>>({
    email: { enabled: true, data: {} },
    phone: { enabled: false, data: { phone: '' } },
    security_question: { enabled: false, data: { question: '', answer: '' } },
    backup_code: { enabled: true, data: {} },
    admin_reset: { enabled: true, data: {} },
    otp: { enabled: false, data: {} },
  });

  const handleSetup = async () => {
    if (pin.length !== 6 || pin !== confirmPin) return;
    await setupPin(pin, recoveryConfig);
    setSetupOpen(false);
    setPin('');
    setConfirmPin('');
  };

  const handlePinInput = (value: string, setter: (v: string) => void) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setter(digits);
  };

  const toggleRecovery = (type: string, enabled: boolean) => {
    setRecoveryConfig(prev => ({ ...prev, [type]: { ...prev[type], enabled } }));
  };

  const updateRecoveryData = (type: string, data: Record<string, any>) => {
    setRecoveryConfig(prev => ({ ...prev, [type]: { ...prev[type], data: { ...prev[type].data, ...data } } }));
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              رمز التعريف الشخصي (PIN)
            </CardTitle>
            <CardDescription>
              رمز مكون من 6 أرقام يُطلب بعد تسجيل الدخول لتأمين حسابك - لديك 6 محاولات قبل القفل
            </CardDescription>
          </div>
          {pinData ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              مفعّل
            </Badge>
          ) : (
            <Badge variant="secondary">غير مفعّل</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pinData ? (
          <div className="flex items-center justify-between p-4 rounded-xl border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">رمز التعريف مفعّل</p>
                <p className="text-sm text-muted-foreground">سيُطلب منك إدخال الرمز بعد كل تسجيل دخول</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={removePin}>
              <Trash2 className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
          </div>
        ) : (
          <Button onClick={() => setSetupOpen(true)} className="w-full gap-2" size="lg">
            <Shield className="h-5 w-5" />
            تفعيل رمز التعريف الشخصي
          </Button>
        )}
      </CardContent>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              إنشاء رمز التعريف الشخصي
            </DialogTitle>
            <DialogDescription>
              أدخل رمز مكون من 6 أرقام وحدد طرق الاسترجاع
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pin" className="mt-4">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="pin">الرمز</TabsTrigger>
              <TabsTrigger value="recovery">طرق الاسترجاع</TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowPin(!showPin)} className="gap-1 text-xs">
                  {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPin ? 'إخفاء' : 'إظهار'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label>رمز التعريف (6 أرقام)</Label>
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={e => handlePinInput(e.target.value, setPin)}
                  placeholder="أدخل 6 أرقام"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  inputMode="numeric"
                />
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>تأكيد الرمز</Label>
                <Input
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={e => handlePinInput(e.target.value, setConfirmPin)}
                  placeholder="أعد إدخال الرمز"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  inputMode="numeric"
                />
                {confirmPin.length === 6 && pin !== confirmPin && (
                  <p className="text-xs text-destructive text-center">الرمزان غير متطابقين</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground">طرق استرجاع رمز التعريف عند نسيانه أو قفل الحساب</p>
              {Object.entries(recoveryTypeLabels).map(([type, info]) => (
                <div key={type} className="p-3 rounded-xl border bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{info.label}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={recoveryConfig[type]?.enabled || false}
                      onCheckedChange={(checked) => toggleRecovery(type, checked)}
                    />
                  </div>
                  {recoveryConfig[type]?.enabled && type === 'security_question' && (
                    <div className="space-y-2">
                      <Input
                        value={recoveryConfig.security_question?.data?.question || ''}
                        onChange={e => updateRecoveryData('security_question', { question: e.target.value })}
                        placeholder="سؤال الأمان"
                        className="text-right text-sm"
                      />
                      <Input
                        type="password"
                        value={recoveryConfig.security_question?.data?.answer || ''}
                        onChange={e => updateRecoveryData('security_question', { answer: e.target.value })}
                        placeholder="الإجابة"
                        className="text-right text-sm"
                      />
                    </div>
                  )}
                  {recoveryConfig[type]?.enabled && type === 'phone' && (
                    <Input
                      value={recoveryConfig.phone?.data?.phone || ''}
                      onChange={e => updateRecoveryData('phone', { phone: e.target.value })}
                      placeholder="رقم الهاتف"
                      className="text-right text-sm"
                    />
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setSetupOpen(false)}>إلغاء</Button>
            <Button onClick={handleSetup} disabled={pin.length !== 6 || pin !== confirmPin}>
              <Shield className="h-4 w-4 ml-2" />
              تفعيل الرمز
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PinCodeSettings;
