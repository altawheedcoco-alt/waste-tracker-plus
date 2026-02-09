import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 5;

const TransporterShipmentsList = ({ shipments, isLoading, onRefresh }: TransporterShipmentsListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter shipments by search
  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return shipments;
    const q = searchQuery.toLowerCase();
    return shipments.filter(s =>
      s.shipment_number?.toLowerCase().includes(q) ||
      s.waste_type?.toLowerCase().includes(q) ||
      s.generator?.name?.toLowerCase().includes(q) ||
      s.recycler?.name?.toLowerCase().includes(q) ||
      s.driver?.profile?.full_name?.toLowerCase().includes(q) ||
      s.pickup_address?.toLowerCase().includes(q) ||
      s.delivery_address?.toLowerCase().includes(q)
    );
  }, [shipments, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <BulkCertificateButton
                shipments={paginatedShipments.map(s => ({
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
                shipments={paginatedShipments.map(s => ({
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
              <CardTitle className="flex items-center gap-2 justify-end">
                شحناتي
                <Badge variant="secondary" className="text-xs">{filteredShipments.length}</Badge>
              </CardTitle>
              <CardDescription>الشحنات المدارة بواسطة شركة النقل الخاصة بك</CardDescription>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الشحنة، نوع المخلف، اسم الشريك..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pr-9 text-right"
            />
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
        ) : paginatedShipments.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد شحنات حتى الآن'}
            </p>
            {!searchQuery && (
              <Button variant="eco" className="mt-4" onClick={() => navigate('/dashboard/shipments/new')}>
                <Plus className="ml-2 h-4 w-4" />
                إنشاء أول شحنة
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onStatusChange={onRefresh}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransporterShipmentsList;
