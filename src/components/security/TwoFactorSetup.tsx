import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle, Key, Smartphone, Loader2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';
import { cn } from '@/lib/utils';

interface TwoFactorSetupProps {
  className?: string;
}

const TwoFactorSetup = memo(({ className }: TwoFactorSetupProps) => {
  const {
    loading,
    status,
    setupData,
    checkStatus,
    startSetup,
    verifySetup,
    disable,
    regenerateBackupCodes,
    cancelSetup
  } = useTwoFactorAuth();

  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [backupCodeInput, setBackupCodeInput] = useState('');

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyAllBackupCodes = async (codes: string[]) => {
    await navigator.clipboard.writeText(codes.join('\n'));
    setCopiedCode('all');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length === 6) {
      const success = await verifySetup(verificationCode);
      if (success) {
        setVerificationCode('');
      }
    }
  };

  const handleDisable = async () => {
    const success = await disable(disableCode);
    if (success) {
      setShowDisableDialog(false);
      setDisableCode('');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const codes = await regenerateBackupCodes(backupCodeInput);
    if (codes) {
      setNewBackupCodes(codes);
      setBackupCodeInput('');
    }
  };

  // Setup in progress
  if (setupData) {
    return (
      <Card className={cn('border-primary/20', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            إعداد المصادقة الثنائية
          </CardTitle>
          <CardDescription>
            اتبع الخطوات التالية لتفعيل المصادقة الثنائية
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: QR Code */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">1</Badge>
              امسح رمز QR
            </h3>
            <p className="text-sm text-muted-foreground">
              افتح تطبيق المصادقة (مثل Google Authenticator أو Authy) وامسح الرمز التالي
            </p>
            <div className="flex justify-center p-6 bg-white rounded-xl shadow-inner">
              <QRCodeSVG
                value={setupData.otpauthUrl}
                size={200}
                level="H"
                includeMargin
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              أو أدخل المفتاح يدوياً:
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {setupData.secret}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyCode(setupData.secret)}
              >
                {copiedCode === setupData.secret ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Backup Codes */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">2</Badge>
              احفظ أكواد الاسترداد
            </h3>
            <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <AlertDescription className="text-sm">
                احتفظ بهذه الأكواد في مكان آمن. يمكنك استخدامها لتسجيل الدخول إذا فقدت الوصول لتطبيق المصادقة.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
              {setupData.backupCodes.map((code, index) => (
                <code key={index} className="text-xs font-mono p-1 bg-background rounded">
                  {code}
                </code>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyAllBackupCodes(setupData.backupCodes)}
              className="w-full"
            >
              {copiedCode === 'all' ? (
                <>
                  <Check className="w-4 h-4 ml-2" />
                  تم النسخ
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ جميع الأكواد
                </>
              )}
            </Button>
          </div>

          {/* Step 2: Verify */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Badge variant="outline">3</Badge>
              أدخل رمز التحقق
            </h3>
            <p className="text-sm text-muted-foreground">
              أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
            </p>
            <div className="flex gap-2">
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                dir="ltr"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleVerifySetup}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <ShieldCheck className="w-4 h-4 ml-2" />
              )}
              تفعيل المصادقة الثنائية
            </Button>
            <Button variant="outline" onClick={cancelSetup}>
              إلغاء
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Status display
  return (
    <>
      <Card className={cn(status?.enabled ? 'border-primary/30' : '', className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" />
              المصادقة الثنائية (2FA)
            </span>
            {status?.enabled ? (
              <Badge className="bg-primary">مُفعّل</Badge>
            ) : (
              <Badge variant="secondary">غير مُفعّل</Badge>
            )}
          </CardTitle>
          <CardDescription>
            أضف طبقة حماية إضافية لحسابك باستخدام تطبيق المصادقة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <ShieldCheck className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-medium">حسابك محمي</p>
                  <p className="text-sm text-muted-foreground">
                    المصادقة الثنائية مفعّلة منذ {status.verifiedAt && new Date(status.verifiedAt).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupDialog(true)}
                >
                  <Key className="w-4 h-4 ml-2" />
                  إنشاء أكواد استرداد جديدة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <ShieldOff className="w-4 h-4 ml-2" />
                  إلغاء التفعيل
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Smartphone className="w-10 h-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">حماية إضافية لحسابك</p>
                  <p className="text-sm text-muted-foreground">
                    استخدم تطبيق المصادقة للتحقق من هويتك عند تسجيل الدخول
                  </p>
                </div>
              </div>

              <Button onClick={startSetup} disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Shield className="w-4 h-4 ml-2" />
                )}
                تفعيل المصادقة الثنائية
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" />
              إلغاء المصادقة الثنائية
            </DialogTitle>
            <DialogDescription>
              أدخل رمز التحقق من تطبيق المصادقة لتأكيد إلغاء التفعيل
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              تحذير: إلغاء المصادقة الثنائية سيقلل من أمان حسابك
            </AlertDescription>
          </Alert>

          <Input
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="أدخل الرمز المكون من 6 أرقام"
            className="text-center text-xl font-mono tracking-widest"
            maxLength={6}
            dir="ltr"
          />

          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={loading || disableCode.length !== 6}
              className="flex-1"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تأكيد الإلغاء
            </Button>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              إلغاء
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Backup Codes Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              إنشاء أكواد استرداد جديدة
            </DialogTitle>
            <DialogDescription>
              {newBackupCodes
                ? 'احفظ هذه الأكواد في مكان آمن'
                : 'أدخل رمز التحقق لإنشاء أكواد استرداد جديدة'}
            </DialogDescription>
          </DialogHeader>

          {newBackupCodes ? (
            <div className="space-y-4">
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  الأكواد القديمة لم تعد صالحة. احفظ الأكواد الجديدة الآن.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                {newBackupCodes.map((code, index) => (
                  <code key={index} className="text-xs font-mono p-1 bg-background rounded">
                    {code}
                  </code>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => handleCopyAllBackupCodes(newBackupCodes)}
                className="w-full"
              >
                {copiedCode === 'all' ? (
                  <>
                    <Check className="w-4 h-4 ml-2" />
                    تم النسخ
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 ml-2" />
                    نسخ جميع الأكواد
                  </>
                )}
              </Button>

              <Button
                onClick={() => {
                  setShowBackupDialog(false);
                  setNewBackupCodes(null);
                }}
                className="w-full"
              >
                تم
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                value={backupCodeInput}
                onChange={(e) => setBackupCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="أدخل الرمز المكون من 6 أرقام"
                className="text-center text-xl font-mono tracking-widest"
                maxLength={6}
                dir="ltr"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleRegenerateBackupCodes}
                  disabled={loading || backupCodeInput.length !== 6}
                  className="flex-1"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  إنشاء أكواد جديدة
                </Button>
                <Button variant="outline" onClick={() => setShowBackupDialog(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});

TwoFactorSetup.displayName = 'TwoFactorSetup';

export default TwoFactorSetup;
