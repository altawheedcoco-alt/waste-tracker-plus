import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check if the current organization (generator) is allowed to create shipments.
 * Non-generator orgs always can. Generators need admin approval (can_create_shipments = true).
 */
export function useShipmentCreationControl() {
  const { organization } = useAuth();

  const isGenerator = organization?.organization_type === 'generator';
  const canCreate = !isGenerator || (organization?.can_create_shipments === true);
  const isFrozen = isGenerator && !canCreate;

  return { canCreate, isFrozen, isGenerator };
}
