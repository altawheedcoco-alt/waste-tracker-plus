import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendBulkDualNotification } from '@/services/unifiedNotifier';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Loader2,
  Building2,
  Search,
  Paperclip,
  FileText,
  CheckCircle2,
  Upload,
  FileSignature,
  Tag,
  Link2,
  Copy,
  ExternalLink,
  Users,
  Globe,
  AlertTriangle,
} from 'lucide-react';

const DOCUMENT_CATEGORIES: Record<string, string> = {
  file: 'ملف عام',
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

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pre-filled document reference (when sharing existing platform document)
  referenceId?: string;
  referenceType?: string; // receipt, certificate, invoice, shipment, contract
  documentTitle?: string;
  preSelectedOrgId?: string;
  /** Auto-attach a file (e.g. generated PDF) instead of requiring manual upload */
  autoFile?: File | null;
}

interface PartnerOrg {
  id: string;
  name: string;
  organization_type: string;
}

const ShareDocumentDialog = ({
  open,
  onOpenChange,
  referenceId,
  referenceType,
  documentTitle: initialTitle,
  preSelectedOrgId,
  autoFile: externalAutoFile,
}: ShareDocumentDialogProps) => {
  const { profile } = useAuth();
  const [partners, setPartners] = useState<PartnerOrg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(preSelectedOrgId || null);
  const [title, setTitle] = useState(initialTitle || '');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [documentCategory, setDocumentCategory] = useState<string>(referenceType || 'file');
  const [shareMode, setShareMode] = useState<'partner' | 'external'>('partner');
  const [externalName, setExternalName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [autoFileUrl, setAutoFileUrl] = useState<string | null>(null);
  const [autoFileName, setAutoFileName] = useState<string | null>(null);
  const [autoFileSize, setAutoFileSize] = useState<number | null>(null);
  const [autoFileType, setAutoFileType] = useState<string | null>(null);
  const [fetchingFile, setFetchingFile] = useState(false);

  useEffect(() => {
    if (open && profile?.organization_id) {
      fetchPartners();
      setTitle(initialTitle || '');
      setSelectedPartner(preSelectedOrgId || null);
      setSent(false);
      setGeneratedLink(null);
      setShareMode('partner');
      setExternalName('');
      setAutoFileUrl(null);
      setAutoFileName(null);
      setFile(null);

      // If an external auto-file is provided (e.g. generated PDF), use it directly
      if (externalAutoFile) {
        setFile(externalAutoFile);
      } else if (referenceId) {
        // Auto-fetch file from entity_documents if referenceId exists
        fetchReferenceFile();
      }
    }
  }, [open, profile?.organization_id]);

  const fetchReferenceFile = async () => {
    if (!referenceId || !profile?.organization_id) return;
    setFetchingFile(true);
    try {
      // Try to find file in entity_documents by reference
      const refColumn = referenceType === 'invoice' ? 'invoice_id'
        : referenceType === 'shipment' ? 'shipment_id'
        : referenceType === 'contract' ? 'contract_id'
        : referenceType === 'deposit' ? 'deposit_id'
        : null;

      let fileData: any = null;

      if (refColumn) {
        const { data } = await supabase
          .from('entity_documents')
          .select('file_url, file_name, file_type, file_size')
          .eq(refColumn, referenceId)
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) fileData = data[0];
      }

      // Fallback: search by title match
      if (!fileData) {
        const { data } = await supabase
          .from('entity_documents')
          .select('file_url, file_name, file_type, file_size')
          .eq('organization_id', profile.organization_id)
          .ilike('title', `%${initialTitle || ''}%`)
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) fileData = data[0];
      }

      if (fileData?.file_url) {
        setAutoFileUrl(fileData.file_url);
        setAutoFileName(fileData.file_name || 'document');
        setAutoFileSize(fileData.file_size || null);
        setAutoFileType(fileData.file_type || 'application/pdf');
      }
    } catch (e) {
      console.error('Error fetching reference file:', e);
    } finally {
      setFetchingFile(false);
    }
  };

  const fetchPartners = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      // Get linked partner organizations
      const { data: links } = await supabase
        .from('partner_links')
        .select('partner_organization_id, organization_id')
        .or(`organization_id.eq.${profile.organization_id},partner_organization_id.eq.${profile.organization_id}`)
        .eq('status', 'active');

      if (!links || links.length === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      const partnerOrgIds = links.map(l =>
        l.organization_id === profile.organization_id
          ? l.partner_organization_id
          : l.organization_id
      ).filter(Boolean) as string[];

      const uniqueIds = [...new Set(partnerOrgIds)];

      if (uniqueIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .in('id', uniqueIds);

        setPartners(orgs || []);
      }
    } catch (e) {
      console.error('Error fetching partners:', e);
    } finally {
      setLoading(false);
    }
  };

  const getOrgTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      generator: 'مولد',
      transporter: 'ناقل',
      recycler: 'مدور',
      disposal: 'تخلص نهائي',
    };
    return map[type] || type;
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let token = '';
    for (let i = 0; i < 20; i++) token += chars[Math.floor(Math.random() * chars.length)];
    return token;
  };

  const handleSend = async () => {
    if (shareMode === 'partner') {
      if (!selectedPartner || !title.trim() || !profile?.organization_id || !profile?.user_id) {
        toast.error('يرجى اختيار الجهة وعنوان المستند');
        return;
      }
    } else {
      if (!title.trim() || !profile?.organization_id || !profile?.user_id) {
        toast.error('يرجى إدخال عنوان المستند');
        return;
      }
    }

    // Enforce file attachment (skip if referenceId exists — document is a platform entity)
    const hasFile = file || autoFileUrl || referenceId;
    if (!hasFile) {
      toast.error('يجب إرفاق ملف أو مستند قبل المشاركة');
      return;
    }

    setSending(true);
    try {
      let fileUrl: string | null = autoFileUrl;
      let fileName: string | null = autoFileName;
      let fileSize: number | null = autoFileSize;
      let fileType: string | null = autoFileType;

      // Upload manual file if attached (overrides auto file)
      if (file) {
        setUploading(true);
        const path = `${profile.organization_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('shared-documents')
          .upload(path, file);

        if (uploadError) throw uploadError;

        // Use signed URL since bucket is private
        const { data: urlData, error: urlError } = await supabase.storage
          .from('shared-documents')
          .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days

        if (urlError) throw urlError;
        fileUrl = urlData?.signedUrl || null;
        fileName = file.name;
        fileSize = file.size;
        fileType = file.type;
        setUploading(false);
      }

      if (shareMode === 'external') {
        // External share: generate public token
        const accessToken = generateToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

        const { error } = await supabase
          .from('shared_documents')
          .insert({
            sender_organization_id: profile.organization_id,
            sender_user_id: profile.user_id,
            recipient_organization_id: profile.organization_id, // self-ref for external
            document_type: referenceType || documentCategory,
            document_title: title.trim(),
            document_description: message.trim() || null,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            reference_id: referenceId || null,
            reference_type: referenceType || null,
            message: message.trim() || null,
            requires_signature: false,
            is_external_share: true,
            public_access_token: accessToken,
            external_recipient_name: externalName.trim() || null,
            expires_at: expiresAt.toISOString(),
          });

        if (error) throw error;

        const link = `${window.location.origin}/shared/${accessToken}`;
        setGeneratedLink(link);
        setSent(true);
        toast.success('تم إنشاء رابط المشاركة');
      } else {
        // Partner share (existing logic)
        const { error } = await supabase
          .from('shared_documents')
          .insert({
            sender_organization_id: profile.organization_id,
            sender_user_id: profile.user_id,
            recipient_organization_id: selectedPartner!,
            document_type: referenceType || documentCategory,
            document_title: title.trim(),
            document_description: message.trim() || null,
            file_url: fileUrl,
            file_name: fileName,
            file_size: fileSize,
            file_type: fileType,
            reference_id: referenceId || null,
            reference_type: referenceType || null,
            message: message.trim() || null,
            requires_signature: requiresSignature,
          });

        if (error) throw error;

        // Send notification to recipient org
        const { data: recipientUsers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('organization_id', selectedPartner!)
          .limit(20);

        if (recipientUsers && recipientUsers.length > 0) {
          const senderOrg = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .single();

          await sendBulkDualNotification({
            user_ids: recipientUsers.map((u: any) => u.user_id),
            title: 'مستند مشترك جديد',
            message: `أرسلت ${senderOrg.data?.name || 'جهة'} مستنداً: ${title.trim()}`,
            type: 'document_shared',
          });
        }

        setSent(true);
        toast.success('تم إرسال المستند بنجاح');
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch (error: any) {
      console.error('Share error:', error);
      const msg = error?.message || error?.error_description || 'خطأ غير معروف';
      toast.error(`فشل في إرسال المستند: ${msg}`);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('تم نسخ الرابط');
    }
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-primary" />
            <p className="text-lg font-semibold">
              {generatedLink ? 'تم إنشاء الرابط!' : 'تم الإرسال بنجاح!'}
            </p>
            {generatedLink ? (
              <div className="w-full space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  شارك هذا الرابط مع الجهة الخارجية (صالح لمدة 30 يوم)
                </p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg border">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="text-xs bg-transparent border-0 h-8"
                    dir="ltr"
                  />
                  <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={copyLink}>
                    <Copy className="w-3.5 h-3.5" />
                    نسخ
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 text-sm"
                    onClick={() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(`مستند مشترك: ${title}\n${generatedLink}`)}`, '_blank');
                    }}
                  >
                    واتساب
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1 text-sm"
                    onClick={() => {
                      window.open(`mailto:?subject=${encodeURIComponent(`مستند مشترك: ${title}`)}&body=${encodeURIComponent(`تم مشاركة مستند معك:\n${generatedLink}`)}`, '_blank');
                    }}
                  >
                    بريد إلكتروني
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                تم مشاركة المستند مع الجهة المحددة
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            مشاركة مستند
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share mode toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setShareMode('partner')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                shareMode === 'partner' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              جهة مرتبطة
            </button>
            <button
              onClick={() => setShareMode('external')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                shareMode === 'external' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-4 h-4" />
              رابط خارجي
            </button>
          </div>

          {/* Document title */}
          <div className="space-y-2">
            <Label>عنوان المستند *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="مثال: شهادة استلام رقم ..."
              dir="rtl"
            />
          </div>

          {/* Document category */}
          {!referenceType && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                تصنيف المستند
              </Label>
              <Select value={documentCategory} onValueChange={setDocumentCategory}>
                <SelectTrigger dir="rtl">
                  <SelectValue placeholder="اختر تصنيف..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reference badge */}
          {referenceId && referenceType && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <FileText className="w-3 h-3" />
                {referenceType === 'receipt' && 'شهادة استلام'}
                {referenceType === 'certificate' && 'شهادة تدوير'}
                {referenceType === 'invoice' && 'فاتورة'}
                {referenceType === 'shipment' && 'شحنة'}
                {referenceType === 'contract' && 'عقد'}
                : {referenceId}
              </Badge>
            </div>
          )}

          {/* Partner mode: Select partner */}
          {shareMode === 'partner' && (
            <div className="space-y-2">
              <Label>اختر الجهة المستلمة *</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث عن جهة..."
                  className="pr-9"
                  dir="rtl"
                />
              </div>
              <ScrollArea className="max-h-40 border rounded-md">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">
                    لا توجد جهات مرتبطة
                  </p>
                ) : (
                  <div className="p-1 space-y-1">
                    {filteredPartners.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPartner(p.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-right transition-colors ${
                          selectedPartner === p.id
                            ? 'bg-primary/10 border border-primary/30'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-sm">{p.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {getOrgTypeLabel(p.organization_type)}
                        </Badge>
                        {selectedPartner === p.id && (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* External mode: recipient name */}
          {shareMode === 'external' && (
            <div className="space-y-2">
              <Label>اسم المستلم (اختياري)</Label>
              <Input
                value={externalName}
                onChange={e => setExternalName(e.target.value)}
                placeholder="اسم الشخص أو الجهة..."
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                سيتم إنشاء رابط عام صالح لمدة 30 يوم
              </p>
            </div>
          )}

          {/* File attachment - mandatory */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              الملف المرفق *
            </Label>

            {/* Auto-fetched file indicator */}
            {fetchingFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">جاري البحث عن الملف المرتبط...</span>
              </div>
            )}

            {autoFileUrl && !file && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{autoFileName}</p>
                  <p className="text-xs text-muted-foreground">تم ربط الملف تلقائياً من سجل المستندات</p>
                </div>
              </div>
            )}

            {/* Manual file upload - always available */}
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : autoFileUrl ? 'استبدال الملف التلقائي...' : 'اختر ملف... (إجباري)'}
                  </span>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
              {file && (
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  ✕
                </Button>
              )}
            </div>

            {/* Warning if no file */}
            {!autoFileUrl && !file && !fetchingFile && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                يجب إرفاق ملف لإتمام المشاركة
              </p>
            )}
          </div>

          {/* Require signature toggle (partner mode only) */}
          {shareMode === 'partner' && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <input
                type="checkbox"
                id="requiresSignature"
                checked={requiresSignature}
                onChange={e => setRequiresSignature(e.target.checked)}
                className="w-4 h-4 rounded border-muted-foreground"
              />
              <label htmlFor="requiresSignature" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium">طلب توقيع وختم من الجهة المستلمة</p>
                <p className="text-xs text-muted-foreground">سيُطلب من المستلم توقيع المستند إلكترونياً</p>
              </label>
              <FileSignature className="w-5 h-5 text-muted-foreground" />
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>رسالة مرفقة (اختياري)</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="أضف ملاحظة أو رسالة..."
              rows={2}
              dir="rtl"
            />
          </div>

          {/* Send button */}
          <Button
            className="w-full gap-2"
            onClick={handleSend}
            disabled={
              (shareMode === 'partner' && !selectedPartner) ||
              !title.trim() ||
              (!file && !autoFileUrl) ||
              fetchingFile ||
              sending
            }
          >
            {sending || uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : shareMode === 'external' ? (
              <Link2 className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {uploading
              ? 'جاري رفع الملف...'
              : sending
              ? 'جاري الإرسال...'
              : shareMode === 'external'
              ? 'إنشاء رابط مشاركة'
              : 'إرسال المستند'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;
