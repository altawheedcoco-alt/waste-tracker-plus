import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, Plus, Search, ChevronLeft, ChevronRight, RefreshCw, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import BulkStatusChangeDropdown from '@/components/shipments/BulkStatusChangeDropdown';
import BulkCertificateButton from '@/components/bulk/BulkCertificateButton';
import { TransporterShipment } from '@/hooks/useTransporterDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface TransporterShipmentsListProps {
  shipments: TransporterShipment[];
  isLoading: boolean;
  onRefresh: () => void;
  statusFilter?: string;
}

const PAGE_SIZE = 5;

const STATUS_TABS = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديدة' },
  { value: 'approved', label: 'معتمدة' },
  { value: 'in_transit', label: 'قيد النقل' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'confirmed', label: 'مؤكدة' },
];

const STATUS_LABELS: Record<string, string> = {
  new: 'جديدة', approved: 'معتمدة', in_transit: 'قيد النقل',
  delivered: 'تم التسليم', confirmed: 'مؤكدة', cancelled: 'ملغاة',
};

const TransporterShipmentsList = ({ shipments, isLoading, onRefresh, statusFilter: externalStatusFilter }: TransporterShipmentsListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeStatus, setActiveStatus] = useState(externalStatusFilter || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync external filter
  useMemo(() => {
    if (externalStatusFilter) setActiveStatus(externalStatusFilter);
  }, [externalStatusFilter]);

  // Count per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shipments.length };
    shipments.forEach(s => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [shipments]);

  // Filter by status + search
  const filteredShipments = useMemo(() => {
    let result = shipments;
    if (activeStatus !== 'all') {
      result = result.filter(s => s.status === activeStatus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.shipment_number?.toLowerCase().includes(q) ||
        s.waste_type?.toLowerCase().includes(q) ||
        s.generator?.name?.toLowerCase().includes(q) ||
        s.recycler?.name?.toLowerCase().includes(q) ||
        s.driver?.profile?.full_name?.toLowerCase().includes(q) ||
        s.pickup_address?.toLowerCase().includes(q) ||
        s.delivery_address?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shipments, searchQuery, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setCurrentPage(1);
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [onRefresh]);

  const handleExportExcel = useCallback(() => {
    if (filteredShipments.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    const exportData = filteredShipments.map(s => ({
      'رقم الشحنة': s.shipment_number,
      'الحالة': STATUS_LABELS[s.status] || s.status,
      'نوع المخلف': s.waste_type,
      'الكمية': s.quantity,
      'الوحدة': s.unit,
      'المولد': s.generator?.name || '-',
      'المدور': s.recycler?.name || '-',
      'السائق': s.driver?.profile?.full_name || s.manual_driver_name || '-',
      'لوحة المركبة': s.driver?.vehicle_plate || s.manual_vehicle_plate || '-',
      'عنوان الاستلام': s.pickup_address || '-',
      'عنوان التسليم': s.delivery_address || '-',
      'تاريخ الإنشاء': s.created_at ? new Date(s.created_at).toLocaleDateString('ar-SA') : '-',
      'تاريخ التسليم': s.delivered_at ? new Date(s.delivered_at).toLocaleDateString('ar-SA') : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الشحنات');
    XLSX.writeFile(wb, `شحنات_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`تم تصدير ${filteredShipments.length} شحنة بنجاح`);
  }, [filteredShipments]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={filteredShipments.length === 0}
                className="text-xs sm:text-sm"
              >
                <Download className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                تصدير Excel
              </Button>
              <BulkCertificateButton
                shipments={paginatedShipments.map(s => ({
                  id: s.id, shipment_number: s.shipment_number, status: s.status,
                  created_at: s.created_at, waste_type: s.waste_type, quantity: s.quantity,
                  unit: s.unit, delivered_at: s.delivered_at, has_receipt: s.has_receipt,
                  generator: s.generator ? { name: s.generator.name, city: s.generator.city } : null,
                  transporter: s.transporter ? { name: s.transporter.name, city: s.transporter.city } : null,
                  recycler: s.recycler ? { name: s.recycler.name, city: s.recycler.city } : null,
                }))}
                type="receipt"
                onSuccess={onRefresh}
              />
              <BulkStatusChangeDropdown
                shipments={paginatedShipments.map(s => ({
                  id: s.id, status: s.status, created_at: s.created_at, waste_type: s.waste_type,
                }))}
                onStatusChange={onRefresh}
              />
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`ml-1 h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/transporter-shipments')}>
                <Eye className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Filter className="h-4 w-4 text-muted-foreground ml-1" />
            {STATUS_TABS.map(tab => (
              <Button
                key={tab.value}
                variant={activeStatus === tab.value ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2.5"
                onClick={() => handleStatusChange(tab.value)}
              >
                {tab.label}
                {(statusCounts[tab.value] ?? 0) > 0 && (
                  <Badge
                    variant={activeStatus === tab.value ? 'secondary' : 'outline'}
                    className="mr-1 text-[10px] h-4 px-1 min-w-[1.25rem] justify-center"
                  >
                    {statusCounts[tab.value]}
                  </Badge>
                )}
              </Button>
            ))}
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
              {searchQuery || activeStatus !== 'all' ? 'لا توجد نتائج مطابقة للفلتر' : 'لا توجد شحنات حتى الآن'}
            </p>
            {!searchQuery && activeStatus === 'all' && (
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
