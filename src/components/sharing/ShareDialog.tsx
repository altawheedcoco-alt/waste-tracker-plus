import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy, Check, MessageCircle, Link2, Shield, Clock, Eye } from 'lucide-react';
import { useShareLink } from '@/hooks/useShareLink';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: string;
  resourceId: string;
  resourceTitle?: string;
}

const ShareDialog = ({ open, onOpenChange, resourceType, resourceId, resourceTitle }: ShareDialogProps) => {
  const { createShareLink, loading } = useShareLink();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [visibility, setVisibility] = useState<'public' | 'authenticated' | 'linked_only'>('public');
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState('');
  const [expiryHours, setExpiryHours] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const expiresAt = expiryHours
      ? new Date(Date.now() + parseInt(expiryHours) * 3600000).toISOString()
      : undefined;

    const result = await createShareLink({
      resourceType,
      resourceId,
      visibilityLevel: visibility,
      title: resourceTitle,
      requiresPin,
      pin: requiresPin ? pin : undefined,
      expiresAt,
      maxViews: maxViews ? parseInt(maxViews) : undefined,
    });

    if (result?.shareUrl) {
      setGeneratedUrl(result.shareUrl);
      toast.success(isAr ? 'تم إنشاء رابط المشاركة' : 'Share link created');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast.success(isAr ? 'تم نسخ الرابط' : 'Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `${resourceTitle || (isAr ? 'رابط مشاركة' : 'Shared link')}\n${generatedUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleReset = () => {
    setGeneratedUrl('');
    setVisibility('public');
    setRequiresPin(false);
    setPin('');
    setExpiryHours('');
    setMaxViews('');
  };

  const visibilityLabels = {
    public: isAr ? 'عام - أي شخص يملك الرابط' : 'Public - anyone with link',
    authenticated: isAr ? 'مسجلون - مستخدم مسجل فقط' : 'Authenticated - registered users',
    linked_only: isAr ? 'مرتبط - طرف مرتبط بالمورد فقط' : 'Linked - related parties only',
  };

  const resourceTypeLabels: Record<string, string> = {
    shipment: isAr ? 'شحنة' : 'Shipment',
    blog: isAr ? 'مقال' : 'Blog Post',
    certificate: isAr ? 'شهادة' : 'Certificate',
    invoice: isAr ? 'فاتورة' : 'Invoice',
    organization: isAr ? 'منظمة' : 'Organization',
    document: isAr ? 'مستند' : 'Document',
    safety_report: isAr ? 'تقرير سلامة' : 'Safety Report',
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleReset(); }}>
      <DialogContent className="sm:max-w-md" dir={isAr ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            {isAr ? 'مشاركة ذكية' : 'Smart Share'}
          </DialogTitle>
          <DialogDescription>
            {isAr ? `مشاركة ${resourceTypeLabels[resourceType] || resourceType}` : `Share ${resourceTypeLabels[resourceType] || resourceType}`}
            {resourceTitle && ` — ${resourceTitle}`}
          </DialogDescription>
        </DialogHeader>

        {!generatedUrl ? (
          <div className="space-y-4">
            {/* Visibility */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {isAr ? 'مستوى الوصول' : 'Access Level'}
              </Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{visibilityLabels.public}</SelectItem>
                  <SelectItem value="authenticated">{visibilityLabels.authenticated}</SelectItem>
                  <SelectItem value="linked_only">{visibilityLabels.linked_only}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PIN */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {isAr ? 'حماية برقم سري (PIN)' : 'PIN Protection'}
              </Label>
              <Switch checked={requiresPin} onCheckedChange={setRequiresPin} />
            </div>
            {requiresPin && (
              <Input
                type="text"
                placeholder={isAr ? 'أدخل الرقم السري' : 'Enter PIN'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
              />
            )}

            {/* Expiry */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {isAr ? 'صلاحية الرابط (ساعات)' : 'Link expiry (hours)'}
              </Label>
              <Input
                type="number"
                placeholder={isAr ? 'بلا حد (اتركه فارغاً)' : 'No limit (leave empty)'}
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                min={1}
              />
            </div>

            {/* Max Views */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {isAr ? 'الحد الأقصى للمشاهدات' : 'Max views'}
              </Label>
              <Input
                type="number"
                placeholder={isAr ? 'بلا حد (اتركه فارغاً)' : 'No limit (leave empty)'}
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                min={1}
              />
            </div>

            <Button onClick={handleCreate} disabled={loading || (requiresPin && !pin)} className="w-full">
              {loading
                ? (isAr ? 'جارٍ الإنشاء...' : 'Creating...')
                : (isAr ? 'إنشاء رابط المشاركة' : 'Create Share Link')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm break-all font-mono" dir="ltr">
              {generatedUrl}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرابط' : 'Copy Link')}
              </Button>
              <Button onClick={handleWhatsApp} variant="default" className="flex-1 gap-2">
                <MessageCircle className="w-4 h-4" />
                {isAr ? 'واتساب' : 'WhatsApp'}
              </Button>
            </div>

            <Button onClick={handleReset} variant="ghost" className="w-full text-muted-foreground">
              {isAr ? 'إنشاء رابط جديد' : 'Create new link'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
