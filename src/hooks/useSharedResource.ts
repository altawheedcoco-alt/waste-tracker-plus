import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SharedResourceResult {
  resource_type: string;
  access_level: 'public' | 'authenticated' | 'linked';
  title: string | null;
  description: string | null;
  data: any;
  organization_id: string | null;
}

type SharedResourceError = 
  | 'link_not_found' 
  | 'link_expired' 
  | 'max_views_reached' 
  | 'pin_required' 
  | 'invalid_pin' 
  | 'auth_required' 
  | 'not_linked' 
  | 'resource_not_found' 
  | 'link_locked'
  | 'access_restricted'
  | 'internal_error';

interface ErrorDetails {
  attempts_left?: number;
  remaining_minutes?: number;
  locked?: boolean;
}

export function useSharedResource(code: string | undefined, pin?: string) {
  const [data, setData] = useState<SharedResourceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SharedResourceError | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [requiresPin, setRequiresPin] = useState(false);

  useEffect(() => {
    if (!code) return;

    const fetchResource = async () => {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      try {
        const { data: result, error: fnError } = await supabase.functions.invoke(
          'resolve-shared-link',
          { body: { code, pin } }
        );

        if (fnError) {
          setError('internal_error');
          return;
        }

        if (result?.error) {
          setError(result.error as SharedResourceError);
          setErrorDetails({
            attempts_left: result.attempts_left,
            remaining_minutes: result.remaining_minutes,
            locked: result.locked,
          });
          if (result.requires_pin) setRequiresPin(true);
          return;
        }

        setData(result as SharedResourceResult);
        setRequiresPin(false);
      } catch (err) {
        setError('internal_error');
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [code, pin]);

  return { data, loading, error, errorDetails, requiresPin };
}
