import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  FileText, 
  Shield, 
  Scale, 
  Leaf, 
  Lock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  transporterTermsSections, 
  legalReferences,
  CURRENT_TERMS_VERSION 
} from '@/data/transporterTermsContent';

interface TransporterTermsDialogProps {
  open: boolean;
  onAccept: () => void;
}

const TransporterTermsDialog = ({ open, onAccept }: TransporterTermsDialogProps) => {
  const { user, profile, organization } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAcceptTerms = async () => {
    if (!agreed) {
      toast.error('يجب الموافقة على الشروط والأحكام للمتابعة');
      return;
    }

    if (!user || !profile || !organization) {
      toast.error('حدث خطأ في بيانات المستخدم');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('terms_acceptances')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          organization_type: organization.organization_type,
          organization_name: organization.name,
          full_name: profile.full_name,
          terms_version: CURRENT_TERMS_VERSION,
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      toast.success('تم تسجيل موافقتك على الشروط والأحكام بنجاح');
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast.error('حدث خطأ أثناء تسجيل الموافقة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <DialogHeader>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Shield className="w-8 h-8" />
              <DialogTitle className="text-2xl font-bold">
                آي ريسايكل
              </DialogTitle>
            </div>
            <DialogDescription className="text-primary-foreground/90 text-center text-lg">
              الشروط والأحكام للجهات الناقلة للمخلفات
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Scale className="w-3 h-3" />
              قانون 202 لسنة 2020
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Leaf className="w-3 h-3" />
              قانون البيئة رقم 4 لسنة 1994
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" />
              الإصدار {CURRENT_TERMS_VERSION}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[50vh] px-6">
          <div className="py-4 space-y-6" dir="rtl">
            {/* Important Notice */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    تنبيه هام
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    بالموافقة على هذه الشروط، فإنك تقر بالتزامك الكامل بالقوانين واللوائح البيئية المصرية 
                    وتتحمل المسؤولية القانونية الكاملة عن عمليات نقل المخلفات.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Terms Sections */}
            {transporterTermsSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-3"
              >
                <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {section.title}
                </h3>
                <div className="space-y-2 pr-6">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="text-sm text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {index < transporterTermsSections.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </motion.div>
            ))}

            {/* Legal References */}
            <div className="bg-muted/50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                المراجع القانونية
              </h4>
              <ul className="space-y-1">
                {legalReferences.map((ref, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {ref}
                  </li>
                ))}
              </ul>
            </div>

            {/* User Info */}
            {organization && profile && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-center">معلومات الموافقة</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">اسم الشركة:</span>
                    <p className="font-medium">{organization.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">الاسم الكامل:</span>
                    <p className="font-medium">{profile.full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">نوع الجهة:</span>
                    <p className="font-medium">جهة ناقلة</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">تاريخ الموافقة:</span>
                    <p className="font-medium">{new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms-agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1"
            />
            <label 
              htmlFor="terms-agree" 
              className="text-sm cursor-pointer leading-relaxed"
            >
              أقر بأنني قرأت وفهمت جميع الشروط والأحكام الواردة أعلاه، وأوافق على الالتزام بها التزاماً كاملاً، 
              وأتحمل كامل المسؤولية القانونية عن أي مخالفة. كما أوافق على إعفاء منصة آي ريسايكل من أي مسؤولية 
              قانونية أو مالية ناتجة عن عملياتي.
            </label>
          </div>

          <Button
            onClick={handleAcceptTerms}
            disabled={!agreed || submitting}
            className="w-full gap-2"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التسجيل...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                الموافقة على الشروط والأحكام
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            هذه الموافقة ملزمة قانونياً وتعتبر بمثابة عقد إلكتروني موقع وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransporterTermsDialog;
