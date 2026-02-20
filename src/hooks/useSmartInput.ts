import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SmartInputSuggestion {
  id: string;
  input_value: string;
  usage_count: number;
  last_used_at: string;
}

export function useSmartInput(fieldContext: string) {
  const { profile } = useAuth();
  const [suggestions, setSuggestions] = useState<SmartInputSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch suggestions for a given query
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!profile?.organization_id || !query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('smart_inputs')
        .select('id, input_value, usage_count, last_used_at')
        .eq('organization_id', profile.organization_id)
        .eq('field_context', fieldContext)
        .ilike('input_value', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(8);

      if (error) throw error;
      // Filter out exact match
      const filtered = (data || []).filter(
        (s: SmartInputSuggestion) => s.input_value.toLowerCase() !== query.toLowerCase()
      );
      setSuggestions(filtered as SmartInputSuggestion[]);
    } catch (err) {
      console.error('Smart input fetch error:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id, fieldContext]);

  // Debounced search
  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
  }, [fetchSuggestions]);

  // Save input value
  const saveInput = useCallback(async (value: string) => {
    if (!profile?.organization_id || !profile?.id || !value || value.trim().length < 2) return;

    try {
      await supabase.rpc('upsert_smart_input', {
        p_organization_id: profile.organization_id,
        p_created_by: profile.id,
        p_field_context: fieldContext,
        p_input_value: value.trim(),
      });
    } catch (err) {
      console.error('Smart input save error:', err);
    }
  }, [profile?.organization_id, profile?.id, fieldContext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { suggestions, loading, search, saveInput, clearSuggestions: () => setSuggestions([]) };
}
