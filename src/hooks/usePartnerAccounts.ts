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
  total_shipment_value: number;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  shipments_count: number;
  last_transaction_date?: string;
  auto_linked?: boolean;
  first_transaction_date?: string;
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

  // Fetch auto-linked partners from partner_links table
  const { data: partnerLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ['partner-links', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // First get links
      const { data: links, error: linksError } = await supabase
        .from('partner_links')
        .select('id, partner_organization_id, external_partner_id, partner_type, status, auto_created, first_transaction_date')
        .eq('organization_id', organization.id)
        .eq('status', 'active');

      if (linksError) {
        console.error('Error fetching partner links:', linksError);
        return [];
      }

      // Get partner organization details
      const partnerIds = (links || [])
        .filter(l => l.partner_organization_id)
        .map(l => l.partner_organization_id);

      if (partnerIds.length === 0) return links || [];

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, organization_type, city, phone')
        .in('id', partnerIds);

      if (orgsError) {
        console.error('Error fetching partner organizations:', orgsError);
        return links || [];
      }

      // Merge data
      const orgMap = new Map((orgs || []).map(o => [o.id, o]));
      return (links || []).map(link => ({
        ...link,
        partner_organization: link.partner_organization_id ? orgMap.get(link.partner_organization_id) : null,
      }));
    },
    enabled: !!organization?.id,
  });

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

  // Fetch partner waste type prices
  const { data: wasteTypePrices = [] } = useQuery({
    queryKey: ['partner-waste-type-prices', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('partner_waste_types')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching waste type prices:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!organization?.id,
  });

  // Fetch shipment data for all linked partners
  const { data: shipmentData = new Map(), isLoading: shipmentsLoading } = useQuery({
    queryKey: ['partner-shipments-data', organization?.id, partnerLinks],
    queryFn: async () => {
      if (!organization?.id) return new Map();

      const partnerIds = partnerLinks
        .filter(pl => pl.partner_organization_id)
        .map(pl => pl.partner_organization_id);

      if (partnerIds.length === 0) return new Map();

      // Fetch shipments involving our org and any linked partner
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('id, generator_id, transporter_id, recycler_id, quantity, waste_type, waste_description, created_at, cancelled_at')
        .or(`generator_id.eq.${organization.id},transporter_id.eq.${organization.id},recycler_id.eq.${organization.id}`);

      if (error) {
        console.error('Error fetching shipments:', error);
        return new Map();
      }

      // Group by partner
      const partnerShipmentMap = new Map<string, { count: number; value: number; lastDate?: string }>();

      for (const shipment of shipments || []) {
        if (shipment.cancelled_at) continue;

        // Find which partner this shipment involves
        const involvedPartnerIds = [
          shipment.generator_id,
          shipment.transporter_id,
          shipment.recycler_id
        ].filter(id => id && id !== organization.id);

        for (const partnerId of involvedPartnerIds) {
          if (!partnerId || !partnerIds.includes(partnerId)) continue;

          const existing = partnerShipmentMap.get(partnerId) || { count: 0, value: 0 };
          const quantity = Number(shipment.quantity) || 0;
          
          // Find price for this waste type
          const wasteDesc = (shipment.waste_description || shipment.waste_type || '').toLowerCase();
          const priceData = wasteTypePrices.find(wt => {
            const wtName = (wt.waste_type || '').toLowerCase();
            return wt.partner_organization_id === partnerId && 
              (wasteDesc.includes(wtName) || wtName.includes(wasteDesc));
          });
          
          const pricePerUnit = priceData?.price_per_unit || 0;
          const value = pricePerUnit * quantity;

          partnerShipmentMap.set(partnerId, {
            count: existing.count + 1,
            value: existing.value + value,
            lastDate: shipment.created_at,
          });
        }
      }

      return partnerShipmentMap;
    },
    enabled: !!organization?.id && partnerLinks.length > 0,
  });

  // Fetch deposits for partners
  const { data: depositsData = new Map(), isLoading: depositsLoading } = useQuery({
    queryKey: ['partner-deposits-totals', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return new Map();

      const { data: deposits, error } = await supabase
        .from('deposits')
        .select('partner_organization_id, external_partner_id, amount')
        .eq('organization_id', organization.id);

      if (error) {
        console.error('Error fetching deposits:', error);
        return new Map();
      }

      const depositMap = new Map<string, number>();
      
      for (const deposit of deposits || []) {
        const partnerId = deposit.partner_organization_id || deposit.external_partner_id;
        if (partnerId) {
          const current = depositMap.get(partnerId) || 0;
          depositMap.set(partnerId, current + (Number(deposit.amount) || 0));
        }
      }

      return depositMap;
    },
    enabled: !!organization?.id,
  });

  // Fetch invoices for partners
  const { data: invoicesData = new Map(), isLoading: invoicesLoading } = useQuery({
    queryKey: ['partner-invoices-totals', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return new Map();

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('partner_organization_id, total_amount, paid_amount')
        .eq('organization_id', organization.id)
        .not('partner_organization_id', 'is', null);

      if (error) {
        console.error('Error fetching invoices:', error);
        return new Map();
      }

      const invoiceMap = new Map<string, { total: number; paid: number }>();
      
      for (const invoice of invoices || []) {
        if (!invoice.partner_organization_id) continue;
        const partnerId = invoice.partner_organization_id;
        const existing = invoiceMap.get(partnerId) || { total: 0, paid: 0 };
        invoiceMap.set(partnerId, {
          total: existing.total + (Number(invoice.total_amount) || 0),
          paid: existing.paid + (Number(invoice.paid_amount) || 0),
        });
      }

      return invoiceMap;
    },
    enabled: !!organization?.id,
  });

  // Build partner balances from partner_links
  const partnerBalances: PartnerBalance[] = partnerLinks
    .filter(link => link.partner_organization_id && (link as any).partner_organization)
    .map((link) => {
      const partnerId = link.partner_organization_id!;
      const partnerOrg = (link as any).partner_organization;
      const shipmentInfo = shipmentData instanceof Map ? shipmentData.get(partnerId) : null;
      const deposits = depositsData instanceof Map ? depositsData.get(partnerId) || 0 : 0;
      const invoiceData = invoicesData instanceof Map ? invoicesData.get(partnerId) : null;
      
      const totalShipmentValue = shipmentInfo?.value || 0;
      const totalPaid = deposits + (invoiceData?.paid || 0);
      const totalInvoiced = invoiceData?.total || 0;
      const balance = totalShipmentValue - totalPaid;

      return {
        id: link.id,
        partner_organization_id: partnerId,
        external_partner_id: null,
        isExternal: false,
        partner_organization: partnerOrg ? {
          id: partnerOrg.id,
          name: partnerOrg.name,
          organization_type: link.partner_type,
          city: partnerOrg.city,
          phone: partnerOrg.phone,
        } : null,
        total_shipment_value: totalShipmentValue,
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        balance: balance,
        shipments_count: shipmentInfo?.count || 0,
        last_transaction_date: shipmentInfo?.lastDate,
        auto_linked: link.auto_created,
        first_transaction_date: link.first_transaction_date,
      };
    });

  // Get external partners with their balances
  const getExternalPartnersWithBalances = (type: string): PartnerBalance[] => {
    return externalPartners
      .filter((ep) => ep.partner_type === type)
      .map((ep) => {
        const deposits = depositsData instanceof Map ? depositsData.get(ep.id) || 0 : 0;
        
        return {
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
          total_shipment_value: 0,
          total_invoiced: 0,
          total_paid: deposits,
          balance: -deposits,
          shipments_count: 0,
          last_transaction_date: undefined,
        };
      });
  };

  // Combine registered and external partners
  const getAllPartners = (type: string): PartnerBalance[] => {
    // Registered partners from partner_links
    const registered = partnerBalances.filter(
      (b) => b.partner_organization?.organization_type === type
    );

    // External partners of this type
    const external = getExternalPartnersWithBalances(type);

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
    partnerLinks,
    balancesLoading: linksLoading || shipmentsLoading || externalLoading || depositsLoading || invoicesLoading,
    partnerTypes,
    filteredBalances,
    calculateTotals,
    organizationType: organization?.organization_type,
  };
}
