import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/ui/back-button';
import { useSigningInbox, SigningRequest } from '@/hooks/useSigningInbox';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Send, Inbox, FileSignature, Clock, CheckCircle2, XCircle, Eye,
  Loader2, AlertTriangle, Stamp, ArrowLeft, Building2, User, Calendar,
  FileText, ExternalLink, PenTool, FolderOpen, Upload, Paperclip, X,
  Truck, Receipt, Link2, ArrowUpRight, GitBranch, BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import UniversalSignatureDialog from '@/components/signatures/UniversalSignatureDialog';
import { saveDocumentSignature } from '@/components/signatures/signatureService';
import type { SignatureData } from '@/components/signatures/UniversalSignatureDialog';
import { withTagline } from '@/utils/platformTaglines';
import SignatureBadges from '@/components/signatures/SignatureBadges';
import PlatformDocumentPicker, { type PlatformDocument } from '@/components/signing/PlatformDocumentPicker';
import { useSigningChains } from '@/hooks/useSigningChains';
import SigningChainCard from '@/components/signing/SigningChainCard';
import CreateSigningChainDialog from '@/components/signing/CreateSigningChainDialog';
import DocumentJourneyTimeline from '@/components/signing/DocumentJourneyTimeline';
import { logJourneyEvent } from '@/hooks/useDocumentJourney';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'في الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  viewed: { label: 'تمت المشاهدة', icon: Eye, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  signed: { label: 'تم التوقيع', icon: CheckCircle2, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  expired: { label: 'منتهي الصلاحية', icon: AlertTriangle, color: 'bg-muted text-muted-foreground' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'bg-muted text-muted-foreground' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'عادي', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'عاجل', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'طارئ', color: 'bg-red-100 text-red-800' },
};

