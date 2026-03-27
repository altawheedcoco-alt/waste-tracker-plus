import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isPast, isToday, differenceInDays } from 'date-fns';
import { type ContractorType } from '@/lib/contract-logic/contractEntityResolver';
import { type SigningMethod } from '@/lib/contract-logic/contractSigningTypes';

export interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description: string | null;
  organization_id: string;
  partner_organization_id: string | null;
  partner_name: string | null;
  contract_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  value: number | null;
  currency: string | null;
  terms: string | null;
  notes: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  partner_organization?: { name: string } | null;
  contractor_type?: string;
  external_legal_name?: string;
  external_tax_id?: string;
  external_commercial_register?: string;
  external_address?: string;
  external_representative?: string;
  external_phone?: string;
  external_email?: string;
  signing_method?: string;
  party_one_signature_url?: string;
  party_two_signature_url?: string;
  share_token?: string;
}

export interface ContractFormData {
  title: string;
  description: string;
  partner_name: string;
  contract_type: string;
  status: string;
  start_date: Date | undefined;
  end_date: Date | undefined;
  value: string;
  terms: string;
  notes: string;
  contractor_type: ContractorType;
  partner_organization_id: string;
  external_legal_name: string;
  external_tax_id: string;
  external_commercial_register: string;
  external_address: string;
  external_representative: string;
  external_phone: string;
  external_email: string;
  signing_method: SigningMethod;
}

const initialFormData: ContractFormData = {
  title: '',
  description: '',
  partner_name: '',
  contract_type: 'service',
  status: 'draft',
  start_date: undefined,
  end_date: undefined,
  value: '',
  terms: '',
  notes: '',
  contractor_type: 'internal',
  partner_organization_id: '',
  external_legal_name: '',
  external_tax_id: '',
  external_commercial_register: '',
  external_address: '',
  external_representative: '',
  external_phone: '',
  external_email: '',
  signing_method: 'none',
};

