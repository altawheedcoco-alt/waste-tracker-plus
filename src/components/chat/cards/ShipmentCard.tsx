import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShipmentCardProps {
  data: {
    id: string;
    shipment_number?: string;
    status?: string;
    waste_type?: string;
    origin_city?: string;
    destination_city?: string;
    weight?: number;
  };
  isOwn: boolean;
  compact?: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  in_transit: { label: 'قيد النقل', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  completed: { label: 'مكتملة', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

const ShipmentCard = memo(({ data, isOwn, compact }: ShipmentCardProps) => {
  const navigate = useNavigate();
  const st = STATUS_MAP[data.status || ''] || { label: data.status || 'غير محدد', color: 'bg-muted text-muted-foreground' };

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[220px] max-w-[280px] space-y-2',
      isOwn ? 'bg-white/10 border-white/20' : 'bg-muted/50 border-border'
    )}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn('text-[10px] py-0', st.color)}>{st.label}</Badge>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isOwn ? 'bg-white/15' : 'bg-emerald-500/10')}>
          <Truck className={cn('w-4 h-4', isOwn ? 'text-white' : 'text-emerald-600')} />
        </div>
      </div>
      <div>
        <p className={cn('text-xs font-bold', isOwn ? 'text-white' : 'text-foreground')}>
          شحنة #{data.shipment_number || data.id.slice(0, 8)}
        </p>
        {data.waste_type && (
          <p className={cn('text-[10px] mt-0.5', isOwn ? 'text-white/60' : 'text-muted-foreground')}>{data.waste_type}</p>
        )}
      </div>
      {(data.origin_city || data.destination_city) && !compact && (
        <div className={cn('flex items-center gap-1 text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          <MapPin className="w-3 h-3" />
          <span>{data.origin_city || '—'} ← {data.destination_city || '—'}</span>
        </div>
      )}
      {data.weight && !compact && (
        <p className={cn('text-[10px]', isOwn ? 'text-white/60' : 'text-muted-foreground')}>
          الوزن: {data.weight} كجم
        </p>
      )}
      <Button
        size="sm"
        variant={isOwn ? 'secondary' : 'outline'}
        className="w-full h-7 text-[11px] gap-1"
        onClick={() => navigate(`/dashboard/shipments/${data.id}`)}
      >
        <ExternalLink className="w-3 h-3" /> فتح التفاصيل
      </Button>
    </div>
  );
});

ShipmentCard.displayName = 'ShipmentCard';
export default ShipmentCard;
