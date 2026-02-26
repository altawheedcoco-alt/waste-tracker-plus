import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  CheckSquare,
  CalendarIcon,
  Filter,
  ArrowRight,
  Loader2,
  Recycle,
} from 'lucide-react';
import {
  getAvailableNextStatuses,
  mapLegacyStatus,
  mapToDbStatus,
  wasteTypeLabels,
  type ShipmentStatus,
  type StatusConfig,
} from '@/lib/shipmentStatusConfig';

interface Shipment {
  id: string;
  status: string;
  created_at: string;
  waste_type: string;
}

interface RecyclerBulkStatusDropdownProps {
  shipments: Shipment[];
  onStatusChange: () => void;
}

const RecyclerBulkStatusDropdown = ({ shipments, onStatusChange }: RecyclerBulkStatusDropdownProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const uniqueWasteTypes = [...new Set(shipments.map(s => s.waste_type))];

  // Get available target statuses for recycler from all shipments
  const getAvailableTargetStatuses = (targetShipments: Shipment[]): StatusConfig[] => {
    const seen = new Set<string>();
    const result: StatusConfig[] = [];
    
    for (const s of targetShipments) {
      const mapped = mapLegacyStatus(s.status);
      const nextStatuses = getAvailableNextStatuses(mapped, 'recycler');
      for (const ns of nextStatuses) {
        if (!seen.has(ns.key)) {
          seen.add(ns.key);
          result.push(ns);
        }
      }
    }
    return result;
  };

  const getShipmentsByDate = (date: Date) => {
    return shipments.filter(s => isSameDay(new Date(s.created_at), date));
  };

  const getShipmentsByWasteType = (wasteType: string) => {
    return shipments.filter(s => s.waste_type === wasteType);
  };

  const getEligibleShipments = (targetShipments: Shipment[], targetStatusKey: string) => {
    return targetShipments.filter(s => {
      const mapped = mapLegacyStatus(s.status);
      const nextStatuses = getAvailableNextStatuses(mapped, 'recycler');
      return nextStatuses.some(ns => ns.key === targetStatusKey);
    });
  };

  const handleBulkStatusChange = async (targetShipments: Shipment[], targetStatusKey: string) => {
    const eligibleShipments = getEligibleShipments(targetShipments, targetStatusKey);
    
    if (eligibleShipments.length === 0) {
      toast.error('لا توجد شحنات قابلة للتحديث (تم تأكيدها مسبقاً أو غير جاهزة)');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const dbStatus = mapToDbStatus(targetStatusKey as ShipmentStatus);
      const updateData: Record<string, any> = { status: dbStatus };

      const timestampMap: Record<string, string> = {
        delivered: 'delivered_at',
        confirmed: 'confirmed_at',
      };
      if (timestampMap[dbStatus]) {
        updateData[timestampMap[dbStatus]] = now;
      }

      const shipmentIds = eligibleShipments.map(s => s.id);

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .in('id', shipmentIds);

      if (error) throw error;

      // Log status changes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileData) {
          const logs = shipmentIds.map(id => ({
            shipment_id: id,
            status: dbStatus as any,
            notes: `تحديث جماعي من الجهة المدورة - ${eligibleShipments.length} شحنة`,
            changed_by: profileData.id,
          }));

          await supabase.from('shipment_logs').insert(logs);
        }
      }

      const statusConfig = getAvailableTargetStatuses(targetShipments).find(s => s.key === targetStatusKey);
      toast.success(`تم تحديث ${eligibleShipments.length} شحنة إلى "${statusConfig?.labelAr || targetStatusKey}"`);
      onStatusChange();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالات');
    } finally {
      setLoading(false);
      setSelectedDate(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const selectedDateShipments = selectedDate ? getShipmentsByDate(selectedDate) : [];
  const allTargetStatuses = getAvailableTargetStatuses(shipments);

  if (allTargetStatuses.length === 0) return null;

  const renderStatusItems = (targetShipments: Shipment[]) => {
    const statuses = getAvailableTargetStatuses(targetShipments);
    return statuses.map((status) => {
      const StatusIcon = status.icon;
      return (
        <DropdownMenuItem
          key={status.key}
          onClick={() => handleBulkStatusChange(targetShipments, status.key)}
          className="flex items-center gap-2"
        >
          <StatusIcon className="h-4 w-4" />
          <span>{status.labelAr}</span>
          <ArrowRight className="h-3 w-3 mr-auto" />
        </DropdownMenuItem>
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || shipments.length === 0}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Recycle className="h-4 w-4 ml-2" />
          )}
          تأكيد الاستلام
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* All Shipments */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span>جميع الشحنات</span>
            <Badge variant="secondary" className="mr-auto">{shipments.length}</Badge>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {renderStatusItems(shipments)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* By Date */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>ليوم معين</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="pointer-events-auto"
                locale={ar}
              />
              {selectedDate && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm text-muted-foreground mb-2 text-center">
                    {format(selectedDate, 'PPP', { locale: ar })}
                    <Badge variant="secondary" className="mr-2">{selectedDateShipments.length} شحنة</Badge>
                  </p>
                  {selectedDateShipments.length > 0 ? (
                    <div className="space-y-1">
                      {getAvailableTargetStatuses(selectedDateShipments).map((status) => {
                        const StatusIcon = status.icon;
                        return (
                          <Button
                            key={status.key}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2"
                            onClick={() => handleBulkStatusChange(selectedDateShipments, status.key)}
                          >
                            <StatusIcon className="h-4 w-4" />
                            <span>{status.labelAr}</span>
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      لا توجد شحنات في هذا اليوم
                    </p>
                  )}
                </div>
              )}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* By Waste Type */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>حسب التصنيف</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {uniqueWasteTypes.map((wasteType) => {
              const wasteShipments = getShipmentsByWasteType(wasteType);
              return (
                <DropdownMenuSub key={wasteType}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2">
                    <span>{wasteTypeLabels[wasteType] || wasteType}</span>
                    <Badge variant="secondary" className="mr-auto">{wasteShipments.length}</Badge>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {renderStatusItems(wasteShipments)}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RecyclerBulkStatusDropdown;
