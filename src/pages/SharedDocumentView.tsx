import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Download,
  Building2,
  Calendar,
  Shield,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Tag,
} from 'lucide-react';

const DOCUMENT_CATEGORIES: Record<string, string> = {
  file: 'مستند عام',
  receipt: 'شهادة استلام',
  certificate: 'شهادة تدوير',
  invoice: 'فاتورة',
  shipment: 'شحنة',
  contract: 'عقد',
  report: 'تقرير',
  weight_ticket: 'تذكرة وزن',
  license: 'ترخيص',
  correspondence: 'مراسلة',
  other: 'أخرى',
};

const SharedDocumentView = () => {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<any>(null);
  const [senderOrg, setSenderOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) fetchDocument();
  }, [token]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('shared_documents')
        .select('*')
        .eq('public_access_token', token)
        .eq('is_external_share', true)
        .single();

      if (fetchErr || !data) {
        setError('المستند غير موجود أو انتهت صلاحية الرابط');
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('انتهت صلاحية هذا الرابط');
        return;
      }

      setDoc(data);

      // Increment view count
      await supabase
        .from('shared_documents')
        .update({ external_views_count: (data.external_views_count || 0) + 1 })
        .eq('id', data.id);

      // Fetch sender org name
      const { data: org } = await supabase
        .from('organizations')
        .select('name, logo_url')
        .eq('id', data.sender_organization_id)
        .single();

      setSenderOrg(org);
    } catch (e) {
      setError('حدث خطأ في تحميل المستند');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <AlertTriangle className="w-14 h-14 text-destructive" />
            <p className="text-lg font-semibold text-center">{error}</p>
            <p className="text-sm text-muted-foreground text-center">
              تأكد من صحة الرابط أو تواصل مع الجهة المرسلة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader className="text-center pb-2">
          {senderOrg?.logo_url && (
            <img
              src={senderOrg.logo_url}
              alt="logo"
              className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-primary/20"
            />
          )}
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            مستند مشترك
          </CardTitle>
          {senderOrg && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Building2 className="w-3.5 h-3.5" />
              مشارك من: {senderOrg.name}
            </p>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{doc.document_title}</h3>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Tag className="w-3 h-3" />
                {DOCUMENT_CATEGORIES[doc.document_type] || doc.document_type}
              </Badge>
            </div>

            {doc.document_description && (
              <p className="text-sm text-muted-foreground">{doc.document_description}</p>
            )}

            {doc.message && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm">{doc.message}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(doc.created_at), 'dd MMMM yyyy', { locale: ar })}
              </span>
              {doc.file_name && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {doc.file_name}
                </span>
              )}
            </div>
          </div>

          {/* Signature info */}
          {doc.signed_at && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">
                  موقّع إلكترونياً بواسطة: {doc.signer_name}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {format(new Date(doc.signed_at), 'dd/MM/yyyy hh:mm a')}
                </p>
              </div>
            </div>
          )}

          {/* Download button */}
          {doc.file_url && (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={() => window.open(doc.file_url, '_blank')}
            >
              <Download className="w-5 h-5" />
              تحميل الملف
            </Button>
          )}

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-muted-foreground">
              تم مشاركة هذا المستند عبر منصة I RECYCLE
            </p>
            {doc.expires_at && (
              <p className="text-[10px] text-muted-foreground mt-1">
                ينتهي الرابط: {format(new Date(doc.expires_at), 'dd/MM/yyyy')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedDocumentView;
