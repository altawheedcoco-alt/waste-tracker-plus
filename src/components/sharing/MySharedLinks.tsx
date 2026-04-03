import { useState, useEffect } from 'react';
import { useShareLink } from '@/hooks/useShareLink';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Link2,
  Eye,
  Shield,
  Clock,
  Ban,
  Activity,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Lock,
  Users,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

const RESOURCE_LABELS: Record<string, string> = {
  shipment: 'شحنة',
  invoice: 'فاتورة',
  certificate: 'شهادة',
  blog: 'مقال',
  organization: 'منظمة',
  document: 'مستند',
  safety_report: 'تقرير سلامة',
};

const VISIBILITY_ICONS: Record<string, any> = {
  public: Globe,
  authenticated: Users,
  linked_only: Lock,
};

const VISIBILITY_LABELS: Record<string, string> = {
  public: 'عام',
  authenticated: 'مسجلون',
  linked_only: 'مرتبطون',
};

export function MySharedLinks() {
  const { getMyLinks, getAccessLog, deactivateLink } = useShareLink();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialog, setLogDialog] = useState<string | null>(null);
  const [accessLog, setAccessLog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const loadLinks = async () => {
    setLoading(true);
    const data = await getMyLinks();
    setLinks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleViewLog = async (linkId: string) => {
    setLogDialog(linkId);
    setLogLoading(true);
    const data = await getAccessLog(linkId);
    setAccessLog(data);
    setLogLoading(false);
  };

  const handleDeactivate = async (linkId: string) => {
    await deactivateLink(linkId);
    await loadLinks();
  };

  const handleCopy = (code: string, resourceType: string) => {
    const url = `${window.location.origin}/s/${resourceType}/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            روابط المشاركة النشطة
            <Badge variant="secondary" className="mr-auto">{links.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              لا توجد روابط مشاركة حالياً
            </p>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
                const isMaxed = link.max_views && link.views_count >= link.max_views;
                const isInactive = !link.is_active || isExpired || isMaxed;
                const VisIcon = VISIBILITY_ICONS[link.visibility_level] || Globe;

                return (
                  <div
                    key={link.id}
                    className={`rounded-lg border p-3 space-y-2 ${isInactive ? 'opacity-60 bg-muted/30' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-xs shrink-0">
                          {RESOURCE_LABELS[link.resource_type] || link.resource_type}
                        </Badge>
                        {link.title && (
                          <span className="text-sm font-medium truncate">{link.title}</span>
                        )}
                      </div>
                      <Badge
                        variant={isInactive ? 'destructive' : 'default'}
                        className="text-xs shrink-0"
                      >
                        {isInactive ? 'معطّل' : 'نشط'}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {link.views_count || 0}
                        {link.max_views ? `/${link.max_views}` : ''} مشاهدة
                      </span>
                      <span className="flex items-center gap-1">
                        <VisIcon className="h-3 w-3" />
                        {VISIBILITY_LABELS[link.visibility_level] || 'عام'}
                      </span>
                      {link.requires_pin && (
                        <span className="flex items-center gap-1 text-primary">
                          <Shield className="h-3 w-3" />
                          PIN
                        </span>
                      )}
                      {link.expires_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isExpired ? 'منتهي' : formatDistanceToNow(new Date(link.expires_at), { locale: ar, addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleCopy(link.code, link.resource_type)}
                      >
                        {copied === link.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        نسخ
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleViewLog(link.id)}
                      >
                        <Activity className="h-3 w-3" />
                        سجل الوصول
                      </Button>
                      {link.is_active && !isExpired && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                          onClick={() => handleDeactivate(link.id)}
                        >
                          <Ban className="h-3 w-3" />
                          تعطيل
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Log Dialog */}
      <Dialog open={!!logDialog} onOpenChange={() => setLogDialog(null)}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              سجل محاولات الوصول
            </DialogTitle>
          </DialogHeader>
          {logLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : accessLog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              لا توجد محاولات وصول بعد
            </p>
          ) : (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2">
                {accessLog.map((attempt) => (
                  <div
                    key={attempt.id}
                    className={`rounded-lg border p-3 text-sm space-y-1 ${
                      attempt.attempt_type === 'success'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={
                          attempt.attempt_type === 'success'
                            ? 'text-emerald-700 border-emerald-300'
                            : 'text-red-700 border-red-300'
                        }
                      >
                        {attempt.attempt_type === 'success' ? '✅ نجح' : '❌ فشل'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(attempt.created_at), 'dd/MM HH:mm', { locale: ar })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span dir="ltr">{attempt.ip_address || '—'}</span>
                      {attempt.failure_reason && (
                        <span className="text-red-600">{attempt.failure_reason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
