/**
 * Contract Entity Resolution Logic
 * Handles internal (auto-fill from DB) vs external (manual form) contractor identification.
 */

export type ContractorType = 'internal' | 'external';

export interface InternalEntity {
  id: string;
  name: string;
  organization_type: string;
  address?: string;
  phone?: string;
  email?: string;
  commercial_register?: string;
  representative_name?: string;
  tax_id?: string;
}

export interface ExternalEntity {
  legal_name: string;
  tax_id: string;
  commercial_register: string;
  address: string;
  representative: string;
  phone: string;
  email: string;
}

export interface ContractEntity {
  type: ContractorType;
  internal?: InternalEntity;
  external?: ExternalEntity;
}

export const emptyExternalEntity: ExternalEntity = {
  legal_name: '',
  tax_id: '',
  commercial_register: '',
  address: '',
  representative: '',
  phone: '',
  email: '',
};

export const resolveEntityName = (entity: ContractEntity): string => {
  if (entity.type === 'internal' && entity.internal) {
    return entity.internal.name;
  }
  if (entity.type === 'external' && entity.external) {
    return entity.external.legal_name;
  }
  return '';
};

export const resolveEntityDetails = (entity: ContractEntity) => {
  if (entity.type === 'internal' && entity.internal) {
    return {
      name: entity.internal.name,
      address: entity.internal.address || '',
      representative: entity.internal.representative_name || '',
      commercial_register: entity.internal.commercial_register || '',
      tax_id: entity.internal.tax_id || '',
      phone: entity.internal.phone || '',
      email: entity.internal.email || '',
    };
  }
  if (entity.type === 'external' && entity.external) {
    return {
      name: entity.external.legal_name,
      address: entity.external.address,
      representative: entity.external.representative,
      commercial_register: entity.external.commercial_register,
      tax_id: entity.external.tax_id,
      phone: entity.external.phone,
      email: entity.external.email,
    };
  }
  return null;
};
