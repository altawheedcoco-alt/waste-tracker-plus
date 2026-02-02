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
        return ['generator', 'recycler', 'guest'];
      case 'generator':
        return ['transporter', 'recycler', 'guest'];
      case 'recycler':
        return ['transporter', 'generator', 'guest'];
      default:
        return ['generator', 'recycler', 'transporter', 'guest'];
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

  // Fetch partners from shipments (auto-detected partners)
  const { data: shipmentPartners = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipment-partners', organization?.id, organization?.organization_type],
    queryFn: async () => {
      if (!organization?.id || !organization?.organization_type) return [];

      const orgType = organization.organization_type;
      let partnerIds: { id: string; type: string; org: any }[] = [];

      // Fetch shipments based on organization type
      if (orgType === 'transporter') {
        // Transporter sees generators and recyclers
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            generator_id,
            recycler_id,
            generator:organizations!shipments_generator_id_fkey(id, name, organization_type, city, phone),
            recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type, city, phone)
          `)
          .eq('transporter_id', organization.id);

        if (!error && shipments) {
          for (const s of shipments) {
            if (s.generator_id && s.generator) {
              partnerIds.push({ id: s.generator_id, type: 'generator', org: s.generator });
            }
            if (s.recycler_id && s.recycler) {
              partnerIds.push({ id: s.recycler_id, type: 'recycler', org: s.recycler });
            }
          }
        }
      } else if (orgType === 'generator') {
        // Generator sees transporters and recyclers
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            transporter_id,
            recycler_id,
            transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type, city, phone),
            recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type, city, phone)
          `)
          .eq('generator_id', organization.id);

        if (!error && shipments) {
          for (const s of shipments) {
            if (s.transporter_id && s.transporter) {
              partnerIds.push({ id: s.transporter_id, type: 'transporter', org: s.transporter });
            }
            if (s.recycler_id && s.recycler) {
              partnerIds.push({ id: s.recycler_id, type: 'recycler', org: s.recycler });
            }
          }
        }
      } else if (orgType === 'recycler') {
        // Recycler sees transporters and generators
        const { data: shipments, error } = await supabase
          .from('shipments')
          .select(`
            transporter_id,
            generator_id,
            transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type, city, phone),
            generator:organizations!shipments_generator_id_fkey(id, name, organization_type, city, phone)
          `)
          .eq('recycler_id', organization.id);

        if (!error && shipments) {
          for (const s of shipments) {
            if (s.transporter_id && s.transporter) {
              partnerIds.push({ id: s.transporter_id, type: 'transporter', org: s.transporter });
            }
            if (s.generator_id && s.generator) {
              partnerIds.push({ id: s.generator_id, type: 'generator', org: s.generator });
            }
          }
        }
      }

      // Deduplicate by partner id
      const uniquePartners = new Map<string, PartnerBalance>();
      for (const p of partnerIds) {
        if (!uniquePartners.has(p.id)) {
          uniquePartners.set(p.id, {
            id: p.id,
            partner_organization_id: p.id,
            external_partner_id: null,
            isExternal: false,
            partner_organization: p.org ? {
              id: p.org.id,
              name: p.org.name,
              organization_type: p.org.organization_type || p.type,
              city: p.org.city,
              phone: p.org.phone,
            } : null,
            total_invoiced: 0,
            total_paid: 0,
            balance: 0,
            last_transaction_date: undefined,
          });
        }
      }

      return Array.from(uniquePartners.values());
    },
    enabled: !!organization?.id && !!organization?.organization_type,
  });

  // Fetch partner balances from invoices and payments
  const { data: invoiceBalances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['partner-invoices', organization?.id],
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
      const partnerMap = new Map<string, { total_invoiced: number; total_paid: number; last_date?: string }>();

      for (const invoice of invoices || []) {
        if (!invoice.partner_organization_id) continue;

        const partnerId = invoice.partner_organization_id;
        const existing = partnerMap.get(partnerId);

        if (existing) {
          existing.total_invoiced += Number(invoice.total_amount) || 0;
          existing.total_paid += Number(invoice.paid_amount) || 0;
          if (invoice.issue_date && (!existing.last_date || invoice.issue_date > existing.last_date)) {
            existing.last_date = invoice.issue_date;
          }
        } else {
          partnerMap.set(partnerId, {
            total_invoiced: Number(invoice.total_amount) || 0,
            total_paid: Number(invoice.paid_amount) || 0,
            last_date: invoice.issue_date,
          });
        }
      }

      return partnerMap;
    },
    enabled: !!organization?.id,
  });

  // Merge shipment partners with invoice balances
  const partnerBalances: PartnerBalance[] = shipmentPartners.map((partner) => {
    const invoiceData = invoiceBalances instanceof Map ? invoiceBalances.get(partner.id) : null;
    return {
      ...partner,
      total_invoiced: invoiceData?.total_invoiced || 0,
      total_paid: invoiceData?.total_paid || 0,
      balance: (invoiceData?.total_invoiced || 0) - (invoiceData?.total_paid || 0),
      last_transaction_date: invoiceData?.last_date,
    };
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
    balancesLoading: balancesLoading || externalLoading || shipmentsLoading,
    partnerTypes,
    filteredBalances,
    calculateTotals,
    organizationType: organization?.organization_type,
  };
}
