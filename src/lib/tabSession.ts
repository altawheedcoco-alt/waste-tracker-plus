/**
 * Tab Session Isolation Utility
 * 
 * Generates a unique session ID per browser tab to isolate:
 * - Realtime channel subscriptions
 * - Transient/form data storage
 * - WebSocket rooms
 * 
 * Uses sessionStorage (per-tab) instead of localStorage (shared).
 * Preferences (theme, accessibility, sound) remain in localStorage as they SHOULD sync.
 */

const TAB_SESSION_KEY = '__tab_session_id';

/**
 * Get or create a unique session ID for this browser tab.
 * Persists in sessionStorage so it survives same-tab navigation but not new tabs.
 */
export function getTabSessionId(): string {
  let sessionId = sessionStorage.getItem(TAB_SESSION_KEY);
  if (!sessionId) {
    sessionId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(TAB_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Generate a unique realtime channel name scoped to this tab.
 * Prevents cross-tab channel interference.
 */
export function getTabChannelName(baseName: string): string {
  return `${baseName}:${getTabSessionId()}`;
}

/**
 * Tab-scoped storage helpers.
 * Use for transient/form data that should NOT be shared across tabs.
 * For user preferences (theme, sound, accessibility), keep using localStorage directly.
 */
export const tabStorage = {
  getItem(key: string): string | null {
    return sessionStorage.getItem(`${getTabSessionId()}:${key}`);
  },

  setItem(key: string, value: string): void {
    sessionStorage.setItem(`${getTabSessionId()}:${key}`, value);
  },

  removeItem(key: string): void {
    sessionStorage.removeItem(`${getTabSessionId()}:${key}`);
  },

  /**
   * Get parsed JSON from tab-scoped storage
   */
  getJSON<T>(key: string): T | null {
    const raw = this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set JSON data in tab-scoped storage
   */
  setJSON<T>(key: string, value: T): void {
    this.setItem(key, JSON.stringify(value));
  },
};