export const useContracts = () => {
  const { organization } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);

  useEffect(() => {
    if (organization?.id) {
      fetchContracts();
    }
  }, [organization?.id]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          partner_organization:organizations!contracts_partner_organization_id_fkey(name)
        `)
        .or(`organization_id.eq.${organization?.id},partner_organization_id.eq.${organization?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast.error('حدث خطأ أثناء جلب العقود');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error('يرجى إدخال عنوان العقد');
      return;
    }

    setSaving(true);
    try {
      const contractData: any = {
        title: formData.title,
        description: formData.description || null,
        partner_name: formData.contractor_type === 'internal' ? formData.partner_name : formData.external_legal_name || null,
        contract_type: formData.contract_type,
        status: formData.status,
        start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : null,
        end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : null,
        value: formData.value ? parseFloat(formData.value) : null,
        terms: formData.terms || null,
        notes: formData.notes || null,
        organization_id: organization?.id,
        contractor_type: formData.contractor_type,
        partner_organization_id: formData.contractor_type === 'internal' && formData.partner_organization_id ? formData.partner_organization_id : null,
        signing_method: formData.signing_method,
      };

      // Add external entity fields
      if (formData.contractor_type === 'external') {
        contractData.external_legal_name = formData.external_legal_name || null;
        contractData.external_tax_id = formData.external_tax_id || null;
        contractData.external_commercial_register = formData.external_commercial_register || null;
        contractData.external_address = formData.external_address || null;
        contractData.external_representative = formData.external_representative || null;
        contractData.external_phone = formData.external_phone || null;
        contractData.external_email = formData.external_email || null;
      }

      if (isEditing && selectedContract) {
        const { error } = await supabase
          .from('contracts')
          .update(contractData)
          .eq('id', selectedContract.id);

        if (error) throw error;
        toast.success('تم تحديث العقد بنجاح');
      } else {
        const { data: newContract, error } = await supabase
          .from('contracts')
          .insert(contractData)
          .select('id')
          .single();

        if (error) throw error;
        toast.success('تم إضافة العقد بنجاح');

        // Fire contract_created notification
        if (newContract) {
          try {
            const { notifyContractEvent } = await import('@/services/notificationTriggers');
            await notifyContractEvent({
              type: 'contract_created',
              contractId: newContract.id,
              contractTitle: formData.title,
              orgId: organization?.id || '',
              partnerOrgId: contractData.partner_organization_id,
            });
          } catch (e) { console.error('Contract notification error:', e); }
        }
      }

      setShowAddDialog(false);
      resetForm();
      fetchContracts();
    } catch (error) {
      console.error('Error saving contract:', error);
      toast.error('حدث خطأ أثناء حفظ العقد');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contractId: string) => {

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;
      toast.success('تم حذف العقد بنجاح');
      fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      toast.error('حدث خطأ أثناء حذف العقد');
    }
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setFormData({
      title: contract.title,
      description: contract.description || '',
      partner_name: contract.partner_name || '',
      contract_type: contract.contract_type,
      status: contract.status,
      start_date: contract.start_date ? new Date(contract.start_date) : undefined,
      end_date: contract.end_date ? new Date(contract.end_date) : undefined,
      value: contract.value?.toString() || '',
      terms: contract.terms || '',
      notes: contract.notes || '',
      contractor_type: (contract.contractor_type as ContractorType) || 'internal',
      partner_organization_id: contract.partner_organization_id || '',
      external_legal_name: contract.external_legal_name || '',
      external_tax_id: contract.external_tax_id || '',
      external_commercial_register: contract.external_commercial_register || '',
      external_address: contract.external_address || '',
      external_representative: contract.external_representative || '',
      external_phone: contract.external_phone || '',
      external_email: contract.external_email || '',
      signing_method: (contract.signing_method as SigningMethod) || 'none',
    });
    setIsEditing(true);
    setShowAddDialog(true);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedContract(null);
    setIsEditing(false);
  };

  const getContractStatus = (contract: Contract) => {
    if (!contract.end_date) return contract.status;
    const endDate = new Date(contract.end_date);
    if (isPast(endDate) && !isToday(endDate)) return 'expired';
    return contract.status;
  };

  const getDaysUntilExpiry = (contract: Contract) => {
    if (!contract.end_date) return null;
    return differenceInDays(new Date(contract.end_date), new Date());
  };

  // Filter contracts by status
  const expiredContracts = contracts.filter(c => getContractStatus(c) === 'expired');
  const activeContracts = contracts.filter(c => getContractStatus(c) === 'active');
  const pendingContracts = contracts.filter(c => ['pending', 'draft'].includes(getContractStatus(c)));

  // Search filter
  const filterContracts = (list: Contract[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(c => 
      c.title.toLowerCase().includes(query) ||
      c.contract_number.toLowerCase().includes(query) ||
      c.partner_name?.toLowerCase().includes(query)
    );
  };

  return {
    // State
    contracts,
    loading,
    searchQuery,
    setSearchQuery,
    showAddDialog,
    setShowAddDialog,
    showViewDialog,
    setShowViewDialog,
    selectedContract,
    setSelectedContract,
    isEditing,
    saving,
    formData,
    setFormData,
    
    // Computed
    expiredContracts,
    activeContracts,
    pendingContracts,
    
    // Actions
    handleSubmit,
    handleDelete,
    handleEdit,
    resetForm,
    getContractStatus,
    getDaysUntilExpiry,
    filterContracts,
  };
};

export const getStatusBadgeConfig = (status: string) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'مسودة', variant: 'outline' },
    active: { label: 'ساري', variant: 'default' },
    pending: { label: 'قيد العمل', variant: 'secondary' },
    expired: { label: 'منتهي', variant: 'destructive' },
    cancelled: { label: 'ملغي', variant: 'destructive' },
  };
  return statusConfig[status] || statusConfig.draft;
};

export const getContractTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    service: 'عقد خدمة',
    supply: 'عقد توريد',
    partnership: 'عقد شراكة',
    maintenance: 'عقد صيانة',
    transport: 'عقد نقل',
    recycling: 'عقد تدوير',
    other: 'أخرى',
  };
  return types[type] || type;
};
