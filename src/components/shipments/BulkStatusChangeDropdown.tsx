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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  CheckCircle2,
  Truck,
  Package,
  Clock,
  Loader2,
} from 'lucide-react';

interface Shipment {
  id: string;
  status: string;
  created_at: string;
  waste_type: string;
}

interface BulkStatusChangeDropdownProps {
  shipments: Shipment[];
  onStatusChange: () => void;
}

const statusOptions = [
  { value: 'approved', label: 'معتمدة', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  { value: 'in_transit', label: 'قيد النقل', icon: Truck, color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'تم التسليم', icon: Clock, color: 'bg-teal-100 text-teal-800' },
  { value: 'confirmed', label: 'مؤكدة', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-800' },
];

const wasteTypeLabels: Record<string, string> = {
  plastic: 'بلاستيك',
  paper: 'ورق',
  metal: 'معادن',
  glass: 'زجاج',
  electronic: 'إلكترونيات',
  organic: 'عضوية',
  chemical: 'كيميائية',
  medical: 'طبية',
  construction: 'مخلفات بناء',
  other: 'أخرى',
};

const BulkStatusChangeDropdown = ({ shipments, onStatusChange }: BulkStatusChangeDropdownProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Get unique waste types from shipments
  const uniqueWasteTypes = [...new Set(shipments.map(s => s.waste_type))];

  // Filter shipments by date
  const getShipmentsByDate = (date: Date) => {
    return shipments.filter(s => isSameDay(new Date(s.created_at), date));
  };

  // Filter shipments by waste type
  const getShipmentsByWasteType = (wasteType: string) => {
    return shipments.filter(s => s.waste_type === wasteType);
  };

  // Get eligible shipments for a specific status (only apply once - sequential flow)
  const getEligibleShipments = (targetShipments: Shipment[], targetStatus: string) => {
    // Define which current statuses can transition to the target status (sequential flow)
    const eligibleCurrentStatuses: Record<string, string[]> = {
      approved: ['new'],           // Only new can become approved
      in_transit: ['approved'],    // Only approved can become in_transit (collecting removed)
      delivered: ['in_transit'],   // Only in_transit can become delivered
      confirmed: ['delivered'],    // Only delivered can become confirmed
    };
    
    const allowedStatuses = eligibleCurrentStatuses[targetStatus] || [];
    return targetShipments.filter(s => allowedStatuses.includes(s.status));
  };

  // Bulk update status
  const handleBulkStatusChange = async (targetShipments: Shipment[], newStatus: string) => {
    // Filter to only eligible shipments
    const eligibleShipments = getEligibleShipments(targetShipments, newStatus);
    
    if (eligibleShipments.length === 0) {
      toast.error('لا توجد شحنات قابلة للتحديث (تم تحديثها مسبقاً أو غير جاهزة)');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const updateData: Record<string, any> = { status: newStatus };

      // Set timestamp based on status
      switch (newStatus) {
        case 'approved':
          updateData.approved_at = now;
          break;
        case 'in_transit':
          updateData.in_transit_at = now;
          break;
        case 'delivered':
          updateData.delivered_at = now;
          break;
        case 'confirmed':
          updateData.confirmed_at = now;
          break;
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
            status: newStatus as any,
            notes: `تحديث جماعي - ${eligibleShipments.length} شحنة`,
            changed_by: profileData.id,
          }));

          await supabase.from('shipment_logs').insert(logs);
        }
      }

      const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
      toast.success(`تم تحديث ${eligibleShipments.length} شحنة إلى "${statusLabel}"`);
      onStatusChange();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('حدث خطأ أثناء تحديث الحالات');
    } finally {
      setLoading(false);
      setSelectedDate(undefined);
      setShowDatePicker(false);
    }
  };

  // Handle date selection for filtering
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setShowDatePicker(false);
    }
  };

  const selectedDateShipments = selectedDate ? getShipmentsByDate(selectedDate) : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || shipments.length === 0}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <CheckSquare className="h-4 w-4 ml-2" />
          )}
          تغيير الحالة
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
            {statusOptions.map((status) => (
              <DropdownMenuItem
                key={status.value}
                onClick={() => handleBulkStatusChange(shipments, status.value)}
                className="flex items-center gap-2"
              >
                <status.icon className="h-4 w-4" />
                <span>{status.label}</span>
                <ArrowRight className="h-3 w-3 mr-auto" />
              </DropdownMenuItem>
            ))}
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
                      {statusOptions.map((status) => (
                        <Button
                          key={status.value}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => handleBulkStatusChange(selectedDateShipments, status.value)}
                        >
                          <status.icon className="h-4 w-4" />
                          <span>{status.label}</span>
                        </Button>
                      ))}
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
                    {statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => handleBulkStatusChange(wasteShipments, status.value)}
                        className="flex items-center gap-2"
                      >
                        <status.icon className="h-4 w-4" />
                        <span>{status.label}</span>
                        <ArrowRight className="h-3 w-3 mr-auto" />
                      </DropdownMenuItem>
                    ))}
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

export default BulkStatusChangeDropdown;