function SignedDocumentView({ request }: { request: SigningRequest }) {
  const { data: signatures, isLoading } = useQuery({
    queryKey: ['signing-request-signatures', request.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('document_id', request.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: request.status === 'signed',
  });

  if (request.status !== 'signed' || isLoading || !signatures?.length) return null;

  return (
    <div className="mt-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-green-800 dark:text-green-300">
        <CheckCircle2 className="w-4 h-4" />
        <span>تم التوقيع والختم</span>
      </div>
      <SignatureBadges signatures={signatures as any} compact />
    </div>
  );
}

/** Fetch linked shipment info for a signing request */
function LinkedShipmentBadge({ shipmentId }: { shipmentId: string }) {
  const navigate = useNavigate();
  const { data: shipment } = useQuery({
    queryKey: ['linked-shipment', shipmentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('shipments')
        .select('id, shipment_number, status, waste_type, pickup_city, delivery_city, quantity, unit')
        .eq('id', shipmentId)
        .single();
      return data;
    },
    enabled: !!shipmentId,
    staleTime: 5 * 60 * 1000,
  });

  if (!shipment) return null;

  return (
    <button
      onClick={() => navigate(`/dashboard/shipments/${shipment.id}`)}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors text-xs"
    >
      <Truck className="w-3 h-3 text-primary" />
      <span className="font-medium">{shipment.shipment_number}</span>
      <span className="text-muted-foreground">
        {shipment.waste_type} • {shipment.quantity} {shipment.unit}
      </span>
      {shipment.pickup_city && shipment.delivery_city && (
        <span className="text-muted-foreground">({shipment.pickup_city} → {shipment.delivery_city})</span>
      )}
      <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
    </button>
  );
}

/** Fetch linked document info for a signing request */
function LinkedDocumentBadge({ documentId, documentType }: { documentId: string; documentType: string }) {
  const navigate = useNavigate();
  
  // Try entity_documents first
  const { data: doc } = useQuery({
    queryKey: ['linked-doc', documentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('entity_documents')
        .select('id, title, file_name, document_type, file_url')
        .eq('id', documentId)
        .single();
      return data;
    },
    enabled: !!documentId && !['shipment', 'invoice'].includes(documentType),
    staleTime: 5 * 60 * 1000,
  });

  if (!doc) return null;

  return (
    <button
      onClick={() => doc.file_url ? window.open(doc.file_url, '_blank') : navigate('/dashboard/document-archive')}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 border transition-colors text-xs"
    >
      <FileText className="w-3 h-3 text-primary" />
      <span className="font-medium truncate max-w-[200px]">{doc.title || doc.file_name}</span>
      <Badge variant="secondary" className="text-[9px] px-1">{doc.document_type}</Badge>
      <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
    </button>
  );
}

function RequestCard({ request, type, onSign, onReject, onView }: {
  request: SigningRequest;
  type: 'incoming' | 'outgoing';
  onSign: (req: SigningRequest) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
}) {
  const sc = statusConfig[request.status] || statusConfig.pending;
  const pc = priorityConfig[request.priority] || priorityConfig.normal;
  const StatusIcon = sc.icon;

  return (
    <Card className="hover:shadow-md transition-shadow border-r-4" style={{
      borderRightColor: request.priority === 'urgent' ? 'hsl(var(--destructive))' :
        request.priority === 'high' ? 'hsl(var(--warning, 38 92% 50%))' : 'transparent'
    }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2 flex-shrink-0">
            {type === 'incoming' && (request.status === 'pending' || request.status === 'viewed') && (
              <>
                <Button size="sm" onClick={() => onSign(request)} className="gap-1">
                  <PenTool className="w-3 h-3" /> وقّع وأختم
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(request.id)} className="gap-1 text-destructive">
                  <XCircle className="w-3 h-3" /> ارفض
                </Button>
              </>
            )}
            {request.document_url && (
              <Button size="sm" variant="ghost" onClick={() => window.open(request.document_url!, '_blank')} className="gap-1">
                <FileText className="w-3 h-3" /> عرض المستند
              </Button>
            )}
          </div>

          <div className="flex-1 text-right space-y-2">
            <div className="flex items-center gap-2 justify-end flex-wrap">
              <Badge className={pc.color} variant="secondary">{pc.label}</Badge>
              <Badge className={sc.color} variant="secondary">
                <StatusIcon className="w-3 h-3 ml-1" />
                {sc.label}
              </Badge>
              {request.requires_stamp && (
                <Badge variant="outline" className="gap-1"><Stamp className="w-3 h-3" /> يتطلب ختم</Badge>
              )}
              <h3 className="font-semibold text-base">{request.document_title}</h3>
            </div>

            {request.document_description && (
              <p className="text-sm text-muted-foreground">{request.document_description}</p>
            )}

            {request.message && (
              <div className="bg-muted/50 rounded-lg p-2 text-sm">
                <span className="text-muted-foreground">💬 </span>{request.message}
              </div>
            )}

            {/* Linked resources */}
            <div className="flex flex-wrap gap-2 justify-end">
              {request.related_shipment_id && (
                <LinkedShipmentBadge shipmentId={request.related_shipment_id} />
              )}
              {request.document_id && request.document_type && (
                <LinkedDocumentBadge documentId={request.document_id} documentType={request.document_type} />
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground justify-end flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {type === 'incoming' ? `من: ${request.sender_org?.name || '—'}` : `إلى: ${request.recipient_org?.name || '—'}`}
              </span>
              {request.sender_profile && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {request.sender_profile.full_name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(request.created_at), 'dd MMM yyyy - hh:mm a', { locale: ar })}
              </span>
              {request.deadline && (
                <span className="flex items-center gap-1 text-destructive">
                  <Clock className="w-3 h-3" />
                  موعد نهائي: {format(new Date(request.deadline), 'dd MMM yyyy', { locale: ar })}
                </span>
              )}
            </div>

            {/* Show signatures if signed */}
            <SignedDocumentView request={request} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SigningInbox() {
  const { incoming, outgoing, isLoading, sendRequest, updateStatus } = useSigningInbox();
  const { chains, isLoading: chainsLoading, signStep } = useSigningChains();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [signingRequest, setSigningRequest] = useState<SigningRequest | null>(null);
  const [signLoading, setSignLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPlatformDoc, setSelectedPlatformDoc] = useState<PlatformDocument | null>(null);
  const [chainDialogOpen, setChainDialogOpen] = useState(false);
  const [journeyDialogId, setJourneyDialogId] = useState<string | null>(null);
  const [form, setForm] = useState({
    recipient_organization_id: '',
    document_title: '',
    document_description: '',
    message: '',
    priority: 'normal',
    requires_stamp: false,
    document_type: 'general',
  });

  // Fetch org stamp
  const { data: orgStamp } = useQuery({
    queryKey: ['org-stamp', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data } = await supabase
        .from('organization_stamps')
        .select('stamp_image_url')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.stamp_image_url || null;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch partner organizations (verified_partnerships + partner_links)
  const { data: partners } = useQuery({
    queryKey: ['partner-orgs-for-signing', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];
      const myOrgId = profile.organization_id;
      const seen = new Set<string>();
      const orgs: { id: string; name: string }[] = [];

      // 1) verified_partnerships (primary source of truth)
      const [vpForward, vpReverse] = await Promise.all([
        supabase.from('verified_partnerships')
          .select('partner_org_id')
          .eq('requester_org_id', myOrgId)
          .eq('status', 'active'),
        supabase.from('verified_partnerships')
          .select('requester_org_id')
          .eq('partner_org_id', myOrgId)
          .eq('status', 'active'),
      ]);

      const vpIds = [
        ...(vpForward.data || []).map((d: any) => d.partner_org_id),
        ...(vpReverse.data || []).map((d: any) => d.requester_org_id),
      ].filter(Boolean);

      // 2) partner_links (fallback)
      const [plForward, plReverse] = await Promise.all([
        supabase.from('partner_links')
          .select('partner_organization_id')
          .eq('organization_id', myOrgId)
          .eq('status', 'active'),
        supabase.from('partner_links')
          .select('organization_id')
          .eq('partner_organization_id', myOrgId)
          .eq('status', 'active'),
      ]);

      const plIds = [
        ...(plForward.data || []).map((d: any) => d.partner_organization_id),
        ...(plReverse.data || []).map((d: any) => d.organization_id),
      ].filter(Boolean);

      const allIds = [...new Set([...vpIds, ...plIds])].filter(id => id !== myOrgId);
      if (!allIds.length) return [];

      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, organization_type, logo_url')
        .in('id', allIds)
        .eq('is_active', true)
        .order('name');

      return (orgData || []).map(o => ({ id: o.id, name: o.name, type: o.organization_type, logo: o.logo_url }));
    },
    enabled: !!profile?.organization_id,
  });

  const handleSend = async () => {
    if (!form.recipient_organization_id || !form.document_title) {
      toast.error('اختر الجهة وعنوان المستند');
      return;
    }
    
    let documentUrl: string | undefined;
    
    // Upload file if selected
    if (uploadFile && profile?.organization_id) {
      setUploading(true);
      try {
        const ext = uploadFile.name.split('.').pop() || 'pdf';
        const path = `${profile.organization_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('signing-documents')
          .upload(path, uploadFile);
        if (uploadError) throw uploadError;
        
        // Get signed URL (valid for 1 year)
        const { data: urlData } = await supabase.storage
          .from('signing-documents')
          .createSignedUrl(path, 365 * 24 * 3600);
        documentUrl = urlData?.signedUrl || undefined;
      } catch (err: any) {
        toast.error('فشل في رفع الملف: ' + (err.message || ''));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    
    const docUrl = documentUrl || selectedPlatformDoc?.fileUrl || undefined;
    const relatedShipment = selectedPlatformDoc?.relatedShipmentId || undefined;
    
    sendRequest.mutate({ 
      ...form, 
      document_url: docUrl, 
      related_shipment_id: relatedShipment,
      document_type: selectedPlatformDoc?.type || form.document_type,
    }, {
      onSuccess: () => {
        setSendOpen(false);
        setUploadFile(null);
        setSelectedPlatformDoc(null);
        setForm({ recipient_organization_id: '', document_title: '', document_description: '', message: '', priority: 'normal', requires_stamp: false, document_type: 'general' });
      },
    });
  };

  const handlePlatformDocSelect = (doc: PlatformDocument) => {
    setSelectedPlatformDoc(doc);
    setUploadFile(null); // Clear file upload if platform doc selected
    // Auto-fill form fields
    setForm(p => ({
      ...p,
      document_title: p.document_title || doc.title,
      document_type: doc.type === 'shipment' ? 'receipt' : doc.type === 'award_letter' ? 'contract' : doc.type,
    }));
  };

  const handleOpenSignDialog = (req: SigningRequest) => {
    // Mark as viewed first
    if (req.status === 'pending') {
      updateStatus.mutate({ id: req.id, status: 'viewed' });
    }
    setSigningRequest(req);
  };

  const handleSignComplete = async (signatureData: SignatureData) => {
    if (!signingRequest || !profile) return;
    setSignLoading(true);
    try {
      const result = await saveDocumentSignature({
        signatureData,
        documentType: (signingRequest.document_type as any) || 'other',
        documentId: signingRequest.id,
        organizationId: profile.organization_id!,
        userId: profile.user_id,
      });

      if (result.success) {
        // Update signing request status + attach signature_id
        const updatePayload: any = {
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_id: result.signatureId || null,
        };
        const { error: updateErr } = await supabase
          .from('signing_requests')
          .update(updatePayload)
          .eq('id', signingRequest.id);
        if (updateErr) console.error('Update signing request error:', updateErr);

        // Notify sender organization that document was signed
        try {
          const { data: senderMembers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('organization_id', signingRequest.sender_organization_id);

          if (senderMembers?.length) {
            const orgName = profile.organization_id
              ? (await supabase.from('organizations').select('name').eq('id', profile.organization_id).single()).data?.name
              : '';
            await sendBulkDualNotification({
              user_ids: senderMembers.map(m => m.user_id),
              title: `✅ تم توقيع المستند: ${signingRequest.document_title}`,
              message: withTagline(`قامت ${orgName || 'الجهة المستلمة'} بالتوقيع على "${signingRequest.document_title}" بنجاح. رقم الختم: ${result.sealNumber || '—'}`),
              type: 'signing_request',
              reference_id: signingRequest.id,
              reference_type: 'signing_request',
            });
          }
        } catch (notifErr) {
          console.error('Notification error (non-blocking):', notifErr);
        }

        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['signing-requests'] });
        queryClient.invalidateQueries({ queryKey: ['signing-request-signatures', signingRequest.id] });
        toast.success('تم توقيع المستند وإرساله للجهة الطالبة بنجاح ✅');
        setSigningRequest(null);
      }
    } catch (err) {
      console.error('Sign error:', err);
      toast.error('فشل في إتمام التوقيع');
    } finally {
      setSignLoading(false);
    }
  };

  const handleReject = () => {
    if (!rejectOpen) return;
    updateStatus.mutate({ id: rejectOpen, status: 'rejected', rejection_reason: rejectReason }, {
      onSuccess: () => {
        toast.success('تم رفض الطلب');
        setRejectOpen(null);
        setRejectReason('');
      },
    });
  };

  const pendingCount = incoming.filter(r => r.status === 'pending' || r.status === 'viewed').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <BackButton />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard/document-archive?tab=signing_request')}>
          <FolderOpen className="w-4 h-4" /> سجل المستندات
        </Button>
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="w-4 h-4" /> إرسال طلب توقيع
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" /> إرسال مستند للتوقيع
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>الجهة المستلمة *</Label>
                <Select value={form.recipient_organization_id} onValueChange={v => setForm(p => ({ ...p, recipient_organization_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الجهة الشريكة..." /></SelectTrigger>
                  <SelectContent>
                    {(partners || []).length === 0 && (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        <Building2 className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        لا توجد جهات مرتبطة
                      </div>
                    )}
                    {(partners || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          {p.logo ? (
                            <img src={p.logo} alt="" className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          )}
                          {p.name}
                          {p.type && (
                            <Badge variant="secondary" className="text-[9px] px-1 mr-1">
                              {p.type === 'generator' ? 'مولد' : p.type === 'transporter' ? 'ناقل' : p.type === 'recycler' ? 'مدور' : p.type}
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>عنوان المستند *</Label>
                <Input value={form.document_title} onChange={e => setForm(p => ({ ...p, document_title: e.target.value }))} placeholder="مثال: إقرار استلام مخلفات" className="text-right" />
              </div>
              <div>
                <Label>نوع المستند</Label>
                <Select value={form.document_type} onValueChange={v => setForm(p => ({ ...p, document_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="receipt">إيصال استلام</SelectItem>
                    <SelectItem value="contract">عقد</SelectItem>
                    <SelectItem value="certificate">شهادة</SelectItem>
                    <SelectItem value="permit">تصريح</SelectItem>
                    <SelectItem value="declaration">إقرار</SelectItem>
                    <SelectItem value="invoice">فاتورة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>وصف المستند</Label>
                <Textarea value={form.document_description} onChange={e => setForm(p => ({ ...p, document_description: e.target.value }))} placeholder="وصف مختصر..." className="text-right" rows={2} />
              </div>
              <div>
                <Label>رسالة للمستلم</Label>
                <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="أرجو التكرم بالتوقيع على..." className="text-right" rows={2} />
              </div>
              <div>
                <Label>إرفاق مستند</Label>
                
                {/* Selected platform document */}
                {selectedPlatformDoc && !uploadFile && (
                  <div className="flex items-center gap-2 mt-1 p-2 rounded-lg border border-primary/30 bg-primary/5">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{selectedPlatformDoc.title}</span>
                    <Badge variant="secondary" className="text-xs">{selectedPlatformDoc.type}</Badge>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedPlatformDoc(null)} className="h-6 w-6 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Uploaded file */}
                {uploadFile && (
                  <div className="flex items-center gap-2 mt-1 p-2 rounded-lg border bg-muted/50">
                    <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{uploadFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setUploadFile(null)} className="h-6 w-6 p-0">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                {/* Action buttons */}
                {!uploadFile && !selectedPlatformDoc && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">رفع ملف</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (f.size > 20 * 1024 * 1024) {
                              toast.error('حجم الملف يجب أن يكون أقل من 20 ميجابايت');
                              return;
                            }
                            setUploadFile(f);
                            setSelectedPlatformDoc(null);
                          }
                        }}
                      />
                    </label>
                    <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} className="gap-2 h-auto py-3">
                      <FolderOpen className="w-4 h-4" />
                      <span className="text-xs">اختيار من المنصة</span>
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الأولوية</Label>
                  <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفض</SelectItem>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="high">عاجل</SelectItem>
                      <SelectItem value="urgent">طارئ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id="require-stamp"
                      checked={form.requires_stamp}
                      onCheckedChange={v => setForm(p => ({ ...p, requires_stamp: !!v }))}
                    />
                    <label htmlFor="require-stamp" className="text-sm cursor-pointer flex items-center gap-1">
                      <Stamp className="w-4 h-4" /> يتطلب ختم رسمي
                    </label>
                  </div>
                </div>
              </div>
              <Button onClick={handleSend} disabled={sendRequest.isPending || uploading} className="w-full gap-2">
                {(sendRequest.isPending || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {uploading ? 'جارٍ رفع الملف...' : 'إرسال الطلب'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

        <div className="text-right">
          <h1 className="text-2xl font-bold flex items-center gap-2 justify-end">
            صندوق التوقيعات
            <FileSignature className="w-7 h-7 text-primary" />
          </h1>
          <p className="text-muted-foreground text-sm">إرسال واستقبال المستندات للتوقيع بين الجهات المرتبطة</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Inbox className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{incoming.length}</p>
            <p className="text-xs text-muted-foreground">واردة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="w-6 h-6 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{outgoing.length}</p>
            <p className="text-xs text-muted-foreground">صادرة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">بانتظار التوقيع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{incoming.filter(r => r.status === 'signed').length + outgoing.filter(r => r.status === 'signed').length}</p>
            <p className="text-xs text-muted-foreground">موقّعة</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming" dir="rtl">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="incoming" className="gap-2">
            <Inbox className="w-4 h-4" /> الواردة
            {pendingCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2">
            <Send className="w-4 h-4" /> الصادرة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-3 mt-4">
          {incoming.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Inbox className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد طلبات واردة</p>
                <p className="text-sm text-muted-foreground/70 mb-4">ستظهر هنا المستندات المرسلة إليك للتوقيع من الجهات المرتبطة</p>
                <p className="text-xs text-muted-foreground/50">
                  يمكن لأي جهة مرتبطة إرسال مستندات لك للتوقيع عبر زر "إرسال للتوقيع" من داخل الشحنات أو المستندات أو الدردشة
                </p>
              </CardContent>
            </Card>
          ) : (
            incoming.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                type="incoming"
                onSign={handleOpenSignDialog}
                onReject={id => setRejectOpen(id)}
                onView={() => {}}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-3 mt-4">
          {outgoing.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Send className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground text-lg">لا توجد طلبات صادرة</p>
                <p className="text-sm text-muted-foreground/70 mb-4">أرسل مستنداً لجهة شريكة للتوقيع عليه</p>
                <Button onClick={() => setSendOpen(true)} className="gap-2">
                  <Send className="w-4 h-4" /> إرسال طلب توقيع جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            outgoing.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                type="outgoing"
                onSign={() => {}}
                onReject={() => {}}
                onView={() => {}}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={!!rejectOpen} onOpenChange={v => { if (!v) { setRejectOpen(null); setRejectReason(''); } }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="اذكر سبب رفض التوقيع..."
              className="text-right"
              rows={3}
            />
            <Button onClick={handleReject} variant="destructive" className="w-full gap-2" disabled={updateStatus.isPending}>
              {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              تأكيد الرفض
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      {signingRequest && (
        <UniversalSignatureDialog
          open={!!signingRequest}
          onOpenChange={(open) => { if (!open) setSigningRequest(null); }}
          onSign={handleSignComplete}
          documentType={(signingRequest.document_type as any) || 'other'}
          documentId={signingRequest.id}
          documentTitle={signingRequest.document_title}
          organizationId={profile?.organization_id || ''}
          organizationStampUrl={orgStamp || undefined}
          signerDefaults={{
            name: profile?.full_name || '',
            title: '',
          }}
          loading={signLoading}
        />
      )}

      {/* Platform Document Picker */}
      <PlatformDocumentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePlatformDocSelect}
      />
    </div>
  );
}
