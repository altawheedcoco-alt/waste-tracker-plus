import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { CheckCircle, Clock, FileText, User, Package, Truck } from 'lucide-react';
import { Permit, usePermitSignatures, PermitSignature } from '@/hooks/usePermits';

const TYPE_LABELS: Record<string, string> = {
  waste_exit: 'تصريح خروج مخلفات',
  person_access: 'تصريح شخص / سائق',
  transport: 'تصريح نقل',
  general: 'تصريح عام',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permit: Permit | null;
}

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

const PermitViewDialog = ({ open, onOpenChange, permit }: Props) => {
  const { data: signatures } = usePermitSignatures(permit?.id || null);

  if (!permit) return null;

  const qrData = JSON.stringify({
    permit: permit.permit_number,
    type: permit.permit_type,
    code: permit.verification_code,
    valid_until: permit.valid_until,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {TYPE_LABELS[permit.permit_type] || 'تصريح'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <InfoRow label="رقم التصريح" value={permit.permit_number} />
            <InfoRow label="كود التحقق" value={permit.verification_code} />
            <InfoRow label="الحالة" value={permit.status} />
            <InfoRow label="تاريخ الإنشاء" value={new Date(permit.created_at).toLocaleString('ar-EG')} />
          </div>

          {/* Details */}
          <div className="space-y-1">
            <InfoRow label="الغرض" value={permit.purpose} />
            <InfoRow label="الشخص" value={permit.person_name} />
            <InfoRow label="الصفة" value={permit.person_role} />
            <InfoRow label="رقم الهوية" value={permit.person_id_number} />
            <InfoRow label="لوحة المركبة" value={permit.vehicle_plate} />
            <InfoRow label="نوع المخلف" value={permit.waste_type} />
            <InfoRow label="الوصف" value={permit.waste_description} />
            {permit.estimated_quantity && (
              <InfoRow label="الكمية" value={`${permit.estimated_quantity} ${permit.quantity_unit}`} />
            )}
            <InfoRow label="صالح من" value={permit.valid_from ? new Date(permit.valid_from).toLocaleString('ar-EG') : null} />
            <InfoRow label="صالح حتى" value={permit.valid_until ? new Date(permit.valid_until).toLocaleString('ar-EG') : null} />
            <InfoRow label="تعليمات خاصة" value={permit.special_instructions} />
            <InfoRow label="ملاحظات" value={permit.notes} />
          </div>

          <Separator />

          {/* Signatures */}
          <div>
            <h4 className="text-sm font-semibold mb-2">التوقيعات والاعتمادات</h4>
            {(signatures || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">لم يتم التوقيع بعد</p>
            ) : (
              <div className="space-y-2">
                {(signatures || []).map((sig: PermitSignature) => (
                  <div key={sig.id} className="flex items-center gap-2 p-2 bg-primary/5 rounded-md">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sig.signer_name}</p>
                      <p className="text-[10px] text-muted-foreground">{sig.role_title}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(sig.signed_at).toLocaleString('ar-EG')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Barcode + QR */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-center gap-6">
              <div className="flex-shrink-0">
                <Barcode
                  value={permit.verification_code || permit.permit_number}
                  width={1.2}
                  height={40}
                  fontSize={10}
                  margin={0}
                  displayValue
                />
              </div>
              <QRCodeSVG value={qrData} size={80} level="M" />
            </div>
            <p className="text-[9px] text-center text-muted-foreground">
              امسح الكود للتحقق من صلاحية التصريح
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermitViewDialog;
