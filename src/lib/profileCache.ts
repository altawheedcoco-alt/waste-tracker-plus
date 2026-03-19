import { supabase } from '@/integrations/supabase/client';

/**
 * كاش البروفايلات المركزي - نمط واتساب
 * يحفظ بيانات المستخدمين محلياً لتقليل طلبات قاعدة البيانات
 */

interface CachedProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  organization_id?: string;
  cached_at: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const profileCache = new Map<string, CachedProfile>();
const pendingFetches = new Map<string, Promise<CachedProfile | null>>();

export async function getCachedProfile(userId: string): Promise<CachedProfile | null> {
  // Check memory cache
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
    return cached;
  }

  // Deduplicate in-flight requests
  if (pendingFetches.has(userId)) {
    return pendingFetches.get(userId)!;
  }

  const fetchPromise = (async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, organization_id')
        .eq('user_id', userId)
        .single();

      if (data) {
        const profile: CachedProfile = { ...data, cached_at: Date.now() };
        profileCache.set(userId, profile);
        return profile;
      }
      return null;
    } finally {
      pendingFetches.delete(userId);
    }
  })();

  pendingFetches.set(userId, fetchPromise);
  return fetchPromise;
}

export async function getCachedProfiles(userIds: string[]): Promise<Map<string, CachedProfile>> {
  const result = new Map<string, CachedProfile>();
  const uncachedIds: string[] = [];

  // Check cache first
  for (const id of userIds) {
    const cached = profileCache.get(id);
    if (cached && Date.now() - cached.cached_at < CACHE_TTL) {
      result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  // Batch fetch uncached
  if (uncachedIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, organization_id')
      .in('user_id', uncachedIds);

    for (const p of data || []) {
      const profile: CachedProfile = { ...p, cached_at: Date.now() };
      profileCache.set(p.user_id, profile);
      result.set(p.user_id, profile);
    }
  }

  return result;
}

export function invalidateProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}
