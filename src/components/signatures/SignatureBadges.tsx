import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PenTool, Shield, Eye, Clock, User, FileCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Signature {
  id: string;
  signer_name: string;
  signer_role?: string;
  signature_method: string;
  signature_image_url?: string;
  signature_text?: string;
  stamp_applied: boolean;
  stamp_image_url?: string;
  platform_seal_number?: string;
  status?: string;
  created_at: string;
  document_hash?: string;
}

interface SignatureBadgesProps {
  signatures: Signature[];
  compact?: boolean;
}

const methodLabels: Record<string, string> = {
  draw: 'رسم يدوي',
  upload: 'صورة مرفوعة',
  text: 'توقيع نصي',
  click: 'موافقة إلكترونية',
};

const SignatureBadges = ({ signatures, compact = false }: SignatureBadgesProps) => {
  const [viewSig, setViewSig] = useState<Signature | null>(null);

  if (!signatures?.length) {
    return compact ? null : (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <PenTool className="w-3 h-3" />
        لم يتم التوقيع بعد
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {signatures.map(sig => (
          <button
            key={sig.id}
            onClick={() => setViewSig(sig)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 text-green-700 dark:text-green-400 text-[10px] hover:bg-green-100 transition-colors"
          >
            <FileCheck className="w-3 h-3" />
            <span className="font-medium">{sig.signer_name}</span>
            {sig.stamp_applied && <span>🔖</span>}
            {sig.platform_seal_number && (
              <span className="text-[9px] text-green-500 font-mono">{sig.platform_seal_number}</span>
            )}
          </button>
        ))}
      </div>

      {/* Signature Detail Dialog */}
      <Dialog open={!!viewSig} onOpenChange={() => setViewSig(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              تفاصيل التوقيع
            </DialogTitle>
          </DialogHeader>

          {viewSig && (
            <div className="space-y-4">
              {/* Signer info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">الموقع</p>
                    <p className="font-medium">{viewSig.signer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">التاريخ</p>
                    <p className="font-medium">{format(new Date(viewSig.created_at), 'dd/MM/yyyy hh:mm a', { locale: ar })}</p>
                  </div>
                </div>
              </div>

              {/* Method */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{methodLabels[viewSig.signature_method] || viewSig.signature_method}</Badge>
                {viewSig.status === 'signed' && <Badge className="bg-green-100 text-green-800 text-xs">ساري</Badge>}
              </div>

              {/* Signature preview */}
              {viewSig.signature_image_url && (
                <div className="border rounded-lg p-4 bg-white text-center">
                  <img src={viewSig.signature_image_url} alt="التوقيع" className="max-h-20 mx-auto" />
                </div>
              )}
              {viewSig.signature_text && !viewSig.signature_image_url && (
                <div className="border rounded-lg p-4 bg-white text-center">
                  <span className="text-xl font-bold text-primary">{viewSig.signature_text}</span>
                </div>
              )}

              {/* Stamp */}
              {viewSig.stamp_applied && viewSig.stamp_image_url && (
                <div className="border rounded-lg p-3 bg-muted/20 flex items-center gap-3">
                  <img src={viewSig.stamp_image_url} alt="الختم" className="h-12 w-12 object-contain" />
                  <span className="text-xs text-muted-foreground">تم تطبيق ختم المنظمة</span>
                </div>
              )}

              {/* Seal number & hash */}
              {viewSig.platform_seal_number && (
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">رقم الختم الإلكتروني</p>
                  <p className="font-mono text-lg font-bold text-primary">{viewSig.platform_seal_number}</p>
                </div>
              )}
              {viewSig.document_hash && (
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">البصمة الرقمية (SHA-256)</p>
                  <p className="text-[9px] font-mono text-muted-foreground break-all">{viewSig.document_hash}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignatureBadges;
