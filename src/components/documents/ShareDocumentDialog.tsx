import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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

  useEffect(() => {
    if (open && profile?.organization_id) {
      fetchPartners();
      setTitle(initialTitle || '');
      setSelectedPartner(preSelectedOrgId || null);
      setSent(false);
      setGeneratedLink(null);
      setShareMode('partner');
      setExternalName('');
    }
  }, [open, profile?.organization_id]);

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

    setSending(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      let fileSize: number | null = null;
      let fileType: string | null = null;

      // Upload file if attached
      if (file) {
        setUploading(true);
        const path = `${profile.organization_id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('shared-documents')
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('shared-documents')
          .getPublicUrl(path);

        fileUrl = urlData?.publicUrl || null;
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

          const notifications = recipientUsers.map((u: any) => ({
            user_id: u.user_id,
            title: 'مستند مشترك جديد',
            message: `أرسلت ${senderOrg.data?.name || 'جهة'} مستنداً: ${title.trim()}`,
            type: 'document_shared',
            is_read: false,
          }));
          await supabase.from('notifications').insert(notifications);
        }

        setSent(true);
        toast.success('تم إرسال المستند بنجاح');
        setTimeout(() => onOpenChange(false), 1500);
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error('فشل في إرسال المستند');
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

          {/* File attachment (only if no reference) */}
          {!referenceId && (
            <div className="space-y-2">
              <Label>إرفاق ملف (اختياري)</Label>
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <div className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : 'اختر ملف...'}
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
            </div>
          )}

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
