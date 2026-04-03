import { useState, useMemo } from 'react';
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
  FileText, Shield, Scale, CheckCircle, AlertTriangle, Loader2,
  Factory, Truck, Recycle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getTermsSections, getTermsTitle, getOrganizationTypeLabel,
  getAgreementText, legalReferences, CURRENT_TERMS_VERSION, OrganizationType
} from '@/data/organizationTermsContent';
import { useTermsContent } from '@/hooks/useTermsContent';

interface OrganizationTermsDialogProps {
  open: boolean;
  onAccept: () => void;
  organizationType: OrganizationType;
}

const OrganizationTermsDialog = ({ open, onAccept, organizationType }: OrganizationTermsDialogProps) => {
  const { user, profile, organization } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { data: dbTermsContent } = useTermsContent(organizationType);

  const termsSections = useMemo(() => {
    if (dbTermsContent?.sections?.length) return dbTermsContent.sections;
    return getTermsSections(organizationType);
  }, [dbTermsContent, organizationType]);

  const currentTermsVersion = dbTermsContent?.version || CURRENT_TERMS_VERSION;
  const termsTitle = getTermsTitle(organizationType);
  const agreementText = getAgreementText(organizationType);

  const getOrgIcon = () => {
    switch (organizationType) {
      case 'generator': return <Factory className="w-6 h-6" />;
      case 'transporter': return <Truck className="w-6 h-6" />;
      case 'recycler': return <Recycle className="w-6 h-6" />;
      default: return <Shield className="w-6 h-6" />;
    }
  };

  const getOrgColor = () => {
    switch (organizationType) {
      case 'generator': return 'from-blue-600 to-indigo-700';
      case 'transporter': return 'from-amber-600 to-orange-700';
      case 'recycler': return 'from-emerald-600 to-green-700';
      default: return 'from-primary to-primary/80';
    }
  };

  const getWarningText = () => {
    switch (organizationType) {
      case 'generator': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن تصنيف وتخزين المخلفات.';
      case 'transporter': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات نقل المخلفات.';
      case 'recycler': return 'بالموافقة، تقر بالتزامك بالقوانين البيئية المصرية وتتحمل المسؤولية عن عمليات التدوير والمعالجة.';
      default: return 'بالموافقة، تقر بالتزامك الكامل بالقوانين البيئية المصرية.';
    }
  };

  const handleAcceptTerms = async () => {
    if (!agreed) { toast.error('يجب الموافقة على الشروط والأحكام للمتابعة'); return; }
    if (!user || !profile || !organization) { toast.error('حدث خطأ في بيانات المستخدم'); return; }

    setSubmitting(true);

    try {
      // Fetch user's IP address
      let userIpAddress: string | null = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        userIpAddress = ipData.ip || null;
      } catch { /* ignore */ }

      const { error } = await supabase.from('terms_acceptances').insert({
        user_id: user.id, 
        organization_id: organization.id, 
        organization_type: organization.organization_type,
        organization_name: organization.name, 
        full_name: profile.full_name, 
        terms_version: currentTermsVersion,
        user_agent: navigator.userAgent,
        ip_address: userIpAddress,
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
        className="max-w-3xl max-h-[92vh] p-0 overflow-hidden border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-l ${getOrgColor()} text-white px-6 py-5 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {getOrgIcon()}
              </div>
              <DialogTitle className="text-xl font-bold">آي ريسايكل</DialogTitle>
            </div>
            <DialogDescription className="text-white/90 text-center text-sm">
              {termsTitle}
            </DialogDescription>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-white/20 text-white border-0 text-xs">
                {getOrganizationTypeLabel(organizationType)}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">
                الإصدار {currentTermsVersion}
              </Badge>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <ScrollArea className="h-[50vh] px-6">
          <div className="py-5 space-y-5" dir="rtl">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed pt-1">
                {getWarningText()}
              </p>
            </div>

            <div className="space-y-4">
              {termsSections.map((section, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="group">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                  </div>
                  <div className="space-y-1.5 pr-8">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-xs text-muted-foreground leading-relaxed">{paragraph}</p>
                    ))}
                  </div>
                  {index < termsSections.length - 1 && <Separator className="mt-4" />}
                </motion.div>
              ))}
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <Scale className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">المراجع القانونية</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {legalReferences.map((ref, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{ref}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Organization & User Info */}
            {organization && profile && (
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <h4 className="font-semibold text-xs text-center mb-3 flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  بيانات الموافقة
                </h4>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">الشركة / الجهة</p>
                    <p className="text-xs font-semibold truncate">{organization.name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">الاسم</p>
                    <p className="text-xs font-semibold truncate">{profile.full_name}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">البريد الإلكتروني</p>
                    <p className="text-xs font-semibold truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground">التاريخ</p>
                    <p className="text-xs font-semibold">{new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with checkbox and button */}
        <div className="border-t bg-muted/20 px-6 py-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <Checkbox id="terms-agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} className="mt-0.5" />
            <label htmlFor="terms-agree" className="text-[11px] cursor-pointer leading-relaxed text-muted-foreground">
              {agreementText}
            </label>
          </div>

          <Button onClick={handleAcceptTerms}
            disabled={!agreed || submitting}
            className={`w-full gap-2 h-11 text-sm font-semibold bg-gradient-to-l ${getOrgColor()} hover:opacity-90`}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> جاري التسجيل...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> الموافقة والمتابعة</>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground">
            موافقة ملزمة قانونياً وفقاً لقانون التوقيع الإلكتروني رقم 15 لسنة 2004
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationTermsDialog;
