import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download, Pen, Eye, CheckCircle, Clock, XCircle, FileText, User, Truck, Package, Copy, Share2, Edit, GitBranch } from 'lucide-react';
import { useRef, useCallback } from 'react';
import { Permit } from '@/hooks/usePermits';

const TYPE_LABELS: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  waste_exit: { label: 'تصريح خروج مخلفات', icon: Package, color: 'bg-amber-100 text-amber-800' },
  person_access: { label: 'تصريح شخص / سائق', icon: User, color: 'bg-blue-100 text-blue-800' },
  transport: { label: 'تصريح نقل', icon: Truck, color: 'bg-green-100 text-green-800' },
  general: { label: 'تصريح عام', icon: FileText, color: 'bg-purple-100 text-purple-800' },
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  draft: { label: 'مسودة', variant: 'outline', icon: Clock },
  pending_signatures: { label: 'بانتظار التوقيعات', variant: 'secondary', icon: Pen },
  active: { label: 'نشط', variant: 'default', icon: CheckCircle },
  expired: { label: 'منتهي', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'ملغي', variant: 'destructive', icon: XCircle },
  superseded: { label: 'مُعدّل', variant: 'outline', icon: GitBranch },
};

interface Props {
  permit: Permit;
  signaturesCount?: number;
  onView: (permit: Permit) => void;
  onSign: (permit: Permit) => void;
  onRevise?: (permit: Permit) => void;
  onShare?: (permit: Permit) => void;
}

const PermitCard = ({ permit, signaturesCount = 0, onView, onSign, onRevise, onShare }: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const typeInfo = TYPE_LABELS[permit.permit_type] || TYPE_LABELS.general;
  const statusInfo = STATUS_MAP[permit.status] || STATUS_MAP.draft;
  const TypeIcon = typeInfo.icon;
  const StatusIcon = statusInfo.icon;

  const qrData = JSON.stringify({
    permit: permit.permit_number,
    type: permit.permit_type,
    code: permit.verification_code,
    org: permit.organization_id,
    valid_until: permit.valid_until,
  });

  const handleDownload = useCallback(() => {
    if (!cardRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(cardRef.current!, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `permit-${permit.permit_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  }, [permit.permit_number]);

  const hasImages = permit.id_card_front_url || permit.license_front_url || permit.person_photo_url;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeInfo.color}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-sm">{typeInfo.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{permit.permit_number}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={statusInfo.variant} className="gap-1 text-[10px]">
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </Badge>
            {permit.revision_number > 1 && (
              <Badge variant="outline" className="text-[9px] gap-0.5">
                <GitBranch className="w-2.5 h-2.5" />
                نسخة {permit.revision_number}
              </Badge>
            )}
          </div>
        </div>

        {/* Details */}
        {permit.purpose && (
          <p className="text-sm text-muted-foreground line-clamp-2">{permit.purpose}</p>
        )}
        {permit.person_name && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {permit.person_photo_url && (
              <img src={permit.person_photo_url} alt="" className="w-6 h-6 rounded-full object-cover border" />
            )}
            <span>
              <span className="font-medium">الشخص:</span> {permit.person_name}
              {permit.person_role && <span> ({permit.person_role})</span>}
            </span>
          </div>
        )}
        {permit.waste_type && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">المخلف:</span> {permit.waste_type}
            {permit.estimated_quantity && <span> — {permit.estimated_quantity} {permit.quantity_unit}</span>}
          </div>
        )}

        {/* Document images indicator */}
        {hasImages && (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[9px] gap-0.5 bg-primary/5">
              📎 مستندات مرفقة
            </Badge>
            {permit.image_source && permit.image_source !== 'manual' && (
              <Badge variant="outline" className="text-[9px]">
                {permit.image_source === 'driver' ? '🚛 سائق' : permit.image_source === 'profile' ? '👤 مستخدم' : permit.image_source === 'kyc' ? '🔒 KYC' : '📁 أرشيف'}
              </Badge>
            )}
          </div>
        )}

        {/* Signatures count + validity */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Pen className="w-3 h-3" />
          <span>{signaturesCount} توقيع</span>
          {permit.valid_until && (
            <>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>حتى {new Date(permit.valid_until).toLocaleDateString('ar-EG')}</span>
            </>
          )}
        </div>

        {/* Barcode + QR mini */}
        <div ref={cardRef} className="bg-muted/50 rounded-lg p-2 flex items-center justify-between gap-2">
          <div className="flex-shrink-0 scale-75 origin-right">
            <Barcode value={permit.verification_code || permit.permit_number} width={1} height={30} fontSize={8} margin={0} displayValue />
          </div>
          <QRCodeSVG value={qrData} size={50} level="L" />
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => onView(permit)}>
            <Eye className="w-3 h-3" />
            عرض
          </Button>
          <Button size="sm" className="flex-1 gap-1" onClick={() => onSign(permit)} disabled={permit.status === 'superseded' || permit.status === 'cancelled'}>
            <Pen className="w-3 h-3" />
            توقيع
          </Button>
          {onRevise && permit.status !== 'superseded' && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onRevise(permit)}>
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onShare(permit)}>
              <Share2 className="w-3 h-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PermitCard;
