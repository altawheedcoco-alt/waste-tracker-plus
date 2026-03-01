import { Package, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SharedShipmentViewProps {
  data: any;
  accessLevel: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_transit: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'قيد الانتظار',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغية',
  picked_up: 'تم الاستلام',
  confirmed: 'مؤكدة',
};

const SharedShipmentView = ({ data, accessLevel }: SharedShipmentViewProps) => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Status Card */}
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">رقم التتبع</p>
              <p className="font-bold text-lg" dir="ltr">{data.tracking_number}</p>
            </div>
          </div>
          <Badge className={statusColors[data.status] || 'bg-muted'}>
            {statusLabels[data.status] || data.status}
          </Badge>
        </div>

        {/* Route */}
        {(data.pickup_location || data.delivery_location) && (
          <div className="flex items-center gap-3 py-3 border-t">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{data.pickup_location || '—'}</span>
            <ArrowLeft className="w-4 h-4 text-muted-foreground shrink-0" />
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm">{data.delivery_location || '—'}</span>
          </div>
        )}

        {/* Waste Type */}
        {data.waste_type && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">نوع النفايات:</span>
            <span className="font-medium">{data.waste_type}</span>
            {data.quantity && <span className="text-muted-foreground">({data.quantity} {data.unit})</span>}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          {data.pickup_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">تاريخ الاستلام</p>
                <p className="font-medium">{new Date(data.pickup_date).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )}
          {data.delivery_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">تاريخ التسليم</p>
                <p className="font-medium">{new Date(data.delivery_date).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-bold mb-4">سجل الحركة</h3>
          <div className="space-y-4">
            {data.timeline.map((event: any, i: number) => (
              <div key={event.id || i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === data.timeline.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  {i < data.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium">{event.status || event.action}</p>
                  {event.notes && <p className="text-xs text-muted-foreground">{event.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.created_at).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extended info for linked users */}
      {accessLevel === 'linked' && data.notes && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="font-bold mb-2">ملاحظات</h3>
          <p className="text-sm text-muted-foreground">{data.notes}</p>
        </div>
      )}
    </div>
  );
};

export default SharedShipmentView;
