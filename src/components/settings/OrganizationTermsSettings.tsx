import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  User, 
  Globe, 
  CheckCircle2, 
  ExternalLink, 
  CreditCard, 
  Phone, 
  Briefcase,
  Shield,
  Image,
  Users,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import TermsDocumentDialog from '@/components/terms/TermsDocumentDialog';

const OrganizationTermsSettings = () => {
  const { organization, roles } = useAuth();
  const navigate = useNavigate();
  const isAdmin = roles.includes('admin');
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  // Fetch terms acceptance for current organization
  const { data: termsAcceptance, isLoading } = useQuery({
    queryKey: ['org-terms-acceptance-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data, error } = await supabase
        .from('terms_acceptances')
        .select('*')
        .eq('organization_id', organization.id)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Admin section - always show for admins
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Admin Card - View All Acceptances */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              إدارة جميع موافقات الشروط والأحكام
            </CardTitle>
            <CardDescription>
              كمدير للنظام، يمكنك عرض جميع موافقات الشروط والأحكام لجميع الجهات المسجلة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-right">
                <p className="font-medium">جميع موافقات الجهات</p>
                <p className="text-sm text-muted-foreground">
                  عرض وإدارة موافقات الشروط والأحكام لجميع الجهات المولدة والناقلة والمدورة
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard/terms-acceptances')}
              className="w-full gap-2"
              size="lg"
            >
              <FileText className="h-5 w-5" />
              عرض جميع الموافقات
              <ArrowLeft className="h-4 w-4 mr-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Current organization acceptance if exists */}
        {termsAcceptance && organization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                موافقة منظمتك الحالية
              </CardTitle>
              <CardDescription>
                وثيقة الموافقة الخاصة بـ {organization.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  تم الموافقة
                </Badge>
                <Badge variant="outline">
                  الإصدار {termsAcceptance.terms_version}
                </Badge>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowTermsDialog(true)}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                عرض الوثيقة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!termsAcceptance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            الشروط والأحكام
          </CardTitle>
          <CardDescription>
            لم يتم العثور على سجل موافقة على الشروط والأحكام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد بيانات موافقة مسجلة لهذه المنظمة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const acceptedDate = new Date(termsAcceptance.accepted_at);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            الشروط والأحكام
          </CardTitle>
          <CardDescription>
            عرض وثيقة الموافقة على الشروط والأحكام الخاصة بمنظمتك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              تم الموافقة على الشروط
            </Badge>
            <Badge variant="outline">
              الإصدار {termsAcceptance.terms_version}
            </Badge>
            {termsAcceptance.verified_match && (
              <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
                <Shield className="h-3.5 w-3.5" />
                تم التحقق من الهوية
              </Badge>
            )}
          </div>

          {/* Signer Details */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">الموقّع</p>
                <p className="font-medium">{termsAcceptance.full_name || 'غير محدد'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <CreditCard className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">الرقم القومي</p>
                <p className="font-medium font-mono text-sm">
                  {termsAcceptance.signer_national_id || 'غير محدد'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <Briefcase className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">المسمى الوظيفي</p>
                <p className="font-medium">
                  {termsAcceptance.signer_position || 'غير محدد'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                <p className="font-medium">
                  {termsAcceptance.signer_phone || 'غير محدد'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">تاريخ الموافقة</p>
                <p className="font-medium">
                  {format(acceptedDate, 'dd MMMM yyyy', { locale: ar })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(acceptedDate, 'hh:mm a', { locale: ar })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <Globe className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">عنوان IP</p>
                <p className="font-medium font-mono text-sm">
                  {termsAcceptance.ip_address || 'غير متاح'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ID Card Images */}
          {(termsAcceptance.signer_id_front_url || termsAcceptance.signer_id_back_url) && (
            <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Image className="h-4 w-4" />
                صور إثبات الهوية
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {termsAcceptance.signer_id_front_url && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">وجه البطاقة</p>
                    <img 
                      src={termsAcceptance.signer_id_front_url} 
                      alt="وجه البطاقة" 
                      className="max-h-32 mx-auto rounded-lg border shadow-sm"
                    />
                  </div>
                )}
                {termsAcceptance.signer_id_back_url && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">ظهر البطاقة</p>
                    <img 
                      src={termsAcceptance.signer_id_back_url} 
                      alt="ظهر البطاقة" 
                      className="max-h-32 mx-auto rounded-lg border shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Document ID */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">معرّف الوثيقة</p>
              <p className="font-medium font-mono text-sm">
                EG-I-RECYCLE-TA-{termsAcceptance.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* View Full Document & Download PDF */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowTermsDialog(true)}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                عرض وثيقة الهوية والشروط
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              مستند PDF يتضمن: بيانات الموقّع — صور إثبات الهوية — الشروط والأحكام — التوقيع الإلكتروني
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms Document Dialog */}
      <TermsDocumentDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        acceptance={{
          id: termsAcceptance.id,
          full_name: termsAcceptance.full_name,
          organization_name: organization?.name || '',
          organization_type: organization?.organization_type || 'guest',
          terms_version: termsAcceptance.terms_version,
          accepted_at: termsAcceptance.accepted_at,
          ip_address: termsAcceptance.ip_address,
          signer_national_id: termsAcceptance.signer_national_id,
          signer_phone: termsAcceptance.signer_phone,
          signer_position: termsAcceptance.signer_position,
          signer_id_front_url: termsAcceptance.signer_id_front_url,
          signer_id_back_url: termsAcceptance.signer_id_back_url,
          signer_signature_url: termsAcceptance.signer_signature_url,
          verified_match: termsAcceptance.verified_match,
        }}
      />
    </>
  );
};

export default OrganizationTermsSettings;
