import { memo, useState } from 'react';
import { Shield, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useTwoFactorAuth } from '@/hooks/useTwoFactorAuth';

interface TwoFactorVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

const TwoFactorVerifyDialog = memo(({
  open,
  onOpenChange,
  onVerified,
  title = 'التحقق بخطوتين',
  description = 'أدخل رمز التحقق للمتابعة'
}: TwoFactorVerifyDialogProps) => {
  const { loading, verify } = useTwoFactorAuth();
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [activeTab, setActiveTab] = useState<'totp' | 'backup'>('totp');

  const handleVerify = async () => {
    let success = false;
    
    if (activeTab === 'totp') {
      success = await verify(code, undefined);
    } else {
      success = await verify(undefined, backupCode);
    }
    
    if (success) {
      onVerified();
      onOpenChange(false);
      setCode('');
      setBackupCode('');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setCode('');
    setBackupCode('');
    setActiveTab('totp');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 justify-center">
            <Shield className="w-6 h-6 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'totp' | 'backup')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="totp">رمز التطبيق</TabsTrigger>
            <TabsTrigger value="backup">كود الاسترداد</TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              أدخل الرمز المكون من 6 أرقام من تطبيق المصادقة
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl font-mono tracking-[0.5em] h-14"
              maxLength={6}
              dir="ltr"
              autoFocus
            />
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Shield className="w-5 h-5 ml-2" />
              )}
              تحقق
            </Button>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground text-center">
              أدخل أحد أكواد الاسترداد
            </p>
            <Input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              placeholder="XXXXX-XXXXX"
              className="text-center text-xl font-mono tracking-widest h-14"
              dir="ltr"
            />
            <Button
              onClick={handleVerify}
              disabled={loading || backupCode.length < 10}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
              ) : (
                <Key className="w-5 h-5 ml-2" />
              )}
              استخدام كود الاسترداد
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});

TwoFactorVerifyDialog.displayName = 'TwoFactorVerifyDialog';

export default TwoFactorVerifyDialog;
