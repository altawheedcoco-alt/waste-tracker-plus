import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Fingerprint,
  Scan,
  Eye,
  Smartphone,
  Laptop,
  Monitor,
  Plus,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useBiometricAuth, BiometricCredential } from '@/hooks/useBiometricAuth';
import { useAuth } from '@/contexts/AuthContext';

export default function BiometricManager() {
  const { user, profile } = useAuth();
  const {
    isLoading,
    isSupported,
    credentials,
    checkSupport,
    registerBiometric,
    loadCredentials,
    deleteCredential,
  } = useBiometricAuth();
  
  const [checking, setChecking] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        checkSupport(),
        loadCredentials(user.id),
      ]).finally(() => setChecking(false));
    }
  }, [user?.id, checkSupport, loadCredentials]);

  const handleRegister = async () => {
    if (!user?.id) return;
    
    setRegistering(true);
    await registerBiometric(
      user.id,
      user.email || 'user',
      profile?.full_name || user.email || 'User'
    );
    await loadCredentials(user.id);
    setRegistering(false);
  };

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="h-5 w-5" />;
      case 'face':
        return <Scan className="h-5 w-5" />;
      case 'iris':
        return <Eye className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getBiometricLabel = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return 'بصمة الإصبع';
      case 'face':
        return 'بصمة الوجه';
      case 'iris':
        return 'بصمة العين';
      default:
        return 'بصمة غير معروفة';
    }
  };

  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('iphone') || name.includes('android')) {
      return <Smartphone className="h-4 w-4" />;
    } else if (name.includes('mac') || name.includes('laptop')) {
      return <Laptop className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              المصادقة البيومترية
            </CardTitle>
            <CardDescription>
              استخدم بصمتك أو وجهك للتوقيع على المستندات
            </CardDescription>
          </div>
          <Badge 
            variant={isSupported ? 'default' : 'secondary'}
            className={cn(
              isSupported 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                : 'bg-amber-100 text-amber-700 border-amber-200'
            )}
          >
            {isSupported ? (
              <>
                <CheckCircle2 className="h-3 w-3 ml-1" />
                مدعوم
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 ml-1" />
                غير مدعوم
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-700 dark:text-blue-300">
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">كيف تعمل المصادقة البيومترية؟</p>
            <p className="text-blue-600 dark:text-blue-400">
              تستخدم بصمتك أو وجهك للتحقق من هويتك عند توقيع المستندات. 
              البيانات البيومترية لا تُرسل للسيرفر أبداً - جهازك يتحقق منها محلياً ويرسل فقط تأكيد التحقق.
            </p>
          </div>
        </div>

        {/* Support Status */}
        {!isSupported && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-300">
            <p className="text-sm">
              جهازك أو متصفحك لا يدعم المصادقة البيومترية. 
              جرب استخدام متصفح حديث على جهاز يحتوي على قارئ بصمة أو كاميرا.
            </p>
          </div>
        )}

        {/* Registered Credentials */}
        {credentials.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">البصمات المسجلة</h4>
            <AnimatePresence>
              {credentials.map((credential: any, index: number) => (
                <motion.div
                  key={credential.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-3 rounded-full',
                        credential.biometric_type === 'fingerprint' 
                          ? 'bg-violet-100 text-violet-600'
                          : credential.biometric_type === 'face'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {getBiometricIcon(credential.biometric_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getBiometricLabel(credential.biometric_type)}</span>
                          <Badge variant="outline" className="gap-1 text-xs">
                            {getDeviceIcon(credential.device_name)}
                            {credential.device_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            مسجلة: {format(new Date(credential.created_at), 'dd MMM yyyy', { locale: ar })}
                          </span>
                          {credential.last_used_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              آخر استخدام: {format(new Date(credential.last_used_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف البصمة</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذه البصمة؟ لن تتمكن من استخدامها للتوقيع بعد ذلك.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCredential(credential.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <Separator />

        {/* Register New Biometric */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">إضافة بصمة جديدة</p>
            <p className="text-sm text-muted-foreground">
              سجل بصمة إصبعك أو وجهك للتوقيع
            </p>
          </div>
          <Button
            onClick={handleRegister}
            disabled={!isSupported || registering}
            className="gap-2"
          >
            {registering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            إضافة بصمة
          </Button>
        </div>

        {/* Usage Stats */}
        {credentials.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{credentials.length}</p>
                <p className="text-xs text-muted-foreground">بصمات مسجلة</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {credentials.filter((c: any) => c.last_used_at).length}
                </p>
                <p className="text-xs text-muted-foreground">تم استخدامها</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-violet-600">
                  {[...new Set(credentials.map((c: any) => c.device_name))].length}
                </p>
                <p className="text-xs text-muted-foreground">أجهزة</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
