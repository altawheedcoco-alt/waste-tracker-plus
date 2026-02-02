import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Calendar, User, Globe, CheckCircle2, Printer, Download, ExternalLink } from 'lucide-react';
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
  const { organization } = useAuth();
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
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              تم الموافقة على الشروط
            </Badge>
            <Badge variant="outline">
              الإصدار {termsAcceptance.terms_version}
            </Badge>
          </div>

          {/* Acceptance Details */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">الموقّع</p>
                <p className="font-medium">{termsAcceptance.full_name || 'غير محدد'}</p>
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

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">معرّف الوثيقة</p>
                <p className="font-medium font-mono text-xs">
                  {termsAcceptance.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </motion.div>

          {/* View Full Document Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={() => setShowTermsDialog(true)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              عرض وثيقة الموافقة الكاملة
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              يمكنك طباعة أو تحميل الوثيقة كملف PDF من نافذة العرض
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
        }}
      />
    </>
  );
};

export default OrganizationTermsSettings;
