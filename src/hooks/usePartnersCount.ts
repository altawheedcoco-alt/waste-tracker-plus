import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePartnersCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count: partnersCount, error } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .in('organization_type', ['generator', 'recycler'])
          .eq('is_verified', true)
          .eq('is_active', true);

        if (error) throw error;
        setCount(partnersCount || 0);
      } catch (error) {
        console.error('Error fetching partners count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { count, loading };
};
