import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PartnerBalance {
  id: string;
  partner_organization_id: string | null;
  external_partner_id: string | null;
  isExternal: boolean;
  partner_organization: {
    id: string;
    name: string;
    organization_type: string;
    city?: string;
    phone?: string;
  } | null;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  last_transaction_date?: string;
}

export interface ExternalPartner {
  id: string;
  name: string;
  partner_type: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  commercial_register?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export function usePartnerAccounts() {
  const { organization } = useAuth();

  // Determine which partner types to show based on organization type
  const getPartnerTypes = () => {
    if (!organization?.organization_type) return [];
    
    switch (organization.organization_type) {
      case 'transporter':
        return ['generator', 'recycler'];
      case 'generator':
        return ['transporter', 'recycler'];
      case 'recycler':
        return ['transporter', 'generator'];
      default:
        return ['generator', 'recycler', 'transporter'];
    }
  };

  const partnerTypes = getPartnerTypes();

  // Fetch external partners
  const { data: externalPartners = [], isLoading: externalLoading } = useQuery({
    queryKey: ['external-partners', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('external_partners')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching external partners:', error);
        return [];
      }

      return data as ExternalPartner[];
    },
    enabled: !!organization?.id,
  });

  // Fetch partner balances from invoices and payments
  const { data: partnerBalances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['partner-accounts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get all invoices for this organization
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          id,
          partner_organization_id,
          partner_name,
          total_amount,
          paid_amount,
          status,
          issue_date,
          invoice_type,
          partner_organization:organizations!invoices_partner_organization_id_fkey(
            id,
            name,
            organization_type,
            city,
            phone
          )
        `)
        .eq('organization_id', organization.id)
        .not('partner_organization_id', 'is', null);

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        return [];
      }

      // Group by partner organization
      const partnerMap = new Map<string, PartnerBalance>();

      for (const invoice of invoices || []) {
        if (!invoice.partner_organization_id) continue;

        const partnerId = invoice.partner_organization_id;
        const existing = partnerMap.get(partnerId);

        if (existing) {
          existing.total_invoiced += Number(invoice.total_amount) || 0;
          existing.total_paid += Number(invoice.paid_amount) || 0;
          existing.balance = existing.total_invoiced - existing.total_paid;
          if (invoice.issue_date && (!existing.last_transaction_date || invoice.issue_date > existing.last_transaction_date)) {
            existing.last_transaction_date = invoice.issue_date;
          }
        } else {
          const partnerOrg = invoice.partner_organization as any;
          partnerMap.set(partnerId, {
            id: partnerId,
            partner_organization_id: partnerId,
            external_partner_id: null,
            isExternal: false,
            partner_organization: partnerOrg ? {
              id: partnerOrg.id,
              name: partnerOrg.name,
              organization_type: partnerOrg.organization_type,
              city: partnerOrg.city,
              phone: partnerOrg.phone,
            } : null,
            total_invoiced: Number(invoice.total_amount) || 0,
            total_paid: Number(invoice.paid_amount) || 0,
            balance: (Number(invoice.total_amount) || 0) - (Number(invoice.paid_amount) || 0),
            last_transaction_date: invoice.issue_date,
          });
        }
      }

      return Array.from(partnerMap.values());
    },
    enabled: !!organization?.id,
  });

  // Combine registered and external partners
  const getAllPartners = (type: string): PartnerBalance[] => {
    // Registered partners
    const registered = partnerBalances.filter(
      (b) => b.partner_organization?.organization_type === type
    );

    // External partners of this type
    const external: PartnerBalance[] = externalPartners
      .filter((ep) => ep.partner_type === type)
      .map((ep) => ({
        id: ep.id,
        partner_organization_id: null,
        external_partner_id: ep.id,
        isExternal: true,
        partner_organization: {
          id: ep.id,
          name: ep.name,
          organization_type: ep.partner_type,
          city: ep.city,
          phone: ep.phone,
        },
        total_invoiced: 0,
        total_paid: 0,
        balance: 0,
        last_transaction_date: undefined,
      }));

    // Combine and sort by name
    return [...registered, ...external].sort((a, b) => 
      (a.partner_organization?.name || '').localeCompare(b.partner_organization?.name || '')
    );
  };

  // Filter by partner type
  const filteredBalances = (type: string) => {
    return getAllPartners(type);
  };

  // Calculate totals
  const calculateTotals = (balances: PartnerBalance[]) => {
    const totalReceivables = balances
      .filter((b) => b.balance > 0)
      .reduce((sum, b) => sum + b.balance, 0);
    
    const totalPayables = balances
      .filter((b) => b.balance < 0)
      .reduce((sum, b) => sum + Math.abs(b.balance), 0);

    return { totalReceivables, totalPayables };
  };

  return {
    partnerBalances,
    externalPartners,
    balancesLoading: balancesLoading || externalLoading,
    partnerTypes,
    filteredBalances,
    calculateTotals,
    organizationType: organization?.organization_type,
  };
}
