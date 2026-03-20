import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScrollText, ExternalLink, FileSignature, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ContractCardProps {
  data: {
    id: string;
    contract_number?: string;
    title?: string;
    contract_type?: string;
    status?: string;
    partner_name?: string;
    value?: number;
    currency?: string;
    start_date?: string;
    end_date?: string;
  };
  isOwn: boolean;
  onAction?: (action: string, id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  draft: { label: 'مسودة', color: 'bg-muted text-muted-foreground border-border' },
  expired: { label: 'منتهي', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  pending: { label: 'قيد المراجعة', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

const ContractCard = memo(({ data, isOwn, onAction }: ContractCardProps) => {
  const navigate = useNavigate();
  const st = STATUS_MAP[data.status || ''] || { label: data.status || 'غير محدد', color: 'bg-muted text-muted-foreground' };

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', st.color)}>{st.label}</Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-indigo-500/10')}>
          <ScrollText className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-indigo-600')} />
        </div>
      </div>
      <div>
        <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
          عقد #{data.contract_number || data.id.slice(0, 8)}
        </p>
        {data.title && <p className={cn('text-[10px] mt-0.5 truncate', isOwn ? 'text-white/60' : 'text-muted-foreground')}>{data.title}</p>}
        {data.partner_name && <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>الطرف: {data.partner_name}</p>}
      </div>
      {data.value != null && (
        <p className={cn('text-sm font-bold', isOwn ? 'text-white' : 'text-primary')}>
          {data.value.toLocaleString()} {data.currency || 'EGP'}
        </p>
      )}
      {(data.start_date || data.end_date) && (
        <div className={cn('flex items-center gap-1 text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          <Calendar className="w-3 h-3" />
          <span>{data.start_date ? new Date(data.start_date).toLocaleDateString('ar-EG') : '—'} — {data.end_date ? new Date(data.end_date).toLocaleDateString('ar-EG') : '—'}</span>
        </div>
      )}
      <div className="flex gap-1.5">
        <Button size="sm" variant={isOwn ? 'secondary' : 'outline'} className="flex-1 h-7 text-[11px] gap-1" onClick={() => navigate('/dashboard/contracts')}>
          <ExternalLink className="w-3 h-3" /> عرض
        </Button>
        {(data.status === 'active' || data.status === 'pending') && onAction && (
          <Button size="sm" className="h-7 text-[11px] gap-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => onAction('sign_contract', data.id)}>
            <FileSignature className="w-3 h-3" /> وقّع
          </Button>
        )}
      </div>
    </div>
  );
});

ContractCard.displayName = 'ContractCard';
export default ContractCard;
