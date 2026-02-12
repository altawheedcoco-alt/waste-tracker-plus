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
  Send,
  Loader2,
  Building2,
  Search,
  Paperclip,
  FileText,
  CheckCircle2,
  Upload,
} from 'lucide-react';

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

  useEffect(() => {
    if (open && profile?.organization_id) {
      fetchPartners();
      setTitle(initialTitle || '');
      setSelectedPartner(preSelectedOrgId || null);
      setSent(false);
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

  const handleSend = async () => {
    if (!selectedPartner || !title.trim() || !profile?.organization_id || !profile?.user_id) {
      toast.error('يرجى اختيار الجهة وعنوان المستند');
      return;
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
        const ext = file.name.split('.').pop();
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

      const { error } = await supabase
        .from('shared_documents')
        .insert({
          sender_organization_id: profile.organization_id,
          sender_user_id: profile.user_id,
          recipient_organization_id: selectedPartner,
          document_type: referenceType || (file ? 'file' : 'file'),
          document_title: title.trim(),
          document_description: message.trim() || null,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: fileType,
          reference_id: referenceId || null,
          reference_type: referenceType || null,
          message: message.trim() || null,
        });

      if (error) throw error;

      // Send notification to recipient org
      const { data: recipientUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('organization_id', selectedPartner)
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
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error('فشل في إرسال المستند');
    } finally {
      setSending(false);
      setUploading(false);
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
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <p className="text-lg font-semibold">تم الإرسال بنجاح!</p>
            <p className="text-sm text-muted-foreground text-center">
              تم مشاركة المستند مع الجهة المحددة
            </p>
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

          {/* Select partner */}
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
            disabled={!selectedPartner || !title.trim() || sending}
          >
            {sending || uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {uploading ? 'جاري رفع الملف...' : sending ? 'جاري الإرسال...' : 'إرسال المستند'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentDialog;
