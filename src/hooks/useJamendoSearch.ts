import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JamendoTrack {
  id: string;
  jamendoId: string;
  name: string;
  artist: string;
  albumImage: string;
  audioUrl: string;
  audioDownload: string;
  duration: number;
  genre: string;
  mood: string;
  shareUrl: string;
}

export const JAMENDO_GENRES = [
  { id: 'arabic', label: 'عربي', emoji: '🇪🇬', searchTag: 'arabic+oriental+middle+eastern' },
  { id: 'oriental', label: 'شرقي', emoji: '🎵', searchTag: 'oriental+belly+dance' },
  { id: 'world', label: 'شعبي/عالمي', emoji: '🌍', searchTag: 'world+folk+ethnic' },
  { id: 'hiphop', label: 'راب/هيب هوب', emoji: '🎤', searchTag: 'hiphop+rap+trap' },
  { id: 'electronic', label: 'إلكتروني', emoji: '🎧', searchTag: 'electronic+edm+dance' },
  { id: 'pop', label: 'بوب', emoji: '💃', searchTag: 'pop' },
  { id: 'rock', label: 'روك', emoji: '🎸', searchTag: 'rock' },
  { id: 'rnb', label: 'آر أند بي', emoji: '💜', searchTag: 'rnb+soul' },
  { id: 'jazz', label: 'جاز', emoji: '🎷', searchTag: 'jazz' },
  { id: 'classical', label: 'كلاسيك', emoji: '🎻', searchTag: 'classical+orchestral' },
  { id: 'reggae', label: 'ريغي', emoji: '🌴', searchTag: 'reggae+reggaeton+latin' },
  { id: 'ambient', label: 'هادئة', emoji: '🌙', searchTag: 'ambient+chillout+lounge' },
];

export function useJamendoSearch() {
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, tags?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'search' });
      if (query) params.set('q', query);
      if (tags) params.set('tags', tags);

      const { data, error: fnError } = await supabase.functions.invoke('jamendo-search', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });

      // Use fetch directly since supabase.functions.invoke doesn't support GET params well
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/jamendo-search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setTracks(result.tracks || []);
    } catch (err: any) {
      setError(err.message);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPopular = useCallback(async (tags?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ action: 'popular' });
      if (tags) params.set('tags', tags);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/jamendo-search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setTracks(result.tracks || []);
    } catch (err: any) {
      setError(err.message);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tracks, loading, error, search, getPopular };
}
