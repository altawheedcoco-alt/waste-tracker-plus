import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Building2,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type Contract, getStatusBadgeConfig, getContractTypeLabel } from '@/hooks/useContracts';

interface ContractCardProps {
  contract: Contract;
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  getContractStatus: (contract: Contract) => string;
  getDaysUntilExpiry: (contract: Contract) => number | null;
}

const statusIcons: Record<string, any> = {
  draft: FileText,
  active: CheckCircle2,
  pending: Clock,
  expired: XCircle,
  cancelled: XCircle,
};

const ContractCard = ({ 
  contract, 
  onView, 
  onEdit, 
  onDelete,
  getContractStatus,
  getDaysUntilExpiry 
}: ContractCardProps) => {
  const status = getContractStatus(contract);
  const daysUntilExpiry = getDaysUntilExpiry(contract);
  const isNearExpiry = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  const badgeConfig = getStatusBadgeConfig(status);
  const StatusIcon = statusIcons[status] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        "transition-all hover:shadow-md",
        isNearExpiry && "border-amber-500/50"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant={badgeConfig.variant} className="gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {badgeConfig.label}
                </Badge>
                <Badge variant="outline">{getContractTypeLabel(contract.contract_type)}</Badge>
                {isNearExpiry && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600 gap-1">
                    <AlertCircle className="w-3 h-3" />
                    ينتهي خلال {daysUntilExpiry} يوم
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg truncate">{contract.title}</h3>
              <p className="text-sm text-muted-foreground">{contract.contract_number}</p>
              {contract.partner_name && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3" />
                  {contract.partner_name}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {contract.start_date && (
                  <span>من: {format(new Date(contract.start_date), 'dd/MM/yyyy')}</span>
                )}
                {contract.end_date && (
                  <span>إلى: {format(new Date(contract.end_date), 'dd/MM/yyyy')}</span>
                )}
                {contract.value && (
                  <span className="font-medium text-foreground">
                    {contract.value.toLocaleString()} {contract.currency || 'EGP'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onView(contract)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onEdit(contract)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(contract.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContractCard;
