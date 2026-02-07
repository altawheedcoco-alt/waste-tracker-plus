import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  FileText,
  FileStack,
  Calendar,
  Filter,
  Loader2,
  CheckCircle2,
  Recycle,
  Truck,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import BulkCertificateDialog from './BulkCertificateDialog';

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  created_at: string;
  waste_type: string;
  quantity: number;
  unit?: string;
  delivered_at?: string | null;
  confirmed_at?: string | null;
  has_report?: boolean;
  has_receipt?: boolean;
  generator?: { name: string; city?: string } | null;
  transporter?: { name: string; city?: string } | null;
  recycler?: { name: string; city?: string } | null;
}

interface BulkCertificateButtonProps {
  shipments: Shipment[];
  type: 'receipt' | 'certificate';
  onSuccess?: () => void;
}

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

const BulkCertificateButton = ({ shipments, type, onSuccess }: BulkCertificateButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<Shipment[]>([]);

  const isReceipt = type === 'receipt';
  const icon = isReceipt ? <Truck className="w-4 h-4" /> : <Recycle className="w-4 h-4" />;
  const label = isReceipt ? 'شهادات استلام مجمعة' : 'شهادات تدوير مجمعة';

  // Get unique waste types
  const uniqueWasteTypes = [...new Set(shipments.map(s => s.waste_type))];

  // Get unique dates
  const uniqueDates = [...new Set(shipments.map(s => 
    format(new Date(s.created_at), 'yyyy-MM-dd')
  ))].sort().reverse().slice(0, 7);

  // Filter eligible shipments (not already certified)
  const getEligibleShipments = (targetShipments: Shipment[]) => {
    if (isReceipt) {
      // For receipts: must be delivered or confirmed, and not have receipt yet
      return targetShipments.filter(s => 
        ['delivered', 'confirmed', 'in_transit'].includes(s.status) && !s.has_receipt
      );
    } else {
      // For certificates: must be confirmed and not have report yet
      return targetShipments.filter(s => 
        ['delivered', 'confirmed'].includes(s.status) && !s.has_report
      );
    }
  };

  // Filter by waste type
  const getShipmentsByWasteType = (wasteType: string) => {
    return shipments.filter(s => s.waste_type === wasteType);
  };

  // Filter by date
  const getShipmentsByDate = (dateStr: string) => {
    return shipments.filter(s => 
      format(new Date(s.created_at), 'yyyy-MM-dd') === dateStr
    );
  };

  const handleSelectAll = () => {
    const eligible = getEligibleShipments(shipments);
    if (eligible.length > 0) {
      setSelectedShipments(eligible);
      setDialogOpen(true);
    }
  };

  const handleSelectByWasteType = (wasteType: string) => {
    const eligible = getEligibleShipments(getShipmentsByWasteType(wasteType));
    if (eligible.length > 0) {
      setSelectedShipments(eligible);
      setDialogOpen(true);
    }
  };

  const handleSelectByDate = (dateStr: string) => {
    const eligible = getEligibleShipments(getShipmentsByDate(dateStr));
    if (eligible.length > 0) {
      setSelectedShipments(eligible);
      setDialogOpen(true);
    }
  };

  const totalEligible = getEligibleShipments(shipments).length;

  if (totalEligible === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FileStack className="w-4 h-4" />
            {label}
            <Badge variant="secondary" className="mr-1">
              {totalEligible}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Issue all eligible */}
          <DropdownMenuItem onClick={handleSelectAll} className="gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>إصدار للكل ({totalEligible})</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* By waste type */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Filter className="w-4 h-4" />
              <span>حسب نوع المخلفات</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {uniqueWasteTypes.map(wasteType => {
                const count = getEligibleShipments(getShipmentsByWasteType(wasteType)).length;
                if (count === 0) return null;
                return (
                  <DropdownMenuItem 
                    key={wasteType} 
                    onClick={() => handleSelectByWasteType(wasteType)}
                    className="justify-between"
                  >
                    <span>{wasteTypeLabels[wasteType] || wasteType}</span>
                    <Badge variant="outline">{count}</Badge>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* By date */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Calendar className="w-4 h-4" />
              <span>حسب التاريخ</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {uniqueDates.map(dateStr => {
                const count = getEligibleShipments(getShipmentsByDate(dateStr)).length;
                if (count === 0) return null;
                return (
                  <DropdownMenuItem 
                    key={dateStr} 
                    onClick={() => handleSelectByDate(dateStr)}
                    className="justify-between"
                  >
                    <span>{format(new Date(dateStr), 'dd MMM yyyy', { locale: ar })}</span>
                    <Badge variant="outline">{count}</Badge>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkCertificateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shipments={selectedShipments}
        type={type}
        onSuccess={() => {
          setDialogOpen(false);
          onSuccess?.();
        }}
      />
    </>
  );
};

export default BulkCertificateButton;
