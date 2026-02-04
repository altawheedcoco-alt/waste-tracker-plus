import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { type Contract, getStatusBadgeConfig, getContractTypeLabel } from '@/hooks/useContracts';

interface ContractViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  getContractStatus: (contract: Contract) => string;
}

const ContractViewDialog = ({
  open,
  onOpenChange,
  contract,
  getContractStatus,
}: ContractViewDialogProps) => {
  if (!contract) return null;

  const status = getContractStatus(contract);
  const badgeConfig = getStatusBadgeConfig(status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {contract.title}
            <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">رقم العقد:</span>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <span className="text-muted-foreground">نوع العقد:</span>
              <p className="font-medium">{getContractTypeLabel(contract.contract_type)}</p>
            </div>
            {contract.partner_name && (
              <div>
                <span className="text-muted-foreground">الطرف الآخر:</span>
                <p className="font-medium">{contract.partner_name}</p>
              </div>
            )}
            {contract.value && (
              <div>
                <span className="text-muted-foreground">القيمة:</span>
                <p className="font-medium">{contract.value.toLocaleString()} {contract.currency || 'EGP'}</p>
              </div>
            )}
            {contract.start_date && (
              <div>
                <span className="text-muted-foreground">تاريخ البداية:</span>
                <p className="font-medium">{format(new Date(contract.start_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
            {contract.end_date && (
              <div>
                <span className="text-muted-foreground">تاريخ الانتهاء:</span>
                <p className="font-medium">{format(new Date(contract.end_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </div>

          {contract.description && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">الوصف:</span>
                <p className="mt-1">{contract.description}</p>
              </div>
            </>
          )}

          {contract.terms && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">الشروط والأحكام:</span>
                <p className="mt-1 whitespace-pre-wrap">{contract.terms}</p>
              </div>
            </>
          )}

          {contract.notes && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">ملاحظات:</span>
                <p className="mt-1">{contract.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContractViewDialog;
