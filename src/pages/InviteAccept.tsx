import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

interface InvitationData {
  email: string;
  employeeType: string;
  organization: {
    id: string;
    name: string;
    logo_url?: string;
  };
  expiresAt: string;
}

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError('رمز الدعوة غير موجود');
      setIsLoading(false);
      return;
    }

    try {
      // Use fetch directly for GET request with query params
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/employee-invitation?action=verify&token=${token}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.expired) {
          setIsExpired(true);
        }
        setError(result.error || 'فشل في التحقق من الدعوة');
      } else if (result.valid) {
        setInvitation(result.invitation);
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('حدث خطأ في التحقق من الدعوة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/employee-invitation?action=accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            token,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone || undefined,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في قبول الدعوة');
      }

      setIsAccepted(true);
      toast.success('تم إنشاء حسابك بنجاح!');

      // Auto login after 2 seconds
      setTimeout(async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email: invitation!.email,
          password: formData.password,
        });

        if (!error) {
          navigate('/dashboard');
        } else {
          navigate('/auth?mode=login');
        }
      }, 2000);
    } catch (err: any) {
      console.error('Accept error:', err);
      toast.error(err.message || 'فشل في قبول الدعوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const employeeTypeLabels: Record<string, string> = {
    employee: 'موظف',
    accountant: 'محاسب',
    supervisor: 'مشرف',
    manager: 'مدير',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                تم إنشاء حسابك بنجاح!
              </h2>
              <p className="text-muted-foreground mb-4">
                جاري تسجيل دخولك تلقائياً...
              </p>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-8 pb-8">
              {isExpired ? (
                <Clock className="h-20 w-20 text-amber-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-20 w-20 text-destructive mx-auto mb-4" />
              )}
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isExpired ? 'انتهت صلاحية الدعوة' : 'دعوة غير صالحة'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error || 'انتهت صلاحية رابط الدعوة. يرجى طلب دعوة جديدة من المسؤول.'}
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                العودة للصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {invitation?.organization?.logo_url ? (
                <img 
                  src={invitation.organization.logo_url} 
                  alt={invitation.organization.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-xl">انضم إلى {invitation?.organization?.name}</CardTitle>
              <CardDescription className="mt-2">
                تمت دعوتك للانضمام كـ
                <Badge variant="secondary" className="mr-1">
                  {employeeTypeLabels[invitation?.employeeType || 'employee']}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={invitation?.email || ''}
                    readOnly
                    className="pr-10 bg-muted"
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="أدخل رقم الهاتف"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="أعد إدخال كلمة المرور"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                </div>
              </div>

              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>كلمتا المرور غير متطابقتين</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || formData.password !== formData.confirmPassword}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  'قبول الدعوة وإنشاء الحساب'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                بالنقر على "قبول الدعوة"، فإنك توافق على شروط الخدمة وسياسة الخصوصية
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-4 text-center flex items-center justify-center gap-2">
          <img src={logo} alt="آي ريسايكل" className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">آي ريسايكل</span>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteAccept;
