/**
 * Hook to resolve storage URLs (handles private bucket URLs by converting to signed URLs)
 */
import { useState, useEffect } from 'react';
import { refreshStorageUrl } from '@/utils/storageUrl';

export const useResolvedUrl = (url: string | null | undefined): string | null => {
  const getInitial = (u: string | null | undefined) => {
    if (!u) return null;
    if (!u.includes('/storage/v1/')) return u;
    if (u.includes('/object/public/')) return u;
    return null;
  };
  const [resolved, setResolved] = useState<string | null>(() => getInitial(url));

  useEffect(() => {
    if (!url) {
      setResolved(null);
      return;
    }

    // If it's not a supabase storage URL, use as-is
    if (!url.includes('/storage/v1/')) {
      setResolved(url);
      return;
    }

    // If the URL is already a public URL (contains /object/public/), use as-is
    if (url.includes('/object/public/')) {
      setResolved(url);
      return;
    }

    // Private bucket URL - get signed URL
    let cancelled = false;
    refreshStorageUrl(url).then(signedUrl => {
      if (!cancelled) setResolved(signedUrl);
    });
    return () => { cancelled = true; };
  }, [url]);

  return resolved;
};

/**
 * Resolve multiple URLs at once
 */
export const useResolvedUrls = (urls: (string | null | undefined)[]): (string | null)[] => {
  const [resolved, setResolved] = useState<(string | null)[]>(urls.map(() => null));

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      urls.map(url => {
        if (!url) return Promise.resolve(null);
        if (!url.includes('/storage/v1/')) return Promise.resolve(url);
        if (url.includes('/object/public/')) {
          return Promise.resolve(url);
        }
        return refreshStorageUrl(url);
      })
    ).then(results => {
      if (!cancelled) setResolved(results);
    });
    return () => { cancelled = true; };
  }, [urls.join(',')]);

  return resolved;
};
