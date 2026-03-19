import { supabase } from '@/integrations/supabase/client';
import { getTabSessionId } from './tabSession';

/**
 * نظام مزامنة حالات القراءة عبر الأجهزة - نمط واتساب
 * يضمن تحديث حالة "تم القراءة" (الصح الأزرق) عبر كل الأجهزة والتبويبات
 */

type ReadSyncCallback = (messageIds: string[]) => void;

const listeners = new Set<ReadSyncCallback>();
let syncChannel: ReturnType<typeof supabase.channel> | null = null;

export function initReadSync(orgId: string) {
  if (syncChannel) return;

  syncChannel = supabase.channel(`read-sync:${orgId}`)
    .on('broadcast', { event: 'messages-read' }, (payload) => {
      const { messageIds, tabId } = payload.payload as { messageIds: string[]; tabId: string };
      // Don't process own tab's events
      if (tabId === getTabSessionId()) return;
      listeners.forEach(cb => cb(messageIds));
    })
    .subscribe();
}

export function broadcastRead(orgId: string, messageIds: string[]) {
  if (!syncChannel || messageIds.length === 0) return;
  
  syncChannel.send({
    type: 'broadcast',
    event: 'messages-read',
    payload: { messageIds, tabId: getTabSessionId() },
  });
}

export function onReadSync(callback: ReadSyncCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function destroyReadSync() {
  if (syncChannel) {
    supabase.removeChannel(syncChannel);
    syncChannel = null;
  }
  listeners.clear();
}
