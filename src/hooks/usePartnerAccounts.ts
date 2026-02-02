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

  // Fetch partners from shipments with full data
  const { data: shipmentPartners = [], isLoading: shipmentsLoading } = useQuery({
    queryKey: ['shipment-partners-full', organization?.id, organization?.organization_type, wasteTypePrices],
    queryFn: async () => {
      if (!organization?.id || !organization?.organization_type) return [];

      const orgType = organization.organization_type;
      
      // Fetch all shipments for this organization
      let shipmentsQuery = supabase.from('shipments').select(`
        id,
        shipment_number,
        generator_id,
        transporter_id,
        recycler_id,
        quantity,
        unit,
        waste_type,
        waste_description,
        created_at,
        cancelled_at,
        generator:organizations!shipments_generator_id_fkey(id, name, organization_type, city, phone),
        transporter:organizations!shipments_transporter_id_fkey(id, name, organization_type, city, phone),
        recycler:organizations!shipments_recycler_id_fkey(id, name, organization_type, city, phone)
      `);

      if (orgType === 'transporter') {
        shipmentsQuery = shipmentsQuery.eq('transporter_id', organization.id);
      } else if (orgType === 'generator') {
        shipmentsQuery = shipmentsQuery.eq('generator_id', organization.id);
      } else if (orgType === 'recycler') {
        shipmentsQuery = shipmentsQuery.eq('recycler_id', organization.id);
      }

      const { data: shipments, error } = await shipmentsQuery;

      if (error) {
        console.error('Error fetching shipments:', error);
        return [];
      }

      // Group shipments by partner
      const partnerMap = new Map<string, {
        org: any;
        type: string;
        shipments: any[];
      }>();

      for (const shipment of shipments || []) {
        // Determine partner based on org type
        let partnerId: string | null = null;
        let partnerOrg: any = null;
        let partnerType = '';

        if (orgType === 'transporter') {
          // Transporter sees generators and recyclers
          if (shipment.generator_id && shipment.generator) {
            partnerId = shipment.generator_id;
            partnerOrg = shipment.generator;
            partnerType = 'generator';
          }
          // Also add recycler as separate partner
          if (shipment.recycler_id && shipment.recycler) {
            const recyclerKey = shipment.recycler_id;
            if (!partnerMap.has(recyclerKey)) {
              partnerMap.set(recyclerKey, {
                org: shipment.recycler,
                type: 'recycler',
                shipments: [],
              });
            }
            partnerMap.get(recyclerKey)!.shipments.push(shipment);
          }
        } else if (orgType === 'generator') {
          if (shipment.transporter_id && shipment.transporter) {
            partnerId = shipment.transporter_id;
            partnerOrg = shipment.transporter;
            partnerType = 'transporter';
          }
        } else if (orgType === 'recycler') {
          if (shipment.transporter_id && shipment.transporter) {
            partnerId = shipment.transporter_id;
            partnerOrg = shipment.transporter;
            partnerType = 'transporter';
          }
          // Also add generator
          if (shipment.generator_id && shipment.generator) {
            const generatorKey = shipment.generator_id;
            if (!partnerMap.has(generatorKey)) {
              partnerMap.set(generatorKey, {
                org: shipment.generator,
                type: 'generator',
                shipments: [],
              });
            }
            partnerMap.get(generatorKey)!.shipments.push(shipment);
          }
        }

        if (partnerId && partnerOrg) {
          if (!partnerMap.has(partnerId)) {
            partnerMap.set(partnerId, {
              org: partnerOrg,
              type: partnerType,
              shipments: [],
            });
          }
          partnerMap.get(partnerId)!.shipments.push(shipment);
        }
      }

      // Calculate values for each partner
      const partners: PartnerBalance[] = [];

      for (const [partnerId, data] of partnerMap) {
        let totalValue = 0;
        let activeShipments = 0;

        for (const shipment of data.shipments) {
          // Skip cancelled shipments
          if (shipment.cancelled_at) continue;
          
          activeShipments++;
          const quantity = Number(shipment.quantity) || 0;
          
          // Find price for this waste type
          const wasteDesc = (shipment.waste_description || shipment.waste_type || '').toLowerCase();
          const priceData = wasteTypePrices.find(wt => {
            const wtName = (wt.waste_type || '').toLowerCase();
            return wt.partner_organization_id === partnerId && 
              (wasteDesc.includes(wtName) || wtName.includes(wasteDesc));
          });
          
          const pricePerUnit = priceData?.price_per_unit || 0;
          totalValue += pricePerUnit * quantity;
        }

        partners.push({
          id: partnerId,
          partner_organization_id: partnerId,
          external_partner_id: null,
          isExternal: false,
          partner_organization: {
            id: data.org.id,
            name: data.org.name,
            organization_type: data.type,
            city: data.org.city,
            phone: data.org.phone,
          },
          total_shipment_value: totalValue,
          total_invoiced: 0,
          total_paid: 0,
          balance: totalValue,
          shipments_count: activeShipments,
          last_transaction_date: data.shipments[0]?.created_at,
        });
      }

      return partners;
    },
    enabled: !!organization?.id && !!organization?.organization_type,
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

  // Merge all data into final partner balances
  const partnerBalances: PartnerBalance[] = shipmentPartners.map((partner) => {
    const deposits = depositsData instanceof Map ? depositsData.get(partner.id) || 0 : 0;
    const invoiceData = invoicesData instanceof Map ? invoicesData.get(partner.id) : null;
    
    const totalPaid = deposits + (invoiceData?.paid || 0);
    const totalInvoiced = invoiceData?.total || 0;
    
    // Balance = shipment value - total paid
    const balance = partner.total_shipment_value - totalPaid;

    return {
      ...partner,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      balance: balance,
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
          balance: -deposits, // External partners with deposits = we owe them
          shipments_count: 0,
          last_transaction_date: undefined,
        };
      });
  };

  // Combine registered and external partners
  const getAllPartners = (type: string): PartnerBalance[] => {
    // Registered partners
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
    balancesLoading: shipmentsLoading || externalLoading || depositsLoading || invoicesLoading,
    partnerTypes,
    filteredBalances,
    calculateTotals,
    organizationType: organization?.organization_type,
  };
}
