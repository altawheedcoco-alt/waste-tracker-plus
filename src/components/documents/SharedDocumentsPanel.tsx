import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Inbox,
  Send,
  FileText,
  Download,
  Eye,
  Building2,
  Calendar,
  Loader2,
  MessageSquare,
  Share2,
  FileSignature,
  Stamp,
  CheckCircle2,
  PenTool,
  Shield,
} from 'lucide-react';
import ShareDocumentDialog from './ShareDocumentDialog';
import SignDocumentButton from '@/components/signature/SignDocumentButton';
import { type BiometricSignatureData } from '@/components/signature/BiometricSignaturePad';

const SharedDocumentsPanel = () => {
  const { profile, organization } = useAuth();
  const [received, setReceived] = useState<any[]>([]);
  const [sentDocs, setSentDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (profile?.organization_id) {
      fetchDocuments();
    }
  }, [profile?.organization_id]);

  const fetchDocuments = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const { data: recv } = await supabase
        .from('shared_documents')
        .select('*')
        .eq('recipient_organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: sent } = await supabase
        .from('shared_documents')
        .select('*')
        .eq('sender_organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(50);

      const allOrgIds = new Set<string>();
      recv?.forEach(d => allOrgIds.add(d.sender_organization_id));
      sent?.forEach(d => allOrgIds.add(d.recipient_organization_id));

      let orgMap: Record<string, string> = {};
      if (allOrgIds.size > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', Array.from(allOrgIds));
        orgs?.forEach(o => { orgMap[o.id] = o.name; });
      }

      setReceived((recv || []).map(d => ({ ...d, _orgName: orgMap[d.sender_organization_id] || 'جهة غير معروفة' })));
      setSentDocs((sent || []).map(d => ({ ...d, _orgName: orgMap[d.recipient_organization_id] || 'جهة غير معروفة' })));
    } catch (e) {
      console.error('Error fetching shared docs:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (docId: string) => {
    await supabase
      .from('shared_documents')
      .update({ status: 'viewed', viewed_at: new Date().toISOString(), viewed_by: profile?.user_id })
      .eq('id', docId);
    fetchDocuments();
  };

  const handleDocumentSigned = async (docId: string, signatureData: BiometricSignatureData) => {
    try {
      const stampUrl = (organization as any)?.stamp_url || null;

      // Generate integrity hash
      const hashInput = `${docId}-${profile?.user_id}-${new Date().toISOString()}-signed`;
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        const char = hashInput.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const integrityHash = `SIG-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;

      await supabase
        .from('shared_documents')
        .update({
          signed_at: new Date().toISOString(),
          signed_by: profile?.user_id,
          signer_name: profile?.full_name || '',
          signature_url: signatureData.signatureDataUrl || null,
          stamp_url: stampUrl,
          stamp_applied: !!stampUrl,
          signature_integrity_hash: integrityHash,
          status: 'signed',
        })
        .eq('id', docId);

      // Notify sender
      const doc = received.find(d => d.id === docId);
      if (doc) {
        const { data: senderUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', doc.sender_organization_id)
          .limit(20);

        if (senderUsers?.length) {
          const notifications = senderUsers.map((u: any) => ({
            user_id: u.user_id,
            title: 'تم توقيع المستند',
            message: `تم توقيع وختم "${doc.document_title}" من قبل ${profile?.full_name || 'جهة'}`,
            type: 'document_signed',
            is_read: false,
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      toast.success('تم توقيع وختم المستند بنجاح');
      fetchDocuments();
    } catch (e) {
      console.error('Error signing document:', e);
      toast.error('فشل في توقيع المستند');
    }
  };

  const getDocTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      file: 'ملف', receipt: 'شهادة استلام', certificate: 'شهادة تدوير',
      invoice: 'فاتورة', shipment: 'شحنة', contract: 'عقد', report: 'تقرير',
    };
    return map[type] || type;
  };

  const getStatusBadge = (doc: any) => {
    if (doc.signed_at) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 text-xs gap-1">
          <CheckCircle2 className="w-3 h-3" />
          موقّع ومختوم
        </Badge>
      );
    }
    switch (doc.status) {
      case 'sent':
        return <Badge variant="outline" className="text-xs">مُرسل</Badge>;
      case 'viewed':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">تمت المشاهدة</Badge>;
      case 'downloaded':
        return <Badge className="bg-accent/20 text-accent-foreground text-xs">تم التحميل</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{doc.status}</Badge>;
    }
  };

  const DocumentRow = ({ doc, isSent }: { doc: any; isSent: boolean }) => (
    <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{doc.document_title}</p>
            {getStatusBadge(doc)}
            <Badge variant="secondary" className="text-[10px]">{getDocTypeLabel(doc.document_type)}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {isSent ? `إلى: ${doc._orgName}` : `من: ${doc._orgName}`}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(doc.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}
            </span>
          </div>
          {doc.message && (
            <p className="text-xs text-muted-foreground flex items-start gap-1 mt-1">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
              {doc.message}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {doc.file_url && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => {
                      window.open(doc.file_url, '_blank');
                      if (!isSent) {
                        await supabase
                          .from('shared_documents')
                          .update({ status: 'downloaded' })
                          .eq('id', doc.id);
                        fetchDocuments();
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>تحميل الملف</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isSent && doc.status === 'sent' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsViewed(doc.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>تأكيد المشاهدة</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Signature/Stamp section */}
      {doc.signed_at ? (
        <div className="flex items-center gap-3 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-4 h-4 text-emerald-600" />
            <div className="text-xs">
              <span className="font-medium text-emerald-800 dark:text-emerald-300">
                موقّع بواسطة: {doc.signer_name}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 mr-2">
                — {format(new Date(doc.signed_at), 'dd/MM/yyyy hh:mm a')}
              </span>
            </div>
          </div>
          {doc.stamp_applied && (
            <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300">
              <Stamp className="w-3 h-3" />
              مختوم
            </Badge>
          )}
          {doc.signature_integrity_hash && (
            <span className="text-[9px] text-emerald-500 font-mono">
              {doc.signature_integrity_hash}
            </span>
          )}
        </div>
      ) : !isSent && (doc.requires_signature || true) ? (
        <div className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <PenTool className="w-4 h-4" />
            <span>{doc.requires_signature ? 'هذا المستند يتطلب توقيعك' : 'يمكنك توقيع وختم هذا المستند'}</span>
          </div>
          <SignDocumentButton
            documentType={doc.reference_type || 'contract'}
            documentId={doc.id}
            documentTitle={doc.document_title}
            onSigned={(data) => handleDocumentSigned(doc.id, data)}
            variant="outline"
            size="sm"
          >
            <FileSignature className="w-4 h-4" />
            توقيع وختم
          </SignDocumentButton>
        </div>
      ) : isSent && doc.requires_signature && !doc.signed_at ? (
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <FileSignature className="w-4 h-4" />
          بانتظار توقيع الجهة المستلمة
        </div>
      ) : null}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="w-5 h-5 text-primary" />
            المستندات المشتركة
          </CardTitle>
          <Button size="sm" className="gap-2" onClick={() => setShareOpen(true)}>
            <Send className="w-4 h-4" />
            مشاركة مستند
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received" dir="rtl">
          <TabsList className="w-full">
            <TabsTrigger value="received" className="flex-1 gap-1">
              <Inbox className="w-4 h-4" />
              الوارد ({received.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex-1 gap-1">
              <Send className="w-4 h-4" />
              المُرسل ({sentDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            <ScrollArea className="max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : received.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد مستندات واردة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {received.map(doc => (
                    <DocumentRow key={doc.id} doc={doc} isSent={false} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sent">
            <ScrollArea className="max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : sentDocs.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Send className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لم ترسل أي مستندات بعد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sentDocs.map(doc => (
                    <DocumentRow key={doc.id} doc={doc} isSent={true} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      <ShareDocumentDialog open={shareOpen} onOpenChange={setShareOpen} />
    </Card>
  );
};

export default SharedDocumentsPanel;
