import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, ExternalLink, Pen } from 'lucide-react';
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
  };
  isOwn: boolean;
  onAction?: (action: string, id: string) => void;
}

const SigningRequestCard = memo(({ data, isOwn, onAction }: SigningRequestCardProps) => {
  const navigate = useNavigate();
  const isPending = data.status === 'pending' || data.status === 'requested';

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
          {isPending ? 'بانتظار التوقيع' : 'تم التوقيع ✓'}
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
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant={isOwn ? 'secondary' : 'outline'}
          className="flex-1 h-7 text-[11px] gap-1"
          onClick={() => navigate(`/dashboard/signing-inbox`)}
        >
          <ExternalLink className="w-3 h-3" /> عرض
        </Button>
        {isPending && !isOwn && onAction && (
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => onAction('sign_now', data.id)}
          >
            <Pen className="w-3 h-3" /> وقّع الآن
          </Button>
        )}
      </div>
    </div>
  );
});

SigningRequestCard.displayName = 'SigningRequestCard';
export default SigningRequestCard;
