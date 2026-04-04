import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Building2, Truck, Recycle, MapPin, AlertCircle,
  CheckCircle2, BadgeCheck, Lock,
} from 'lucide-react';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
import type { ShipmentData } from './ShipmentCardTypes';

interface ShipmentDataGridProps {
  shipment: ShipmentData;
  visibility: {
    canViewGeneratorInfo: boolean;
    canViewRecyclerInfo: boolean;
    isOwner: boolean;
  };
}

const ShipmentDataGrid = ({ shipment, visibility }: ShipmentDataGridProps) => {
  return (
    <div className="text-right min-w-0">
      {/* Organizations Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-sm">
        {visibility.canViewGeneratorInfo ? (
          <div className="flex items-center gap-1 justify-end text-muted-foreground">
            <span>{shipment.generator?.name || '-'}</span>
            <Building2 className="w-4 h-4" />
          </div>
        ) : !visibility.isOwner ? (
          <div className="flex items-center gap-1 justify-end text-muted-foreground/50">
            <span>محجوب</span><Lock className="w-3 h-3" />
          </div>
        ) : null}
        <div className="flex items-center gap-1 justify-end text-muted-foreground">
          <span>{shipment.transporter?.name || '-'}</span>
          <Truck className="w-4 h-4" />
        </div>
        {visibility.canViewRecyclerInfo ? (
          <div className="flex items-center gap-1 justify-end text-muted-foreground">
            <span>{shipment.recycler?.name || '-'}</span>
            <Recycle className="w-4 h-4" />
          </div>
        ) : !visibility.isOwner ? (
          <div className="flex items-center gap-1 justify-end text-muted-foreground/50">
            <span>محجوب</span><Lock className="w-3 h-3" />
          </div>
        ) : null}
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1.5 mt-3 text-xs border-t border-border/30 pt-3">
        <DataField label="النوع:" value={wasteTypeLabels[shipment.waste_type] || shipment.waste_type} bold />
        <DataField label="الكمية:" value={`${shipment.quantity} ${shipment.unit || 'كجم'}`} bold />
        <DataField label="الإنشاء:" value={format(new Date(shipment.created_at), 'PP', { locale: ar })} />
        {shipment.expected_delivery_date && <DataField label="التسليم المتوقع:" value={format(new Date(shipment.expected_delivery_date), 'PP', { locale: ar })} />}

        {shipment.pickup_address && (
          <div className="flex items-center gap-1.5 justify-end col-span-2">
            <span className="text-foreground truncate max-w-[200px]">{shipment.pickup_address}</span>
            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground shrink-0">الاستلام:</span>
          </div>
        )}
        {shipment.delivery_address && (
          <div className="flex items-center gap-1.5 justify-end col-span-2">
            <span className="text-foreground truncate max-w-[200px]">{shipment.delivery_address}</span>
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span className="text-muted-foreground shrink-0">التسليم:</span>
          </div>
        )}

        {(shipment.driver?.profile?.full_name || shipment.manual_driver_name) && (
          <DataField label="السائق:" value={shipment.driver?.profile?.full_name || shipment.manual_driver_name || ''} />
        )}
        {(shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate) && (
          <div className="flex items-center gap-1.5 justify-end">
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">{shipment.driver?.vehicle_plate || shipment.manual_vehicle_plate}</Badge>
            <span className="text-muted-foreground">اللوحة:</span>
          </div>
        )}
        {shipment.driver?.vehicle_type && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground">{shipment.driver.vehicle_type}</span>
            <Truck className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">المركبة:</span>
          </div>
        )}

        {shipment.hazard_level && (
          <div className="flex items-center gap-1.5 justify-end">
            <Badge className={cn("text-[10px] h-5 px-1.5",
              shipment.hazard_level === 'high' ? 'bg-destructive/20 text-destructive border-destructive/30' :
              shipment.hazard_level === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700' :
              'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
            )}>
              {shipment.hazard_level === 'high' ? 'عالي' : shipment.hazard_level === 'medium' ? 'متوسط' : 'منخفض'}
            </Badge>
            <AlertCircle className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">الخطورة:</span>
          </div>
        )}
        {shipment.packaging_method && <DataField label="التغليف:" value={shipment.packaging_method} />}
        {shipment.disposal_method && <DataField label="طريقة التخلص:" value={shipment.disposal_method} />}

        {shipment.pickup_date && <DataField label="موعد الاستلام:" value={format(new Date(shipment.pickup_date), 'PP', { locale: ar })} />}
        {shipment.approved_at && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground">{format(new Date(shipment.approved_at), 'Pp', { locale: ar })}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span className="text-muted-foreground">الاعتماد:</span>
          </div>
        )}
        {shipment.in_transit_at && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground">{format(new Date(shipment.in_transit_at), 'Pp', { locale: ar })}</span>
            <Truck className="w-3 h-3 text-blue-600" />
            <span className="text-muted-foreground">بدء النقل:</span>
          </div>
        )}
        {shipment.delivered_at && <DataField label="التسليم:" value={format(new Date(shipment.delivered_at), 'Pp', { locale: ar })} />}
        {shipment.confirmed_at && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground">{format(new Date(shipment.confirmed_at), 'Pp', { locale: ar })}</span>
            <BadgeCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-muted-foreground">التأكيد:</span>
          </div>
        )}

        {shipment.generator?.phone && visibility.canViewGeneratorInfo && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground font-mono text-[10px]" dir="ltr">{shipment.generator.phone}</span>
            <span className="text-muted-foreground">هاتف المولّد:</span>
          </div>
        )}
        {shipment.recycler?.phone && visibility.canViewRecyclerInfo && (
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-foreground font-mono text-[10px]" dir="ltr">{shipment.recycler.phone}</span>
            <span className="text-muted-foreground">هاتف المدوّر:</span>
          </div>
        )}
        {shipment.generator?.representative_name && visibility.canViewGeneratorInfo && <DataField label="ممثل المولّد:" value={shipment.generator.representative_name} />}
        {shipment.recycler?.representative_name && visibility.canViewRecyclerInfo && <DataField label="ممثل المدوّر:" value={shipment.recycler.representative_name} />}
      </div>

      {/* Notes */}
      {(shipment.notes || shipment.waste_description || shipment.generator_notes) && (
        <div className="mt-2 space-y-1 text-xs border-t border-border/30 pt-2">
          {shipment.waste_description && <NoteRow label="وصف المخلفات:" value={shipment.waste_description} />}
          {shipment.notes && <NoteRow label="ملاحظات:" value={shipment.notes} />}
          {shipment.generator_notes && visibility.canViewGeneratorInfo && <NoteRow label="ملاحظات المولّد:" value={shipment.generator_notes} />}
        </div>
      )}
    </div>
  );
};

const DataField = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-center gap-1.5 justify-end">
    <span className={cn("text-foreground", bold && "font-medium")}>{value}</span>
    <span className="text-muted-foreground">{label}</span>
  </div>
);

const NoteRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start gap-1.5 justify-end text-muted-foreground">
    <span className="text-foreground">{value}</span>
    <span className="shrink-0">{label}</span>
  </div>
);

export default ShipmentDataGrid;
