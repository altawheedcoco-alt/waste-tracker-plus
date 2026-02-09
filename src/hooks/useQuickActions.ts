import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getQuickActionsByType,
  getQuickActionsByCategory,
  QuickActionConfig,
} from '@/config/quickActions';
import { QuickAction } from '@/components/dashboard/QuickActionsGrid';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';

type ActionHandlers = {
  openDepositDialog?: () => void;
  openSmartWeightUpload?: () => void;
  openLiveMap?: () => void;
  openSettings?: () => void;
  [key: string]: (() => void) | undefined;
};

interface UseQuickActionsOptions {
  type: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver' | 'disposal';
  handlers?: ActionHandlers;
  category?: 'primary' | 'secondary' | 'utility' | 'all';
  limit?: number;
  applyUserPreferences?: boolean;
}

/**
 * Hook to get quick actions for a specific user type
 * Converts QuickActionConfig to QuickAction format with proper handlers
 * Optionally applies user's custom order from database
 */
export function useQuickActions({
  type,
  handlers = {},
  category = 'all',
  limit,
  applyUserPreferences = false,
}: UseQuickActionsOptions): QuickAction[] {
  const navigate = useNavigate();
  const { applyOrder, preferences } = useQuickActionPreferences();

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
    
    // Apply user preferences if enabled
    if (applyUserPreferences && preferences) {
      actions = applyOrder(actions);
    }
    
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
  }, [type, category, limit, resolveHandler, applyUserPreferences, preferences, applyOrder]);

  return quickActions;
}

/**
 * Get raw quick action configs without converting to QuickAction format
 * Optionally applies user's custom order
 */
export function useQuickActionConfigs(
  type: 'admin' | 'transporter' | 'generator' | 'recycler' | 'driver',
  applyUserPreferences = false
): QuickActionConfig[] {
  const { applyOrder, preferences } = useQuickActionPreferences();
  
  return useMemo(() => {
    const actions = getQuickActionsByType(type);
    if (applyUserPreferences && preferences) {
      return applyOrder(actions);
    }
    return actions;
  }, [type, applyUserPreferences, preferences, applyOrder]);
}
