/**
 * سجل موحد لسلاسل الإجراءات لكل الجهات
 */
import type { OrgActionChains } from '@/types/actionChainTypes';
import { TRANSPORTER_CHAINS } from './transporter/transporterChains';
import { GENERATOR_CHAINS } from './generator/generatorChains';
import { RECYCLER_CHAINS } from './recycler/recyclerChains';
import { DISPOSAL_CHAINS } from './disposal/disposalChains';

export const ACTION_CHAINS_REGISTRY: Record<string, OrgActionChains> = {
  transporter: TRANSPORTER_CHAINS,
  generator: GENERATOR_CHAINS,
  recycler: RECYCLER_CHAINS,
  disposal: DISPOSAL_CHAINS,
};

export const getOrgChains = (orgType: string): OrgActionChains | undefined => {
  return ACTION_CHAINS_REGISTRY[orgType];
};
