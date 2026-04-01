/**
 * useChatInfiniteScroll — Infinite scroll pagination for chat messages
 * Loads older messages when user scrolls to top
 */
import { useState, useCallback, useRef } from 'react';
import type { DecryptedMessage } from '@/hooks/usePrivateChat';

interface UseChatInfiniteScrollOptions {
  fetchMessages: (conversationId: string, limit?: number, before?: string) => Promise<DecryptedMessage[]>;
  conversationId: string | null;
  pageSize?: number;
}

export function useChatInfiniteScroll({ fetchMessages, conversationId, pageSize = 50 }: UseChatInfiniteScrollOptions) {
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const loadOlderMessages = useCallback(async (
    currentMessages: DecryptedMessage[],
    setMessages: React.Dispatch<React.SetStateAction<DecryptedMessage[]>>
  ) => {
    if (!conversationId || loadingMore || !hasMore) return;
    
    // Throttle: min 500ms between loads
    const now = Date.now();
    if (now - lastFetchRef.current < 500) return;
    lastFetchRef.current = now;

    const oldest = currentMessages[0];
    if (!oldest) return;

    setLoadingMore(true);
    try {
      const olderMessages = await fetchMessages(conversationId, pageSize, oldest.created_at);
      if (olderMessages.length < pageSize) setHasMore(false);
      if (olderMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = olderMessages.filter(m => !existingIds.has(m.id));
          return [...newMsgs, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, fetchMessages, hasMore, loadingMore, pageSize]);

  const resetPagination = useCallback(() => {
    setHasMore(true);
    setLoadingMore(false);
    lastFetchRef.current = 0;
  }, []);

  return { hasMore, loadingMore, loadOlderMessages, resetPagination };
}
