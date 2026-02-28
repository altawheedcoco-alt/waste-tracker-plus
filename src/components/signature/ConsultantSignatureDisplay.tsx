import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, ShieldCheck, Users, Clock, CheckCircle2, XCircle, Stamp } from 'lucide-react';

interface ConsultantSignatureDisplayProps {
  signature: {
    signed_as_role?: string | null;
    solidarity_statement?: string | null;
    office_stamp_applied?: boolean | null;
    office_co_signed?: boolean | null;
    director_approval_status?: string | null;
    director_notes?: string | null;
    office_id?: string | null;
  };
  consultantName: string;
  officeName?: string | null;
  compact?: boolean;
}

const statusConfig: Record<string, { icon: any; label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  approved: { icon: CheckCircle2, label: 'معتمد', variant: 'default' },
  pending: { icon: Clock, label: 'قيد المراجعة', variant: 'secondary' },
  rejected: { icon: XCircle, label: 'مرفوض', variant: 'destructive' },
};

const ConsultantSignatureDisplay = memo(({
  signature,
  consultantName,
  officeName,
  compact = false,
}: ConsultantSignatureDisplayProps) => {
  const status = signature.director_approval_status
    ? statusConfig[signature.director_approval_status]
    : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] gap-1">
          <ShieldCheck className="w-3 h-3" />{consultantName}
        </Badge>
        {signature.signed_as_role && (
          <Badge variant="secondary" className="text-[9px]">{signature.signed_as_role}</Badge>
        )}
        {officeName && (
          <Badge variant="outline" className="text-[9px] gap-1">
            <Building2 className="w-3 h-3" />{officeName}
          </Badge>
        )}
        {signature.office_stamp_applied && (
          <Badge variant="default" className="text-[9px] gap-1">
            <Stamp className="w-3 h-3" />مختوم
          </Badge>
        )}
        {status && (
          <Badge variant={status.variant} className="text-[9px] gap-1">
            <status.icon className="w-3 h-3" />{status.label}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-2 bg-card">
      {/* Consultant info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{consultantName}</span>
          {signature.signed_as_role && (
            <Badge variant="secondary" className="text-[10px]">{signature.signed_as_role}</Badge>
          )}
        </div>
        {status && (
          <Badge variant={status.variant} className="text-[10px] gap-1">
            <status.icon className="w-3 h-3" />{status.label}
          </Badge>
        )}
      </div>

      {/* Office info */}
      {officeName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          <span>{officeName}</span>
          {signature.office_stamp_applied && (
            <Badge variant="default" className="text-[10px] gap-1"><Stamp className="w-3 h-3" />مختوم</Badge>
          )}
        </div>
      )}

      {/* Solidarity statement */}
      {signature.solidarity_statement && (
        <div className="flex items-start gap-2 p-2 rounded bg-muted/50 border border-border">
          <Users className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">{signature.solidarity_statement}</p>
        </div>
      )}

      {/* Director notes */}
      {signature.director_notes && (
        <div className="p-2 rounded bg-muted/50 border border-border">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium">ملاحظة المدير:</span> {signature.director_notes}
          </p>
        </div>
      )}
    </div>
  );
});

ConsultantSignatureDisplay.displayName = 'ConsultantSignatureDisplay';
export default ConsultantSignatureDisplay;
