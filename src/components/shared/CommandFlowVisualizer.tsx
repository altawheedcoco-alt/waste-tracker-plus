/**
 * CommandFlowVisualizer - عرض مرئي لسلسلة الأوامر وحالة تنفيذها
 * يعرض كل أمر في السلسلة مع حالته (جاهز/منفذ/محجوب) والتبعيات والآثار
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, ArrowDown, Zap } from 'lucide-react';
import { useCommandEngine } from '@/hooks/useCommandEngine';
import { useAuth } from '@/contexts/AuthContext';
import { BINDING_DISPLAY } from '@/types/bindingTypes';
import { CHAIN_NODE_DISPLAY } from '@/types/actionChainTypes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CommandStatus } from '@/types/commandTypes';

interface CommandFlowVisualizerProps {
  chainId: string;
  resourceId: string;
  resourceType: string;
}

const StatusIcon = ({ status }: { status: CommandStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'blocked':
      return <Lock className="w-4 h-4 text-destructive" />;
    default:
      return <Circle className="w-4 h-4 text-muted-foreground" />;
  }
};

const CommandFlowVisualizer = ({ chainId, resourceId, resourceType }: CommandFlowVisualizerProps) => {
  const { organization } = useAuth();
  const orgType = organization?.organization_type || 'generator';
  const { getChainCommands, useResourceCommandStatuses } = useCommandEngine({ orgType });

  const commands = useMemo(() => getChainCommands(chainId), [chainId, getChainCommands]);
  const { data: statuses = {} } = useResourceCommandStatuses(resourceId, resourceType);

  if (commands.length === 0) return null;

  const completedCount = Object.values(statuses).filter(s => s === 'completed').length;
  const totalCount = commands.length;
  const healthPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Health Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${healthPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-bold text-muted-foreground min-w-[3rem] text-left">
            {healthPercent}%
          </span>
        </div>

        {/* Command Flow */}
        <div className="space-y-1">
          {commands.map((cmd, idx) => {
            const status = statuses[cmd.id] || 'ready';
            const binding = BINDING_DISPLAY[cmd.bindingType];
            const isLast = idx === commands.length - 1;

            return (
              <div key={cmd.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        status === 'completed'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : status === 'blocked'
                          ? 'bg-destructive/5 border-destructive/20 opacity-60'
                          : 'bg-card border-border hover:bg-muted/50'
                      }`}
                    >
                      <StatusIcon status={status} />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${binding.dotClass}`} />
                      <span className="text-sm font-medium flex-1">{cmd.labelAr}</span>
                      {cmd.impacts.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          {cmd.impacts.length}
                        </span>
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[250px]">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">{cmd.labelAr}</p>
                      {cmd.descriptionAr && (
                        <p className="text-[10px] text-muted-foreground">{cmd.descriptionAr}</p>
                      )}
                      <p className="text-[10px]">
                        النوع: <span className={binding.colorClass}>{binding.labelAr}</span>
                      </p>
                      {cmd.dependencies.length > 0 && (
                        <p className="text-[10px] text-amber-500">
                          يعتمد على {cmd.dependencies.length} خطوة سابقة
                        </p>
                      )}
                      {cmd.impacts.length > 0 && (
                        <p className="text-[10px] text-emerald-500">
                          يُنتج {cmd.impacts.length} أثر متقاطع
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {!isLast && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-3 h-3 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CommandFlowVisualizer;
