import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Fingerprint, KeyRound, Clock, LogOut, Smartphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TwoFactorSetup from '@/components/security/TwoFactorSetup';
import PagePasswordSettings from '@/components/security/PagePasswordSettings';
import PinCodeSettings from '@/components/security/PinCodeSettings';
import { useState } from 'react';

const SecuritySettings = () => {
  const [sessionTimeout, setSessionTimeout] = useState(true);

  return (
    <div className="space-y-4">
      {/* Security Score */}
      <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-background">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">مستوى الأمان</h3>
              <p className="text-sm text-muted-foreground">تحسين أمان حسابك يحمي بياناتك ومؤسستك</p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 px-3 py-1.5 text-sm">
              متوسط
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-green-500/10 rounded-lg text-center">
              <Fingerprint className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-[10px] font-medium text-green-700">PIN مفعّل</p>
            </div>
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-center">
              <Smartphone className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <p className="text-[10px] font-medium text-amber-700">2FA غير مفعّل</p>
            </div>
            <div className="p-2.5 bg-green-500/10 rounded-lg text-center">
              <KeyRound className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-[10px] font-medium text-green-700">كلمة مرور قوية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PinCodeSettings />
      <TwoFactorSetup />
      <PagePasswordSettings />

      {/* Session Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            إدارة الجلسات
          </CardTitle>
          <CardDescription className="text-xs">تحكم في جلسات تسجيل الدخول النشطة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">انتهاء الجلسة التلقائي</p>
              <p className="text-xs text-muted-foreground">تسجيل خروج تلقائي بعد 30 دقيقة من عدم النشاط</p>
            </div>
            <Switch checked={sessionTimeout} onCheckedChange={setSessionTimeout} />
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2 text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" />
            تسجيل الخروج من جميع الأجهزة
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuritySettings;
