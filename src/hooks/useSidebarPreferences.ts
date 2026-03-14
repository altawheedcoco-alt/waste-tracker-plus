import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { SidebarGroupConfig, getGroupsForOrgType, getDefaultGroupOrder, filterGroupsByPermissions } from '@/config/sidebarConfig';
import { useMyPermissions } from '@/hooks/useMyPermissions';

interface SidebarPrefs {
  group_order: string[];
  hidden_groups: string[];
  collapsed_groups: string[];
}

export function useSidebarPreferences() {
  const { user, organization, roles } = useAuth();
  const { permissions, isEmployee } = useMyPermissions();
  const [prefs, setPrefs] = useState<SidebarPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = roles.includes('admin');
  const orgType = (organization?.organization_type as string) || (isAdmin ? '' : 'generator');

  const fetchPrefs = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('sidebar_preferences')
        .select('group_order, hidden_groups, collapsed_groups')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPrefs(data ? {
        group_order: data.group_order || [],
        hidden_groups: data.hidden_groups || [],
        collapsed_groups: data.collapsed_groups || [],
      } : null);
    } catch (err) {
      console.error('Error fetching sidebar prefs:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const savePrefs = useCallback(async (newPrefs: SidebarPrefs) => {
    if (!user) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sidebar_preferences')
        .upsert({
          user_id: user.id,
          organization_id: organization?.id ?? null,
          group_order: newPrefs.group_order,
          hidden_groups: newPrefs.hidden_groups,
          collapsed_groups: newPrefs.collapsed_groups,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,organization_id' });

      if (error) throw error;
      setPrefs(newPrefs);
      return true;
    } catch (err) {
      console.error('Error saving sidebar prefs:', err);
      toast.error('فشل حفظ ترتيب القائمة');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, organization?.id]);

  // Get all available groups for this user
  const allGroups = useMemo(() => {
    const groups = getGroupsForOrgType(orgType, isAdmin);
    return filterGroupsByPermissions(groups, permissions, isEmployee);
  }, [orgType, isAdmin, permissions, isEmployee]);
  const defaultOrder = useMemo(() => getDefaultGroupOrder(orgType, isAdmin), [orgType, isAdmin]);

  // Effective ordered + filtered groups
  const orderedGroups = useMemo((): SidebarGroupConfig[] => {
    const order = prefs?.group_order?.length ? prefs.group_order : defaultOrder;
    const hidden = new Set(prefs?.hidden_groups || []);
    const groupMap = new Map(allGroups.map(g => [g.id, g]));

    const result: SidebarGroupConfig[] = [];

    // Add in saved order
    for (const id of order) {
      if (!hidden.has(id) && groupMap.has(id)) {
        result.push(groupMap.get(id)!);
        groupMap.delete(id);
      }
    }

    // Add any new groups not in saved order
    for (const g of groupMap.values()) {
      if (!hidden.has(g.id)) {
        result.push(g);
      }
    }

    return result;
  }, [allGroups, defaultOrder, prefs]);

  const moveGroup = useCallback(async (groupId: string, direction: 'up' | 'down') => {
    const order = prefs?.group_order?.length ? [...prefs.group_order] : [...defaultOrder];
    const idx = order.indexOf(groupId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= order.length) return;
    [order[idx], order[swapIdx]] = [order[swapIdx], order[idx]];
    await savePrefs({ ...effectivePrefs, group_order: order });
  }, [prefs, defaultOrder, savePrefs]);

  const toggleGroupVisibility = useCallback(async (groupId: string) => {
    const hidden = prefs?.hidden_groups || [];
    const newHidden = hidden.includes(groupId)
      ? hidden.filter(id => id !== groupId)
      : [...hidden, groupId];
    await savePrefs({ ...effectivePrefs, hidden_groups: newHidden });
  }, [prefs, savePrefs]);

  const resetToDefaults = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('sidebar_preferences')
        .delete()
        .eq('user_id', user.id);
      setPrefs(null);
      toast.success('تم استعادة الترتيب الافتراضي');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const effectivePrefs: SidebarPrefs = {
    group_order: prefs?.group_order?.length ? prefs.group_order : defaultOrder,
    hidden_groups: prefs?.hidden_groups || [],
    collapsed_groups: prefs?.collapsed_groups || [],
  };

  return {
    orderedGroups,
    allGroups,
    effectivePrefs,
    loading,
    saving,
    moveGroup,
    toggleGroupVisibility,
    resetToDefaults,
    hasCustomization: prefs !== null,
  };
}
