import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getQuickActionsByType,
  getQuickActionsByCategory,
  QuickActionConfig,
} from '@/config/quickActions';
import { QuickAction } from '@/components/dashboard/QuickActionsGrid';

type ActionHandlers = {
  openDepositDialog?: () => void;
  [key: string]: (() => void) | undefined;
};

interface UseQuickActionsOptions {
  type: 'admin' | 'transporter' | 'generator' | 'recycler';
  handlers?: ActionHandlers;
  category?: 'primary' | 'secondary' | 'utility' | 'all';
  limit?: number;
}

/**
 * Hook to get quick actions for a specific user type
 * Converts QuickActionConfig to QuickAction format with proper handlers
 */
export function useQuickActions({
  type,
  handlers = {},
  category = 'all',
  limit,
}: UseQuickActionsOptions): QuickAction[] {
  const navigate = useNavigate();

  const resolveHandler = useCallback(
    (action: QuickActionConfig): (() => void) | undefined => {
      if (action.onClick && handlers[action.onClick]) {
        return handlers[action.onClick];
      }
      if (action.path) {
        return () => navigate(action.path!);
      }
      return undefined;
    },
    [handlers, navigate]
  );

  const quickActions = useMemo(() => {
    let actions = getQuickActionsByType(type);
    
    if (category !== 'all') {
      actions = getQuickActionsByCategory(actions, category);
    }

    // Convert to QuickAction format
    const converted: QuickAction[] = actions.map((action) => ({
      title: action.title,
      subtitle: action.subtitle,
      icon: action.icon,
      path: action.path,
      onClick: action.onClick ? resolveHandler(action) : undefined,
      iconBgClass: action.iconBgClass,
    }));

    if (limit && limit > 0) {
      return converted.slice(0, limit);
    }

    return converted;
  }, [type, category, limit, resolveHandler]);

  return quickActions;
}

/**
 * Get raw quick action configs without converting to QuickAction format
 */
export function useQuickActionConfigs(
  type: 'admin' | 'transporter' | 'generator' | 'recycler'
): QuickActionConfig[] {
  return useMemo(() => getQuickActionsByType(type), [type]);
}
