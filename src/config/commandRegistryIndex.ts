/**
 * Command Registry المركزي
 * يجمع سجلات الأوامر لكل الجهات
 */
import type { OrgCommandRegistry, CommandDefinition } from '@/types/commandTypes';
import { TRANSPORTER_COMMAND_REGISTRY } from './transporter/transporterCommandRegistry';
import { GENERATOR_COMMAND_REGISTRY } from './generator/generatorCommandRegistry';
import { RECYCLER_COMMAND_REGISTRY } from './recycler/recyclerCommandRegistry';
import { DISPOSAL_COMMAND_REGISTRY } from './disposal/disposalCommandRegistry';
import {
  CONSULTANT_COMMAND_REGISTRY,
  CONSULTING_OFFICE_COMMAND_REGISTRY,
  DRIVER_COMMAND_REGISTRY,
  EMPLOYEE_COMMAND_REGISTRY,
  REGULATOR_COMMAND_REGISTRY,
  ADMIN_COMMAND_REGISTRY,
} from './shared/sharedCommandRegistries';

const COMMAND_REGISTRIES: Record<string, OrgCommandRegistry> = {
  transporter: TRANSPORTER_COMMAND_REGISTRY,
  generator: GENERATOR_COMMAND_REGISTRY,
  recycler: RECYCLER_COMMAND_REGISTRY,
  disposal: DISPOSAL_COMMAND_REGISTRY,
  consultant: CONSULTANT_COMMAND_REGISTRY,
  consulting_office: CONSULTING_OFFICE_COMMAND_REGISTRY,
  driver: DRIVER_COMMAND_REGISTRY,
  employee: EMPLOYEE_COMMAND_REGISTRY,
  regulator: REGULATOR_COMMAND_REGISTRY,
  admin: ADMIN_COMMAND_REGISTRY,
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

/** الحصول على عدد الأوامر الكلي لكل الجهات */
export const getTotalCommandCount = (): number => {
  return Object.values(COMMAND_REGISTRIES).reduce(
    (total, reg) => total + reg.commands.length, 0
  );
};

/** الحصول على قائمة كل الجهات المسجلة */
export const getRegisteredOrgTypes = (): string[] => {
  return Object.keys(COMMAND_REGISTRIES);
};
