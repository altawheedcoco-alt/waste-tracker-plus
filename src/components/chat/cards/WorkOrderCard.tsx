import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ExternalLink, MapPin, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkOrderCardProps {
  data: {
    id: string;
    order_number?: string;
    waste_type?: string;
    status?: string;
    urgency?: string;
    pickup_location?: string;
    estimated_quantity?: number;
    unit?: string;
    is_hazardous?: boolean;
  };
  isOwn: boolean;
}

const URGENCY_COLOR: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  normal: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const WorkOrderCard = memo(({ data, isOwn }: WorkOrderCardProps) => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', URGENCY_COLOR[data.urgency || 'normal'] || URGENCY_COLOR.normal)}>
          {data.urgency || data.status || 'عادي'}
        </Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-cyan-500/10')}>
          <Briefcase className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-cyan-600')} />
        </div>
      </div>
      <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
        أمر عمل #{data.order_number || data.id.slice(0, 8)}
      </p>
      {data.waste_type && <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>{data.waste_type}</p>}
      {data.estimated_quantity && (
        <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          الكمية: {Number(data.estimated_quantity).toLocaleString()} {data.unit || 'كجم'}
        </p>
      )}
      {data.pickup_location && (
        <div className={cn('flex items-center gap-1 text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          <MapPin className="w-3 h-3" /><span className="truncate">{data.pickup_location}</span>
        </div>
      )}
      {data.is_hazardous && (
        <div className="flex items-center gap-1 text-[10px] text-red-600">
          <AlertTriangle className="w-3 h-3" /><span>مواد خطرة ⚠️</span>
        </div>
      )}
      <Button size="sm" variant={isOwn ? 'secondary' : 'outline'} className="w-full h-7 text-[11px] gap-1" onClick={() => navigate('/dashboard/work-orders')}>
        <ExternalLink className="w-3 h-3" /> فتح التفاصيل
      </Button>
    </div>
  );
});

WorkOrderCard.displayName = 'WorkOrderCard';
export default WorkOrderCard;
