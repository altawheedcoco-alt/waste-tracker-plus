/**
 * نظام الأوامر المفضلة والأكثر استخداماً
 */

const FAVORITES_KEY = 'voice_favorites';
const HISTORY_KEY = 'voice_command_history';
const MAX_HISTORY = 50;
const MAX_FAVORITES = 10;

export interface VoiceFavorite {
  id: string;
  command: string;
  label: string;
  icon: string;
  usageCount: number;
  lastUsed: number;
  addedAt: number;
}

export interface VoiceHistoryEntry {
  command: string;
  intent: string;
  response: string;
  timestamp: number;
  success: boolean;
}

// الأوامر المفضلة
export function getFavorites(): VoiceFavorite[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addFavorite(command: string, label: string, icon: string = '⭐'): VoiceFavorite {
  const favorites = getFavorites();
  const existing = favorites.find(f => f.command === command);
  if (existing) return existing;

  const fav: VoiceFavorite = {
    id: Date.now().toString(36),
    command,
    label,
    icon,
    usageCount: 0,
    lastUsed: Date.now(),
    addedAt: Date.now(),
  };

  favorites.unshift(fav);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
  return fav;
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites().filter(f => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function incrementFavoriteUsage(command: string): void {
  const favorites = getFavorites();
  const fav = favorites.find(f => f.command === command);
  if (fav) {
    fav.usageCount++;
    fav.lastUsed = Date.now();
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// تاريخ الأوامر
export function getCommandHistory(): VoiceHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<VoiceHistoryEntry, 'timestamp'>): void {
  const history = getCommandHistory();
  history.unshift({ ...entry, timestamp: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function clearCommandHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// الأوامر الأكثر استخداماً (من التاريخ)
export function getMostUsedCommands(limit: number = 5): { command: string; count: number }[] {
  const history = getCommandHistory();
  const counts: Record<string, number> = {};
  history.forEach(h => {
    if (h.success) counts[h.command] = (counts[h.command] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([command, count]) => ({ command, count }));
}
