/**
 * useCommandEngine - المحرك الموحد للأوامر
 * يجمع بين: Command Registry + Dependency Resolver + Cross-Impact Engine
 * 
 * الاستخدام:
 * const { executeCommand, checkDependencies, getCommandStatus } = useCommandEngine('transporter');
 */
import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMyPermissions } from '@/hooks/useMyPermissions';
import { toast } from 'sonner';
import { findCommand, getChainCommands, getDependentCommands, getCommandRegistry } from '@/config/commandRegistryIndex';
import type { 
  CommandDefinition, 
  CommandStatus, 
  DependencyCheckResult, 
  CommandExecutionRecord,
  CrossImpact 
} from '@/types/commandTypes';

interface CommandEngineOptions {
  orgType: string;
}

export function useCommandEngine({ orgType }: CommandEngineOptions) {
  const { user, organization } = useAuth();
  const { hasPermission, hasAnyPermission, isAdmin, isCompanyAdmin } = useMyPermissions();
  const queryClient = useQueryClient();

  const registry = useMemo(() => getCommandRegistry(orgType), [orgType]);

  // ══════════════════════════════════════════
  // 1. DEPENDENCY RESOLVER
  // ══════════════════════════════════════════

  /** فحص حالة تنفيذ أمر معين على مورد معين */
  const getCommandExecutionStatus = useCallback(async (
    commandId: string, 
    resourceId: string
  ): Promise<CommandStatus> => {
    if (!user?.id) return 'blocked';

    const { data } = await supabase
      .from('action_execution_log')
      .select('id')
      .eq('action_type', commandId)
      .eq('resource_id', resourceId)
      .maybeSingle();

    return data ? 'completed' : 'ready';
  }, [user?.id]);

  /** فحص كل التبعيات لأمر معين */
  const checkDependencies = useCallback(async (
    commandId: string,
    resourceId: string
  ): Promise<DependencyCheckResult> => {
    const command = findCommand(orgType, commandId);
    if (!command) {
      return { canExecute: false, blockedBy: [], bypassable: false };
    }

    if (command.dependencies.length === 0) {
      return { canExecute: true, blockedBy: [], bypassable: false };
    }

    const blockedBy: DependencyCheckResult['blockedBy'] = [];

    for (const dep of command.dependencies) {
      const status = await getCommandExecutionStatus(dep.commandId, resourceId);
      
      if (dep.checkType === 'completed' && status !== 'completed') {
        blockedBy.push({ condition: dep, currentStatus: status });
      } else if (dep.checkType === 'exists') {
        // التحقق من وجود المورد
        const { data } = await supabase
          .from('action_execution_log')
          .select('id')
          .eq('action_type', dep.commandId)
          .eq('resource_id', resourceId)
          .limit(1);

        if (!data || data.length === 0) {
          blockedBy.push({ condition: dep, currentStatus: 'ready' });
        }
      }
    }

    const bypassable = blockedBy.length > 0 && blockedBy.every(b => b.condition.allowBypass);

    return {
      canExecute: blockedBy.length === 0,
      blockedBy,
      bypassable,
    };
  }, [orgType, getCommandExecutionStatus]);

  // ══════════════════════════════════════════
  // 2. PERMISSION CHECK
  // ══════════════════════════════════════════

  const checkPermission = useCallback((command: CommandDefinition): boolean => {
    if (isAdmin || isCompanyAdmin) return true;
    
    if (command.requireAllPermissions) {
      return command.requiredPermissions.every(p => hasPermission(p));
    }
    return hasAnyPermission(...command.requiredPermissions);
  }, [isAdmin, isCompanyAdmin, hasPermission, hasAnyPermission]);

  // ══════════════════════════════════════════
  // 3. CROSS-IMPACT ENGINE
  // ══════════════════════════════════════════

  const executeImpacts = useCallback(async (
    impacts: CrossImpact[],
    commandId: string,
    resourceId: string,
    resourceType: string
  ): Promise<void> => {
    // ترتيب حسب الأولوية
    const sorted = [...impacts].sort((a, b) => a.priority - b.priority);

    for (const impact of sorted) {
      if (!impact.autoExecute) continue;

      try {
        switch (impact.type) {
          case 'log_audit':
            await supabase.from('activity_logs').insert({
              action: commandId,
              action_type: 'command_execution',
              resource_type: resourceType,
              resource_id: resourceId,
              user_id: user?.id,
              organization_id: organization?.id,
              details: { impactId: impact.id, labelAr: impact.labelAr } as any,
            });
            break;

          case 'send_notification':
            await supabase.from('notifications').insert({
              user_id: user?.id || '',
              title: impact.labelAr,
              message: `تم تنفيذ: ${impact.labelAr}`,
              type: 'system',
              organization_id: organization?.id,
            });
            break;

           case 'update_kpi':
          case 'update_ledger':
          case 'update_compliance':
          case 'recalculate_esg':
          case 'trigger_chain':
          case 'update_inventory':
          case 'custom':
            // Placeholder — to be expanded
            break;
        }
      } catch (err) {
        console.error(`[Impact Error] ${impact.id}:`, err);
      }
    }
  }, [user?.id, organization?.id]);

  // ══════════════════════════════════════════
  // 4. UNIFIED COMMAND EXECUTOR
  // ══════════════════════════════════════════

  const executeCommand = useCallback(async (
    commandId: string,
    resourceId: string,
    /** الوظيفة الفعلية التي سينفذها الزر */
    handler: () => Promise<void>,
    options?: { bypassReason?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    const command = findCommand(orgType, commandId);
    if (!command) {
      return { success: false, error: 'الأمر غير موجود في السجل' };
    }

    // فحص الصلاحيات
    if (!checkPermission(command)) {
      toast.error('ليس لديك صلاحية تنفيذ هذا الإجراء');
      return { success: false, error: 'permission_denied' };
    }

    // فحص التبعيات
    const depCheck = await checkDependencies(commandId, resourceId);
    if (!depCheck.canExecute) {
      if (depCheck.bypassable && options?.bypassReason) {
        // تسجيل التجاوز
        console.log(`[Bypass] ${commandId} — Reason: ${options.bypassReason}`);
      } else if (!depCheck.bypassable) {
        const firstBlock = depCheck.blockedBy[0];
        toast.error(firstBlock.condition.blockMessageAr);
        return { success: false, error: 'dependency_blocked' };
      }
    }

    try {
      // تسجيل التنفيذ (ذري - يمنع التكرار)
      const { data: recorded } = await supabase.rpc('record_action_execution', {
        p_user_id: user?.id || '',
        p_action_type: commandId,
        p_resource_type: command.resourceType,
        p_resource_id: resourceId,
        p_action_value: null,
        p_organization_id: organization?.id || null,
        p_metadata: { bypassReason: options?.bypassReason } as any,
      });

      if (!recorded) {
        toast.warning('تم تنفيذ هذا الإجراء مسبقاً');
        return { success: false, error: 'already_executed' };
      }

      // تنفيذ الوظيفة الفعلية
      await handler();

      // تنفيذ الآثار المتقاطعة
      await executeImpacts(command.impacts, commandId, resourceId, command.resourceType);

      // إبطال الكاش للأوامر المعتمدة
      queryClient.invalidateQueries({ queryKey: ['command-status', orgType] });

      return { success: true };
    } catch (err: any) {
      // التراجع عن تسجيل التنفيذ
      await supabase
        .from('action_execution_log')
        .delete()
        .eq('user_id', user?.id || '')
        .eq('action_type', commandId)
        .eq('resource_id', resourceId);

      console.error(`[Command Error] ${commandId}:`, err);
      return { success: false, error: err.message };
    }
  }, [orgType, user?.id, organization?.id, checkPermission, checkDependencies, executeImpacts, queryClient]);

  // ══════════════════════════════════════════
  // 5. QUERY: حالة كل الأوامر على مورد معين
  // ══════════════════════════════════════════

  const useResourceCommandStatuses = (resourceId: string, resourceType: string) => {
    return useQuery({
      queryKey: ['command-status', orgType, resourceId, resourceType],
      queryFn: async () => {
        if (!user?.id || !resourceId) return {};

        const commands = registry?.commands.filter(c => c.resourceType === resourceType) || [];
        const { data } = await supabase
          .from('action_execution_log')
          .select('action_type')
          .eq('resource_id', resourceId)
          .in('action_type', commands.map(c => c.id));

        const executed = new Set((data || []).map(d => d.action_type));
        const statuses: Record<string, CommandStatus> = {};

        for (const cmd of commands) {
          statuses[cmd.id] = executed.has(cmd.id) ? 'completed' : 'ready';
        }

        return statuses;
      },
      enabled: !!user?.id && !!resourceId,
      staleTime: 30_000,
    });
  };

  return {
    registry,
    executeCommand,
    checkDependencies,
    checkPermission,
    getCommandExecutionStatus,
    useResourceCommandStatuses,
    findCommand: (id: string) => findCommand(orgType, id),
    getChainCommands: (chainId: string) => getChainCommands(orgType, chainId),
    getDependentCommands: (id: string) => getDependentCommands(orgType, id),
  };
}
