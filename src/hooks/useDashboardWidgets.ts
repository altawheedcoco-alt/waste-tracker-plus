import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardWidgetConfig, getWidgetsByOrgType, getDefaultPinnedWidgets } from '@/config/dashboardWidgets';

interface WidgetPreferences {
  widget_order: string[];
  hidden_widgets: string[];
  pinned_widgets: string[];
}

export function useDashboardWidgets(orgType: 'generator' | 'transporter' | 'recycler' | 'disposal' | 'admin') {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [userPrefs, setUserPrefs] = useState<WidgetPreferences | null>(null);
  const [orgDefaults, setOrgDefaults] = useState<WidgetPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allWidgets = useMemo(() => getWidgetsByOrgType(orgType), [orgType]);
  const defaultPinned = useMemo(() => getDefaultPinnedWidgets(orgType), [orgType]);

  // Fetch both user prefs and org defaults
  const fetchPreferences = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      const query = supabase
        .from('dashboard_widget_preferences')
        .select('widget_order, hidden_widgets, pinned_widgets, is_org_default, user_id');

      const filters = [
        `user_id.eq.${user.id}`,
      ];
      if (organization?.id) {
        filters.push(`and(is_org_default.eq.true,organization_id.eq.${organization.id})`);
      }

      const { data, error } = await query.or(filters.join(','));

      if (error) throw error;

      const userRow = (data || []).find(d => d.user_id === user.id && !d.is_org_default);
      const orgRow = (data || []).find(d => d.is_org_default);

      setUserPrefs(userRow ? {
        widget_order: userRow.widget_order || [],
        hidden_widgets: userRow.hidden_widgets || [],
        pinned_widgets: userRow.pinned_widgets || [],
      } : null);

      setOrgDefaults(orgRow ? {
        widget_order: orgRow.widget_order || [],
        hidden_widgets: orgRow.hidden_widgets || [],
        pinned_widgets: orgRow.pinned_widgets || [],
      } : null);
    } catch (err) {
      console.error('Error fetching widget preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user, organization?.id]);

  useEffect(() => { fetchPreferences(); }, [fetchPreferences]);

  // Effective preferences = user override > org default > system default
  const effectivePrefs = useMemo((): WidgetPreferences => {
    const source = userPrefs || orgDefaults;
    return {
      widget_order: source?.widget_order?.length ? source.widget_order : allWidgets.map(w => w.id),
      hidden_widgets: source?.hidden_widgets || [],
      pinned_widgets: source?.pinned_widgets?.length ? source.pinned_widgets : defaultPinned,
    };
  }, [userPrefs, orgDefaults, allWidgets, defaultPinned]);

  // Ordered & filtered widgets
  const orderedWidgets = useMemo(() => {
    const order = effectivePrefs.widget_order;
    const hidden = new Set(effectivePrefs.hidden_widgets);
    const pinned = new Set(effectivePrefs.pinned_widgets);
    const widgetMap = new Map(allWidgets.map(w => [w.id, w]));

    const result: Array<DashboardWidgetConfig & { isPinned: boolean }> = [];

    // Pinned first
    for (const id of order) {
      if (pinned.has(id) && !hidden.has(id) && widgetMap.has(id)) {
        result.push({ ...widgetMap.get(id)!, isPinned: true });
        widgetMap.delete(id);
      }
    }

    // Then remaining in order
    for (const id of order) {
      if (!hidden.has(id) && widgetMap.has(id)) {
        result.push({ ...widgetMap.get(id)!, isPinned: false });
        widgetMap.delete(id);
      }
    }

    // Any new widgets not in saved order
    for (const w of widgetMap.values()) {
      if (!hidden.has(w.id)) {
        result.push({ ...w, isPinned: false });
      }
    }

    return result;
  }, [allWidgets, effectivePrefs]);

  // Save user preferences
  const saveUserPrefs = useCallback(async (newPrefs: WidgetPreferences) => {
    if (!user || !organization?.id) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('dashboard_widget_preferences')
        .upsert({
          user_id: user.id,
          organization_id: organization.id,
          widget_order: newPrefs.widget_order,
          hidden_widgets: newPrefs.hidden_widgets,
          pinned_widgets: newPrefs.pinned_widgets,
          is_org_default: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,organization_id' });

      if (error) throw error;
      setUserPrefs(newPrefs);
      return true;
    } catch (err) {
      console.error('Error saving widget prefs:', err);
      toast({ title: 'خطأ', description: 'فشل حفظ التفضيلات', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, organization?.id, toast]);

  // Move widget
  const moveWidget = useCallback(async (widgetId: string, direction: 'up' | 'down') => {
    const order = [...effectivePrefs.widget_order];
    const idx = order.indexOf(widgetId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= order.length) return;
    [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];
    await saveUserPrefs({ ...effectivePrefs, widget_order: order });
  }, [effectivePrefs, saveUserPrefs]);

  // Toggle visibility
  const toggleWidget = useCallback(async (widgetId: string) => {
    const hidden = effectivePrefs.hidden_widgets.includes(widgetId)
      ? effectivePrefs.hidden_widgets.filter(id => id !== widgetId)
      : [...effectivePrefs.hidden_widgets, widgetId];
    await saveUserPrefs({ ...effectivePrefs, hidden_widgets: hidden });
  }, [effectivePrefs, saveUserPrefs]);

  // Toggle pin
  const togglePin = useCallback(async (widgetId: string) => {
    const pinned = effectivePrefs.pinned_widgets.includes(widgetId)
      ? effectivePrefs.pinned_widgets.filter(id => id !== widgetId)
      : [...effectivePrefs.pinned_widgets, widgetId];
    await saveUserPrefs({ ...effectivePrefs, pinned_widgets: pinned });
  }, [effectivePrefs, saveUserPrefs]);

  // Reset
  const resetToDefaults = useCallback(async () => {
    if (!user || !organization?.id) return;
    setSaving(true);
    try {
      await supabase
        .from('dashboard_widget_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('organization_id', organization.id);
      setUserPrefs(null);
      toast({ title: 'تم', description: 'تم استعادة الإعدادات الافتراضية' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [user, organization?.id, toast]);

  // Reorder by drag (set full new order)
  const reorderWidgets = useCallback(async (newOrder: string[]) => {
    await saveUserPrefs({ ...effectivePrefs, widget_order: newOrder });
  }, [effectivePrefs, saveUserPrefs]);

  return {
    widgets: orderedWidgets,
    allWidgets,
    effectivePrefs,
    loading,
    saving,
    moveWidget,
    toggleWidget,
    togglePin,
    resetToDefaults,
    reorderWidgets,
    hasUserCustomization: userPrefs !== null,
  };
}
