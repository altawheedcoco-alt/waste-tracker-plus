import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getQuickActions, type QuickAction } from '@/config/chatOrgCommands';

interface ChatQuickActionsProps {
  orgType?: string;
  partnerType?: string;
  onAction: (actionType: string) => void;
}

const ChatQuickActions = memo(({ orgType, partnerType, onAction }: ChatQuickActionsProps) => {
  const actions = getQuickActions(orgType, partnerType);
  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-border/30 bg-muted/20 overflow-x-auto scrollbar-none">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.actionType}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onAction(action.actionType)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all active:scale-95',
              action.color, 'hover:opacity-80'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </motion.button>
        );
      })}
    </div>
  );
});

ChatQuickActions.displayName = 'ChatQuickActions';
export default ChatQuickActions;
