import { memo, useState } from 'react';
import { Truck, MapPin, Navigation, RefreshCw, FileSignature, Stamp as StampIcon } from 'lucide-react';
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
  onAction?: (action: string, id: string, data?: any) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  approved: { label: 'معتمدة', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  collecting: { label: 'جاري التجميع', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  in_transit: { label: 'قيد النقل', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
};

const ShipmentCard = memo(({ data, isOwn, compact, onAction }: ShipmentCardProps) => {
  const st = STATUS_MAP[data.status || ''] || { label: data.status || 'غير محدد', color: 'bg-muted text-muted-foreground' };

  return (
    <div className={cn(
      'rounded-xl border p-3 min-w-[240px] max-w-[300px] space-y-2',
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

      {/* Interactive Action Buttons */}
      {onAction && (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="h-7 text-[10px] gap-1"
            onClick={() => onAction('track', data.id, data)}
          >
            <Navigation className="w-3 h-3" /> تتبع
          </Button>
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="h-7 text-[10px] gap-1"
            onClick={() => onAction('change_status', data.id, data)}
          >
            <RefreshCw className="w-3 h-3" /> حالة
          </Button>
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="h-7 text-[10px] gap-1"
            onClick={() => onAction('sign_shipment', data.id, data)}
          >
            <FileSignature className="w-3 h-3" /> وقّع
          </Button>
          <Button
            size="sm"
            variant={isOwn ? 'secondary' : 'outline'}
            className="h-7 text-[10px] gap-1"
            onClick={() => onAction('stamp_shipment', data.id, data)}
          >
            <StampIcon className="w-3 h-3" /> اختم
          </Button>
        </div>
      )}

      {/* Fallback: view-only */}
      {!onAction && (
        <Button
          size="sm"
          variant={isOwn ? 'secondary' : 'outline'}
          className="w-full h-7 text-[11px] gap-1"
          onClick={() => window.open(`/dashboard/shipments/${data.id}`, '_blank')}
        >
          فتح التفاصيل
        </Button>
      )}
    </div>
  );
});

ShipmentCard.displayName = 'ShipmentCard';
export default ShipmentCard;
