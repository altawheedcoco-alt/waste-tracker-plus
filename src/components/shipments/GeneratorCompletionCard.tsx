import CameraArrivalProof from './CameraArrivalProof';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle2,
  Package,
  Truck,
  Recycle,
  Calendar,
  Scale,
  MapPin,
  FileCheck,
  Shield,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { wasteTypeLabels } from '@/lib/shipmentStatusConfig';
interface GeneratorCompletionCardProps {
  shipment: {
    id?: string;
    shipment_number: string;
    waste_type: string;
    quantity: number;
    unit?: string;
    status: string;
    created_at: string;
    delivered_at?: string | null;
    confirmed_at?: string | null;
    pickup_address?: string;
    delivery_address?: string;
    waste_description?: string;
    disposal_method?: string;
    generator?: { name: string; city?: string } | null;
    transporter?: { name: string; city?: string } | null;
    recycler?: { name: string; city?: string } | null;
    driver?: { profile?: { full_name?: string } | null; vehicle_plate?: string | null } | null;
  };
}

// wasteTypeLabels imported from '@/lib/shipmentStatusConfig'

const GeneratorCompletionCard = ({ shipment }: GeneratorCompletionCardProps) => {
  const isConfirmed = shipment.status === 'confirmed';
  const completionDate = shipment.confirmed_at || shipment.delivered_at;

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Badge className="bg-primary text-primary-foreground gap-1 text-sm px-3 py-1">
            <CheckCircle2 className="w-4 h-4" />
            {isConfirmed ? 'تم التأكيد والاستلام' : 'تم التسليم للمدوّر'}
          </Badge>
          <CardTitle className="text-lg flex items-center gap-2 text-primary dark:text-primary">
            <Shield className="w-5 h-5" />
            اكتمال دورة الشحنة
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground text-right mt-2">
          تم تسليم المخلفات بنجاح إلى جهة التدوير/التخلص. انتهت مسؤولية التتبع للجهة المولدة.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 border" dir="rtl">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
              <p className="text-sm font-medium">
                {format(new Date(shipment.created_at), 'dd MMM yyyy', { locale: ar })}
              </p>
            </div>
          </div>
          {completionDate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 border" dir="rtl">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الاكتمال</p>
                <p className="text-sm font-medium">
                  {format(new Date(completionDate), 'dd MMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 border" dir="rtl">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900">
              <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الكمية المسلّمة</p>
              <p className="text-sm font-medium">
                {shipment.quantity} {shipment.unit || 'كجم'} - {wasteTypeLabels[shipment.waste_type] || shipment.waste_type}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Parties Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" dir="rtl">
          {shipment.generator && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-muted-foreground">المولّد</p>
                <p className="text-sm font-semibold">{shipment.generator.name}</p>
                {shipment.generator.city && <p className="text-xs text-muted-foreground">{shipment.generator.city}</p>}
              </div>
            </div>
          )}
          {shipment.transporter && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">الناقل</p>
                <p className="text-sm font-semibold">{shipment.transporter.name}</p>
                {shipment.transporter.city && <p className="text-xs text-muted-foreground">{shipment.transporter.city}</p>}
              </div>
            </div>
          )}
          {shipment.recycler && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <Recycle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">المدوّر/المستلم</p>
                <p className="text-sm font-semibold">{shipment.recycler.name}</p>
                {shipment.recycler.city && <p className="text-xs text-muted-foreground">{shipment.recycler.city}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" dir="rtl">
          {shipment.pickup_address && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/80 border">
              <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">موقع الاستلام</p>
                <p className="text-sm">{shipment.pickup_address}</p>
              </div>
            </div>
          )}
          {shipment.delivery_address && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/80 border">
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">موقع التسليم</p>
                <p className="text-sm">{shipment.delivery_address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Arrival Proof */}
        {shipment.id && <CameraArrivalProof shipmentId={shipment.id} />}

        {/* Footer note */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed" dir="rtl">
          <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            يمكنك الاطلاع على كافة المستندات والإقرارات والشهادات المرتبطة بهذه الشحنة أدناه. لا يتطلب الأمر أي إجراء إضافي من طرفك.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneratorCompletionCard;
