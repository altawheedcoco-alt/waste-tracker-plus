/**
 * Command Registry المركزي
 * يجمع سجلات الأوامر لكل الجهات
 */
import type { OrgCommandRegistry, CommandDefinition } from '@/types/commandTypes';
import { TRANSPORTER_COMMAND_REGISTRY } from './transporter/transporterCommandRegistry';

const COMMAND_REGISTRIES: Record<string, OrgCommandRegistry> = {
  transporter: TRANSPORTER_COMMAND_REGISTRY,
};

/** الحصول على سجل أوامر جهة معينة */
export const getCommandRegistry = (orgType: string): OrgCommandRegistry | undefined => {
  return COMMAND_REGISTRIES[orgType];
};

/** البحث عن أمر بمعرفه */
export const findCommand = (orgType: string, commandId: string): CommandDefinition | undefined => {
  return COMMAND_REGISTRIES[orgType]?.commands.find(c => c.id === commandId);
};

/** الحصول على كل الأوامر المرتبطة بسلسلة معينة */
export const getChainCommands = (orgType: string, chainId: string): CommandDefinition[] => {
  return COMMAND_REGISTRIES[orgType]?.commands.filter(c => c.chainId === chainId) || [];
};

/** الحصول على كل الأوامر التي تعتمد على أمر معين */
export const getDependentCommands = (orgType: string, commandId: string): CommandDefinition[] => {
  return COMMAND_REGISTRIES[orgType]?.commands.filter(
    c => c.dependencies.some(d => d.commandId === commandId)
  ) || [];
};
