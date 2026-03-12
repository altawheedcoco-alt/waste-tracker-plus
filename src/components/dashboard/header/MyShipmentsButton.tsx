import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import ShipmentCard from '@/components/shipments/ShipmentCard';
import {
  Package, Search, Filter, Eye, RefreshCw, AlertCircle, Plus,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createWorkbook, jsonToSheet, writeFile } from '@/lib/excelExport';

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

const MyShipmentsButton = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { organization } = useAuth();
  const navigate = useNavigate();

  const orgId = organization?.id;
  const orgType = organization?.organization_type;

  const { data: shipments = [], isLoading, refetch } = useQuery({
    queryKey: ['my-shipments-header', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Build query based on org type
      let query = supabase
        .from('shipments')
        .select(`
          id, shipment_number, status, waste_type, quantity, unit,
          created_at, pickup_address, delivery_address, pickup_date,
          expected_delivery_date, delivered_at, notes,
          approved_at, collection_started_at, in_transit_at, confirmed_at,
          hazard_level, packaging_method, disposal_method,
          waste_description, generator_notes, recycler_notes,
          manual_driver_name, manual_vehicle_plate,
          generator:generator_id(name, email, phone, address, city, representative_name),
          transporter:transporter_id(name, email, phone, address, city, representative_name),
          recycler:recycler_id(name, email, phone, address, city, representative_name),
          driver:driver_id(license_number, vehicle_type, vehicle_plate, profile:profiles(full_name, phone))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by org role
      if (orgType === 'transporter') {
        query = query.eq('transporter_id', orgId);
      } else if (orgType === 'generator') {
        query = query.eq('generator_id', orgId);
      } else if (orgType === 'recycler' || orgType === 'disposal') {
        query = query.eq('recycler_id', orgId);
      }
      // admin sees all

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && open,
    staleTime: 30_000,
  });

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shipments.length };
    shipments.forEach((s: any) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return counts;
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    let result = shipments as any[];
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
        s.transporter?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shipments, searchQuery, activeStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportExcel = useCallback(async () => {
    if (filteredShipments.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }
    const exportData = filteredShipments.map((s: any) => ({
      'رقم الشحنة': s.shipment_number,
      'الحالة': STATUS_LABELS[s.status] || s.status,
      'نوع المخلف': s.waste_type,
      'الكمية': s.quantity,
      'الوحدة': s.unit,
      'المولد': s.generator?.name || '-',
      'الناقل': s.transporter?.name || '-',
      'المدور': s.recycler?.name || '-',
      'تاريخ الإنشاء': s.created_at ? new Date(s.created_at).toLocaleDateString('ar-EG') : '-',
    }));
    const wb = createWorkbook();
    jsonToSheet(wb, exportData, 'الشحنات');
    await writeFile(wb, `شحنات_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`تم تصدير ${filteredShipments.length} شحنة بنجاح`);
  }, [filteredShipments]);

  const totalCount = shipments.length;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative gap-1.5 px-2 sm:px-3"
            onClick={() => setOpen(true)}
          >
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline text-sm font-medium">شحناتي</span>
            {totalCount > 0 && open === false && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1 min-w-[1.25rem] justify-center">
                {totalCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>شحناتي</TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-hidden" dir="rtl">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b space-y-3">
              <SheetHeader className="text-right">
                <SheetTitle className="flex items-center gap-2 justify-end">
                  شحناتي
                  <Badge variant="secondary" className="text-xs">{filteredShipments.length}</Badge>
                </SheetTitle>
                <SheetDescription>الشحنات المدارة بواسطة مؤسستك</SheetDescription>
              </SheetHeader>

              {/* Actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="text-xs" onClick={handleExportExcel} disabled={filteredShipments.length === 0}>
                  <Download className="ml-1 h-3 w-3" />
                  تصدير
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => refetch()}>
                  <RefreshCw className="ml-1 h-3 w-3" />
                  تحديث
                </Button>
                <Button variant="ghost" size="sm" className="text-xs mr-auto" onClick={() => { setOpen(false); navigate('/dashboard/transporter-shipments'); }}>
                  <Eye className="ml-1 h-3 w-3" />
                  عرض الكل
                </Button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 flex-wrap justify-end">
                <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                {STATUS_TABS.map(tab => (
                  <Button
                    key={tab.value}
                    variant={activeStatus === tab.value ? 'default' : 'outline'}
                    size="sm"
                    className="text-[11px] h-6 px-2"
                    onClick={() => { setActiveStatus(tab.value); setCurrentPage(1); }}
                  >
                    {tab.label}
                    {(statusCounts[tab.value] ?? 0) > 0 && (
                      <Badge
                        variant={activeStatus === tab.value ? 'secondary' : 'outline'}
                        className="mr-1 text-[9px] h-3.5 px-1 min-w-[1rem] justify-center"
                      >
                        {statusCounts[tab.value]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="بحث برقم الشحنة، نوع المخلف، اسم الشريك..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pr-9 text-right h-8 text-sm"
                />
              </div>
            </div>

            {/* Shipments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-lg" />
                ))
              ) : paginatedShipments.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || activeStatus !== 'all' ? 'لا توجد نتائج مطابقة' : 'لا توجد شحنات حتى الآن'}
                  </p>
                  {!searchQuery && activeStatus === 'all' && (
                    <Button variant="eco" className="mt-4" size="sm" onClick={() => { setOpen(false); navigate('/dashboard/shipments/new'); }}>
                      <Plus className="ml-2 h-4 w-4" />
                      إنشاء شحنة
                    </Button>
                  )}
                </div>
              ) : (
                paginatedShipments.map((shipment: any) => (
                  <div
                    key={shipment.id}
                    className="rounded-lg border border-border/50 hover:border-primary/30 transition-all hover:shadow-sm overflow-hidden"
                  >
                    <ShipmentCard shipment={shipment} onStatusChange={() => refetch()} />
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MyShipmentsButton;
