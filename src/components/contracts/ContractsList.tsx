import { FileText } from 'lucide-react';
import ContractCard from './ContractCard';
import { type Contract } from '@/hooks/useContracts';

interface ContractsListProps {
  contracts: Contract[];
  emptyMessage: string;
  filterContracts: (list: Contract[]) => Contract[];
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onDelete: (contractId: string) => void;
  getContractStatus: (contract: Contract) => string;
  getDaysUntilExpiry: (contract: Contract) => number | null;
}

const ContractsList = ({ 
  contracts, 
  emptyMessage,
  filterContracts,
  onView,
  onEdit,
  onDelete,
  getContractStatus,
  getDaysUntilExpiry
}: ContractsListProps) => {
  const filtered = filterContracts(contracts);
  
  if (filtered.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map(contract => (
        <ContractCard 
          key={contract.id} 
          contract={contract}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          getContractStatus={getContractStatus}
          getDaysUntilExpiry={getDaysUntilExpiry}
        />
      ))}
    </div>
  );
};

export default ContractsList;
