/**
 * useChatNotificationSettings — Per-conversation notification settings
 * Supports custom sound, DND schedule, and notification level per conversation
 */
import { useState, useCallback, useEffect } from 'react';

export type NotificationLevel = 'all' | 'mentions' | 'none';

interface ConvoNotifSettings {
  level: NotificationLevel;
  customSound: string | null;
  dndEnabled: boolean;
  dndStart: string; // HH:mm
  dndEnd: string;   // HH:mm
  muteUntil: string | null; // ISO timestamp
}

const DEFAULT_SETTINGS: ConvoNotifSettings = {
  level: 'all',
  customSound: null,
  dndEnabled: false,
  dndStart: '22:00',
  dndEnd: '07:00',
  muteUntil: null,
};

const STORAGE_KEY = 'chat_notif_settings';

function loadSettings(): Record<string, ConvoNotifSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSettings(settings: Record<string, ConvoNotifSettings>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

export function useChatNotificationSettings(conversationId: string | null) {
  const [settings, setSettings] = useState<ConvoNotifSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!conversationId) return;
    const all = loadSettings();
    setSettings(all[conversationId] || DEFAULT_SETTINGS);
  }, [conversationId]);

  const updateSettings = useCallback((patch: Partial<ConvoNotifSettings>) => {
    if (!conversationId) return;
    const all = loadSettings();
    const updated = { ...(all[conversationId] || DEFAULT_SETTINGS), ...patch };
    all[conversationId] = updated;
    saveSettings(all);
    setSettings(updated);
  }, [conversationId]);

  const isDND = useCallback(() => {
    if (!settings.dndEnabled) return false;
    const now = new Date();
    const [startH, startM] = settings.dndStart.split(':').map(Number);
    const [endH, endM] = settings.dndEnd.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    // Overnight DND (e.g., 22:00 - 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }, [settings]);

  const isMuted = useCallback(() => {
    if (settings.muteUntil) {
      return new Date(settings.muteUntil) > new Date();
    }
    return settings.level === 'none';
  }, [settings]);

  const shouldNotify = useCallback((isMention: boolean = false) => {
    if (isMuted()) return false;
    if (isDND()) return false;
    if (settings.level === 'mentions') return isMention;
    return settings.level === 'all';
  }, [settings, isMuted, isDND]);

  const muteFor = useCallback((minutes: number) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    updateSettings({ muteUntil: until });
  }, [updateSettings]);

  return {
    settings,
    updateSettings,
    isDND,
    isMuted,
    shouldNotify,
    muteFor,
  };
}
