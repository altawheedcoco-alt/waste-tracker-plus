/**
 * Chat Sync Bus - مزامنة لحظية بين الويدجت العائم وصفحة الدردشة الرئيسية
 * يضمن ظهور الرسائل فوراً في كل الأماكن عند الإرسال من أي مكان
 */

type ChatSyncEvent = 
  | { type: 'message-sent'; conversationId?: string; partnerOrgId?: string; message: any }
  | { type: 'messages-read'; conversationId?: string; partnerOrgId?: string }
  | { type: 'conversation-updated'; conversationId: string };

type ChatSyncHandler = (event: ChatSyncEvent) => void;

const handlers = new Set<ChatSyncHandler>();

export function onChatSync(handler: ChatSyncHandler): () => void {
  handlers.add(handler);
  return () => { handlers.delete(handler); };
}

export function emitChatSync(event: ChatSyncEvent): void {
  handlers.forEach(fn => fn(event));
}
