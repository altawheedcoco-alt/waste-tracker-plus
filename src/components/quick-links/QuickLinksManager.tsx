import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Plus, Link2, Copy, Trash2, Loader2, ExternalLink,
  CheckCircle2, AlertCircle, Share2, Truck, QrCode,
  ToggleLeft, ToggleRight, Eye, Clock, Hash,
  MessageCircle,
} from 'lucide-react';
import { useQuickShipmentLinks, QuickShipmentLink } from '@/hooks/useQuickShipmentLinks';
import QuickLinkFormBuilder from './QuickLinkFormBuilder';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function QuickLinksManager() {
  const { links, loading, createLink, toggleLink, deleteLink } = useQuickShipmentLinks();
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrLink, setQrLink] = useState<QuickShipmentLink | null>(null);

  const getLinkUrl = (code: string) => `${window.location.origin}/quick-ship/${code}`;

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(getLinkUrl(code));
    toast.success('تم نسخ الرابط');
  };

  const shareWhatsApp = (link: QuickShipmentLink) => {
    const url = getLinkUrl(link.link_code);
    const text = `📦 سجل شحنتك بسهولة عبر الرابط:\n${link.link_name}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSave = async (linkData: any, fields: any[]) => {
    setSaving(true);
    try {
      const result = await createLink(linkData, fields);
      if (result) setShowBuilder(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرابط؟')) return;
    await deleteLink(id);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (showBuilder) {
    return <QuickLinkFormBuilder onSave={handleSave} onCancel={() => setShowBuilder(false)} saving={saving} />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                روابط الشحن السريعة المتقدمة
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                أنشئ نماذج مخصصة وشاركها مع السائقين — بتحكم كامل في الحقول والقيم
              </p>
            </div>
            <Button onClick={() => setShowBuilder(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              رابط جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Link2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">لا توجد روابط بعد</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                أنشئ رابطاً مخصصاً للسائقين لتسجيل الشحنات بسهولة — حدد الحقول والقيم المسموحة
              </p>
              <Button variant="outline" onClick={() => setShowBuilder(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إنشاء أول رابط
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map(link => (
                <div key={link.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{link.link_name}</h4>
                        <Badge variant={link.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {link.is_active ? 'نشط' : 'معطل'}
                        </Badge>
                        {link.requires_approval && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">يحتاج موافقة</Badge>
                        )}
                      </div>
                      {link.description && (
                        <p className="text-xs text-muted-foreground mb-2">{link.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {link.link_code}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {link.current_uses} استخدام
                        </span>
                        {link.max_uses && (
                          <span className="flex items-center gap-1">
                            من {link.max_uses}
                          </span>
                        )}
                        {link.expires_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            ينتهي: {new Date(link.expires_at).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(link.link_code)} title="نسخ الرابط">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrLink(link)} title="كود QR">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareWhatsApp(link)} title="مشاركة واتساب">
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(getLinkUrl(link.link_code), '_blank')} title="معاينة">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleLink(link.id, link.is_active)} title={link.is_active ? 'إيقاف' : 'تفعيل'}>
                        {link.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(link.id)} title="حذف">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!qrLink} onOpenChange={() => setQrLink(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{qrLink?.link_name}</DialogTitle>
          </DialogHeader>
          {qrLink && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <QRCodeSVG value={getLinkUrl(qrLink.link_code)} size={200} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">{qrLink.link_code}</p>
              <Button variant="outline" size="sm" onClick={() => copyLink(qrLink.link_code)} className="gap-2">
                <Copy className="h-3 w-3" />
                نسخ الرابط
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
