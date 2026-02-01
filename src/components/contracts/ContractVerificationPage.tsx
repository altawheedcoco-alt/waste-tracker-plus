import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  Calendar,
  Hash
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import logoImage from '@/assets/logo.png';

interface VerificationResult {
  isValid: boolean;
  contract?: {
    id: string;
    title: string;
    contract_number: string;
    verification_code: string;
    status: string;
    start_date: string;
    end_date: string;
    organization_name: string;
    partner_name: string;
    waste_type: string;
    created_at: string;
  };
  error?: string;
}

const ContractVerificationPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('يرجى إدخال رمز التحقق');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // البحث عن العقد برمز التحقق
      const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
          id,
          title,
          contract_number,
          verification_code,
          status,
          start_date,
          end_date,
          waste_type,
          created_at,
          organizations!contracts_organization_id_fkey(name),
          partner_organizations:organizations!contracts_partner_organization_id_fkey(name)
        `)
        .eq('verification_code', verificationCode.trim().toUpperCase())
        .single();

      if (error || !contract) {
        // تسجيل محاولة التحقق الفاشلة
        await supabase.from('contract_verifications').insert({
          contract_id: '00000000-0000-0000-0000-000000000000', // placeholder
          verification_code: verificationCode,
          verification_result: false,
        });

        setResult({
          isValid: false,
          error: 'رمز التحقق غير صحيح أو العقد غير موجود'
        });
        return;
      }

      // تسجيل محاولة التحقق الناجحة
      await supabase.from('contract_verifications').insert({
        contract_id: contract.id,
        verification_code: verificationCode,
        verification_result: true,
      });

      setResult({
        isValid: true,
        contract: {
          id: contract.id,
          title: contract.title,
          contract_number: contract.contract_number,
          verification_code: contract.verification_code || '',
          status: contract.status,
          start_date: contract.start_date || '',
          end_date: contract.end_date || '',
          organization_name: (contract.organizations as any)?.name || '',
          partner_name: (contract.partner_organizations as any)?.name || '',
          waste_type: contract.waste_type || '',
          created_at: contract.created_at,
        }
      });

      toast.success('تم التحقق من صحة العقد بنجاح');
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        isValid: false,
        error: 'حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'active': { label: 'ساري', variant: 'default' },
      'draft': { label: 'مسودة', variant: 'secondary' },
      'expired': { label: 'منتهي', variant: 'destructive' },
      'pending': { label: 'قيد المراجعة', variant: 'outline' },
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <img src={logoImage} alt="Logo" className="h-16 mx-auto" />
          <h1 className="text-3xl font-bold">التحقق من صحة العقود</h1>
          <p className="text-muted-foreground">
            أدخل رمز التحقق للتأكد من صحة العقد وعدم التلاعب به
          </p>
        </motion.div>

        {/* Verification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                خانة التحقق
              </CardTitle>
              <CardDescription>
                أدخل رمز التحقق المكون من الحروف والأرقام الموجود على العقد
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="مثال: EG-WMRA-XXXXX-XXXXXX-XX"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  className="text-center font-mono text-lg tracking-wider"
                  dir="ltr"
                />
                <Button onClick={handleVerify} disabled={loading} className="gap-2 min-w-[120px]">
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  تحقق
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">ملاحظة:</p>
                <p>رمز التحقق يبدأ بـ EG-WMRA ويتكون من أحرف وأرقام مفصولة بشرطات.</p>
                <p>يمكنك إيجاد الرمز في أعلى العقد بجوار الباركود أو رمز QR.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {result.isValid && result.contract ? (
              <Card className="border-2 border-primary/50 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-primary">العقد صحيح وموثق</CardTitle>
                      <CardDescription>
                        تم التحقق من صحة العقد بنجاح - هذا العقد أصلي وغير معدل
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">عنوان العقد</p>
                        <p className="font-medium">{result.contract.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">رقم العقد</p>
                        <p className="font-medium font-mono">{result.contract.contract_number}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">الطرف الأول</p>
                        <p className="font-medium">{result.contract.organization_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">الطرف الثاني</p>
                        <p className="font-medium">{result.contract.partner_name || '-'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">فترة العقد</p>
                        <p className="font-medium">
                          {result.contract.start_date && result.contract.end_date
                            ? `${format(new Date(result.contract.start_date), 'dd/MM/yyyy')} - ${format(new Date(result.contract.end_date), 'dd/MM/yyyy')}`
                            : '-'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">حالة العقد</p>
                        <Badge variant={getStatusLabel(result.contract.status).variant}>
                          {getStatusLabel(result.contract.status).label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {result.contract.waste_type && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">نوع المخلفات:</span>
                        <Badge variant="outline">{result.contract.waste_type}</Badge>
                      </div>
                    </>
                  )}
                  
                  <div className="bg-primary/10 rounded-lg p-3 text-sm">
                    <p className="flex items-center gap-2 text-primary font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      تم توليد هذا العقد وتوثيقه إلكترونياً عبر منصة إدارة المخلفات
                    </p>
                    <p className="text-muted-foreground mt-1">
                      تاريخ الإصدار: {format(new Date(result.contract.created_at), 'dd MMMM yyyy', { locale: ar })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-destructive/10">
                      <XCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-destructive">فشل التحقق</CardTitle>
                      <CardDescription>
                        {result.error}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-destructive/10 rounded-lg p-3 text-sm">
                    <p className="font-medium text-destructive mb-2">
                      <ShieldAlert className="w-4 h-4 inline ml-1" />
                      تحذير!
                    </p>
                    <p className="text-muted-foreground">
                      إذا حصلت على هذا العقد من جهة ما وظهرت هذه الرسالة، فقد يكون العقد مزوراً أو معدلاً. 
                      يرجى التواصل مع الجهة المصدرة للتأكد من صحته.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>منظومة التحقق الإلكتروني من العقود</p>
          <p>طبقاً لقانون إدارة المخلفات رقم 202 لسنة 2020</p>
        </div>
      </div>
    </div>
  );
};

export default ContractVerificationPage;
