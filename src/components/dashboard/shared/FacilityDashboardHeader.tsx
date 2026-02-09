import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import CreateShipmentButton from '../CreateShipmentButton';
import SmartRequestDialog from '../SmartRequestDialog';

interface FacilityDashboardHeaderProps {
  userName: string;
  orgName: string;
  orgLabel: string;
  icon: LucideIcon;
  iconGradient: string;
  facility?: {
    name?: string;
    is_verified?: boolean;
    facility_type?: string;
  } | null;
  showCreateShipment?: boolean;
  showSmartRequest?: boolean;
  onSmartWeightUpload?: () => void;
  onRefresh?: () => void;
}

const FacilityDashboardHeader = ({
  userName,
  orgName,
  orgLabel,
  icon: Icon,
  iconGradient,
  facility,
  showCreateShipment = true,
  showSmartRequest = true,
  onSmartWeightUpload,
  onRefresh,
}: FacilityDashboardHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {showCreateShipment && <CreateShipmentButton onSuccess={onRefresh} />}
        {showSmartRequest && <SmartRequestDialog buttonText="طلب تقارير" buttonVariant="outline" />}
        {onSmartWeightUpload && (
          <Button onClick={onSmartWeightUpload} variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            رفع الوزنة الذكي
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {facility && (
          <div className="flex items-center gap-2">
            <Badge variant={facility.is_verified ? 'default' : 'secondary'} className="gap-1">
              <Shield className="w-3 h-3" />
              {facility.is_verified ? 'منشأة معتمدة' : 'قيد التحقق'}
            </Badge>
            {facility.facility_type && (
              <Badge variant="outline">
                {facility.facility_type === 'landfill' ? 'مدفن' :
                 facility.facility_type === 'incinerator' ? 'محرقة' :
                 facility.facility_type === 'treatment' ? 'معالجة' : facility.facility_type}
              </Badge>
            )}
          </div>
        )}
        <div className="text-right">
          <h1 className="text-2xl font-bold">مرحباً، {userName}</h1>
          <p className="text-muted-foreground">
            {orgName} - {orgLabel}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg shrink-0`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default FacilityDashboardHeader;
