import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { QuickActionConfig } from '@/config/quickActions';

interface QuickActionPreferences {
  action_order: string[];
  hidden_actions: string[];
}

/**
 * Hook to manage user's quick action preferences (order and visibility)
 */
export function useQuickActionPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<QuickActionPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences from database
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_quick_action_preferences')
        .select('action_order, hidden_actions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          action_order: data.action_order || [],
          hidden_actions: data.hidden_actions || [],
        });
      } else {
        setPreferences({ action_order: [], hidden_actions: [] });
      }
    } catch (error) {
      console.error('Error fetching quick action preferences:', error);
      setPreferences({ action_order: [], hidden_actions: [] });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save preferences to database
  const savePreferences = useCallback(async (newPreferences: QuickActionPreferences) => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_quick_action_preferences')
        .upsert({
          user_id: user.id,
          action_order: newPreferences.action_order,
          hidden_actions: newPreferences.hidden_actions,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences(newPreferences);
      return true;
    } catch (error) {
      console.error('Error saving quick action preferences:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حفظ الترتيب',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, toast]);

  // Move action up in the list
  const moveUp = useCallback(async (actionId: string, actions: QuickActionConfig[]) => {
    const currentOrder = preferences?.action_order?.length 
      ? preferences.action_order 
      : actions.map(a => a.id);
    
    const index = currentOrder.indexOf(actionId);
    if (index <= 0) return false;

    const newOrder = [...currentOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    return savePreferences({
      ...preferences!,
      action_order: newOrder,
    });
  }, [preferences, savePreferences]);

  // Move action down in the list
  const moveDown = useCallback(async (actionId: string, actions: QuickActionConfig[]) => {
    const currentOrder = preferences?.action_order?.length 
      ? preferences.action_order 
      : actions.map(a => a.id);
    
    const index = currentOrder.indexOf(actionId);
    if (index < 0 || index >= currentOrder.length - 1) return false;

    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    return savePreferences({
      ...preferences!,
      action_order: newOrder,
    });
  }, [preferences, savePreferences]);

  // Toggle action visibility
  const toggleVisibility = useCallback(async (actionId: string) => {
    if (!preferences) return false;

    const hiddenActions = preferences.hidden_actions || [];
    const newHiddenActions = hiddenActions.includes(actionId)
      ? hiddenActions.filter(id => id !== actionId)
      : [...hiddenActions, actionId];

    return savePreferences({
      ...preferences,
      hidden_actions: newHiddenActions,
    });
  }, [preferences, savePreferences]);

  // Reset to default order
  const resetToDefault = useCallback(async () => {
    return savePreferences({
      action_order: [],
      hidden_actions: [],
    });
  }, [savePreferences]);

  // Apply order to actions
  const applyOrder = useCallback((actions: QuickActionConfig[]): QuickActionConfig[] => {
    if (!preferences?.action_order?.length) {
      return actions.filter(a => !preferences?.hidden_actions?.includes(a.id));
    }

    // Create a map for quick lookup
    const actionMap = new Map(actions.map(a => [a.id, a]));
    
    // Build ordered array
    const orderedActions: QuickActionConfig[] = [];
    
    // First add actions in the saved order
    for (const id of preferences.action_order) {
      const action = actionMap.get(id);
      if (action && !preferences.hidden_actions?.includes(id)) {
        orderedActions.push(action);
        actionMap.delete(id);
      }
    }
    
    // Add any remaining actions not in the order
    for (const action of actionMap.values()) {
      if (!preferences.hidden_actions?.includes(action.id)) {
        orderedActions.push(action);
      }
    }

    return orderedActions;
  }, [preferences]);

  return {
    preferences,
    loading,
    saving,
    moveUp,
    moveDown,
    toggleVisibility,
    resetToDefault,
    applyOrder,
    refetch: fetchPreferences,
  };
}
