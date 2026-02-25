/// <reference types="google.maps" />
import { useState, useEffect } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

let cachedApiKey: string | null = null;
let loadPromise: Promise<void> | null = null;

const fetchApiKey = async (): Promise<string> => {
  if (cachedApiKey) return cachedApiKey;

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-google-maps-key`, {
    headers: {
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch Google Maps API key');
  const data = await res.json();
  cachedApiKey = data.key;
  return data.key;
};

export const useGoogleMaps = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (loadPromise) {
          await loadPromise;
          if (!cancelled) setLoaded(true);
          return;
        }

        const apiKey = await fetchApiKey();

        setOptions({
          key: apiKey,
          v: 'weekly',
          libraries: ['places', 'geometry'],
          language: 'ar',
          region: 'EG',
        });

        loadPromise = (async () => {
          await importLibrary('maps');
          await importLibrary('places');
        })();

        await loadPromise;
        if (!cancelled) setLoaded(true);
      } catch (err) {
        console.error('Google Maps load error:', err);
        if (!cancelled) setError('فشل تحميل خريطة Google');
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return { loaded, error };
};
