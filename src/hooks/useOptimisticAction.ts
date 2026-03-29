import { useState, useCallback } from 'react';

/**
 * Optimistic UI helper — immediately reflects the action
 * while the server call runs in the background.
 * Rolls back on failure.
 */
export function useOptimisticToggle(
  initialValue: boolean,
  onToggle: (newValue: boolean) => Promise<void> | void
) {
  const [optimisticValue, setOptimisticValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(async () => {
    const newValue = !optimisticValue;
    setOptimisticValue(newValue); // instant UI update
    setIsPending(true);
    try {
      await onToggle(newValue);
    } catch {
      setOptimisticValue(!newValue); // rollback
    } finally {
      setIsPending(false);
    }
  }, [optimisticValue, onToggle]);

  return { value: optimisticValue, toggle, isPending };
}
