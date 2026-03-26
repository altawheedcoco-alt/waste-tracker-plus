import { memo } from 'react';
import { Receipt, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InvoiceCardProps {
  data: {
    id: string;
    invoice_number?: string;
    status?: string;
    total_amount?: number;
    currency?: string;
    due_date?: string;
  };
  isOwn: boolean;
  onAction?: (action: string, id: string, data?: any) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'بانتظار الدفع', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  paid: { label: 'مدفوعة ✓', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  overdue: { label: 'متأخرة', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  rejected: { label: 'مرفوضة', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const InvoiceCard = memo(({ data, isOwn, onAction }: InvoiceCardProps) => {
  const st = STATUS_MAP[data.status || ''] || { label: data.status || 'غير محدد', color: 'bg-muted text-muted-foreground' };
  const isPending = data.status === 'pending';

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[240px] max-w-[300px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', st.color)}>{st.label}</Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-blue-500/10')}>
          <Receipt className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-blue-600')} />
        </div>
      </div>
      <div>
        <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
          فاتورة #{data.invoice_number || data.id.slice(0, 8)}
        </p>
        {data.total_amount != null && (
          <p className={cn('text-sm font-bold mt-1', isOwn ? 'text-white' : 'text-primary')}>
            {data.total_amount.toLocaleString()} {data.currency || 'EGP'}
          </p>
        )}
      </div>
      {data.due_date && (
        <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          استحقاق: {new Date(data.due_date).toLocaleDateString('ar-EG')}
        </p>
      )}

      {/* Interactive buttons */}
      {isPending && onAction && (
        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="flex-1 h-7 text-[10px] gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => onAction('approve_invoice', data.id, data)}
          >
            <CheckCircle className="w-3 h-3" /> اعتمد
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1 h-7 text-[10px] gap-1"
            onClick={() => onAction('reject_invoice', data.id, data)}
          >
            <XCircle className="w-3 h-3" /> ارفض
          </Button>
        </div>
      )}
    </div>
  );
});

InvoiceCard.displayName = 'InvoiceCard';
export default InvoiceCard;
