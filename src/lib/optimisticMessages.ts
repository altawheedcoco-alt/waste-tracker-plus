/**
 * نظام المراسلة التفاؤلية (Optimistic Messaging) - نمط واتساب
 * يعرض الرسالة فوراً للمستخدم قبل تأكيد الخادم
 * مع آلية إعادة المحاولة عند الفشل
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface OptimisticMessage {
  tempId: string;
  realId?: string;
  content: string;
  messageType: string;
  status: MessageStatus;
  createdAt: string;
  senderId: string;
  senderOrgId: string;
  receiverOrgId: string;
  retryCount: number;
  fileUrl?: string;
  fileName?: string;
}

const pendingMessages = new Map<string, OptimisticMessage>();
const MAX_RETRIES = 3;

export function createOptimisticMessage(
  content: string,
  messageType: string,
  senderId: string,
  senderOrgId: string,
  receiverOrgId: string,
  fileUrl?: string,
  fileName?: string,
): OptimisticMessage {
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const msg: OptimisticMessage = {
    tempId,
    content,
    messageType,
    status: 'sending',
    createdAt: new Date().toISOString(),
    senderId,
    senderOrgId,
    receiverOrgId,
    retryCount: 0,
    fileUrl,
    fileName,
  };

  pendingMessages.set(tempId, msg);
  return msg;
}

export function confirmMessage(tempId: string, realId: string): void {
  const msg = pendingMessages.get(tempId);
  if (msg) {
    msg.realId = realId;
    msg.status = 'sent';
    // Keep for a bit then clean up
    setTimeout(() => pendingMessages.delete(tempId), 10000);
  }
}

export function failMessage(tempId: string): boolean {
  const msg = pendingMessages.get(tempId);
  if (!msg) return false;
  
  msg.retryCount++;
  if (msg.retryCount >= MAX_RETRIES) {
    msg.status = 'failed';
    return false; // No more retries
  }
  
  msg.status = 'sending';
  return true; // Should retry
}

export function removeMessage(tempId: string): void {
  pendingMessages.delete(tempId);
}

export function getPendingMessages(receiverOrgId: string): OptimisticMessage[] {
  return Array.from(pendingMessages.values())
    .filter(m => m.receiverOrgId === receiverOrgId && m.status !== 'failed');
}

export function getFailedMessages(receiverOrgId: string): OptimisticMessage[] {
  return Array.from(pendingMessages.values())
    .filter(m => m.receiverOrgId === receiverOrgId && m.status === 'failed');
}
