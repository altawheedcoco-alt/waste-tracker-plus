import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  Eye,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Truck,
  Package,
  Calendar,
  Scale,
  ExternalLink,
} from 'lucide-react';

interface ReceiptCardProps {
  receipt: {
    id: string;
    receipt_number: string;
    pickup_date: string;
    waste_type: string;
    actual_weight: number | null;
    declared_weight: number | null;
    unit: string;
    status: string;
    shipment?: {
      id?: string;
      shipment_number: string;
    } | null;
    generator?: {
      id?: string;
      name: string;
    } | null;
    transporter?: {
      name: string;
    } | null;
    driver?: {
      profile?: {
        full_name: string;
      } | null;
    } | null;
  };
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  showTransporter?: boolean;
  showGenerator?: boolean;
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
  wood: 'أخشاب',
  hazardous: 'خطرة',
  other: 'أخرى',
};

const ReceiptCard = ({ 
  receipt, 
  onView, 
  onPrint,
  showTransporter = false,
  showGenerator = true 
}: ReceiptCardProps) => {
  const navigate = useNavigate();
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { 
          label: 'مؤكدة', 
          icon: CheckCircle2, 
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
        };
      case 'pending':
        return { 
          label: 'بانتظار التأكيد', 
          icon: Clock, 
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' 
        };
      case 'disputed':
        return { 
          label: 'متنازع عليها', 
          icon: AlertCircle, 
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
        };
      case 'cancelled':
        return { 
          label: 'ملغية', 
          icon: XCircle, 
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' 
        };
      default:
        return { 
          label: status, 
          icon: Clock, 
          className: 'bg-gray-100 text-gray-800' 
        };
    }
  };

  const statusConfig = getStatusConfig(receipt.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Receipt Icon & Number */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{receipt.receipt_number}</h3>
                  <Badge className={statusConfig.className}>
                    <StatusIcon className="w-3 h-3 ml-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                {receipt.shipment && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (receipt.shipment?.id) {
                        navigate(`/dashboard/shipments/${receipt.shipment.id}`);
                      }
                    }}
                    className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Package className="w-3 h-3" />
                    شحنة: {receipt.shipment.shipment_number}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onView(receipt.id)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onPrint(receipt.id)}>
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                تاريخ الاستلام
              </p>
              <p className="text-sm font-medium">
                {format(new Date(receipt.pickup_date), 'dd MMM yyyy', { locale: ar })}
              </p>
            </div>

            {/* Waste Type */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">نوع النفايات</p>
              <p className="text-sm font-medium">
                {wasteTypeLabels[receipt.waste_type] || receipt.waste_type}
              </p>
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Scale className="w-3 h-3" />
                الوزن
              </p>
              <p className="text-sm font-medium">
                {receipt.actual_weight || receipt.declared_weight || '-'} {receipt.unit}
              </p>
            </div>

            {/* Generator or Transporter */}
            {showGenerator && receipt.generator && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  الجهة المولدة
                </p>
                <p className="text-sm font-medium truncate">{receipt.generator.name}</p>
              </div>
            )}
            {showTransporter && receipt.transporter && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  الجهة الناقلة
                </p>
                <p className="text-sm font-medium truncate">{receipt.transporter.name}</p>
              </div>
            )}
          </div>

          {/* Driver Info */}
          {receipt.driver?.profile?.full_name && (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="w-4 h-4" />
              السائق: {receipt.driver.profile.full_name}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReceiptCard;
