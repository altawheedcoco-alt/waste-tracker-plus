import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AwardLetterCardProps {
  data: {
    id: string;
    letter_number?: string;
    title?: string;
    status?: string;
    total_estimated_quantity?: number;
    start_date?: string;
    end_date?: string;
  };
  isOwn: boolean;
}

const AwardLetterCard = memo(({ data, isOwn }: AwardLetterCardProps) => {
  const navigate = useNavigate();
  const isPending = data.status === 'pending' || data.status === 'draft';

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20')}>
          {isPending ? 'قيد المراجعة' : data.status || 'نشط'}
        </Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-orange-500/10')}>
          <Award className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-orange-600')} />
        </div>
      </div>
      <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
        خطاب ترسية #{data.letter_number || data.id.slice(0, 8)}
      </p>
      {data.title && <p className={cn('text-[10px] truncate', isOwn ? 'text-white/60' : 'text-muted-foreground')}>{data.title}</p>}
      {data.total_estimated_quantity && (
        <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          الكمية التقديرية: {Number(data.total_estimated_quantity).toLocaleString()}
        </p>
      )}
      {(data.start_date || data.end_date) && (
        <div className={cn('flex items-center gap-1 text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          <Calendar className="w-3 h-3" />
          <span>{data.start_date ? new Date(data.start_date).toLocaleDateString('ar-EG') : ''} — {data.end_date ? new Date(data.end_date).toLocaleDateString('ar-EG') : ''}</span>
        </div>
      )}
      <Button size="sm" variant={isOwn ? 'secondary' : 'outline'} className="w-full h-7 text-[11px] gap-1" onClick={() => navigate('/dashboard/contracts')}>
        <ExternalLink className="w-3 h-3" /> عرض التفاصيل
      </Button>
    </div>
  );
});

AwardLetterCard.displayName = 'AwardLetterCard';
export default AwardLetterCard;
