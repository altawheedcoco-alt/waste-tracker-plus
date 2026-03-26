import { memo } from 'react';
import { FileSignature, Pen, CheckCircle2, Stamp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SigningRequestCardProps {
  data: {
    id: string;
    document_title?: string;
    document_type?: string;
    status?: string;
    signer_name?: string;
    shipment_number?: string;
    requires_stamp?: boolean;
  };
  isOwn: boolean;
  onAction?: (action: string, id: string, data?: any) => void;
}

const SigningRequestCard = memo(({ data, isOwn, onAction }: SigningRequestCardProps) => {
  const isPending = data.status === 'pending' || data.status === 'requested';
  const isSigned = data.status === 'signed' || data.status === 'completed';

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[240px] max-w-[300px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0',
          isSigned
            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        )}>
          {isSigned ? 'تم التوقيع ✓' : 'بانتظار التوقيع'}
        </Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-amber-500/10')}>
          <FileSignature className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-amber-600')} />
        </div>
      </div>
      <div>
        <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
          {data.document_title || 'طلب توقيع'}
        </p>
        {data.document_type && (
          <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
            {data.document_type}
          </p>
        )}
        {data.shipment_number && (
          <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
            شحنة #{data.shipment_number}
          </p>
        )}
      </div>

      {/* Interactive buttons */}
      {isPending && onAction && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="flex-1 h-7 text-[10px] gap-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => onAction('sign_now', data.id, data)}
          >
            <Pen className="w-3 h-3" /> وقّع الآن
          </Button>
          {data.requires_stamp && (
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => onAction('stamp_now', data.id, data)}
            >
              <Stamp className="w-3 h-3" /> اختم
            </Button>
          )}
        </div>
      )}

      {isSigned && (
        <div className="flex items-center justify-center gap-1.5 py-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className={cn('text-[11px] font-medium', isOwn ? 'text-emerald-300' : 'text-emerald-600')}>
            تم التوقيع بنجاح
          </span>
        </div>
      )}
    </div>
  );
});

SigningRequestCard.displayName = 'SigningRequestCard';
export default SigningRequestCard;
