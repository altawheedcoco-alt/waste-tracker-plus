import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus, AlertCircle } from 'lucide-react';
import ShipmentCard from '@/components/shipments/ShipmentCard';

interface RecentShipment {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  pickup_address: string;
  delivery_address: string;
  pickup_date: string | null;
  expected_delivery_date: string | null;
  notes: string | null;
  generator_notes: string | null;
  recycler_notes: string | null;
  waste_description: string | null;
  hazard_level: string | null;
  packaging_method: string | null;
  disposal_method: string | null;
  approved_at: string | null;
  collection_started_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  confirmed_at: string | null;
  manual_driver_name: string | null;
  manual_vehicle_plate: string | null;
  generator: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  transporter: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  recycler: { name: string; email: string; phone: string; address: string; city: string; representative_name: string | null } | null;
  driver: { license_number: string; vehicle_type: string | null; vehicle_plate: string | null; profile: { full_name: string; phone: string | null } } | null;
}

interface AdminRecentShipmentsProps {
  shipments: RecentShipment[];
  onRefresh: () => void;
}

const AdminRecentShipments = ({ shipments, onRefresh }: AdminRecentShipmentsProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/shipments')}>
            <Eye className="ml-2 h-4 w-4" />
            عرض الكل
          </Button>
          <div className="text-right">
            <CardTitle>الشحنات الأخيرة</CardTitle>
            <CardDescription>أحدث الشحنات في النظام</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {shipments.length === 0 ? (
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
            {shipments.map((shipment) => (
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

export default AdminRecentShipments;
