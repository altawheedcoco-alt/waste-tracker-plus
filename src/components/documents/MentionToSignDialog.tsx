import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MentionableField, type MentionableEntity } from '@/components/ui/mentionable-field';
import { useMentionableEntities } from '@/hooks/useMentionableEntities';
import { useMentionSigning } from '@/hooks/useMentionSigning';
import { FileSignature, Stamp, Send, Loader2, QrCode, Building2, User, Barcode } from 'lucide-react';

interface MentionToSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled document info */
  documentTitle?: string;
  documentType?: string;
  documentUrl?: string;
  documentId?: string;
  relatedShipmentId?: string;
}

/**
 * Dialog that allows users to @mention someone and send them a signing request.
 * Supports signing, stamping, QR code, barcode, and other verification methods.
 */
const MentionToSignDialog = ({
  open,
  onOpenChange,
  documentTitle: initialTitle = '',
  documentType: initialType = 'general',
  documentUrl,
  documentId,
  relatedShipmentId,
}: MentionToSignDialogProps) => {
  const { entities } = useMentionableEntities();
  const { sendSigningRequest } = useMentionSigning();

  const [selectedEntity, setSelectedEntity] = useState<MentionableEntity | null>(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [docTitle, setDocTitle] = useState(initialTitle);
  const [docType, setDocType] = useState(initialType);
  const [message, setMessage] = useState('');
  const [requiresStamp, setRequiresStamp] = useState(false);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [sending, setSending] = useState(false);

  const handleEntitySelect = useCallback((entity: MentionableEntity) => {
    setSelectedEntity(entity);
    setRecipientSearch(entity.name);
  }, []);

  const handleSend = async () => {
    if (!selectedEntity) return;
    if (!docTitle.trim()) return;

    setSending(true);
    try {
      const success = await sendSigningRequest({
        entity: selectedEntity,
        documentTitle: docTitle,
        documentType: docType,
        documentUrl,
        documentId,
        relatedShipmentId,
        message: message || undefined,
        requiresStamp,
        priority,
      });

      if (success) {
        // Reset
        setSelectedEntity(null);
        setRecipientSearch('');
        setMessage('');
        setRequiresStamp(false);
        setPriority('normal');
        onOpenChange(false);
      }
    } finally {
      setSending(false);
    }
  };

  const resetOnOpen = useCallback(() => {
    if (open) {
      setDocTitle(initialTitle);
      setDocType(initialType);
      setSelectedEntity(null);
      setRecipientSearch('');
      setMessage('');
    }
  }, [open, initialTitle, initialType]);

  // Reset on open
  useState(() => { resetOnOpen(); });

  const DOC_TYPES: Record<string, string> = {
    general: 'عام',
    shipment: 'شحنة',
    invoice: 'فاتورة',
    contract: 'عقد',
    certificate: 'شهادة',
    receipt: 'إيصال',
    report: 'تقرير',
    license: 'ترخيص',
    correspondence: 'مراسلة',
    other: 'أخرى',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            إرسال مستند للتوقيع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient */}
          <div>
            <Label>الموجه إليه (@ للإشارة) *</Label>
            <MentionableField
              value={recipientSearch}
              onChange={setRecipientSearch}
              entities={entities}
              onEntitySelect={handleEntitySelect}
              placeholder="اكتب @ للإشارة لمستخدم أو جهة"
              className="mt-1.5"
            />
            {selectedEntity && (
              <div className="mt-1.5 flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {selectedEntity.type === 'organization' ? (
                    <Building2 className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {selectedEntity.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] px-1.5"
                  onClick={() => {
                    setSelectedEntity(null);
                    setRecipientSearch('');
                  }}
                >
                  تغيير
                </Button>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div>
            <Label>عنوان المستند *</Label>
            <Input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="مثال: عقد نقل مخلفات"
              className="mt-1.5"
            />
          </div>

          {/* Document Type */}
          <div>
            <Label>نوع المستند</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div>
            <Label>رسالة مرفقة</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="يرجى مراجعة المستند وتوقيعه..."
              rows={2}
              className="mt-1.5"
            />
          </div>

          {/* Options Row */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={requiresStamp}
                  onCheckedChange={setRequiresStamp}
                  id="stamp"
                />
                <Label htmlFor="stamp" className="text-sm cursor-pointer flex items-center gap-1">
                  <Stamp className="h-3.5 w-3.5" />
                  مطلوب ختم
                </Label>
              </div>
            </div>

            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="high">مهم</SelectItem>
                <SelectItem value="urgent">عاجل 🔴</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* What the recipient can do */}
          <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">الطرف المشار إليه سيتمكن من:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px] gap-1">
                <FileSignature className="h-3 w-3" /> توقيع المستند
              </Badge>
              {requiresStamp && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Stamp className="h-3 w-3" /> وضع الختم
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] gap-1">
                <QrCode className="h-3 w-3" /> كود QR
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                <Barcode className="h-3 w-3" /> باركود
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            إلغاء
          </Button>
          <Button
            onClick={handleSend}
            disabled={!selectedEntity || !docTitle.trim() || sending}
            className="gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال للتوقيع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MentionToSignDialog;
