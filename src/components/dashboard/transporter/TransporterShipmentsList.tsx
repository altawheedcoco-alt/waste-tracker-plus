import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import BulkStatusChangeDropdown from '@/components/shipments/BulkStatusChangeDropdown';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';

interface TransporterShipmentsListProps {
  shipments: TransporterShipment[];
  isLoading: boolean;
  onRefresh: () => void;
}

const TransporterShipmentsList = ({ shipments, isLoading, onRefresh }: TransporterShipmentsListProps) => {
  const navigate = useNavigate();
  const recentShipments = shipments.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <BulkCertificateButton
              shipments={recentShipments.map(s => ({
                id: s.id,
                shipment_number: s.shipment_number,
                status: s.status,
                created_at: s.created_at,
                waste_type: s.waste_type,
                quantity: s.quantity,
                unit: s.unit,
                delivered_at: s.delivered_at,
                has_receipt: s.has_receipt,
                generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
              }))}
              type="receipt"
              onSuccess={onRefresh}
            />
            <BulkStatusChangeDropdown
              shipments={recentShipments.map(s => ({
                id: s.id,
                status: s.status,
                created_at: s.created_at,
                waste_type: s.waste_type,
              }))}
              onStatusChange={onRefresh}
            />
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/transporter-shipments')}>
              <Eye className="ml-2 h-4 w-4" />
              عرض الكل
            </Button>
          </div>
          <div className="text-right">
            <CardTitle>شحناتي</CardTitle>
            <CardDescription>الشحنات المدارة بواسطة شركة النقل الخاصة بك</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : recentShipments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">لا توجد شحنات حتى الآن</p>
            <Button variant="eco" className="mt-4" onClick={() => navigate('/dashboard/shipments/new')}>
              <Plus className="ml-2 h-4 w-4" />
              إنشاء أول شحنة
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onStatusChange={onRefresh}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransporterShipmentsList;
