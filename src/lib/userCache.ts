/**
 * Local cache for user profile data — enables instant PWA startup.
 * Data is read from localStorage before network calls complete,
 * giving the user an immediate UI while fresh data loads in background.
 */

const CACHE_KEY = 'irecycle_user_cache';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

interface CachedUserData {
  profile: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    organization_id: string | null;
    active_organization_id: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
    organization_type: string;
    logo_url?: string | null;
  } | null;
  roles: string[];
  timestamp: number;
}

export function getCachedUserData(): CachedUserData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data: CachedUserData = JSON.parse(raw);
    // Check TTL
    if (Date.now() - data.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCachedUserData(
  profile: CachedUserData['profile'],
  organization: CachedUserData['organization'],
  roles: string[]
): void {
  try {
    const data: CachedUserData = {
      profile,
      organization,
      roles,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function clearCachedUserData(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}
