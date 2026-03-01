import { memo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShareButton from '@/components/sharing/ShareButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Package, Building2, Truck, Recycle, MapPin, Calendar, User, CheckCircle, Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { STATUS_CONFIG, WASTE_TYPE_LABELS, HAZARD_LEVELS } from './shipmentConstants';

const LicenseComplianceBanner = lazy(() => import('@/components/wmis/LicenseComplianceBanner'));
const WMISEventsFeed = lazy(() => import('@/components/wmis/WMISEventsFeed'));

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  delivery_address: string;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  waste_description: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  approved_at: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  generator?: { id: string; name: string; city: string; address: string } | null;
  transporter?: { id: string; name: string; city: string } | null;
  recycler?: { id: string; name: string; city: string; address: string } | null;
  driver?: {
    id: string;
    vehicle_type: string;
    vehicle_plate: string;
    profile?: { full_name: string; phone: string };
  } | null;
  created_by_profile?: { full_name: string; email: string } | null;
}

interface ShipmentDetailsDialogProps {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint?: (shipment: Shipment) => void;
}

const ShipmentDetailsDialog = memo(({
  shipment,
  open,
  onOpenChange,
  onPrint,
}: ShipmentDetailsDialogProps) => {
  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              تفاصيل الشحنة {shipment.shipment_number}
            </DialogTitle>
            <ShareButton
              resourceType="shipment"
              resourceId={shipment.id}
              resourceTitle={shipment.shipment_number}
              size="sm"
              variant="ghost"
            />
          </div>
          <DialogDescription>جميع بيانات الشحنة والأطراف المعنية</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm text-muted-foreground">الحالة</label>
              <Badge className={STATUS_CONFIG[shipment.status]?.color || ''}>
                {STATUS_CONFIG[shipment.status]?.label}
              </Badge>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">نوع النفايات</label>
              <p className="font-medium">{WASTE_TYPE_LABELS[shipment.waste_type]}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">الكمية</label>
              <p className="font-medium">{shipment.quantity} {shipment.unit}</p>
            </div>
            {shipment.hazard_level && (
              <div>
                <label className="text-sm text-muted-foreground">مستوى الخطورة</label>
                <Badge className={HAZARD_LEVELS[shipment.hazard_level]?.color}>
                  {HAZARD_LEVELS[shipment.hazard_level]?.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Organizations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  الجهة المولدة
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm">
                <p className="font-medium">{shipment.generator?.name}</p>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {shipment.generator?.city}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{shipment.pickup_address}</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  الجهة الناقلة
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm">
                <p className="font-medium">{shipment.transporter?.name}</p>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {shipment.transporter?.city}
                </p>
                {shipment.driver && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      السائق: {shipment.driver.profile?.full_name || 'غير محدد'}
                    </p>
                    <p>المركبة: {shipment.driver.vehicle_type} - {shipment.driver.vehicle_plate}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Recycle className="h-4 w-4 text-primary" />
                  الجهة المدورة
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 text-sm">
                <p className="font-medium">{shipment.recycler?.name}</p>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {shipment.recycler?.city}
                </p>
                <p className="text-muted-foreground text-xs mt-1">{shipment.delivery_address}</p>
              </CardContent>
            </Card>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                <p className="text-sm font-medium">
                  {format(new Date(shipment.created_at), 'dd MMM yyyy hh:mm a', { locale: ar })}
                </p>
              </div>
            </div>
            {shipment.pickup_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ الاستلام</p>
                  <p className="text-sm font-medium">
                    {format(new Date(shipment.pickup_date), 'dd MMM yyyy', { locale: ar })}
                  </p>
                </div>
              </div>
            )}
            {shipment.approved_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ الاعتماد</p>
                  <p className="text-sm font-medium">
                    {format(new Date(shipment.approved_at), 'dd MMM yyyy hh:mm a', { locale: ar })}
                  </p>
                </div>
              </div>
            )}
            {shipment.delivered_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">تاريخ التسليم</p>
                  <p className="text-sm font-medium">
                    {format(new Date(shipment.delivered_at), 'dd MMM yyyy hh:mm a', { locale: ar })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipment.packaging_method && (
              <div>
                <label className="text-sm text-muted-foreground">طريقة التعبئة</label>
                <p className="font-medium">{shipment.packaging_method}</p>
              </div>
            )}
            {shipment.disposal_method && (
              <div>
                <label className="text-sm text-muted-foreground">طريقة التخلص</label>
                <p className="font-medium">{shipment.disposal_method}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {(shipment.waste_description || shipment.notes || shipment.generator_notes || shipment.recycler_notes) && (
            <div className="space-y-3">
              {shipment.waste_description && (
                <div>
                  <label className="text-sm text-muted-foreground">وصف النفايات</label>
                  <p className="bg-muted p-2 rounded text-sm mt-1">{shipment.waste_description}</p>
                </div>
              )}
              {shipment.notes && (
                <div>
                  <label className="text-sm text-muted-foreground">ملاحظات عامة</label>
                  <p className="bg-muted p-2 rounded text-sm mt-1">{shipment.notes}</p>
                </div>
              )}
              {shipment.generator_notes && (
                <div>
                  <label className="text-sm text-muted-foreground">ملاحظات المولد</label>
                  <p className="bg-muted p-2 rounded text-sm mt-1">{shipment.generator_notes}</p>
                </div>
              )}
              {shipment.recycler_notes && (
                <div>
                  <label className="text-sm text-muted-foreground">ملاحظات المدور</label>
                  <p className="bg-muted p-2 rounded text-sm mt-1">{shipment.recycler_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* WMIS: License Compliance & Events */}
          <Suspense fallback={null}>
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                التحقق من تراخيص WMIS
              </h4>
              <div className="space-y-2">
                {shipment.generator?.id && (
                  <LicenseComplianceBanner
                    organizationId={shipment.generator.id}
                    organizationName={shipment.generator.name}
                    wasteType={shipment.waste_type}
                    role="generator"
                    shipmentId={shipment.id}
                  />
                )}
                {shipment.transporter?.id && (
                  <LicenseComplianceBanner
                    organizationId={shipment.transporter.id}
                    organizationName={shipment.transporter.name}
                    wasteType={shipment.waste_type}
                    role="transporter"
                    shipmentId={shipment.id}
                  />
                )}
                {shipment.recycler?.id && (
                  <LicenseComplianceBanner
                    organizationId={shipment.recycler.id}
                    organizationName={shipment.recycler.name}
                    wasteType={shipment.waste_type}
                    role="recycler"
                    shipmentId={shipment.id}
                  />
                )}
              </div>
              <WMISEventsFeed shipmentId={shipment.id} compact />
            </div>
          </Suspense>

          {/* Creator Info */}
          {shipment.created_by_profile && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              <p>تم الإنشاء بواسطة: {shipment.created_by_profile.full_name} ({shipment.created_by_profile.email})</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
            {onPrint && (
              <Button variant="outline" onClick={() => {
                onPrint(shipment);
                onOpenChange(false);
              }}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ShipmentDetailsDialog.displayName = 'ShipmentDetailsDialog';

export default ShipmentDetailsDialog;
