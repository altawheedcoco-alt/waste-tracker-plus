/**
 * Tab Auth Isolation — Intercepts localStorage for Supabase auth keys
 * and redirects them to sessionStorage, enabling independent login
 * sessions per browser tab.
 *
 * MUST be imported BEFORE the Supabase client is initialized (i.e., at
 * the very top of main.tsx).
 *
 * Everything else (theme, preferences, sound settings) stays in
 * localStorage so it syncs across tabs as expected.
 */

const SUPABASE_AUTH_PREFIX = 'sb-';
const AUTH_TOKEN_SUFFIX = '-auth-token';

function isSupabaseAuthKey(key: string): boolean {
  return key.startsWith(SUPABASE_AUTH_PREFIX) && key.endsWith(AUTH_TOKEN_SUFFIX);
}

const _origGetItem = Storage.prototype.getItem;
const _origSetItem = Storage.prototype.setItem;
const _origRemoveItem = Storage.prototype.removeItem;

Storage.prototype.getItem = function (this: Storage, key: string): string | null {
  if (this === localStorage && isSupabaseAuthKey(key)) {
    return _origGetItem.call(sessionStorage, key);
  }
  return _origGetItem.call(this, key);
};

Storage.prototype.setItem = function (this: Storage, key: string, value: string): void {
  if (this === localStorage && isSupabaseAuthKey(key)) {
    _origSetItem.call(sessionStorage, key, value);
    return;
  }
  _origSetItem.call(this, key, value);
};

Storage.prototype.removeItem = function (this: Storage, key: string): void {
  if (this === localStorage && isSupabaseAuthKey(key)) {
    _origRemoveItem.call(sessionStorage, key);
    return;
  }
  _origRemoveItem.call(this, key);
};

// Also clean up any leftover auth tokens in localStorage from before
// this isolation was enabled, so they don't interfere.
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && isSupabaseAuthKey(k)) {
      // Use the original removeItem to actually remove from localStorage
      _origRemoveItem.call(localStorage, k);
    }
  }
} catch {
  // Ignore errors during cleanup
}

export {};
