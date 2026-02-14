import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchResults {
  shipments: ShipmentResult[];
  organizations: OrganizationResult[];
  external_partners: ExternalPartnerResult[];
  drivers: DriverResult[];
  employees: EmployeeResult[];
  invoices: InvoiceResult[];
  contracts: ContractResult[];
  deposits: DepositResult[];
  award_letters: AwardLetterResult[];
  declarations: DeclarationResult[];
  receipts: ReceiptResult[];
}

export interface ShipmentResult {
  id: string;
  shipment_number: string;
  status: string;
  waste_type: string;
  quantity: number;
  unit: string;
  created_at: string;
  from_name: string;
  to_name: string;
  result_type: 'shipment';
}

export interface OrganizationResult {
  id: string;
  name: string;
  organization_type: string;
  city: string;
  is_active: boolean;
  result_type: 'organization';
}

export interface ExternalPartnerResult {
  id: string;
  name: string;
  partner_type: string;
  city: string;
  contact_person: string;
  phone: string;
  result_type: 'external_partner';
}

export interface DriverResult {
  id: string;
  full_name: string;
  phone: string;
  license_number: string;
  status: string;
  vehicle_type: string;
  plate_number: string;
  result_type: 'driver';
}

export interface EmployeeResult {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  employee_type: string;
  is_active: boolean;
  result_type: 'employee';
}

export interface InvoiceResult {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  issue_date: string;
  due_date: string;
  client_name: string;
  result_type: 'invoice';
}

export interface ContractResult {
  id: string;
  contract_number: string;
  title: string;
  status: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  value: number;
  partner_name: string;
  result_type: 'contract';
}

export interface DepositResult {
  id: string;
  amount: number;
  transfer_method: string;
  deposit_date: string;
  reference_number: string;
  depositor_name: string;
  partner_name: string;
  result_type: 'deposit';
}

export interface AwardLetterResult {
  id: string;
  letter_number: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  partner_name: string;
  result_type: 'award_letter';
}

export interface DeclarationResult {
  id: string;
  declaration_type: string;
  status: string;
  created_at: string;
  shipment_number: string;
  waste_type: string;
  generator_name: string;
  result_type: 'declaration';
}

export interface ReceiptResult {
  id: string;
  receipt_number: string;
  status: string;
  created_at: string;
  shipment_number: string;
  result_type: 'receipt';
}

const emptyResults: SearchResults = {
  shipments: [],
  organizations: [],
  external_partners: [],
  drivers: [],
  employees: [],
  invoices: [],
  contracts: [],
  deposits: [],
  award_letters: [],
  declarations: [],
  receipts: [],
};

export function useGlobalSearch() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery, profile?.organization_id],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !profile?.organization_id) {
        return emptyResults;
      }

      const { data, error } = await supabase.rpc('global_search', {
        p_query: debouncedQuery,
        p_org_id: profile.organization_id,
        p_limit: 5,
      });

      if (error) {
        console.error('Global search error:', error);
        return emptyResults;
      }

      return (data as unknown as SearchResults) || emptyResults;
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2 && !!profile?.organization_id,
    staleTime: 30000,
  });

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  const hasResults = totalResults > 0;

  return {
    query,
    setQuery: handleQueryChange,
    results: results || emptyResults,
    isLoading,
    hasResults,
    totalResults,
    clearQuery: useCallback(() => {
      setQuery('');
      setDebouncedQuery('');
    }, []),
  };
}
