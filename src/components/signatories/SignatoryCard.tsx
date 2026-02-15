import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Edit, Trash2, Star, StarOff, Download, Shield, FileText, Truck, Receipt, Award } from 'lucide-react';
import { useRef, useCallback } from 'react';

interface SignatoryData {
  id: string;
  full_name: string;
  job_title: string | null;
  national_id: string | null;
  authority_level: string;
  can_sign_shipments: boolean | null;
  can_sign_contracts: boolean | null;
  can_sign_invoices: boolean | null;
  can_sign_certificates: boolean | null;
  is_active: boolean | null;
  signatory_code: string | null;
  signature_image_url: string | null;
  created_at: string;
  activated_at: string | null;
}

interface SignatoryCardProps {
  signatory: SignatoryData;
  organizationName: string;
  verificationBaseUrl: string;
  onEdit: (signatory: SignatoryData) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

const permissionIcons = [
  { key: 'can_sign_shipments', label: 'الشحنات', icon: Truck },
  { key: 'can_sign_contracts', label: 'العقود', icon: FileText },
  { key: 'can_sign_invoices', label: 'الفواتير', icon: Receipt },
  { key: 'can_sign_certificates', label: 'الشهادات', icon: Award },
] as const;

const SignatoryCard = ({ signatory, organizationName, verificationBaseUrl, onEdit, onDelete, onToggleActive }: SignatoryCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    code: signatory.signatory_code,
    name: signatory.full_name,
    title: signatory.job_title,
    org: organizationName,
    nationalId: signatory.national_id ? `***${signatory.national_id.slice(-4)}` : null,
    permissions: {
      shipments: !!signatory.can_sign_shipments,
      contracts: !!signatory.can_sign_contracts,
      invoices: !!signatory.can_sign_invoices,
      certificates: !!signatory.can_sign_certificates,
    },
    verify: `${verificationBaseUrl}/verify-signatory/${signatory.signatory_code}`,
  });

  const handleDownloadCard = useCallback(() => {
    if (!cardRef.current) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(cardRef.current!, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.download = `signatory-${signatory.signatory_code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  }, [signatory.signatory_code]);

  return (
    <Card className={`relative overflow-hidden transition-all ${signatory.is_active ? 'border-primary/30' : 'border-destructive/30 opacity-70'}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-foreground">{signatory.full_name}</h3>
              <Badge variant={signatory.is_active ? 'default' : 'destructive'} className="text-[10px]">
                {signatory.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
            </div>
            {signatory.job_title && (
              <p className="text-sm text-muted-foreground">{signatory.job_title}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              مستوى السلطة: <span className="font-semibold text-primary">{signatory.authority_level}</span>
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              كود: {signatory.signatory_code || '—'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleActive(signatory.id, !signatory.is_active)}>
              {signatory.is_active ? <StarOff className="w-4 h-4 text-amber-500" /> : <Star className="w-4 h-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(signatory)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(signatory.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Permissions */}
        <div className="flex flex-wrap gap-2">
          {permissionIcons.map(({ key, label, icon: Icon }) => {
            const hasPermission = !!(signatory as any)[key];
            return (
              <Badge key={key} variant={hasPermission ? 'default' : 'outline'} className={`gap-1 text-[10px] ${hasPermission ? '' : 'opacity-40'}`}>
                <Icon className="w-3 h-3" />
                {label}
              </Badge>
            );
          })}
        </div>

        {/* Barcode + QR Section */}
        <div ref={cardRef} className="bg-card border rounded-lg p-3 space-y-3">
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground mb-1">بطاقة تعريف المفوض</p>
            <p className="text-sm font-bold text-foreground">{signatory.full_name}</p>
            <p className="text-xs text-muted-foreground">{signatory.job_title} • {organizationName}</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            {/* Barcode */}
            <div className="flex-shrink-0">
              <Barcode
                value={signatory.signatory_code || signatory.id.slice(0, 12)}
                width={1.2}
                height={40}
                fontSize={10}
                margin={0}
                displayValue={true}
              />
            </div>

            {/* QR Code */}
            <div className="flex-shrink-0">
              <QRCodeSVG
                value={qrData}
                size={80}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          <p className="text-[9px] text-center text-muted-foreground">
            امسح الكود للتحقق من صلاحية التوقيع • {verificationBaseUrl}/verify-signatory/{signatory.signatory_code}
          </p>
        </div>

        <Button variant="outline" size="sm" className="w-full gap-2" onClick={handleDownloadCard}>
          <Download className="w-4 h-4" />
          تحميل بطاقة التعريف
        </Button>
      </CardContent>
    </Card>
  );
};

export default SignatoryCard;
