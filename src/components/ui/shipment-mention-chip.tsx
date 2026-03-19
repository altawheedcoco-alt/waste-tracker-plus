import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { wasteTypeLabels, getStatusConfig, mapLegacyStatus } from '@/lib/shipmentStatusConfig';

interface ShipmentMentionChipProps {
  shipmentNumber: string;
  shipmentId?: string;
  status?: string;
  wasteType?: string;
  inline?: boolean;
  className?: string;
}

const ShipmentMentionChip = ({
  shipmentNumber,
  shipmentId,
  status,
  wasteType,
  inline = true,
  className,
}: ShipmentMentionChipProps) => {
  const navigate = useNavigate();
  const statusConfig = status ? getStatusConfig(mapLegacyStatus(status)) : null;
  const wasteLabel = wasteType ? (wasteTypeLabels as Record<string, string>)[wasteType] || wasteType : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shipmentId) {
      navigate(`/dashboard/shipments?highlight=${shipmentId}`);
    }
  };

  if (inline) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium',
          'bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer',
          'border border-primary/20',
          className
        )}
      >
        <Package className="w-3 h-3" />
        <span dir="ltr">{shipmentNumber}</span>
      </button>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors',
        className
      )}
    >
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Truck className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 text-right">
        <p className="text-xs font-semibold text-primary" dir="ltr">#{shipmentNumber}</p>
        <div className="flex items-center gap-1 justify-end mt-0.5">
          {statusConfig && (
            <Badge variant="outline" className="text-[9px] py-0 h-4">
              {statusConfig.label}
            </Badge>
          )}
          {wasteLabel && (
            <span className="text-[10px] text-muted-foreground">{wasteLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export { ShipmentMentionChip };
